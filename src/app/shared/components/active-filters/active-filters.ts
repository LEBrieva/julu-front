import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';

// Models
import {
  FilterProductDto,
  formatSize,
  formatColor,
  formatStyle
} from '../../../core/models/product.model';

export interface ActiveFilter {
  key: string;           // Identificador único del filtro
  label: string;         // Label a mostrar (ej: "Estilo: Regular")
  icon?: string;         // Icono PrimeIcons opcional
  removable: boolean;    // Si se puede remover (sortBy no se puede)
}

@Component({
  selector: 'app-active-filters',
  standalone: true,
  imports: [
    CommonModule,
    ChipModule,
    ButtonModule
  ],
  templateUrl: './active-filters.html',
  styleUrl: './active-filters.css'
})
export class ActiveFiltersComponent {
  // Inputs
  filters = input.required<FilterProductDto>();

  // Outputs
  filterRemoved = output<string>();  // Emite el key del filtro a remover
  allFiltersCleared = output<void>();

  // Filtros activos transformados a chips
  activeFilters = computed(() => {
    const filters = this.filters();
    const result: ActiveFilter[] = [];

    // Estilos
    if (filters.styles && filters.styles.length > 0) {
      const stylesStr = filters.styles.map(s => formatStyle(s)).join(', ');
      result.push({
        key: 'styles',
        label: `Estilo: ${stylesStr}`,
        icon: 'pi-tag',
        removable: true
      });
    }

    // Tallas
    if (filters.sizes && filters.sizes.length > 0) {
      const sizesStr = filters.sizes.map(s => formatSize(s)).join(', ');
      result.push({
        key: 'sizes',
        label: `Talla: ${sizesStr}`,
        icon: 'pi-th-large',
        removable: true
      });
    }

    // Colores
    if (filters.colors && filters.colors.length > 0) {
      const colorsStr = filters.colors.map(c => formatColor(c)).join(', ');
      result.push({
        key: 'colors',
        label: `Color: ${colorsStr}`,
        icon: 'pi-palette',
        removable: true
      });
    }

    // Rango de precios
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const min = filters.minPrice ?? 0;
      const max = filters.maxPrice ?? 50000;
      const minFormatted = this.formatPrice(min);
      const maxFormatted = this.formatPrice(max);
      result.push({
        key: 'price',
        label: `Precio: ${minFormatted} - ${maxFormatted}`,
        icon: 'pi-dollar',
        removable: true
      });
    }


    // Ordenamiento (NO removable, solo informativo)
    if (filters.sortBy && filters.sortBy !== 'newest') {
      const sortLabel = this.getSortLabel(filters.sortBy);
      result.push({
        key: 'sortBy',
        label: `Orden: ${sortLabel}`,
        icon: 'pi-sort-alt',
        removable: false
      });
    }

    return result;
  });

  // Contador de filtros removibles
  removableFiltersCount = computed(() => {
    return this.activeFilters().filter(f => f.removable).length;
  });

  /**
   * Emite evento para remover un filtro específico
   */
  removeFilter(filterKey: string): void {
    this.filterRemoved.emit(filterKey);
  }

  /**
   * Emite evento para limpiar todos los filtros
   */
  clearAll(): void {
    this.allFiltersCleared.emit();
  }

  /**
   * Formatea precio
   */
  private formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Obtiene label legible del ordenamiento
   */
  private getSortLabel(sortBy: string): string {
    const labels: Record<string, string> = {
      newest: 'Más Nuevos',
      price_asc: 'Precio: Menor a Mayor',
      price_desc: 'Precio: Mayor a Menor',
      name_asc: 'Nombre: A-Z',
      name_desc: 'Nombre: Z-A'
    };
    return labels[sortBy] || sortBy;
  }
}
