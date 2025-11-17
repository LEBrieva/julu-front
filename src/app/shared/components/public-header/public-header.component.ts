import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartDrawerService } from '../../../core/services/cart-drawer.service';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';

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
    ButtonModule,
    MenuModule,
    AvatarModule
  ],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.css'
})
export class PublicHeaderComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private cartDrawerService = inject(CartDrawerService);
  private router = inject(Router);

  // Signals
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  isAdmin = this.authService.isAdmin;

  // Badge del carrito (reactivo)
  cartItemsCount = this.cartService.totalItems;

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
   * Navegar al perfil del usuario
   */
  goToProfile(): void {
    // TODO FASE 9+: Implementar página de perfil de usuario
    console.log('Navigate to profile');
  }

  /**
   * Navegar a las órdenes del usuario
   */
  goToOrders(): void {
    // TODO FASE 9: Implementar página de órdenes del usuario
    console.log('Navigate to orders');
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
}
