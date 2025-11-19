import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MessageService } from 'primeng/api';

/**
 * Auth Guard - Protege rutas que requieren autenticación
 *
 * CONCEPTO: Los guards son funciones que deciden si una ruta puede activarse o no.
 * Es EXACTAMENTE como los guards en NestJS:
 *
 * NESTJS (backend):
 * @UseGuards(JwtAuthGuard)  // ← Verifica JWT en el servidor
 * @Get('cart')
 * getCart() { }
 *
 * ANGULAR (frontend):
 * {
 *   path: 'cart',
 *   canActivate: [authGuard],  // ← Verifica autenticación en el cliente
 *   component: CartComponent
 * }
 *
 * FLUJO:
 * 1. Usuario intenta acceder a /cart
 * 2. authGuard se ejecuta ANTES de cargar el componente
 * 3. Verifica si el usuario está autenticado (currentUser existe)
 * 4. Si está autenticado → return true (permite acceso)
 * 5. Si NO está autenticado → redirect a home + toast (bloquea acceso)
 *
 * IMPORTANTE:
 * - Esta validación es solo UX (mejorar experiencia de usuario)
 * - La seguridad REAL está en el backend con JwtAuthGuard
 * - Un usuario malicioso puede deshabilitar este guard en DevTools,
 *   pero el backend SIEMPRE validará el JWT
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  // Verificar si el usuario está autenticado (currentUser es un signal)
  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated) {
    // Usuario autenticado → Permitir acceso
    console.log('✅ AuthGuard: Usuario autenticado, acceso permitido');
    return true;
  }

  // Usuario NO autenticado → Redirigir a home y mostrar toast
  console.log('⛔ AuthGuard: Usuario no autenticado, redirigiendo a home');

  // Mostrar toast informativo
  messageService.add({
    severity: 'info',
    summary: 'Autenticación Requerida',
    detail: 'Inicia sesión para acceder a esta sección',
    life: 4000
  });

  // Navegar a home (donde el usuario puede hacer clic en el botón de login del header)
  router.navigate(['/']);

  return false; // Bloquear acceso
};

/**
 * EJEMPLO DE USO EN RUTAS:
 *
 * // app.routes.ts
 * export const routes: Routes = [
 *   // Rutas públicas (sin guard)
 *   { path: 'login', component: LoginComponent },
 *   { path: 'products', component: ProductListComponent },
 *
 *   // Rutas protegidas (con authGuard)
 *   {
 *     path: 'cart',
 *     component: CartComponent,
 *     canActivate: [authGuard]  // ← Solo usuarios autenticados
 *   },
 *   {
 *     path: 'profile',
 *     component: ProfileComponent,
 *     canActivate: [authGuard]  // ← Solo usuarios autenticados
 *   }
 * ];
 *
 * ANALOGÍA NESTJS:
 * Es como poner @UseGuards(JwtAuthGuard) en un controller:
 *
 * @Controller('cart')
 * @UseGuards(JwtAuthGuard)  // ← Requiere autenticación
 * export class CartController { }
 */
