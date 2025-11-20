import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartDrawerService } from '../../../core/services/cart-drawer.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductListItem } from '../../../core/models/product.model';
import { getErrorMessage } from '../../utils/form-errors.util';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';

/**
 * Header público de la tienda
 *
 * CARACTERÍSTICAS:
 * - Logo clickeable al home
 * - Navegación: Home, Productos
 * - Icono de carrito con badge (preparado para FASE 9)
 * - User menu si está logueado (avatar + dropdown)
 * - Botón "Iniciar Sesión" si NO está logueado
 * - Responsive con hamburger menu en mobile
 */
@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    MenuModule,
    AvatarModule,
    ConfirmPopupModule,
    InputTextModule,
    PasswordModule
  ],
  providers: [ConfirmationService],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.css'
})
export class PublicHeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private cartDrawerService = inject(CartDrawerService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  // Public para acceso en template
  confirmationService = inject(ConfirmationService);

  // Signals
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  isAdmin = this.authService.isAdmin;
  loadingLogin = signal(false);
  searchVisible = signal(false);
  searchResults = signal<ProductListItem[]>([]);
  searchLoading = signal(false);

  // Badge del carrito (reactivo)
  cartItemsCount = this.cartService.totalItems;

  // Formularios
  loginForm: FormGroup;
  searchControl = new FormControl('');

  // Subscripciones
  private searchSubscription?: Subscription;

  // ViewChild para el input de búsqueda
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  // Helper para errores de validación
  getErrorMessage = getErrorMessage;

  constructor() {
    // Inicializar formulario de login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Configurar búsqueda en tiempo real con debounce
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        tap((query) => {
          // Activar loading INMEDIATAMENTE si hay texto válido (antes del debounce)
          if (query && query.trim().length > 0) {
            this.searchLoading.set(true);
          }
        }),
        debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
        distinctUntilChanged(), // Solo emitir si el valor cambió
        switchMap((query) => {
          // Si el query está vacío, limpiar resultados
          if (!query || query.trim().length === 0) {
            this.searchResults.set([]);
            this.searchLoading.set(false);
            return of({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
          }

          // Llamar al servicio de búsqueda (catálogo público)
          return this.productService.getPublicCatalog({
            search: query.trim(),
            page: 1,
            limit: 8 // Limitar a 8 resultados
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.searchResults.set(response.data);
          this.searchLoading.set(false);
        },
        error: (error) => {
          console.error('Error al buscar productos:', error);
          this.searchResults.set([]);
          this.searchLoading.set(false);
        }
      });

    // Listener para cerrar modal con ESC
    document.addEventListener('keydown', this.handleEscKey.bind(this));
  }

  ngOnDestroy(): void {
    // Limpiar suscripción al destruir el componente
    this.searchSubscription?.unsubscribe();

    // Limpiar listener de ESC
    document.removeEventListener('keydown', this.handleEscKey.bind(this));
  }

  /**
   * Manejar tecla ESC para cerrar modal
   */
  private handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.searchVisible()) {
      this.closeSearchModal();
    }
  }

  // Menu items para user menu (cuando está logueado)
  userMenuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.goToProfile()
    },
    {
      label: 'Mis Órdenes',
      icon: 'pi pi-shopping-cart',
      command: () => this.goToOrders()
    },
    ...(this.isAdmin()
      ? [
          {
            separator: true
          },
          {
            label: 'Panel Admin',
            icon: 'pi pi-cog',
            command: () => this.goToAdmin()
          }
        ]
      : []),
    {
      separator: true
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  /**
   * Navegar al perfil del usuario (FASE 11)
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navegar al tab de órdenes en el perfil del usuario
   */
  goToOrders(): void {
    this.router.navigate(['/profile'], { queryParams: { tab: 'orders' } });
  }

  /**
   * Navegar al panel admin (solo si es admin)
   */
  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * Ir a la página de login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Abrir el drawer del carrito o navegar a /cart si ya estamos ahí
   */
  goToCart(): void {
    const currentUrl = this.router.url;
    
    // Si ya estamos en /cart, no hacer nada (ya estamos viendo el carrito)
    if (currentUrl.startsWith('/cart')) {
      return;
    }
    
    // Si estamos en checkout, navegar a /cart (no abrir drawer)
    if (currentUrl.startsWith('/checkout')) {
      this.router.navigate(['/cart']);
      return;
    }
    
    // En cualquier otra página, abrir el drawer
    this.cartDrawerService.open();
  }

  /**
   * Logout del sistema
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Forzar logout local incluso si falla la petición
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Obtener iniciales del usuario para el avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';

    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';

    return firstInitial + lastInitial || 'U';
  }

  /**
   * Abrir popup de login
   */
  openLoginPopup(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '', // Lo manejamos en el template custom
      acceptVisible: false, // Ocultar botón de aceptar
      rejectVisible: false, // Ocultar botón de rechazar
      closable: true // Permitir cerrar con X o ESC
    });
  }

  /**
   * Manejador del submit del formulario de login
   */
  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loadingLogin.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.loadingLogin.set(false);

        // Cerrar popup
        this.confirmationService.close();

        // Resetear formulario
        this.loginForm.reset();

        // Mostrar toast de bienvenida
        this.messageService.add({
          severity: 'success',
          summary: 'Bienvenido',
          detail: `Hola ${response.user.firstName}!`,
          life: 3000
        });

        // Permanecer en la página actual (NO redirigir)
      },
      error: (error) => {
        this.loadingLogin.set(false);
        // El error.interceptor ya mostró el toast de error
      }
    });
  }

  /**
   * Abrir modal de búsqueda y hacer focus en el input
   */
  openSearchModal(): void {
    this.searchVisible.set(true);

    // Esperar a que el DOM se actualice y hacer focus en el input
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 0);
  }

  /**
   * Cerrar modal de búsqueda y limpiar estado
   */
  closeSearchModal(): void {
    this.searchVisible.set(false);
    this.searchControl.setValue('', { emitEvent: false }); // No emitir evento para evitar búsqueda
    this.searchResults.set([]);
    this.searchLoading.set(false);
  }

  /**
   * Navegar a detalle de producto y cerrar modal
   */
  goToProduct(productId: string): void {
    this.closeSearchModal();
    this.router.navigate(['/products', productId]);
  }

  /**
   * Ver todos los resultados en /products con el término de búsqueda
   */
  viewAllResults(): void {
    const searchTerm = this.searchControl.value;
    if (searchTerm && searchTerm.trim().length > 0) {
      this.closeSearchModal();
      this.router.navigate(['/products'], {
        queryParams: { search: searchTerm.trim() }
      });
    }
  }
}
