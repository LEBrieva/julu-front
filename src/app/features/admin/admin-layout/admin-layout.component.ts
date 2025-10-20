import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';

/**
 * Layout principal del panel de administración
 *
 * ESTRUCTURA:
 * - Header: Logo, título, user menu con logout
 * - Sidebar: Navegación a Dashboard, Products, Orders, Users
 * - Content: <router-outlet> para children routes
 *
 * CARACTERÍSTICAS:
 * - Sidebar colapsable (mobile-friendly)
 * - User menu con nombre y email del admin
 * - Logout con confirmación
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MenuModule,
    AvatarModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  currentUser = this.authService.currentUser;
  sidebarVisible = signal(true);

  // Menu items para user menu
  userMenuItems: MenuItem[] = [
    {
      label: 'Perfil',
      icon: 'pi pi-user',
      command: () => this.goToProfile()
    },
    {
      separator: true
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  // Sidebar navigation items
  navItems = [
    {
      label: 'Dashboard',
      icon: 'pi pi-th-large',
      route: '/admin/dashboard'
    },
    {
      label: 'Productos',
      icon: 'pi pi-box',
      route: '/admin/products'
      // ✅ FASE 5 COMPLETADA
    },
    {
      label: 'Órdenes',
      icon: 'pi pi-shopping-cart',
      route: '/admin/orders'
      // ✅ FASE 6 COMPLETADA
    },
    {
      label: 'Usuarios',
      icon: 'pi pi-users',
      route: '/admin/users',
      disabled: true // TODO FASE 7
    }
  ];

  /**
   * Toggle sidebar visibility (para mobile)
   */
  toggleSidebar(): void {
    this.sidebarVisible.update(value => !value);
  }

  /**
   * Ir al perfil del usuario (TODO: implementar)
   */
  goToProfile(): void {
    // TODO: Implementar página de perfil
    console.log('Navigate to profile');
  }

  /**
   * Logout del sistema
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Forzar logout local incluso si falla la petición
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Obtener iniciales del usuario para el avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'AD';

    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';

    return firstInitial + lastInitial || 'AD';
  }
}
