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
 * Layout principal do painel de administração
 *
 * ESTRUCTURA:
 * - Header: Logo, título, user menu com logout
 * - Sidebar: Navegação para Painel, Produtos, Pedidos, Usuários
 * - Content: <router-outlet> para children routes
 *
 * CARACTERÍSTICAS:
 * - Sidebar colapsável (mobile-friendly)
 * - User menu com nome e email do admin
 * - Logout com confirmação
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
      label: 'Ir ao Início',
      icon: 'pi pi-home',
      command: () => this.goToHome()
    },
    {
      separator: true
    },
    {
      label: 'Sair',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  // Sidebar navigation items
  navItems: Array<{ label: string; icon: string; route: string; disabled?: boolean }> = [
    {
      label: 'Painel',
      icon: 'pi pi-th-large',
      route: '/admin/dashboard'
    },
    {
      label: 'Produtos',
      icon: 'pi pi-box',
      route: '/admin/products'
      // ✅ FASE 5 COMPLETADA
    },
    {
      label: 'Pedidos',
      icon: 'pi pi-shopping-cart',
      route: '/admin/orders'
      // ✅ FASE 6 COMPLETADA
    },
    {
      label: 'Usuários',
      icon: 'pi pi-users',
      route: '/admin/users'
      // ✅ FASE 7 COMPLETADA
    }
  ];

  /**
   * Alternar visibilidade da barra lateral (para mobile)
   */
  toggleSidebar(): void {
    this.sidebarVisible.update(value => !value);
  }

  /**
   * Ir ao perfil do usuário (TODO: implementar)
   */
  goToProfile(): void {
    // TODO: Implementar página de perfil
    console.log('Navigate to profile');
  }

  /**
   * Navegar ao home público do ecommerce (sem fechar sessão)
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Logout do sistema
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Forçar logout local mesmo se a requisição falhar
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Obter iniciais do usuário para o avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'AD';

    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';

    return firstInitial + lastInitial || 'AD';
  }
}
