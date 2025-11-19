import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartDrawerService } from '../../../core/services/cart-drawer.service';
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
export class PublicHeaderComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private cartDrawerService = inject(CartDrawerService);
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

  // Badge del carrito (reactivo)
  cartItemsCount = this.cartService.totalItems;

  // Formulario de login
  loginForm: FormGroup;

  // Helper para errores de validación
  getErrorMessage = getErrorMessage;

  constructor() {
    // Inicializar formulario de login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
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
}
