import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// PrimeNG Components
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services and models
import { ProductService } from '../../../../core/services/product.service';
import {
  Product,
  ProductCategory,
  ProductStyle,
  ProductStatus,
  ProductSize,
  ProductColor,
  CATEGORY_STYLE_MAP,
  enumToOptions,
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto
} from '../../../../core/models/product.model';
import { getErrorMessage } from '../../../../shared/utils/form-errors.util';

/**
 * ProductFormComponent - Formulario de Producto (Crear/Editar)
 *
 * Funcionalidades:
 * - Modo crear: /admin/products/new
 * - Modo editar: /admin/products/:id/edit
 * - Validaciones con reactive forms
 * - Dropdown dinámico de estilos según categoría
 * - En modo simplificado: crea 1 variante por defecto (M, negro, stock 0)
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    CardModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  // State
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  productId: string | null = null;

  // Form
  productForm: FormGroup;

  // Dropdown options
  categoryOptions = enumToOptions(ProductCategory);
  availableStyleOptions: { label: string; value: string }[] = [];
  statusOptions = enumToOptions(ProductStatus);

  // Helper para mensajes de error
  getErrorMessage = getErrorMessage;

  constructor() {
    // Inicializar formulario
    this.productForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      style: ['', Validators.required],
      status: [ProductStatus.ACTIVE]
    });

    // Escuchar cambios en categoría para actualizar estilos disponibles
    this.productForm.get('category')?.valueChanges.subscribe((category: ProductCategory) => {
      this.onCategoryChange(category);
    });
  }

  ngOnInit(): void {
    // Determinar si es modo editar o crear
    this.productId = this.route.snapshot.paramMap.get('id');

    if (this.productId) {
      this.isEditMode.set(true);
      this.loadProduct(this.productId);
    }
  }

  /**
   * Carga el producto para editar
   */
  private loadProduct(id: string): void {
    this.isLoading.set(true);

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.populateForm(product);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el producto. Intenta nuevamente.'
        });
        this.isLoading.set(false);
        this.goBack();
      }
    });
  }

  /**
   * Rellena el formulario con los datos del producto
   */
  private populateForm(product: Product): void {
    this.productForm.patchValue({
      code: product.code,
      name: product.name,
      description: product.description || '',
      basePrice: product.basePrice,
      category: product.category,
      style: product.style,
      status: product.status
    });

    // Actualizar estilos disponibles según la categoría cargada
    if (product.category) {
      this.onCategoryChange(product.category);
    }
  }

  /**
   * Maneja el cambio de categoría
   * Actualiza los estilos disponibles según la categoría seleccionada
   */
  private onCategoryChange(category: ProductCategory): void {
    if (!category) {
      this.availableStyleOptions = [];
      return;
    }

    // Obtener estilos válidos para esta categoría
    const validStyles = CATEGORY_STYLE_MAP[category] || [];
    this.availableStyleOptions = validStyles.map((style) => ({
      label: this.formatEnumValue(style),
      value: style
    }));

    // Limpiar el campo de estilo si ya no es válido para la nueva categoría
    const currentStyle = this.productForm.get('style')?.value;
    if (currentStyle && !validStyles.includes(currentStyle)) {
      this.productForm.patchValue({ style: '' });
    }
  }

  /**
   * Formatea un valor de enum para mostrar en UI
   */
  private formatEnumValue(value: string): string {
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Getter para acceder fácilmente a los controles del formulario
   */
  get f() {
    return this.productForm.controls;
  }

  /**
   * Maneja el submit del formulario
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Inválido',
        detail: 'Por favor corrige los errores antes de continuar.'
      });
      return;
    }

    this.isLoading.set(true);

    if (this.isEditMode()) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  /**
   * Crea un nuevo producto
   */
  private createProduct(): void {
    const formValue = this.productForm.value;

    // Crear variante por defecto (requerida por el backend)
    const defaultVariant: CreateProductVariantDto = {
      size: ProductSize.M,
      color: ProductColor.BLACK,
      stock: 0,
      price: formValue.basePrice
    };

    const createDto: CreateProductDto = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || undefined,
      basePrice: formValue.basePrice,
      category: formValue.category,
      style: formValue.style,
      variants: [defaultVariant], // Siempre al menos 1 variante
      tags: []
    };

    this.productService.createProduct(createDto).subscribe({
      next: (product) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Producto Creado',
          detail: `El producto "${product.name}" fue creado correctamente.`
        });
        this.isLoading.set(false);
        // Esperar un momento para que el usuario vea el mensaje
        setTimeout(() => this.goBack(), 1500);
      },
      error: (error) => {
        console.error('Error creando producto:', error);
        this.isLoading.set(false);
        // El error.interceptor ya mostró el toast, solo loggeamos
      }
    });
  }

  /**
   * Actualiza un producto existente
   */
  private updateProduct(): void {
    if (!this.productId) return;

    const formValue = this.productForm.value;

    const updateDto: UpdateProductDto = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || undefined,
      basePrice: formValue.basePrice,
      category: formValue.category,
      style: formValue.style,
      status: formValue.status
    };

    this.productService.updateProduct(this.productId, updateDto).subscribe({
      next: (product) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Producto Actualizado',
          detail: `El producto "${product.name}" fue actualizado correctamente.`
        });
        this.isLoading.set(false);
        // Esperar un momento para que el usuario vea el mensaje
        setTimeout(() => this.goBack(), 1500);
      },
      error: (error) => {
        console.error('Error actualizando producto:', error);
        this.isLoading.set(false);
        // El error.interceptor ya mostró el toast, solo loggeamos
      }
    });
  }

  /**
   * Vuelve a la lista de productos
   */
  goBack(): void {
    this.router.navigate(['/admin/products']);
  }

  /**
   * Resetea el formulario
   */
  resetForm(): void {
    this.productForm.reset({
      status: ProductStatus.ACTIVE,
      basePrice: 0
    });
  }
}
