import { Component, output, signal, effect, input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { SelectModule } from 'primeng/select';
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

// Services
import { ProductService } from '../../../../core/services/product.service';

interface FilterForm {
  styles: FormControl<ProductStyle[] | null>;
  sizes: FormControl<ProductSize[] | null>;
  colors: FormControl<ProductColor[] | null>;
  minPrice: FormControl<number | null>;
  maxPrice: FormControl<number | null>;
}

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AccordionModule,
    CheckboxModule,
    SliderModule,
    SelectModule,
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
export class FilterSidebarComponent implements OnInit {
  // Services
  private productService = inject(ProductService);

  // Inputs
  initialFilters = input<FilterProductDto>();

  // Outputs
  filtersApplied = output<FilterProductDto>();
  filtersCleared = output<void>();

  // Form
  filterForm = new FormGroup<FilterForm>({
    styles: new FormControl<ProductStyle[]>([]),
    sizes: new FormControl<ProductSize[]>([]),
    colors: new FormControl<ProductColor[]>([]),
    minPrice: new FormControl<number | null>(null),
    maxPrice: new FormControl<number | null>(null),
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
  priceRangeValue: [number, number] = [0, 50000]; // Propiedad para ngModel
  priceStep = signal<number>(1); // Step dinámico basado en el rango
  minPrice = signal<number>(0);
  maxPrice = signal<number>(50000);

  // Contador de filtros activos
  activeFiltersCount = signal<number>(0);

  // Control de paneles del acordeón (1 = Estilos expandido por defecto)
  activeIndex = signal<string[]>(['1']);
  
  // Flag para controlar la visibilidad del acordeón y forzar su recreación
  showAccordion = signal<boolean>(true);

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
      const max = this.filterForm.controls.maxPrice.value ?? this.maxPrice();
      this.priceRange.set([min ?? this.minPrice(), max]);
    });

    this.filterForm.controls.maxPrice.valueChanges.subscribe(max => {
      const min = this.filterForm.controls.minPrice.value ?? this.minPrice();
      this.priceRange.set([min, max ?? this.maxPrice()]);
    });
  }

  ngOnInit(): void {
    this.loadPriceRange();
  }

  /**
   * Carga el rango de precios dinámico desde el backend
   */
  private loadPriceRange(): void {
    this.productService.getPriceRange().subscribe({
      next: (range) => {
        this.minPrice.set(range.min);
        this.maxPrice.set(range.max);

        // Calcular step dinámico basado en el rango
        const priceRange = range.max - range.min;
        let step = 1;

        if (priceRange > 10000) {
          step = 500;
        } else if (priceRange > 1000) {
          step = 100;
        } else if (priceRange > 100) {
          step = 10;
        } else {
          step = 1;
        }

        this.priceStep.set(step);

        // Actualizar el slider solo si no hay filtros preexistentes
        const currentMin = this.filterForm.controls.minPrice.value;
        const currentMax = this.filterForm.controls.maxPrice.value;

        if (currentMin === null && currentMax === null) {
          const newRange: [number, number] = [range.min, range.max];
          this.priceRange.set(newRange);
          this.priceRangeValue = newRange;
        }
      },
      error: (err) => {
        console.error('Error cargando rango de precios, usando valores por defecto:', err);
        // Mantener valores por defecto (0, 50000) ya inicializados
      }
    });
  }

  /**
   * Maneja cambio del slider de precios
   */
  onPriceRangeChange(value: [number, number]): void {
    const [min, max] = value;

    // Sincronizar signal y propiedad
    this.priceRange.set(value);
    this.priceRangeValue = value;

    // Actualizar el form
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
      styles: formValue.styles?.length ? formValue.styles : undefined,
      sizes: formValue.sizes?.length ? formValue.sizes : undefined,
      colors: formValue.colors?.length ? formValue.colors : undefined,
      minPrice: formValue.minPrice ?? undefined,
      maxPrice: formValue.maxPrice ?? undefined
    };

    this.filtersApplied.emit(filters);
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.filterForm.reset({
      styles: [],
      sizes: [],
      colors: [],
      minPrice: null,
      maxPrice: null
    });

    const resetRange: [number, number] = [this.minPrice(), this.maxPrice()];
    this.priceRange.set(resetRange);
    this.priceRangeValue = resetRange;
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

    return count;
  }

  /**
   * Carga filtros desde input (para inicialización o sincronización con query params)
   */
  private loadFiltersFromInput(filters: FilterProductDto): void {
    this.filterForm.patchValue({
      styles: filters.styles || [],
      sizes: filters.sizes || [],
      colors: filters.colors || [],
      minPrice: filters.minPrice ?? null,
      maxPrice: filters.maxPrice ?? null
    });

    // Actualizar slider
    const min = filters.minPrice ?? this.minPrice();
    const max = filters.maxPrice ?? this.maxPrice();
    const newRange: [number, number] = [min, max];
    this.priceRange.set(newRange);
    this.priceRangeValue = newRange;
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

  /**
   * Resetea el acordeón a su estado inicial (solo el primer panel abierto)
   * Este método debe ser llamado cuando se abre el drawer
   */
  resetAccordion(): void {
    // Ocultar el acordeón momentáneamente para destruirlo
    this.showAccordion.set(false);
    
    // Esperar a que Angular procese el cambio, luego resetear y mostrar
    setTimeout(() => {
      this.activeIndex.set(['0']);
      this.showAccordion.set(true);
    }, 0);
  }
}
