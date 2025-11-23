import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { CarouselModule } from 'primeng/carousel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Components
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { HeroCategoryCardComponent, type HeroCategoryConfig } from '../../shared/components/hero-category-card/hero-category-card.component';
import { CompactCategoryCardComponent, type CompactCategoryConfig } from '../../shared/components/compact-category-card/compact-category-card.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

// Services & Models
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { HERO_CATEGORY, COMPACT_CATEGORIES } from './constants/split-categories.const';

/**
 * HomeComponent - Landing page principal
 *
 * Estructura:
 * - Hero banner
 * - Grid de 5 secciones (Nueva Colección, Más Vendidas, Ofertas, Regular, Oversize)
 * - Carousel de productos destacados (máximo 12)
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CarouselModule,
    ProgressSpinnerModule,
    HeroSectionComponent,
    HeroCategoryCardComponent,
    CompactCategoryCardComponent,
    ProductCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);

  // Signals
  productosDestacados = signal<Product[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Categorías para layout split
  heroCategory = HERO_CATEGORY;
  compactCategories = COMPACT_CATEGORIES;

  // Configuración del carousel (responsive)
  carouselResponsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 4,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  ngOnInit(): void {
    this.loadProductosDestacados();
  }

  /**
   * Navega al catálogo con los filtros de la categoría hero seleccionada
   */
  navigateToHeroCategory(category: HeroCategoryConfig): void {
    this.router.navigate(['/products'], {
      queryParams: category.queryParams
    });
  }

  /**
   * Navega al catálogo con los filtros de la categoría compacta seleccionada
   */
  navigateToCompactCategory(category: CompactCategoryConfig): void {
    this.router.navigate(['/products'], {
      queryParams: category.queryParams
    });
  }

  /**
   * Carga los productos destacados desde el backend
   */
  private loadProductosDestacados(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getProductosDestacados().subscribe({
      next: (products) => {
        this.productosDestacados.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar produtos em destaque:', err);
        this.error.set('Não foi possível carregar os produtos em destaque');
        this.loading.set(false);
      }
    });
  }
}
