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
import { Product, ProductListItem, ProductColor, ProductSize, formatColor, formatStyle, formatEnumValue, getColorHex } from '../../../core/models/product.model';

// Shared components
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

// SEO utilities (FASE 8c)
import { truncateDescription, buildPageUrl, getMetaTagDescription } from '../../../shared/utils/seo.util';

/**
 * ProductDetailComponent - Página de detalle de producto
 *
 * FASE 8c Sprint 3: Diseño estilo Poseidon
 * - Thumbnails verticales a la izquierda
 * - Imagen principal grande en el centro
 * - Panel de info a la derecha (rating, color, size, quantity, add to cart)
 * - Tabs debajo (Details, Reviews, Shipping)
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
    // Subscribe to route params to reload product if ID changes
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      } else {
        this.error.set('ID de producto no válido');
        this.loading.set(false);
      }
    });
  }

  /**
   * Carga el producto desde el backend
   */
  private loadProduct(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getPublicProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);

        // FASE 8c: Update meta tags with product information
        this.updatePageMetaTags(product);

        // FASE 8c: Cargar productos relacionados después de cargar el producto principal
        this.loadRelatedProducts(product.category, product.id);
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error.set(
          err.status === 404
            ? 'Producto no encontrado'
            : 'Error al cargar el producto. Por favor, intenta nuevamente.'
        );
        this.loading.set(false);

        // FASE 8c: Reset meta tags on error
        this.resetPageMetaTags();
      }
    });
  }

  /**
   * Carga productos relacionados de la misma categoría (FASE 8c)
   *
   * @param category Categoría del producto actual
   * @param excludeId ID del producto actual (para excluirlo)
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
        console.error('Error loading related products:', err);
        this.relatedError.set('No se pudieron cargar productos relacionados');
        this.relatedLoading.set(false);
      }
    });
  }

  /**
   * Volver al catálogo
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Reintentar carga del producto
   */
  retry(): void {
    const id = this.productId();
    if (id) {
      this.loadProduct(id);
    }
  }

  /**
   * Seleccionar imagen de la galería
   */
  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  /**
   * Agregar al carrito (placeholder por ahora - FASE 9)
   */
  addToCart(): void {
    if (!this.selectedVariant()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Selección Incompleta',
        detail: 'Por favor selecciona talla y color'
      });
      return;
    }

    // Placeholder toast para FASE 9
    this.messageService.add({
      severity: 'info',
      summary: 'Próximamente',
      detail: 'Funcionalidad de carrito disponible en FASE 9'
    });
  }

  // ===========================
  // SEO META TAGS (FASE 8c)
  // ===========================

  /**
   * Update page meta tags with product information
   * Called after successfully loading product
   *
   * @param product - Loaded product object
   */
  private updatePageMetaTags(product: Product): void {
    // 1. PAGE TITLE
    // Format: "Remera Oversize Negra - Tu Tienda"
    const pageTitle = `${product.name} - Tu Tienda`;
    this.titleService.setTitle(pageTitle);

    // 2. META DESCRIPTION
    // Use product description truncated to 160 chars
    const metaDescription = getMetaTagDescription(product.description, 160);
    this.updateMetaTag('name', 'description', metaDescription);

    // 3. OPEN GRAPH TAGS (for social sharing)
    const currentUrl = buildPageUrl(this.router.url);
    const featuredImage = this.getFeaturedImageUrl(product);

    // og:title
    this.updateMetaTag('property', 'og:title', pageTitle);

    // og:description
    this.updateMetaTag('property', 'og:description', metaDescription);

    // og:image - Use featured/first image
    this.updateMetaTag('property', 'og:image', featuredImage);

    // og:url - Current page URL
    this.updateMetaTag('property', 'og:url', currentUrl);

    // og:type - Type is "product"
    this.updateMetaTag('property', 'og:type', 'product');

    // 4. TWITTER CARD TAGS
    this.updateMetaTag('name', 'twitter:card', 'summary_large_image');
    this.updateMetaTag('name', 'twitter:title', pageTitle);
    this.updateMetaTag('name', 'twitter:description', metaDescription);
    this.updateMetaTag('name', 'twitter:image', featuredImage);

    // 5. ADDITIONAL SEO TAGS (optional but recommended)
    // Keywords (if available from tags)
    if (product.tags && product.tags.length > 0) {
      const keywords = product.tags.join(', ');
      this.updateMetaTag('name', 'keywords', keywords);
    }

    // Category in structured data format
    this.updateMetaTag('property', 'product:category', product.category);
  }

  /**
   * Get the featured/first product image URL
   * Falls back to placeholder if no images
   *
   * @param product - Product object
   * @returns URL of featured image
   */
  private getFeaturedImageUrl(product: Product): string {
    if (!product.images || product.images.length === 0) {
      return buildPageUrl('/assets/images/placeholder-product.png');
    }

    const featuredIndex = product.featuredImageIndex || 0;
    return product.images[featuredIndex];
  }

  /**
   * Update or create a meta tag
   * Handles both 'name' and 'property' attributes
   *
   * @param attrType - Either 'name' or 'property'
   * @param attrName - Attribute name (e.g., 'description', 'og:title')
   * @param value - Attribute value
   */
  private updateMetaTag(
    attrType: 'name' | 'property',
    attrName: string,
    value: string
  ): void {
    // First, try to remove existing tag with same name/property
    this.metaService.removeTag(`${attrType}='${attrName}'`);

    // Then add new tag
    if (attrType === 'name') {
      this.metaService.addTag({ name: attrName, content: value });
    } else {
      this.metaService.addTag({ property: attrName, content: value });
    }
  }

  /**
   * Reset meta tags to default/blank state
   * Called on component destroy
   */
  private resetPageMetaTags(): void {
    // Reset title to app default
    this.titleService.setTitle('Tu Tienda - E-Commerce');

    // Remove dynamic meta tags
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
   * Cleanup lifecycle hook
   * Resets meta tags when leaving the component
   */
  ngOnDestroy(): void {
    this.resetPageMetaTags();
  }
}
