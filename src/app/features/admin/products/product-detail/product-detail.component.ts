import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ImageModule } from 'primeng/image';
import { GalleriaModule } from 'primeng/galleria';

// Services and models
import { ProductService } from '../../../../core/services/product.service';
import {
  Product,
  ProductVariant,
  formatEnumValue,
  getStatusSeverity
} from '../../../../core/models/product.model';

/**
 * ProductDetailComponent - Vista de detalle de producto (solo lectura)
 *
 * Funcionalidades:
 * - Muestra todos los datos del producto en modo lectura
 * - Lista las variantes con stock y precios
 * - Botones para volver a la lista o editar el producto
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    ToastModule,
    TableModule,
    ImageModule,
    GalleriaModule
  ],
  providers: [MessageService],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  // Services
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  // State
  product = signal<Product | null>(null);
  loading = signal<boolean>(false);
  productId: string | null = null;

  // Helper functions
  formatEnumValue = formatEnumValue;
  getStatusSeverity = getStatusSeverity;

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');

    if (this.productId) {
      this.loadProduct(this.productId);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'ID de producto inválido'
      });
      this.goBack();
    }
  }

  /**
   * Carga el producto desde el backend
   */
  loadProduct(id: string): void {
    this.loading.set(true);

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el producto. Intenta nuevamente.'
        });
        this.loading.set(false);
        this.goBack();
      }
    });
  }

  /**
   * Navega al formulario de edición
   */
  editProduct(): void {
    if (this.productId) {
      this.router.navigate(['/admin/products', this.productId, 'edit']);
    }
  }

  /**
   * Vuelve a la lista de productos
   */
  goBack(): void {
    this.router.navigate(['/admin/products']);
  }

  /**
   * Calcula el stock total de todas las variantes
   */
  getTotalStock(): number {
    const prod = this.product();
    if (!prod || !prod.variants) return 0;
    return prod.variants.reduce((sum, v) => sum + v.stock, 0);
  }
}
