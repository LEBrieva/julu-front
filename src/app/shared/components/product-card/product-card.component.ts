import { Component, inject, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';

// Models
import { Product, ProductListItem } from '../../../core/models/product.model';

/**
 * ProductCardComponent - Tarjeta reutilizable de producto
 *
 * Componente shared que muestra la información básica de un producto
 * en formato de tarjeta (card). Usado en:
 * - Home (carousel de productos destacados)
 * - Catálogo público (grid de productos)
 * - Resultados de búsqueda
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ImageModule
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  private router = inject(Router);

  /** Producto a mostrar en la tarjeta (acepta Product o ProductListItem) */
  product = input.required<Product | ProductListItem>();

  /** Modo de vista: 'grid' (card vertical) o 'list' (layout horizontal) */
  viewMode = input<'grid' | 'list'>('grid');

  /**
   * URL de la imagen principal del producto
   * Usa featuredImageIndex si está definido, sino la primera imagen
   */
  productImage = computed(() => {
    const prod = this.product();
    // Verificar si el producto tiene imágenes (solo Product tiene este campo)
    if ('images' in prod && prod.images && prod.images.length > 0) {
      const index = prod.featuredImageIndex ?? 0;
      return prod.images[index];
    }
    return undefined;
  });

  /**
   * Precio formateado del producto
   */
  formattedPrice = computed(() => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(this.product().basePrice);
  });

  /**
   * Navega al detalle del producto
   * TODO: Implementar en FASE 8c
   */
  navigateToDetail(): void {
    this.router.navigate(['/products', this.product().id]);
  }
}
