import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// PrimeNG imports
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { Paginator } from 'primeng/paginator';

// Services and models
import { ProductService } from '../../core/services/product.service';
import { ProductListItem } from '../../core/models/product.model';

// Shared components
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

/**
 * ProductListComponent - Catálogo público de productos
 *
 * Funcionalidades:
 * - Grid responsive de productos
 * - Búsqueda con debounce (300ms)
 * - Paginación
 * - Loading y empty states
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    Paginator,
    ProductCardComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit, OnDestroy {
  // Services
  private productService = inject(ProductService);
  private activatedRoute = inject(ActivatedRoute);

  // State (usando signals)
  products = signal<ProductListItem[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Paginación
  totalRecords = signal<number>(0);
  currentPage = 1;
  rowsPerPage = 12; // 12 productos por página (3 columnas × 4 filas)
  first = 0; // Para PrimeNG Paginator

  // Búsqueda
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Filtros de query params (ej: ?style=regular&category=remera)
  private currentFilters: any = {};

  ngOnInit(): void {
    // Suscribirse a query params (ej: /products?style=regular&category=remera)
    this.activatedRoute.queryParams.subscribe((params) => {
      // Extraer filtros de query params
      this.currentFilters = {};
      if (params['style']) this.currentFilters.style = params['style'];
      if (params['category']) this.currentFilters.category = params['category'];
      if (params['minPrice']) this.currentFilters.minPrice = params['minPrice'];
      if (params['maxPrice']) this.currentFilters.maxPrice = params['maxPrice'];

      // Resetear paginación al cambiar filtros
      this.currentPage = 1;
      this.first = 0;

      // Recargar productos con nuevos filtros
      this.loadProducts();
    });

    // Configurar debounce para búsqueda (300ms)
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((searchValue) => {
        this.searchTerm = searchValue;
        this.currentPage = 1;
        this.first = 0;
        this.loadProducts();
      });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  /**
   * Carga productos desde el backend
   * Incluye filtros de query params, búsqueda y paginación
   */
  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = {
      page: this.currentPage,
      limit: this.rowsPerPage,
      search: this.searchTerm || undefined,
      ...this.currentFilters // Agregar filtros de query params (style, category, etc.)
    };

    this.productService.getPublicCatalog(filters).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.totalRecords.set(response.pagination.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.error.set('No se pudieron cargar los productos. Intenta nuevamente.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Maneja el cambio de búsqueda con debounce
   */
  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  /**
   * Maneja el cambio de página del paginador
   */
  onPageChange(event: any): void {
    this.currentPage = event.page + 1; // PrimeNG usa índice 0, backend usa 1
    this.rowsPerPage = event.rows;
    this.first = event.first;
    this.loadProducts();
  }
}
