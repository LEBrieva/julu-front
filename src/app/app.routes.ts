import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { cartNotEmptyGuard } from './core/guards/cart-not-empty.guard';

/**
 * Configuración de rutas de la aplicación
 *
 * ESTRUCTURA:
 * - Rutas públicas con layout: /, /products (usan PublicLayoutComponent)
 * - Login: /login (sin layout, página standalone)
 * - Carrito: /cart (público para anónimos)
 * - Checkout: /checkout (requiere authGuard + cartNotEmptyGuard)
 * - Order Success: /order-success/:id (requiere authGuard)
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
      },

      // Carrito (FASE 9) - Público para usuarios anónimos
      {
        path: 'cart',
        loadComponent: () =>
          import('./features/cart/cart').then((m) => m.CartComponent)
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

  // ========== REGISTER (sin layout, standalone) ==========

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
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

  // Checkout (FASE 9) - Requiere autenticación + carrito con items
  {
    path: 'checkout',
    canActivate: [authGuard, cartNotEmptyGuard],
    loadComponent: () =>
      import('./features/checkout/checkout').then((m) => m.CheckoutComponent)
  },

  // Guest Checkout (FASE 10) - Sin autenticación, solo carrito con items
  {
    path: 'checkout/guest',
    canActivate: [cartNotEmptyGuard], // Solo verifica que haya items en el carrito
    loadComponent: () =>
      import('./features/checkout/guest-checkout').then(
        (m) => m.GuestCheckoutComponent
      )
  },

  // Order Success (FASE 9) - Requiere autenticación
  {
    path: 'order-success/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/order-success/order-success').then(
        (m) => m.OrderSuccessComponent
      )
  },

  // Order Success Guest (FASE 10) - Sin autenticación (público)
  {
    path: 'order-success-guest/:id',
    loadComponent: () =>
      import('./features/order-success/order-success-guest').then(
        (m) => m.OrderSuccessGuestComponent
      )
  },

  // Profile (FASE 11) - Requiere autenticación
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      )
  },

  // ========== WILDCARD (404) ==========

  {
    path: '**',
    redirectTo: '/' // Si la ruta no existe, ir a home
  }
];
