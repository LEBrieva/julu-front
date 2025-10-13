import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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
 * 5. Si NO está autenticado → redirect a /login (bloquea acceso)
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

  // Verificar si el usuario está autenticado (currentUser es un signal)
  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated) {
    // Usuario autenticado → Permitir acceso
    console.log('✅ AuthGuard: Usuario autenticado, acceso permitido');
    return true;
  }

  // Usuario NO autenticado → Redirigir a login
  console.log('⛔ AuthGuard: Usuario no autenticado, redirigiendo a /login');

  // Guardar la URL a la que intentaba acceder para redirigir después del login
  // Ejemplo: Usuario intentó /cart → guardamos "/cart" → después de login, lo llevamos ahí
  const returnUrl = state.url;

  // Navegar a login con el returnUrl como query param
  router.navigate(['/login'], {
    queryParams: { returnUrl }
  });

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
