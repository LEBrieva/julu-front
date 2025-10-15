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
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
    // ⭐ Lazy loading a nivel de feature module
    // Carga AdminLayoutComponent + todos los componentes admin en un chunk separado
    // Solo se descarga si el usuario es ADMIN y accede a /admin
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
