import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

/**
 * Configuración de rutas de la aplicación
 *
 * ESTRUCTURA:
 * - Rutas públicas: /login, /products
 * - Rutas autenticadas: /cart, /orders (requieren authGuard)
 * - Rutas admin: /admin/* (requieren authGuard + adminGuard)
 *
 * LAZY LOADING:
 * Los componentes se cargan mediante import() dinámico para optimizar el bundle
 */
export const routes: Routes = [
  // Ruta por defecto: redirect a productos
  {
    path: '',
    redirectTo: '/products',
    pathMatch: 'full'
  },

  // ========== RUTAS PÚBLICAS ==========

  // Login
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      )
  },

  // Catálogo de productos (público)
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/product-list.component').then(
        (m) => m.ProductListComponent
      )
  },

  // ========== RUTAS ADMIN (authGuard + adminGuard) ==========

  {
    path: 'admin',
    canActivate: [authGuard, adminGuard], // ⭐ Requiere autenticación + rol ADMIN
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      }
      // TODO FASE 5: Agregar rutas para products, orders, users
      // {
      //   path: 'products',
      //   loadComponent: () => import('./features/admin/products/...').then(...)
      // },
    ]
  },

  // ========== RUTAS AUTENTICADAS (solo authGuard) ==========

  // TODO FASE 9: Agregar rutas para cart, checkout, orders del usuario
  // {
  //   path: 'cart',
  //   canActivate: [authGuard],
  //   loadComponent: () => import('./features/cart/cart.component').then(...)
  // },

  // ========== WILDCARD (404) ==========

  {
    path: '**',
    redirectTo: '/products' // Si la ruta no existe, ir a productos
  }
];
