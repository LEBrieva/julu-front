import { Routes } from '@angular/router';

/**
 * Rutas del módulo Admin (lazy loaded desde app.routes.ts)
 *
 * ESTRUCTURA:
 * - AdminLayoutComponent actúa como wrapper con sidebar + header
 * - Cada child se carga con lazy loading individual
 *
 * ACCESO:
 * - Estas rutas están protegidas por authGuard + adminGuard (configurados en app.routes.ts)
 * - Solo usuarios con rol ADMIN pueden acceder
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      // Redirect por defecto a dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      }

      // TODO FASE 5: Products CRUD
      // {
      //   path: 'products',
      //   loadComponent: () =>
      //     import('./products/admin-products.component').then(
      //       (m) => m.AdminProductsComponent
      //     )
      // },

      // TODO FASE 6: Orders Management
      // {
      //   path: 'orders',
      //   loadComponent: () =>
      //     import('./orders/admin-orders.component').then(
      //       (m) => m.AdminOrdersComponent
      //     )
      // },

      // TODO FASE 7: Users Management
      // {
      //   path: 'users',
      //   loadComponent: () =>
      //     import('./users/admin-users.component').then(
      //       (m) => m.AdminUsersComponent
      //     )
      // }
    ]
  }
];
