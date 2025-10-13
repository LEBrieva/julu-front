import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor - Inyecta el JWT en cada petición
 *
 * CONCEPTO: Esto es como un middleware en NestJS que se ejecuta ANTES de cada petición HTTP.
 *
 * ANALOGÍA BACKEND:
 * En NestJS tienes interceptores que modifican requests/responses automáticamente.
 * Este hace lo mismo pero en el frontend:
 *
 * Backend (NestJS):
 *   Request → JwtAuthGuard (lee Authorization header) → Controller
 *
 * Frontend (Angular):
 *   Request → authInterceptor (AGREGA Authorization header) → Backend
 *
 * FLUJO:
 * 1. Componente hace: http.get('/products')
 * 2. authInterceptor intercepta la petición
 * 3. Lee el accessToken de localStorage
 * 4. Clona la petición y agrega: Authorization: Bearer <token>
 * 5. Envía la petición modificada al backend
 * 6. Backend valida el token con JwtAuthGuard
 *
 * NOTA: HttpInterceptorFn es la nueva forma de crear interceptors en Angular (funcional)
 * Antes se usaban clases, ahora funciones (más simple)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Leer el token de localStorage
  const token = localStorage.getItem('accessToken');

  // Si no hay token, enviar la petición sin modificar
  if (!token) {
    return next(req);
  }

  // Clonar la petición y agregar el header Authorization
  // IMPORTANTE: Las peticiones HTTP son inmutables, no se pueden modificar directamente
  // Por eso usamos clone() (similar a Object.assign() o spread operator)
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`  // ⭐ Tu backend espera este formato
    },
    withCredentials: true  // ⭐ CRÍTICO: Incluir cookies httpOnly en cada petición
  });

  // Pasar la petición modificada al siguiente interceptor o al servidor
  return next(clonedRequest);
};

/**
 * DEBUGGING TIP:
 * Si quieres ver qué peticiones están siendo interceptadas:
 *
 * console.log('🔐 Interceptor:', req.url, token ? '✅ Token agregado' : '⚠️ Sin token');
 */
