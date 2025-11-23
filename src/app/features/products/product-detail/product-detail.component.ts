import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RatingModule } from 'primeng/rating';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabsModule } from 'primeng/tabs';
import { CarouselModule } from 'primeng/carousel';
import { MenuItem, MessageService } from 'primeng/api';

// Services and models
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product, ProductListItem, ProductColor, ProductSize, formatColor, formatStyle, formatEnumValue, getColorHex } from '../../../core/models/product.model';

// Shared components
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

// SEO utilities (FASE 8c)
import { truncateDescription, buildPageUrl, getMetaTagDescription } from '../../../shared/utils/seo.util';

/**
 * ProductDetailComponent - Página de detalhes do produto
 *
 * FASE 8c Sprint 3: Design estilo Poseidon
 * - Miniaturas verticais à esquerda
 * - Imagem principal grande no centro
 * - Painel de informações à direita (classificação, cor, tamanho, quantidade, adicionar ao carrinho)
 * - Abas abaixo (Detalhes, Avaliações, Entrega)
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    ImageModule,
    ProgressSpinnerModule,
    BreadcrumbModule,
    RatingModule,
    InputNumberModule,
    TabsModule,
    CarouselModule,
    ProductCardComponent
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  // Services
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  // SEO services (FASE 8c)
  private titleService = inject(Title);
  private metaService = inject(Meta);

  // State signals
  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  addingToCart = signal(false);

  // Gallery/Image signals
  currentImageIndex = signal(0);
  galleryImages = computed(() => {
    const p = this.product();
    if (!p || !p.images || p.images.length === 0) {
      return ['/assets/images/placeholder-product.png'];
    }
    return p.images;
  });
  currentImage = computed(() => this.galleryImages()[this.currentImageIndex()]);

  // Rating (hardcoded for now)
  rating = signal(4.5);
  reviewsCount = signal(24);

  // Variant selection
  selectedColor = signal<ProductColor | null>(null);
  selectedSize = signal<ProductSize | null>(null);
  quantity = signal(1);

  // Related products (FASE 8c)
  relatedProducts = signal<ProductListItem[]>([]);
  relatedLoading = signal(false);
  relatedError = signal<string | null>(null);

  // Computed properties
  productId = computed(() => this.route.snapshot.paramMap.get('id'));

  availableColors = computed(() => {
    const p = this.product();
    if (!p) return [];
    return [...new Set(p.variants.filter(v => v.stock > 0).map(v => v.color))];
  });

  availableSizes = computed(() => {
    const p = this.product();
    const color = this.selectedColor();
    if (!p) return [];

    const filteredVariants = color
      ? p.variants.filter(v => v.color === color && v.stock > 0)
      : p.variants.filter(v => v.stock > 0);

    return [...new Set(filteredVariants.map(v => v.size))];
  });

  selectedVariant = computed(() => {
    const p = this.product();
    const size = this.selectedSize();
    const color = this.selectedColor();
    if (!p || !size || !color) return null;

    return p.variants.find(v => v.size === size && v.color === color) || null;
  });

  maxQuantity = computed(() => this.selectedVariant()?.stock || 1);

  // Breadcrumbs (Home is rendered automatically by p-breadcrumb [home] prop)
  breadcrumbItems = computed<MenuItem[]>(() => {
    const p = this.product();
    if (!p) return [];

    return [
      {
        label: formatEnumValue(p.category),
        icon: 'pi pi-tag',
        routerLink: '/products',
        queryParams: { category: p.category }
      },
      {
        label: p.name,
        disabled: true // Current page, not clickable
      }
    ];
  });

  // All possible sizes for selector
  allSizes: ProductSize[] = [ProductSize.P, ProductSize.M, ProductSize.G, ProductSize.GG];

  // Carousel responsive configuration (FASE 8c)
  relatedProductsCarouselConfig = [
    { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
    { breakpoint: '768px', numVisible: 2, numScroll: 1 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

  // Helper functions (exposed for template)
  formatColor = formatColor;
  formatStyle = formatStyle;
  formatEnumValue = formatEnumValue;
  getColorHex = getColorHex;

  ngOnInit(): void {
    // Inscrever-se aos parâmetros da rota para recarregar o produto se o ID mudar
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      } else {
        this.error.set('ID do produto inválido');
        this.loading.set(false);
      }
    });
  }

  /**
   * Carrega o produto desde o backend
   */
  private loadProduct(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getPublicProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);

        // FASE 8c: Atualizar meta tags com informações do produto
        this.updatePageMetaTags(product);

        // FASE 8c: Carregar produtos relacionados depois de carregar o produto principal
        this.loadRelatedProducts(product.category, product.id);
      },
      error: (err) => {
        console.error('Erro ao carregar o produto:', err);
        this.error.set(
          err.status === 404
            ? 'Produto não encontrado'
            : 'Erro ao carregar o produto. Por favor, tente novamente.'
        );
        this.loading.set(false);

        // FASE 8c: Resetar meta tags em caso de erro
        this.resetPageMetaTags();
      }
    });
  }

  /**
   * Carrega produtos relacionados da mesma categoria (FASE 8c)
   *
   * @param category Categoria do produto atual
   * @param excludeId ID do produto atual (para excluir)
   */
  private loadRelatedProducts(category: string, excludeId: string): void {
    this.relatedLoading.set(true);
    this.relatedError.set(null);

    this.productService.getRelatedProducts(category as any, excludeId, 6).subscribe({
      next: (products) => {
        this.relatedProducts.set(products);
        this.relatedLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar produtos relacionados:', err);
        this.relatedError.set('Não foi possível carregar produtos relacionados');
        this.relatedLoading.set(false);
      }
    });
  }

  /**
   * Voltar ao catálogo
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Tentar novamente o carregamento do produto
   */
  retry(): void {
    const id = this.productId();
    if (id) {
      this.loadProduct(id);
    }
  }

  /**
   * Selecionar imagem da galeria
   */
  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  /**
   * Adicionar ao carrinho (FASE 9)
   */
  addToCart(): void {
    const variant = this.selectedVariant();
    const product = this.product();
    const qty = this.quantity();

    if (!variant || !product) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Seleção Incompleta',
        detail: 'Por favor selecione tamanho e cor'
      });
      return;
    }

    if (variant.stock < qty) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Estoque Insuficiente',
        detail: `Apenas ${variant.stock} unidades disponíveis`
      });
      return;
    }

    this.addingToCart.set(true);

    const request = {
      productId: product.id,
      variantSKU: variant.sku,
      quantity: qty
    };

    const snapshot = {
      name: product.name,
      image: product.images?.[product.featuredImageIndex || 0] || '',
      size: variant.size,
      color: variant.color,
      price: variant.price || product.basePrice
    };

    this.cartService.addItem(request, snapshot).subscribe({
      next: () => {
        this.addingToCart.set(false);
        // O toast já é exibido desde o CartService
        // Reiniciar quantidade para 1 depois de adicionar
        this.quantity.set(1);
      },
      error: () => {
        this.addingToCart.set(false);
        // O erro já é tratado no CartService
      }
    });
  }

  // ===========================
  // META TAGS SEO (FASE 8c)
  // ===========================

  /**
   * Atualizar meta tags da página com informações do produto
   * Chamado após carregar o produto com sucesso
   *
   * @param product - Objeto do produto carregado
   */
  private updatePageMetaTags(product: Product): void {
    // 1. TÍTULO DA PÁGINA
    // Formato: "Camiseta Oversize Preta - Minha Loja"
    const pageTitle = `${product.name} - Minha Loja`;
    this.titleService.setTitle(pageTitle);

    // 2. META DESCRIÇÃO
    // Usar descrição do produto truncada para 160 caracteres
    const metaDescription = getMetaTagDescription(product.description, 160);
    this.updateMetaTag('name', 'description', metaDescription);

    // 3. TAGS OPEN GRAPH (para compartilhamento em redes sociais)
    const currentUrl = buildPageUrl(this.router.url);
    const featuredImage = this.getFeaturedImageUrl(product);

    // og:title
    this.updateMetaTag('property', 'og:title', pageTitle);

    // og:description
    this.updateMetaTag('property', 'og:description', metaDescription);

    // og:image - Usar imagem destacada/primeira
    this.updateMetaTag('property', 'og:image', featuredImage);

    // og:url - URL da página atual
    this.updateMetaTag('property', 'og:url', currentUrl);

    // og:type - Tipo é "product"
    this.updateMetaTag('property', 'og:type', 'product');

    // 4. TAGS DO TWITTER CARD
    this.updateMetaTag('name', 'twitter:card', 'summary_large_image');
    this.updateMetaTag('name', 'twitter:title', pageTitle);
    this.updateMetaTag('name', 'twitter:description', metaDescription);
    this.updateMetaTag('name', 'twitter:image', featuredImage);

    // 5. TAGS SEO ADICIONAIS (opcional mas recomendado)
    // Palavras-chave (se disponível das tags)
    if (product.tags && product.tags.length > 0) {
      const keywords = product.tags.join(', ');
      this.updateMetaTag('name', 'keywords', keywords);
    }

    // Categoria em formato de dados estruturados
    this.updateMetaTag('property', 'product:category', product.category);
  }

  /**
   * Obter a URL da imagem destaque/primeira do produto
   * Volta para o placeholder se não houver imagens
   *
   * @param product - Objeto do produto
   * @returns URL da imagem destacada
   */
  private getFeaturedImageUrl(product: Product): string {
    if (!product.images || product.images.length === 0) {
      return buildPageUrl('/assets/images/placeholder-product.png');
    }

    const featuredIndex = product.featuredImageIndex || 0;
    return product.images[featuredIndex];
  }

  /**
   * Atualizar ou criar uma meta tag
   * Manipula ambos os atributos 'name' e 'property'
   *
   * @param attrType - 'name' ou 'property'
   * @param attrName - Nome do atributo (ex: 'description', 'og:title')
   * @param value - Valor do atributo
   */
  private updateMetaTag(
    attrType: 'name' | 'property',
    attrName: string,
    value: string
  ): void {
    // Primeiro, tente remover a tag existente com o mesmo name/property
    this.metaService.removeTag(`${attrType}='${attrName}'`);

    // Depois adicione a nova tag
    if (attrType === 'name') {
      this.metaService.addTag({ name: attrName, content: value });
    } else {
      this.metaService.addTag({ property: attrName, content: value });
    }
  }

  /**
   * Resetar meta tags para estado padrão/em branco
   * Chamado ao destruir o componente
   */
  private resetPageMetaTags(): void {
    // Resetar título para o padrão da aplicação
    this.titleService.setTitle('Minha Loja - E-Commerce');

    // Remover meta tags dinâmicas
    const metaTags = [
      'description',
      'og:title',
      'og:description',
      'og:image',
      'og:url',
      'og:type',
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image',
      'keywords',
      'product:category'
    ];

    metaTags.forEach(tag => {
      if (tag.startsWith('og:') || tag.startsWith('twitter:') || tag === 'product:category') {
        this.metaService.removeTag(`property='${tag}'`);
      } else {
        this.metaService.removeTag(`name='${tag}'`);
      }
    });
  }

  /**
   * Hook do ciclo de vida para limpeza
   * Reseta meta tags ao sair do componente
   */
  ngOnDestroy(): void {
    this.resetPageMetaTags();
  }
}
