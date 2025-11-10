import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, Params } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';

/**
 * CategoryCardComponent - Tarjeta de sección del catálogo
 *
 * Componente genérico que muestra una sección clickeable:
 * - Estilos (Regular, Oversize)
 * - Colecciones especiales (Nueva Colección, Ofertas, Más Vendidas)
 *
 * Click → navega con queryParams específicos
 */
@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule
  ],
  templateUrl: './category-card.component.html',
  styleUrls: ['./category-card.component.css']
})
export class CategoryCardComponent {
  private router = inject(Router);

  /** Nombre de la sección */
  title = input.required<string>();

  /** URL de la imagen */
  imageUrl = input.required<string>();

  /** Query params para el filtro (opcional) */
  queryParams = input<Params>({});

  /**
   * Navega al catálogo con los filtros especificados
   */
  navigateToSection(): void {
    this.router.navigate(['/products'], {
      queryParams: this.queryParams()
    });
  }
}
