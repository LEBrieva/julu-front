import { Component, output, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';

// Models
import {
  FilterProductDto,
  ProductStyle,
  ProductSize,
  ProductColor,
  formatColor,
  formatSize,
  getColorHex
} from '../../../../core/models/product.model';

interface FilterForm {
  search: FormControl<string | null>;
  styles: FormControl<ProductStyle[] | null>;
  sizes: FormControl<ProductSize[] | null>;
  colors: FormControl<ProductColor[] | null>;
  minPrice: FormControl<number | null>;
  maxPrice: FormControl<number | null>;
  destacado: FormControl<boolean | null>;
  tags: FormControl<string | null>;
}

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MultiSelectModule,
    SliderModule,
    SelectModule,
    ToggleSwitchModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ChipModule,
    BadgeModule,
    DividerModule
  ],
  templateUrl: './filter-sidebar.html',
  styleUrl: './filter-sidebar.css'
})
export class FilterSidebarComponent {
  // Inputs
  initialFilters = input<FilterProductDto>();

  // Outputs
  filtersApplied = output<FilterProductDto>();
  filtersCleared = output<void>();

  // Form
  filterForm = new FormGroup<FilterForm>({
    search: new FormControl<string>(''),
    styles: new FormControl<ProductStyle[]>([]),
    sizes: new FormControl<ProductSize[]>([]),
    colors: new FormControl<ProductColor[]>([]),
    minPrice: new FormControl<number | null>(null),
    maxPrice: new FormControl<number | null>(null),
    destacado: new FormControl<boolean>(false),
    tags: new FormControl<string>(''),
  });

  // Opciones de filtros
  styleOptions = [
    { label: 'Regular', value: ProductStyle.REGULAR },
    { label: 'Oversize', value: ProductStyle.OVERSIZE },
    { label: 'Slim Fit', value: ProductStyle.SLIM_FIT }
  ];

  sizeOptions = [
    { label: 'P', value: ProductSize.P },
    { label: 'M', value: ProductSize.M },
    { label: 'G', value: ProductSize.G },
    { label: 'GG', value: ProductSize.GG }
  ];

  colorOptions = [
    { label: 'Negro', value: ProductColor.BLACK, hex: getColorHex(ProductColor.BLACK) },
    { label: 'Blanco', value: ProductColor.WHITE, hex: getColorHex(ProductColor.WHITE) },
    { label: 'Gris', value: ProductColor.GRAY, hex: getColorHex(ProductColor.GRAY) },
    { label: 'Azul Marino', value: ProductColor.NAVY, hex: getColorHex(ProductColor.NAVY) },
    { label: 'Rojo', value: ProductColor.RED, hex: getColorHex(ProductColor.RED) },
    { label: 'Azul', value: ProductColor.BLUE, hex: getColorHex(ProductColor.BLUE) }
  ];

  // Rango de precios
  priceRange = signal<[number, number]>([0, 50000]);
  readonly MIN_PRICE = 0;
  readonly MAX_PRICE = 50000;
  readonly PRICE_STEP = 500;

  // Contador de filtros activos
  activeFiltersCount = signal<number>(0);

  constructor() {
    // Actualizar contador cuando cambia el form
    effect(() => {
      const count = this.countActiveFilters();
      this.activeFiltersCount.set(count);
    }, { allowSignalWrites: true });

    // Inicializar filtros desde input si vienen
    effect(() => {
      const filters = this.initialFilters();
      if (filters) {
        this.loadFiltersFromInput(filters);
      }
    }, { allowSignalWrites: true });

    // Sincronizar slider con form controls
    this.filterForm.controls.minPrice.valueChanges.subscribe(min => {
      const max = this.filterForm.controls.maxPrice.value ?? this.MAX_PRICE;
      this.priceRange.set([min ?? 0, max]);
    });

    this.filterForm.controls.maxPrice.valueChanges.subscribe(max => {
      const min = this.filterForm.controls.minPrice.value ?? 0;
      this.priceRange.set([min, max ?? this.MAX_PRICE]);
    });
  }

  /**
   * Maneja cambio del slider de precios
   */
  onPriceRangeChange(event: any): void {
    const [min, max] = event.value;
    this.filterForm.patchValue({
      minPrice: min,
      maxPrice: max
    });
  }

  /**
   * Aplica los filtros actuales
   */
  applyFilters(): void {
    const formValue = this.filterForm.value;

    const filters: FilterProductDto = {
      search: formValue.search?.trim() || undefined,
      styles: formValue.styles?.length ? formValue.styles : undefined,
      sizes: formValue.sizes?.length ? formValue.sizes : undefined,
      colors: formValue.colors?.length ? formValue.colors : undefined,
      minPrice: formValue.minPrice ?? undefined,
      maxPrice: formValue.maxPrice ?? undefined,
      destacado: formValue.destacado ?? undefined,
      tags: formValue.tags ? formValue.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
    };

    this.filtersApplied.emit(filters);
  }

  /**
   * Limpia el campo de búsqueda
   */
  clearSearch(): void {
    this.filterForm.patchValue({ search: '' });
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      styles: [],
      sizes: [],
      colors: [],
      minPrice: null,
      maxPrice: null,
      destacado: false,
      tags: ''
    });

    this.priceRange.set([0, this.MAX_PRICE]);
    this.filtersCleared.emit();
  }

  /**
   * Cuenta filtros activos
   */
  private countActiveFilters(): number {
    const formValue = this.filterForm.value;
    let count = 0;

    if (formValue.styles?.length) count++;
    if (formValue.sizes?.length) count++;
    if (formValue.colors?.length) count++;
    if (formValue.minPrice !== null || formValue.maxPrice !== null) count++;
    if (formValue.destacado) count++;
    if (formValue.tags && formValue.tags.trim().length > 0) count++;

    return count;
  }

  /**
   * Carga filtros desde input (para inicialización o sincronización con query params)
   */
  private loadFiltersFromInput(filters: FilterProductDto): void {
    this.filterForm.patchValue({
      search: filters.search || '',
      styles: filters.styles || [],
      sizes: filters.sizes || [],
      colors: filters.colors || [],
      minPrice: filters.minPrice ?? null,
      maxPrice: filters.maxPrice ?? null,
      destacado: filters.destacado ?? false,
      tags: filters.tags?.join(', ') || ''
    });

    // Actualizar slider
    const min = filters.minPrice ?? 0;
    const max = filters.maxPrice ?? this.MAX_PRICE;
    this.priceRange.set([min, max]);
  }

  /**
   * Formatea precio para mostrar en el slider
   */
  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
