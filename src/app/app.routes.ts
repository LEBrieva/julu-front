import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

/**
 * Configuración de rutas de la aplicación
 *
 * ESTRUCTURA:
 * - Rutas públicas con layout: /, /products (usan PublicLayoutComponent)
 * - Login: /login (sin layout, página standalone)
 * - Rutas autenticadas: /cart, /orders (requieren authGuard)
 * - Rutas admin: /admin/* (requieren authGuard + adminGuard)
 *
 * LAZY LOADING:
 * Los componentes se cargan mediante import() dinámico para optimizar el bundle
 */
export const routes: Routes = [
  // ========== RUTAS PÚBLICAS CON LAYOUT (Header + Content) ==========

  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent
      ),
    children: [
      // Home / Landing page
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent)
      },

      // Catálogo de productos (público)
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list.component').then(
            (m) => m.ProductListComponent
          )
      },

      // Detalle de producto (público) - FASE 8c
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent
          )
      }
    ]
  },

  // ========== LOGIN (sin layout, standalone) ==========

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
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
    redirectTo: '/' // Si la ruta no existe, ir a home
  }
];
