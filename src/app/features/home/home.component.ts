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
      imageUrl: 'https://placehold.co/400x300/3B82F6/FFFFFF?text=Nueva+Colecci%C3%B3n',
      queryParams: {} // TODO: Agregar filtro cuando exista campo 'nueva'
    },
    {
      title: 'Más Vendidas',
      imageUrl: 'https://placehold.co/400x300/10B981/FFFFFF?text=M%C3%A1s+Vendidas',
      queryParams: {} // TODO: Agregar filtro cuando existan métricas
    },
    {
      title: 'Ofertas',
      imageUrl: 'https://placehold.co/400x300/EF4444/FFFFFF?text=Ofertas',
      queryParams: {} // TODO: Agregar filtro cuando exista campo 'enOferta'
    },
    {
      title: 'Regular',
      imageUrl: 'https://placehold.co/400x300/8B5CF6/FFFFFF?text=Regular',
      queryParams: { style: ProductStyle.REGULAR }
    },
    {
      title: 'Oversize',
      imageUrl: 'https://placehold.co/400x300/F59E0B/FFFFFF?text=Oversize',
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
