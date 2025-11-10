import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';

/**
 * HeroSectionComponent - Banner principal del home
 *
 * Sección destacada con:
 * - Imagen de fondo
 * - Título y subtítulo
 * - CTA (Call To Action) "Explorar Catálogo"
 */
@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css']
})
export class HeroSectionComponent {
  private router = inject(Router);

  /**
   * Navega al catálogo de productos
   */
  navigateToCatalog(): void {
    this.router.navigate(['/products']);
  }
}
