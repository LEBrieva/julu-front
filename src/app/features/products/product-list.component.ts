import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { Paginator } from 'primeng/paginator';
import { DataViewModule } from 'primeng/dataview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DrawerModule } from 'primeng/drawer';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';

// Services and models
import { ProductService } from '../../core/services/product.service';
import { ProductListItem, FilterProductDto } from '../../core/models/product.model';

// Shared components
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar';
import { ActiveFiltersComponent } from '../../shared/components/active-filters/active-filters';

/**
 * ProductListComponent - Catálogo público de productos con filtros avanzados
 *
 * FASE 8b Features:
 * - Grid/List view toggle con PrimeNG DataView
 * - Sidebar de filtros avanzados (precio, tallas, colores, estilos, tags, destacados)
 * - Active filters chips (removibles)
 * - Sincronización con query params del router (URL compartible)
 * - Persistencia de preferencia de vista en localStorage
 * - Búsqueda con debounce (300ms)
 * - Paginación server-side
 * - Responsive (sidebar overlay en mobile)
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    Paginator,
    DataViewModule,
    ProgressSpinnerModule,
    DrawerModule,
    BadgeModule,
    TooltipModule,
    SelectModule,
    DividerModule,
    ProductCardComponent,
    FilterSidebarComponent,
    ActiveFiltersComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit, AfterViewInit, OnDestroy {
  // ViewChild para acceder al header
  @ViewChild('catalogHeader', { read: ElementRef }) catalogHeader?: ElementRef;
  
  // ViewChild para acceder al componente de filtros
  @ViewChild(FilterSidebarComponent) filterSidebar?: FilterSidebarComponent;

  // Services
  private productService = inject(ProductService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  // State (usando signals)
  products = signal<ProductListItem[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Paginación
  totalRecords = signal<number>(0);
  currentPage = 1;
  rowsPerPage = 12; // 12 productos por página
  rowsPerPageOptions = [12, 24, 36];
  first = 0; // Para PrimeNG Paginator

  // Ordenamiento
  sortBy = 'newest';
  sortOptions = [
    { label: 'Más Nuevos', value: 'newest' },
    { label: 'Precio: Menor a Mayor', value: 'price_asc' },
    { label: 'Precio: Mayor a Menor', value: 'price_desc' },
    { label: 'Nombre: A-Z', value: 'name_asc' },
    { label: 'Nombre: Z-A', value: 'name_desc' }
  ];

  // Filtros activos (sincronizados con query params)
  activeFilters = signal<FilterProductDto>({});

  // View mode (Grid / List)
  viewMode = signal<'grid' | 'list'>('grid');

  // Sidebar state (mobile)
  sidebarVisible = signal<boolean>(false);

  // Header sticky state
  isHeaderSticky = signal<boolean>(false);
  headerHeight = signal<number>(0);
  private headerOffsetTop = 0;

  // Contador de filtros activos (para badge)
  activeFiltersCount = computed(() => {
    const filters = this.activeFilters();
    let count = 0;
    if (filters.styles?.length) count++;
    if (filters.sizes?.length) count++;
    if (filters.colors?.length) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.destacado) count++;
    if (filters.tags?.length) count++;
    return count;
  });

  ngOnInit(): void {
    // Cargar preferencia de vista desde localStorage
    const savedViewMode = localStorage.getItem('catalogViewMode') as 'grid' | 'list' | null;
    if (savedViewMode) {
      this.viewMode.set(savedViewMode);
    }

    // Procesar query params iniciales
    const initialParams = this.activatedRoute.snapshot.queryParams;
    const initialFilters = this.parseQueryParamsToFilters(initialParams);
    this.activeFilters.set(initialFilters);

    // Cargar sortBy desde query params
    this.sortBy = initialParams['sortBy'] || 'newest';

    // Suscribirse a cambios en query params (para futuros cambios)
    this.activatedRoute.queryParams.subscribe((params) => {
      const filters = this.parseQueryParamsToFilters(params);
      this.activeFilters.set(filters);

      // Actualizar sortBy
      this.sortBy = params['sortBy'] || 'newest';

      // Resetear paginación al cambiar filtros
      this.currentPage = 1;
      this.first = 0;

      // Recargar productos con nuevos filtros
      this.loadProducts();
    });

    // Cargar productos inicialmente
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    // Obtener la posición inicial y altura del header
    if (this.catalogHeader) {
      setTimeout(() => {
        const headerElement = this.catalogHeader?.nativeElement;
        if (headerElement) {
          this.headerOffsetTop = headerElement.offsetTop;
          this.headerHeight.set(headerElement.offsetHeight);
        }
      }, 0);
    }
  }

  ngOnDestroy(): void {
    // No hay subscriptions manuales para completar
  }

  /**
   * Detecta scroll para hacer el header sticky
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
    const shouldBeSticky = scrollPosition >= this.headerOffsetTop;

    // Actualizar altura si el header cambió (ej: responsive, filtros aplicados)
    if (this.catalogHeader?.nativeElement && !shouldBeSticky) {
      const currentHeight = this.catalogHeader.nativeElement.offsetHeight;
      if (currentHeight !== this.headerHeight()) {
        this.headerHeight.set(currentHeight);
      }
    }

    this.isHeaderSticky.set(shouldBeSticky);
  }

  /**
   * Carga productos desde el backend con filtros activos
   */
  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: FilterProductDto = {
      ...this.activeFilters(),
      page: this.currentPage,
      limit: this.rowsPerPage,
      sortBy: this.sortBy as any
    };

    this.productService.getPublicCatalog(filters).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.totalRecords.set(response.pagination.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar los productos. Intenta nuevamente.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Aplica filtros desde el sidebar
   */
  onFiltersApplied(filters: FilterProductDto): void {
    this.updateQueryParams(filters);
    this.sidebarVisible.set(false); // Cerrar sidebar en mobile
  }

  /**
   * Limpia todos los filtros
   */
  onFiltersClear(): void {
    this.sortBy = 'newest';
    this.updateQueryParams({});
    this.sidebarVisible.set(false);
  }

  /**
   * Remueve un filtro individual desde ActiveFiltersComponent
   */
  onFilterRemoved(filterKey: string): void {
    const currentFilters = { ...this.activeFilters() };

    // Remover el filtro específico
    switch (filterKey) {
      case 'styles':
        delete currentFilters.styles;
        break;
      case 'sizes':
        delete currentFilters.sizes;
        break;
      case 'colors':
        delete currentFilters.colors;
        break;
      case 'price':
        delete currentFilters.minPrice;
        delete currentFilters.maxPrice;
        break;
      case 'destacado':
        delete currentFilters.destacado;
        break;
      case 'tags':
        delete currentFilters.tags;
        break;
    }

    this.updateQueryParams(currentFilters);
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onSortChange(event: any): void {
    const currentFilters = { ...this.activeFilters() };
    currentFilters.sortBy = this.sortBy as any;
    this.updateQueryParams(currentFilters);
  }

  /**
   * Maneja el cambio de página del paginador
   */
  onPageChange(event: any): void {
    this.currentPage = event.page + 1; // PrimeNG usa índice 0, backend usa 1
    this.rowsPerPage = event.rows;
    this.first = event.first;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
  }

  /**
   * Toggle view mode (Grid / List)
   */
  toggleViewMode(): void {
    const newMode = this.viewMode() === 'grid' ? 'list' : 'grid';
    this.viewMode.set(newMode);
    localStorage.setItem('catalogViewMode', newMode);
  }

  /**
   * Toggle sidebar (mobile)
   */
  toggleSidebar(): void {
    const newVisibility = !this.sidebarVisible();
    this.sidebarVisible.set(newVisibility);
    
    // Si se está abriendo el drawer, resetear el acordeón después de un pequeño delay
    if (newVisibility) {
      setTimeout(() => {
        this.filterSidebar?.resetAccordion();
      }, 100);
    }
  }

  /**
   * Actualiza query params del router (sincronización URL)
   */
  private updateQueryParams(filters: Partial<FilterProductDto>): void {
    const queryParams: any = {};

    // Filtros básicos
    if (filters.search) queryParams.search = filters.search;
    if (filters.sortBy && filters.sortBy !== 'newest') queryParams.sortBy = filters.sortBy;

    // Filtros avanzados (arrays a CSV)
    if (filters.styles?.length) queryParams.styles = filters.styles.join(',');
    if (filters.sizes?.length) queryParams.sizes = filters.sizes.join(',');
    if (filters.colors?.length) queryParams.colors = filters.colors.join(',');
    if (filters.tags?.length) queryParams.tags = filters.tags.join(',');

    // Rango de precios
    if (filters.minPrice !== undefined) queryParams.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) queryParams.maxPrice = filters.maxPrice;

    // Destacados
    if (filters.destacado) queryParams.destacado = 'true';

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams,
      // NO usar 'merge' para evitar mantener filtros viejos
    });
  }

  /**
   * Parsea query params a FilterProductDto
   */
  private parseQueryParamsToFilters(params: any): FilterProductDto {
    const filters: FilterProductDto = {};

    // Búsqueda (ahora viene del FilterSidebar)
    if (params['search']) {
      filters.search = params['search'];
    }

    // Ordenamiento
    if (params['sortBy']) filters.sortBy = params['sortBy'];

    // Estilos (CSV a array)
    if (params['styles']) {
      filters.styles = params['styles'].split(',');
    }

    // Tallas (CSV a array)
    if (params['sizes']) {
      filters.sizes = params['sizes'].split(',');
    }

    // Colores (CSV a array)
    if (params['colors']) {
      filters.colors = params['colors'].split(',');
    }

    // Tags (CSV a array)
    if (params['tags']) {
      filters.tags = params['tags'].split(',');
    }

    // Rango de precios
    if (params['minPrice']) filters.minPrice = Number(params['minPrice']);
    if (params['maxPrice']) filters.maxPrice = Number(params['maxPrice']);

    // Destacados
    if (params['destacado'] === 'true') filters.destacado = true;

    return filters;
  }

  /**
   * Retry al fallar la carga
   */
  retryLoad(): void {
    this.loadProducts();
  }

}
