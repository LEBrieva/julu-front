import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// Shared Components
import { TooltipIcon } from '../../../../shared/components/tooltip-icon/tooltip-icon';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';

// PrimeNG Components
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { Fieldset } from 'primeng/fieldset';
import { Tag } from 'primeng/tag';
import { Table, TableModule } from 'primeng/table';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services and models
import { ProductService } from '../../../../core/services/product.service';
import {
  Product,
  ProductCategory,
  ProductStyle,
  ProductStatus,
  ProductSize,
  ProductColor,
  ProductVariant,
  CATEGORY_STYLE_MAP,
  enumToOptions,
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  AddVariantDto,
  UpdateSingleVariantDto,
  formatSize,
  formatColor,
  getColorHex,
  getTextColor,
  getSizeSeverity
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
    FormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ToggleSwitchModule,
    SelectModule,
    ButtonModule,
    CardModule,
    MessageModule,
    ToastModule,
    Fieldset,
    Tag,
    TableModule,
    ConfirmDialog,
    TooltipModule,
    TooltipIcon,
    ImageUploadComponent
  ],
  providers: [MessageService, ConfirmationService],
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
  private confirmationService = inject(ConfirmationService);

  // State
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  productId: string | null = null;
  currentProduct: Product | null = null; // Producto cargado en modo editar
  productImages = signal<string[]>([]); // Imágenes del producto (reactivo)
  productFeaturedIndex = signal<number>(0); // Índice de imagen destacada (reactivo)

  // Form
  productForm: FormGroup;

  // Tags input temporal
  tagInput: string = '';

  // Gestión de variantes (modo CREAR)
  variants: CreateProductVariantDto[] = [];
  variantSize: ProductSize | null = null;
  variantColor: ProductColor | null = null;
  variantStock: number = 0;
  variantPrice: number = 0;

  // Gestión de variantes (modo EDITAR)
  editingVariantSku: string | null = null;
  originalVariant: ProductVariant | null = null;
  showAddVariantForm = false; // Controla si se muestra el formulario de agregar variante

  // Dropdown options
  categoryOptions = enumToOptions(ProductCategory);
  availableStyleOptions: { label: string; value: string }[] = [];
  statusOptions = enumToOptions(ProductStatus);

  // Opciones de tamaño con labels en MAYÚSCULAS
  sizeOptions = [
    { label: 'P', value: ProductSize.P },
    { label: 'M', value: ProductSize.M },
    { label: 'G', value: ProductSize.G },
    { label: 'GG', value: ProductSize.GG },
  ];

  // Opciones de color en español
  colorOptions = [
    { label: 'Negro', value: ProductColor.BLACK },
    { label: 'Blanco', value: ProductColor.WHITE },
    { label: 'Gris', value: ProductColor.GRAY },
    { label: 'Azul Marino', value: ProductColor.NAVY },
    { label: 'Rojo', value: ProductColor.RED },
    { label: 'Azul', value: ProductColor.BLUE }
  ];

  // Helpers para variantes
  formatSize = formatSize;
  formatColor = formatColor;
  getColorHex = getColorHex;
  getTextColor = getTextColor;
  getSizeSeverity = getSizeSeverity;

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
      status: [ProductStatus.ACTIVE],
      tags: [[]],  // Array de strings vacío por defecto
      destacado: [false]  // Por defecto no es destacado
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
    this.productImages.set([]); // Limpiar imágenes anteriores

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
    this.currentProduct = product; // Guardar producto completo para acceso a variantes

    this.productForm.patchValue({
      code: product.code,
      name: product.name,
      description: product.description || '',
      basePrice: product.basePrice,
      category: product.category,
      style: product.style,
      status: product.status,
      tags: product.tags || [],
      destacado: product.destacado || false
    });

    // Inicializar imágenes (asegurar que sea un array válido)
    this.productImages.set(Array.isArray(product.images) ? product.images : []);

    // Inicializar índice de imagen destacada
    this.productFeaturedIndex.set(product.featuredImageIndex ?? 0);

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

    // Validar que haya al menos 1 variante
    if (this.variants.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Variantes Requeridas',
        detail: 'Debes agregar al menos una variante antes de crear el producto.'
      });
      this.isLoading.set(false);
      return;
    }

    const createDto: CreateProductDto = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || undefined,
      basePrice: formValue.basePrice,
      category: formValue.category,
      style: formValue.style,
      variants: this.variants, // Usar variantes agregadas por el usuario
      tags: formValue.tags || []
    };

    this.productService.createProduct(createDto).subscribe({
      next: (product) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Producto Creado',
          detail: `El producto "${product.name}" fue creado correctamente con ${this.variants.length} variante(s).`
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
      status: formValue.status,
      tags: formValue.tags,
      destacado: formValue.destacado
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
      basePrice: 0,
      tags: []
    });
    this.tagInput = '';
  }

  /**
   * Agrega un tag al array cuando se presiona Enter
   */
  addTag(event: Event): void {
    event.preventDefault(); // Previene submit del formulario
    event.stopPropagation();

    const tag = this.tagInput.trim();

    // Validar que no esté vacío
    if (!tag) {
      return;
    }

    // Obtener tags actuales
    const currentTags: string[] = this.productForm.get('tags')?.value || [];

    // Validar que no exista ya (evitar duplicados)
    if (currentTags.includes(tag)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Tag Duplicado',
        detail: 'Este tag ya fue agregado.'
      });
      this.tagInput = '';
      return;
    }

    // Agregar nuevo tag
    this.productForm.patchValue({
      tags: [...currentTags, tag]
    });

    // Limpiar input
    this.tagInput = '';
  }

  /**
   * Elimina un tag del array
   */
  removeTag(index: number): void {
    const currentTags: string[] = this.productForm.get('tags')?.value || [];
    const updatedTags = currentTags.filter((_, i) => i !== index);

    this.productForm.patchValue({
      tags: updatedTags
    });
  }

  // ===========================
  // GESTIÓN DE VARIANTES (CREAR)
  // ===========================

  /**
   * Agrega una variante al array local (solo modo CREAR)
   * Valida que la combinación size+color no exista
   */
  addVariant(): void {
    // Validar que size y color estén seleccionados
    if (!this.variantSize || !this.variantColor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos Incompletos',
        detail: 'Debes seleccionar tamaño y color para agregar una variante.'
      });
      return;
    }

    // Validar que stock y price sean >= 0
    if (this.variantStock < 0 || this.variantPrice < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valores Inválidos',
        detail: 'Stock y precio deben ser mayores o iguales a 0.'
      });
      return;
    }

    // Validar que la combinación size+color no exista
    const exists = this.variants.some(
      (v) => v.size === this.variantSize && v.color === this.variantColor
    );

    if (exists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Variante Duplicada',
        detail: `Ya existe una variante con tamaño ${formatSize(this.variantSize)} y color ${formatColor(this.variantColor)}.`
      });
      return;
    }

    // Agregar variante al array local
    const newVariant: CreateProductVariantDto = {
      size: this.variantSize,
      color: this.variantColor,
      stock: this.variantStock,
      price: this.variantPrice
    };

    this.variants.push(newVariant);

    // Resetear inputs
    this.variantSize = null;
    this.variantColor = null;
    this.variantStock = 0;
    this.variantPrice = 0;

    // No mostrar toast en modo CREAR (es solo array local)
  }

  /**
   * Elimina una variante del array local (solo modo CREAR)
   */
  removeVariant(index: number): void {
    if (index < 0 || index >= this.variants.length) return;

    this.variants.splice(index, 1);

    // No mostrar toast en modo CREAR (es solo array local)
  }

  // ===========================
  // GESTIÓN DE VARIANTES (EDITAR)
  // ===========================

  /**
   * Inicia la edición de una variante (solo modo EDITAR)
   */
  startEditVariant(variant: ProductVariant): void {
    this.editingVariantSku = variant.sku;
    this.originalVariant = { ...variant }; // Guardar copia para cancelar
  }

  /**
   * Cancela la edición de una variante
   */
  cancelEditVariant(): void {
    if (this.originalVariant && this.currentProduct) {
      // Restaurar valores originales
      const index = this.currentProduct.variants.findIndex(v => v.sku === this.editingVariantSku);
      if (index !== -1) {
        this.currentProduct.variants[index] = { ...this.originalVariant };
      }
    }
    this.editingVariantSku = null;
    this.originalVariant = null;
  }

  /**
   * Guarda los cambios de una variante (solo modo EDITAR)
   */
  saveVariantChanges(variant: ProductVariant): void {
    if (!this.productId || !this.currentProduct) return;

    // Validar cambios
    if (variant.stock < 0 || variant.price < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valores Inválidos',
        detail: 'Stock y precio deben ser mayores o iguales a 0.'
      });
      this.cancelEditVariant();
      return;
    }

    this.isLoading.set(true);

    const updateData: UpdateSingleVariantDto = {
      stock: variant.stock,
      price: variant.price
    };

    this.productService.updateVariant(this.productId, variant.sku, updateData).subscribe({
      next: (updatedProduct) => {
        this.currentProduct = updatedProduct; // Actualizar producto completo
        this.messageService.add({
          severity: 'success',
          summary: 'Variante Actualizada',
          detail: `Variante ${formatSize(variant.size)} - ${formatColor(variant.color)} actualizada correctamente.`
        });
        this.isLoading.set(false);
        this.editingVariantSku = null;
        this.originalVariant = null;
      },
      error: (error) => {
        console.error('Error actualizando variante:', error);
        this.cancelEditVariant(); // Restaurar valores originales
        this.isLoading.set(false);
        // El error.interceptor ya mostró el toast
      }
    });
  }

  /**
   * Muestra/oculta el formulario de agregar variante (solo modo EDITAR)
   */
  toggleAddVariantForm(): void {
    this.showAddVariantForm = !this.showAddVariantForm;

    // Si se cierra, resetear inputs
    if (!this.showAddVariantForm) {
      this.variantSize = null;
      this.variantColor = null;
      this.variantStock = 0;
      this.variantPrice = 0;
    }
  }

  /**
   * Agrega una variante al producto existente (solo modo EDITAR)
   */
  addVariantToProduct(): void {
    if (!this.productId || !this.currentProduct) return;

    // Validar que size y color estén seleccionados
    if (!this.variantSize || !this.variantColor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos Incompletos',
        detail: 'Debes seleccionar tamaño y color para agregar una variante.'
      });
      return;
    }

    // Validar que stock y price sean >= 0
    if (this.variantStock < 0 || this.variantPrice < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valores Inválidos',
        detail: 'Stock y precio deben ser mayores o iguales a 0.'
      });
      return;
    }

    // Validar que la combinación size+color no exista
    const exists = this.currentProduct.variants.some(
      (v) => v.size === this.variantSize && v.color === this.variantColor
    );

    if (exists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Variante Duplicada',
        detail: `Ya existe una variante con tamaño ${formatSize(this.variantSize)} y color ${formatColor(this.variantColor)}.`
      });
      return;
    }

    this.isLoading.set(true);

    const newVariant: AddVariantDto = {
      size: this.variantSize,
      color: this.variantColor,
      stock: this.variantStock,
      price: this.variantPrice
    };

    this.productService.addVariant(this.productId, newVariant).subscribe({
      next: (updatedProduct) => {
        this.currentProduct = updatedProduct; // Actualizar producto completo
        this.messageService.add({
          severity: 'success',
          summary: 'Variante Agregada',
          detail: `Variante ${formatSize(newVariant.size)} - ${formatColor(newVariant.color)} agregada correctamente.`
        });
        this.isLoading.set(false);

        // Resetear formulario y ocultarlo
        this.variantSize = null;
        this.variantColor = null;
        this.variantStock = 0;
        this.variantPrice = 0;
        this.showAddVariantForm = false;
      },
      error: (error) => {
        console.error('Error agregando variante:', error);
        this.isLoading.set(false);
        // El error.interceptor ya mostró el toast
      }
    });
  }

  /**
   * Elimina una variante del producto existente (solo modo EDITAR)
   */
  deleteVariantFromProduct(variant: ProductVariant): void {
    if (!this.productId || !this.currentProduct) return;

    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la variante ${formatSize(variant.size)} - ${formatColor(variant.color)}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.isLoading.set(true);

        this.productService.deleteVariant(this.productId!, variant.sku).subscribe({
          next: (updatedProduct) => {
            this.currentProduct = updatedProduct; // Actualizar producto completo
            this.messageService.add({
              severity: 'success',
              summary: 'Variante Eliminada',
              detail: `Variante ${formatSize(variant.size)} - ${formatColor(variant.color)} eliminada correctamente.`
            });
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error eliminando variante:', error);
            this.isLoading.set(false);
            // El error.interceptor ya mostró el toast
            // Si el error es por órdenes asociadas, el mensaje vendrá del backend
          }
        });
      }
    });
  }

  // ===========================
  // GESTIÓN DE IMÁGENES
  // ===========================

  /**
   * Handler cuando cambian las imágenes del producto
   * Actualiza el signal de imágenes para reflejar los cambios
   */
  onImagesChanged(newImages: string[]): void {
    this.productImages.set(newImages);
  }

  /**
   * Handler cuando cambia la imagen destacada del producto
   * Actualiza el signal del índice de imagen destacada
   */
  onFeaturedImageChanged(newIndex: number): void {
    this.productFeaturedIndex.set(newIndex);
  }
}
