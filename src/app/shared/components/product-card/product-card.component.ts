import { Component, inject, input, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// Models & Services
import { Product, ProductListItem, ProductColor, ProductSize, getColorHex, formatColor, formatSize } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';

/**
 * ProductCardComponent - Tarjeta reutilizable de producto
 *
 * Componente shared que muestra la información básica de un producto
 * en formato de tarjeta (card). Usado en:
 * - Home (carousel de productos destacados)
 * - Catálogo público (grid de productos)
 * - Resultados de búsqueda
 * 
 * ACTUALIZACIÓN: Ahora incluye selectores de color/tamaño y botón
 * para agregar al carrito directamente desde la tarjeta.
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ImageModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  private router = inject(Router);
  private cartService = inject(CartService);

  /** Producto a mostrar en la tarjeta (acepta Product o ProductListItem) */
  product = input.required<Product | ProductListItem>();

  /** Modo de vista: 'grid' (card vertical) o 'list' (layout horizontal) */
  viewMode = input<'grid' | 'list'>('grid');

  // ========== SIGNALS DE ESTADO ==========
  
  /** Color seleccionado por el usuario */
  private selectedColorSignal = signal<ProductColor | null>(null);
  
  /** Tamaño seleccionado por el usuario */
  private selectedSizeSignal = signal<ProductSize | null>(null);
  
  /** Indica si se está agregando el producto al carrito (signal privado) */
  private isAddingToCartSignal = signal<boolean>(false);

  // Versiones read-only públicas
  selectedColor = this.selectedColorSignal.asReadonly();
  selectedSize = this.selectedSizeSignal.asReadonly();
  isAddingToCart = this.isAddingToCartSignal.asReadonly();

  // ========== COMPUTED SIGNALS ==========

  /**
   * Verifica si el producto tiene variantes disponibles
   */
  hasVariants = computed(() => {
    const prod = this.product();
    return 'variants' in prod && Array.isArray(prod.variants) && prod.variants.length > 0;
  });

  /**
   * Colores únicos disponibles (con stock > 0)
   */
  availableColors = computed(() => {
    const prod = this.product();
    if (!this.hasVariants()) return [];
    
    const colorsWithStock = prod.variants!
      .filter(v => v.stock > 0)
      .map(v => v.color);
    
    return [...new Set(colorsWithStock)];
  });

  /**
   * Tamaños disponibles según el color seleccionado
   */
  availableSizes = computed(() => {
    const prod = this.product();
    const color = this.selectedColor();
    
    if (!color || !this.hasVariants()) return [];
    
    return prod.variants!
      .filter(v => v.color === color && v.stock > 0)
      .map(v => v.size);
  });

  /**
   * Variante actualmente seleccionada (combinación color + tamaño)
   */
  selectedVariant = computed(() => {
    const prod = this.product();
    const color = this.selectedColor();
    const size = this.selectedSize();
    
    if (!color || !size || !this.hasVariants()) return null;
    
    return prod.variants!.find(
      v => v.color === color && v.size === size
    );
  });

  /**
   * Precio final (base + modificador de variante, o precio directo de variante)
   */
  finalPrice = computed(() => {
    const variant = this.selectedVariant();
    const prod = this.product();
    
    if (variant?.price) {
      return variant.price;
    }
    
    return prod.basePrice;
  });

  /**
   * Precio formateado del producto (precio base)
   */
  formattedPrice = computed(() => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(this.product().basePrice);
  });

  /**
   * Precio final formateado
   */
  formattedFinalPrice = computed(() => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(this.finalPrice());
  });

  /**
   * Verifica si se puede agregar al carrito
   * Requiere: color y tamaño seleccionados, variante válida, y no estar procesando
   */
  canAddToCart = computed(() => {
    return this.selectedColor() !== null 
      && this.selectedSize() !== null 
      && this.selectedVariant() !== null
      && !this.isAddingToCart();
  });

  /**
   * Verifica si el stock es bajo (≤ 5 unidades)
   */
  isLowStock = computed(() => {
    const variant = this.selectedVariant();
    return variant && variant.stock > 0 && variant.stock <= 5;
  });

  /**
   * URL de la imagen principal del producto
   * Usa featuredImageIndex si está definido, sino la primera imagen
   */
  productImage = computed(() => {
    const prod = this.product();
    if ('images' in prod && prod.images && prod.images.length > 0) {
      const index = prod.featuredImageIndex ?? 0;
      return prod.images[index];
    }
    return undefined;
  });

  // ========== CONSTRUCTOR & EFFECTS ==========

  constructor() {
    // Auto-seleccionar primera combinación disponible
    effect(() => {
      const colors = this.availableColors();
      
      if (colors.length > 0 && !this.selectedColor()) {
        this.selectColor(colors[0]);
      }
    });
  }

  // ========== MÉTODOS PÚBLICOS ==========

  /**
   * Seleccionar color
   * Actualiza los tamaños disponibles y resetea/mantiene el tamaño según disponibilidad
   */
  selectColor(color: ProductColor): void {
    this.selectedColorSignal.set(color);
    
    // Verificar si el tamaño actual sigue disponible con el nuevo color
    const availableSizes = this.availableSizes();
    const currentSize = this.selectedSize();
    
    if (currentSize && !availableSizes.includes(currentSize)) {
      // Si el tamaño no está disponible, resetear
      this.selectedSizeSignal.set(null);
    } else if (!currentSize && availableSizes.length > 0) {
      // Auto-seleccionar el primer tamaño disponible si no hay ninguno seleccionado
      this.selectedSizeSignal.set(availableSizes[0]);
    }
  }

  /**
   * Seleccionar tamaño
   */
  selectSize(size: ProductSize): void {
    this.selectedSizeSignal.set(size);
  }

  /**
   * Obtener código hexadecimal de color para visualización
   */
  getColorHex(color: ProductColor): string {
    return getColorHex(color);
  }

  /**
   * Obtener nombre del color en español
   */
  getColorName(color: ProductColor): string {
    return formatColor(color);
  }

  /**
   * Formatear tamaño para visualización
   */
  formatSize(size: ProductSize): string {
    return formatSize(size);
  }

  /**
   * Agregar producto al carrito con la variante seleccionada
   */
  addToCart(event: Event): void {
    event.stopPropagation(); // Prevenir navegación al detalle
    
    const variant = this.selectedVariant();
    const prod = this.product();
    
    if (!variant || !this.canAddToCart()) return;
    
    this.isAddingToCartSignal.set(true);
    
    const request = {
      productId: prod.id,
      variantSKU: variant.sku,
      quantity: 1
    };
    
    const snapshot = {
      name: prod.name,
      image: this.productImage(),
      size: formatSize(variant.size),
      color: formatColor(variant.color),
      price: this.finalPrice()
    };
    
    this.cartService.addItem(request, snapshot).subscribe({
      next: () => {
        this.isAddingToCartSignal.set(false);
        // El CartService ya abre el drawer automáticamente
      },
      error: (error) => {
        console.error('Error agregando al carrito:', error);
        this.isAddingToCartSignal.set(false);
      }
    });
  }

  /**
   * Navega al detalle del producto
   */
  navigateToDetail(): void {
    this.router.navigate(['/products', this.product().id]);
  }
}
