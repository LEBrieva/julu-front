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
 * ProductFormComponent - Formulário de Produto (Criar/Editar)
 *
 * Funcionalidades:
 * - Modo criar: /admin/products/new
 * - Modo editar: /admin/products/:id/edit
 * - Validações com reactive forms
 * - Dropdown dinâmico de estilos conforme categoria
 * - Em modo simplificado: cria 1 variante por padrão (M, preto, estoque 0)
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

  // Opções de cor em português
  colorOptions = [
    { label: 'Preto', value: ProductColor.BLACK },
    { label: 'Branco', value: ProductColor.WHITE },
    { label: 'Cinza', value: ProductColor.GRAY },
    { label: 'Azul Marinho', value: ProductColor.NAVY },
    { label: 'Vermelho', value: ProductColor.RED },
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
   * Carrega o produto para editar
   */
  private loadProduct(id: string): void {
    this.isLoading.set(true);
    this.productImages.set([]); // Limpar imagens anteriores

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.populateForm(product);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar produto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar o produto. Tente novamente.'
        });
        this.isLoading.set(false);
        this.goBack();
      }
    });
  }

  /**
   * Preenche o formulário com os dados do produto
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

    // Inicializar imagens (assegurar que seja um array válido)
    this.productImages.set(Array.isArray(product.images) ? product.images : []);

    // Inicializar índice de imagem em destaque
    this.productFeaturedIndex.set(product.featuredImageIndex ?? 0);

    // Atualizar estilos disponíveis conforme a categoria carregada
    if (product.category) {
      this.onCategoryChange(product.category);
    }
  }

  /**
   * Trata a mudança de categoria
   * Atualiza os estilos disponíveis conforme a categoria selecionada
   */
  private onCategoryChange(category: ProductCategory): void {
    if (!category) {
      this.availableStyleOptions = [];
      return;
    }

    // Obter estilos válidos para esta categoria
    const validStyles = CATEGORY_STYLE_MAP[category] || [];
    this.availableStyleOptions = validStyles.map((style) => ({
      label: this.formatEnumValue(style),
      value: style
    }));

    // Limpar o campo de estilo se não for mais válido para a nova categoria
    const currentStyle = this.productForm.get('style')?.value;
    if (currentStyle && !validStyles.includes(currentStyle)) {
      this.productForm.patchValue({ style: '' });
    }
  }

  /**
   * Formata um valor de enum para mostrar na UI
   */
  private formatEnumValue(value: string): string {
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Getter para acessar facilmente os controles do formulário
   */
  get f() {
    return this.productForm.controls;
  }

  /**
   * Trata o submit do formulário
   */
  onSubmit(): void {
    // Marcar todos os campos como touched para mostrar erros
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulário Inválido',
        detail: 'Por favor corrija os erros antes de continuar.'
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
   * Cria um novo produto
   */
  private createProduct(): void {
    const formValue = this.productForm.value;

    // Validar que haja pelo menos 1 variante
    if (this.variants.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Variantes Necessárias',
        detail: 'Você deve adicionar pelo menos uma variante antes de criar o produto.'
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
          summary: 'Produto Criado',
          detail: `O produto "${product.name}" foi criado com sucesso com ${this.variants.length} variante(s).`
        });
        this.isLoading.set(false);
        // Aguardar um momento para que o usuário veja a mensagem
        setTimeout(() => this.goBack(), 1500);
      },
      error: (error) => {
        console.error('Erro ao criar produto:', error);
        this.isLoading.set(false);
        // O error.interceptor já mostrou o toast, apenas fazemos log
      }
    });
  }

  /**
   * Atualiza um produto existente
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
          summary: 'Produto Atualizado',
          detail: `O produto "${product.name}" foi atualizado com sucesso.`
        });
        this.isLoading.set(false);
        // Aguardar um momento para que o usuário veja a mensagem
        setTimeout(() => this.goBack(), 1500);
      },
      error: (error) => {
        console.error('Erro ao atualizar produto:', error);
        this.isLoading.set(false);
        // O error.interceptor já mostrou o toast, apenas fazemos log
      }
    });
  }

  /**
   * Volta para a lista de produtos
   */
  goBack(): void {
    this.router.navigate(['/admin/products']);
  }

  /**
   * Reseta o formulário
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
   * Adiciona uma tag ao array quando Enter é pressionado
   */
  addTag(event: Event): void {
    event.preventDefault(); // Previne submit do formulário
    event.stopPropagation();

    const tag = this.tagInput.trim();

    // Validar que não esteja vazio
    if (!tag) {
      return;
    }

    // Obter tags atuais
    const currentTags: string[] = this.productForm.get('tags')?.value || [];

    // Validar que não exista já (evitar duplicados)
    if (currentTags.includes(tag)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Tag Duplicada',
        detail: 'Esta tag já foi adicionada.'
      });
      this.tagInput = '';
      return;
    }

    // Adicionar nova tag
    this.productForm.patchValue({
      tags: [...currentTags, tag]
    });

    // Limpar input
    this.tagInput = '';
  }

  /**
   * Remove uma tag do array
   */
  removeTag(index: number): void {
    const currentTags: string[] = this.productForm.get('tags')?.value || [];
    const updatedTags = currentTags.filter((_, i) => i !== index);

    this.productForm.patchValue({
      tags: updatedTags
    });
  }

  // ===========================
  // GESTÃO DE VARIANTES (CRIAR)
  // ===========================

  /**
   * Adiciona uma variante ao array local (apenas modo CRIAR)
   * Valida que a combinação tamanho+cor não exista
   */
  addVariant(): void {
    // Validar que tamanho e cor estejam selecionados
    if (!this.variantSize || !this.variantColor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Dados Incompletos',
        detail: 'Você deve selecionar tamanho e cor para adicionar uma variante.'
      });
      return;
    }

    // Validar que estoque seja >= 0
    if (this.variantStock < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valores Inválidos',
        detail: 'O estoque deve ser maior ou igual a 0.'
      });
      return;
    }

    // Validar que a combinação tamanho+cor não exista
    const exists = this.variants.some(
      (v) => v.size === this.variantSize && v.color === this.variantColor
    );

    if (exists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Variante Duplicada',
        detail: `Já existe uma variante com tamanho ${formatSize(this.variantSize)} e cor ${formatColor(this.variantColor)}.`
      });
      return;
    }

    // Adicionar variante ao array local
    const newVariant: CreateProductVariantDto = {
      size: this.variantSize,
      color: this.variantColor,
      stock: this.variantStock
    };

    this.variants.push(newVariant);

    // Resetar inputs
    this.variantSize = null;
    this.variantColor = null;
    this.variantStock = 0;

    // Não mostrar toast em modo CRIAR (é apenas array local)
  }

  /**
   * Remove uma variante do array local (apenas modo CRIAR)
   */
  removeVariant(index: number): void {
    if (index < 0 || index >= this.variants.length) return;

    this.variants.splice(index, 1);

    // No mostrar toast en modo CREAR (es solo array local)
  }

  // ===========================
  // GESTÃO DE VARIANTES (EDITAR)
  // ===========================

  /**
   * Inicia a edição de uma variante (apenas modo EDITAR)
   */
  startEditVariant(variant: ProductVariant): void {
    this.editingVariantSku = variant.sku;
    this.originalVariant = { ...variant }; // Guardar cópia para cancelar
  }

  /**
   * Cancela a edição de uma variante
   */
  cancelEditVariant(): void {
    if (this.originalVariant && this.currentProduct) {
      // Restaurar valores originais
      const index = this.currentProduct.variants.findIndex(v => v.sku === this.editingVariantSku);
      if (index !== -1) {
        this.currentProduct.variants[index] = { ...this.originalVariant };
      }
    }
    this.editingVariantSku = null;
    this.originalVariant = null;
  }

  /**
   * Salva as alterações de uma variante (apenas modo EDITAR)
   */
  saveVariantChanges(variant: ProductVariant): void {
    if (!this.productId || !this.currentProduct) return;

    // Validar alterações
    if (variant.stock < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valores Inválidos',
        detail: 'O estoque deve ser maior ou igual a 0.'
      });
      this.cancelEditVariant();
      return;
    }

    this.isLoading.set(true);

    const updateData: UpdateSingleVariantDto = {
      stock: variant.stock
    };

    this.productService.updateVariant(this.productId, variant.sku, updateData).subscribe({
      next: (updatedProduct) => {
        this.currentProduct = updatedProduct; // Atualizar produto completo
        this.messageService.add({
          severity: 'success',
          summary: 'Variante Atualizada',
          detail: `Variante ${formatSize(variant.size)} - ${formatColor(variant.color)} atualizada com sucesso.`
        });
        this.isLoading.set(false);
        this.editingVariantSku = null;
        this.originalVariant = null;
      },
      error: (error) => {
        console.error('Erro ao atualizar variante:', error);
        this.cancelEditVariant(); // Restaurar valores originais
        this.isLoading.set(false);
        // O error.interceptor já mostrou o toast
      }
    });
  }

  /**
   * Mostra/oculta o formulário de adicionar variante (apenas modo EDITAR)
   */
  toggleAddVariantForm(): void {
    this.showAddVariantForm = !this.showAddVariantForm;

    // Se fechar, resetar inputs
    if (!this.showAddVariantForm) {
      this.variantSize = null;
      this.variantColor = null;
      this.variantStock = 0;
    }
  }

  /**
   * Adiciona uma variante ao produto existente (apenas modo EDITAR)
   */
  addVariantToProduct(): void {
    if (!this.productId || !this.currentProduct) return;

    // Validar que tamanho e cor estejam selecionados
    if (!this.variantSize || !this.variantColor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Dados Incompletos',
        detail: 'Você deve selecionar tamanho e cor para adicionar uma variante.'
      });
      return;
    }

    // Validar que estoque seja >= 0
    if (this.variantStock < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valores Inválidos',
        detail: 'O estoque deve ser maior ou igual a 0.'
      });
      return;
    }

    // Validar que a combinação tamanho+cor não exista
    const exists = this.currentProduct.variants.some(
      (v) => v.size === this.variantSize && v.color === this.variantColor
    );

    if (exists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Variante Duplicada',
        detail: `Já existe uma variante com tamanho ${formatSize(this.variantSize)} e cor ${formatColor(this.variantColor)}.`
      });
      return;
    }

    this.isLoading.set(true);

    const newVariant: AddVariantDto = {
      size: this.variantSize,
      color: this.variantColor,
      stock: this.variantStock
    };

    this.productService.addVariant(this.productId, newVariant).subscribe({
      next: (updatedProduct) => {
        this.currentProduct = updatedProduct; // Atualizar produto completo
        this.messageService.add({
          severity: 'success',
          summary: 'Variante Adicionada',
          detail: `Variante ${formatSize(newVariant.size)} - ${formatColor(newVariant.color)} adicionada com sucesso.`
        });
        this.isLoading.set(false);

        // Resetar formulário e ocultá-lo
        this.variantSize = null;
        this.variantColor = null;
        this.variantStock = 0;
        this.showAddVariantForm = false;
      },
      error: (error) => {
        console.error('Erro ao adicionar variante:', error);
        this.isLoading.set(false);
        // O error.interceptor já mostrou o toast
      }
    });
  }

  /**
   * Remove uma variante do produto existente (apenas modo EDITAR)
   */
  deleteVariantFromProduct(variant: ProductVariant): void {
    if (!this.productId || !this.currentProduct) return;

    this.confirmationService.confirm({
      message: `Tem certeza que deseja remover a variante ${formatSize(variant.size)} - ${formatColor(variant.color)}?`,
      header: 'Confirmar Remoção',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, remover',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.isLoading.set(true);

        this.productService.deleteVariant(this.productId!, variant.sku).subscribe({
          next: (updatedProduct) => {
            this.currentProduct = updatedProduct; // Atualizar produto completo
            this.messageService.add({
              severity: 'success',
              summary: 'Variante Removida',
              detail: `Variante ${formatSize(variant.size)} - ${formatColor(variant.color)} removida com sucesso.`
            });
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Erro ao remover variante:', error);
            this.isLoading.set(false);
            // O error.interceptor já mostrou o toast
            // Se o erro for por pedidos associados, a mensagem virá do backend
          }
        });
      }
    });
  }

  // ===========================
  // GESTÃO DE IMAGENS
  // ===========================

  /**
   * Handler quando as imagens do produto mudam
   * Atualiza o signal de imagens para refletir as alterações
   */
  onImagesChanged(newImages: string[]): void {
    this.productImages.set(newImages);
  }

  /**
   * Handler quando a imagem em destaque do produto muda
   * Atualiza o signal do índice de imagem em destaque
   */
  onFeaturedImageChanged(newIndex: number): void {
    this.productFeaturedIndex.set(newIndex);
  }
}
