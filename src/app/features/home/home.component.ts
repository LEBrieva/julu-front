import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { CarouselModule } from 'primeng/carousel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Components
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { CategoryCardComponent } from './components/category-card/category-card.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

// Services & Models
import { ProductService } from '../../core/services/product.service';
import { Product, ProductStyle } from '../../core/models/product.model';

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
    CategoryCardComponent,
    ProductCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);

  // Signals
  productosDestacados = signal<Product[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Secciones del catálogo (hardcodeadas)
  catalogSections = [
    {
      title: 'Nueva Colección',
      imageUrl: 'assets/images/categories/straight.jpg',
      queryParams: {} // TODO: Agregar filtro cuando exista campo 'nueva'
    },
    {
      title: 'Más Vendidas',
      imageUrl: 'assets/images/categories/slim.jpg',
      queryParams: {} // TODO: Agregar filtro cuando existan métricas
    },
    {
      title: 'Ofertas',
      imageUrl: 'assets/images/categories/skinny.jpg',
      queryParams: {} // TODO: Agregar filtro cuando exista campo 'enOferta'
    },
    {
      title: 'Regular',
      imageUrl: 'assets/images/categories/regular.jpg',
      queryParams: { style: ProductStyle.REGULAR }
    },
    {
      title: 'Oversize',
      imageUrl: 'assets/images/categories/oversize.jpg',
      queryParams: { style: ProductStyle.OVERSIZE }
    }
  ];

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
        console.error('Error al cargar productos destacados:', err);
        this.error.set('No se pudieron cargar los productos destacados');
        this.loading.set(false);
      }
    });
  }
}
