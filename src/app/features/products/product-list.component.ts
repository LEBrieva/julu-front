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
 * ProductListComponent - Catálogo público de produtos com filtros avançados
 *
 * FASE 8b Features:
 * - Grid/List view toggle com PrimeNG DataView
 * - Sidebar de filtros avançados (preço, tamanhos, cores, estilos, tags, destaques)
 * - Active filters chips (removíveis)
 * - Sincronização com query params do router (URL compartilhável)
 * - Persistência de preferência de visualização em localStorage
 * - Busca com debounce (300ms)
 * - Paginação server-side
 * - Responsivo (sidebar overlay em mobile)
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

  // Ordenamento
  sortBy = 'newest';
  sortOptions = [
    { label: 'Mais Recentes', value: 'newest' },
    { label: 'Preço: Menor a Maior', value: 'price_asc' },
    { label: 'Preço: Maior a Menor', value: 'price_desc' },
    { label: 'Nome: A-Z', value: 'name_asc' },
    { label: 'Nome: Z-A', value: 'name_desc' }
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
    if (filters.search && filters.search.trim().length > 0) count++;
    if (filters.styles?.length) count++;
    if (filters.sizes?.length) count++;
    if (filters.colors?.length) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    return count;
  });

  ngOnInit(): void {
    // Carregar preferência de visualização desde localStorage
    const savedViewMode = localStorage.getItem('catalogViewMode') as 'grid' | 'list' | null;
    if (savedViewMode) {
      this.viewMode.set(savedViewMode);
    }

    // Processar query params iniciais
    const initialParams = this.activatedRoute.snapshot.queryParams;
    const initialFilters = this.parseQueryParamsToFilters(initialParams);
    this.activeFilters.set(initialFilters);

    // Carregar sortBy desde query params
    this.sortBy = initialParams['sortBy'] || 'newest';

    // Inscrever-se a mudanças em query params (para futuras mudanças)
    this.activatedRoute.queryParams.subscribe((params) => {
      const filters = this.parseQueryParamsToFilters(params);
      this.activeFilters.set(filters);

      // Atualizar sortBy
      this.sortBy = params['sortBy'] || 'newest';

      // Resetar paginação ao alterar filtros
      this.currentPage = 1;
      this.first = 0;

      // Recarregar produtos com novos filtros
      this.loadProducts();
    });

    // Carregar produtos inicialmente
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    // Obter a posição inicial e altura do header
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
    // Não há subscriptions manuais para completar
  }

  /**
   * Detecta scroll para fazer o header sticky
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
    const shouldBeSticky = scrollPosition >= this.headerOffsetTop;

    // Atualizar altura se o header mudou (ex: responsivo, filtros aplicados)
    if (this.catalogHeader?.nativeElement && !shouldBeSticky) {
      const currentHeight = this.catalogHeader.nativeElement.offsetHeight;
      if (currentHeight !== this.headerHeight()) {
        this.headerHeight.set(currentHeight);
      }
    }

    this.isHeaderSticky.set(shouldBeSticky);
  }

  /**
   * Carrega produtos desde o backend com filtros ativos
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
        this.error.set('Não foi possível carregar os produtos. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Aplica filtros desde a sidebar
   */
  onFiltersApplied(filters: FilterProductDto): void {
    this.updateQueryParams(filters);
    this.sidebarVisible.set(false); // Fechar sidebar em mobile
  }

  /**
   * Limpa todos os filtros
   */
  onFiltersClear(): void {
    this.sortBy = 'newest';
    this.updateQueryParams({});
    this.sidebarVisible.set(false);
  }

  /**
   * Remove um filtro individual desde ActiveFiltersComponent
   */
  onFilterRemoved(filterKey: string): void {
    const currentFilters = { ...this.activeFilters() };

    // Remover o filtro específico
    switch (filterKey) {
      case 'search':
        delete currentFilters.search;
        break;
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
    }

    this.updateQueryParams(currentFilters);
  }

  /**
   * Maneja a mudança de ordenamento
   */
  onSortChange(event: any): void {
    const currentFilters = { ...this.activeFilters() };
    currentFilters.sortBy = this.sortBy as any;
    this.updateQueryParams(currentFilters);
  }

  /**
   * Maneja a mudança de página do paginador
   */
  onPageChange(event: any): void {
    this.currentPage = event.page + 1; // PrimeNG usa índice 0, backend usa 1
    this.rowsPerPage = event.rows;
    this.first = event.first;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll para o topo
  }

  /**
   * Toggle de modo de visualização (Grade / Lista)
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

    // Se o drawer está sendo aberto, resetar o acordeão depois de um pequeno delay
    if (newVisibility) {
      setTimeout(() => {
        this.filterSidebar?.resetAccordion();
      }, 100);
    }
  }

  /**
   * Atualiza query params do router (sincronização URL)
   */
  private updateQueryParams(filters: Partial<FilterProductDto>): void {
    const queryParams: any = {};

    // Filtros básicos
    if (filters.search) queryParams.search = filters.search;
    if (filters.sortBy && filters.sortBy !== 'newest') queryParams.sortBy = filters.sortBy;

    // Filtros avançados (arrays para CSV)
    if (filters.styles?.length) queryParams.styles = filters.styles.join(',');
    if (filters.sizes?.length) queryParams.sizes = filters.sizes.join(',');
    if (filters.colors?.length) queryParams.colors = filters.colors.join(',');

    // Intervalo de preços
    if (filters.minPrice !== undefined) queryParams.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) queryParams.maxPrice = filters.maxPrice;

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams,
      // NÃO usar 'merge' para evitar manter filtros antigos
    });
  }

  /**
   * Parseia query params para FilterProductDto
   */
  private parseQueryParamsToFilters(params: any): FilterProductDto {
    const filters: FilterProductDto = {};

    // Busca (agora vem do FilterSidebar)
    if (params['search']) {
      filters.search = params['search'];
    }

    // Ordenamento
    if (params['sortBy']) filters.sortBy = params['sortBy'];

    // Estilos (CSV para array)
    if (params['styles']) {
      filters.styles = params['styles'].split(',');
    }

    // Tamanhos (CSV para array)
    if (params['sizes']) {
      filters.sizes = params['sizes'].split(',');
    }

    // Cores (CSV para array)
    if (params['colors']) {
      filters.colors = params['colors'].split(',');
    }

    // Intervalo de preços
    if (params['minPrice']) filters.minPrice = Number(params['minPrice']);
    if (params['maxPrice']) filters.maxPrice = Number(params['maxPrice']);

    return filters;
  }

  /**
   * Tentar novamente ao falhar o carregamento
   */
  retryLoad(): void {
    this.loadProducts();
  }

}
