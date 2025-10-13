import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Admin Guard - Protege rutas que requieren rol ADMIN
 *
 * CONCEPTO: Este guard verifica no solo autenticación, sino también el ROL del usuario.
 * Es EXACTAMENTE como el RolesGuard en NestJS:
 *
 * NESTJS (backend):
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.ADMIN)  // ← Solo admins
 * @Get('admin/products')
 * getProducts() { }
 *
 * ANGULAR (frontend):
 * {
 *   path: 'admin',
 *   canActivate: [authGuard, adminGuard],  // ← Autenticado Y admin
 *   component: AdminComponent
 * }
 *
 * FLUJO:
 * 1. Usuario intenta acceder a /admin/products
 * 2. authGuard verifica autenticación (ya explicado antes)
 * 3. adminGuard verifica que sea ADMIN
 * 4. Si es ADMIN → return true (permite acceso)
 * 5. Si NO es ADMIN → redirect a /products + toast de error
 *
 * IMPORTANTE:
 * - Este guard debe usarse SIEMPRE CON authGuard (primero auth, luego admin)
 * - La seguridad REAL está en el backend con @Roles(UserRole.ADMIN)
 * - Este guard solo mejora la UX (evita que usuarios normales vean el panel admin)
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  // Obtener el usuario actual
  const currentUser = authService.currentUser();

  // Primera verificación: ¿Está autenticado?
  if (!currentUser) {
    // No autenticado → authGuard debería haber bloqueado, pero por si acaso
    console.log('⛔ AdminGuard: Usuario no autenticado');
    router.navigate(['/login']);
    return false;
  }

  // Segunda verificación: ¿Es ADMIN?
  if (currentUser.role === UserRole.ADMIN) {
    // Es admin → Permitir acceso
    console.log('✅ AdminGuard: Usuario es ADMIN, acceso permitido');
    return true;
  }

  // NO es admin → Bloquear acceso y mostrar toast
  console.log('⛔ AdminGuard: Usuario no es ADMIN, acceso denegado');

  // Mostrar notificación de acceso denegado
  messageService.add({
    severity: 'warn',
    summary: 'Acceso Restringido',
    detail: 'No tienes permisos para acceder al panel de administración.',
    life: 5000
  });

  // Redirigir a la página principal
  router.navigate(['/products']);

  return false; // Bloquear acceso
};

/**
 * EJEMPLO DE USO EN RUTAS:
 *
 * // app.routes.ts
 * export const routes: Routes = [
 *   // Rutas públicas
 *   { path: 'login', component: LoginComponent },
 *   { path: 'products', component: ProductListComponent },
 *
 *   // Rutas de usuario autenticado (cualquier rol)
 *   {
 *     path: 'cart',
 *     component: CartComponent,
 *     canActivate: [authGuard]  // ← Solo autenticación
 *   },
 *
 *   // Rutas de admin (requiere rol ADMIN)
 *   {
 *     path: 'admin',
 *     canActivate: [authGuard, adminGuard],  // ← Autenticación + rol admin
 *     children: [
 *       { path: 'products', component: AdminProductsComponent },
 *       { path: 'orders', component: AdminOrdersComponent },
 *       { path: 'users', component: AdminUsersComponent }
 *     ]
 *   }
 * ];
 *
 * ANALOGÍA NESTJS:
 * Es como combinar dos guards en un controller:
 *
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)  // ← Autenticación + rol
 * @Roles(UserRole.ADMIN)
 * export class AdminController {
 *   @Get('products')
 *   getProducts() { }  // ← Solo admins pueden acceder
 * }
 *
 * SECURITY NOTE:
 * Aunque un usuario cambie su rol en localStorage/DevTools:
 * 1. Frontend lo detecta y bloquea el acceso (este guard)
 * 2. Backend SIEMPRE valida el JWT y el rol (JwtAuthGuard + RolesGuard)
 * 3. Si un usuario bypasea el frontend y hace peticiones directas:
 *    - Backend responde 403 Forbidden (sin rol admin en el JWT válido)
 *    - error.interceptor muestra un toast de error
 */
