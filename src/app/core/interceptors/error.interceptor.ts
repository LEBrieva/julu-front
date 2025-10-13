import { HttpInterceptorFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

/**
 * Error Interceptor - Maneja errores HTTP globalmente con Toasts visuales
 *
 * CONCEPTO: Este interceptor captura TODAS las respuestas de error del backend
 * y muestra notificaciones Toast automáticas usando PrimeNG.
 *
 * TOASTS (MessageService de PrimeNG):
 * - Es un servicio global que muestra notificaciones en la pantalla
 * - Severidades: 'success' (verde), 'info' (azul), 'warn' (amarillo), 'error' (rojo)
 * - Se muestran automáticamente y desaparecen después de unos segundos
 *
 * ANALOGÍA BACKEND:
 * Es como un Exception Filter en NestJS + un logger que notifica errores:
 *
 * @Catch(HttpException)
 * export class HttpExceptionFilter {
 *   catch(exception: HttpException) {
 *     logger.error(exception.message); // ← En frontend: Toast
 *   }
 * }
 *
 * CASOS DE USO:
 * 1. 401 Unauthorized → Token expirado → Toast info + refresh automático
 * 2. 403 Forbidden → Sin permisos → Toast error "Acceso denegado"
 * 3. 404 Not Found → Recurso no existe → Toast warn
 * 4. 429 Too Many Requests → Rate limit → Toast warn con tiempo de espera
 * 5. 500 Server Error → Error backend → Toast error genérico
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const messageService = inject(MessageService); // ⭐ Servicio de toasts de PrimeNG

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Verificar si el error es HTTP (no errores de red)
      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente (red, timeout, etc.)
        console.error('❌ Error de red:', error.error.message);
        messageService.add({
          severity: 'error',
          summary: 'Error de Conexión',
          detail: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          life: 5000
        });
      } else {
        // Error del lado del servidor (401, 403, 500, etc.)
        console.error(
          `❌ Backend error: ${error.status} ${error.statusText}`,
          error.error
        );

        // Manejar diferentes códigos de estado
        switch (error.status) {
          case 401:
            // 401 Unauthorized → Token expirado o inválido
            return handle401Error(req, next, authService, router, messageService, error);

          case 403:
            // 403 Forbidden → Sin permisos
            messageService.add({
              severity: 'error',
              summary: 'Acceso Denegado',
              detail: 'No tienes permisos para realizar esta acción.',
              life: 5000
            });
            break;

          case 404:
            // 404 Not Found → Recurso no encontrado
            messageService.add({
              severity: 'warn',
              summary: 'No Encontrado',
              detail: 'El recurso solicitado no existe.',
              life: 4000
            });
            break;

          case 400:
            // 400 Bad Request → Errores de validación
            // Extraer mensajes de error del backend (tu NestJS devuelve array de strings)
            const validationErrors = Array.isArray(error.error.message)
              ? error.error.message.join(', ')
              : error.error.message || 'Datos inválidos';

            messageService.add({
              severity: 'warn',
              summary: 'Datos Inválidos',
              detail: validationErrors,
              life: 5000
            });
            break;

          case 429:
            // 429 Too Many Requests → Rate limit excedido (tu ThrottlerGuard)
            // Extraer tiempo de espera del header X-RateLimit-Reset
            const resetTime = error.headers.get('X-RateLimit-Reset');
            let waitMessage = 'Intenta de nuevo en unos segundos.';

            if (resetTime) {
              const waitSeconds = Math.ceil((parseInt(resetTime) * 1000 - Date.now()) / 1000);
              waitMessage = `Intenta de nuevo en ${waitSeconds} segundos.`;
            }

            messageService.add({
              severity: 'warn',
              summary: 'Demasiadas Peticiones',
              detail: `Has excedido el límite de peticiones. ${waitMessage}`,
              life: 6000
            });
            break;

          case 409:
            // 409 Conflict → Duplicado (ej: email ya existe, código de producto duplicado)
            messageService.add({
              severity: 'warn',
              summary: 'Conflicto',
              detail: error.error.message || 'El recurso ya existe.',
              life: 5000
            });
            break;

          case 500:
          case 502:
          case 503:
            // 5xx Server Error → Error interno del backend
            messageService.add({
              severity: 'error',
              summary: 'Error del Servidor',
              detail: 'Ocurrió un error en el servidor. Por favor, intenta más tarde.',
              life: 6000
            });
            break;

          default:
            // Cualquier otro error no manejado
            messageService.add({
              severity: 'error',
              summary: 'Error Inesperado',
              detail: error.error.message || 'Ocurrió un error inesperado.',
              life: 5000
            });
        }
      }

      // Re-lanzar el error para que el componente también pueda manejarlo si es necesario
      return throwError(() => error);
    })
  );
};

/**
 * Manejar error 401 - Intentar refresh automático
 *
 * FLUJO DETALLADO:
 * 1. Detectamos 401
 * 2. Verificamos que NO sea el endpoint de refresh (evitar loop infinito)
 * 3. Mostramos toast info "Renovando sesión..."
 * 4. Llamamos a authService.refresh()
 * 5. Si refresh OK:
 *    - Toast success "Sesión renovada"
 *    - Reintentar la petición original con el nuevo token
 * 6. Si refresh falla:
 *    - Toast warn "Sesión expirada"
 *    - Logout y redirect a /login
 */
function handle401Error(
  req: any,
  next: any,
  authService: AuthService,
  router: Router,
  messageService: MessageService,
  originalError: HttpErrorResponse
): Observable<HttpEvent<unknown>> {
  // Si el error viene del endpoint de refresh o login, no intentar refresh
  if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
    console.error('❌ Credenciales inválidas o refresh token expirado');

    if (req.url.includes('/auth/login')) {
      // Error en login → Credenciales incorrectas
      messageService.add({
        severity: 'error',
        summary: 'Error de Autenticación',
        detail: 'Email o contraseña incorrectos.',
        life: 5000
      });
    } else {
      // Error en refresh → Sesión expirada
      messageService.add({
        severity: 'warn',
        summary: 'Sesión Expirada',
        detail: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        life: 5000
      });
      authService.logout().subscribe(() => {
        router.navigate(['/login']);
      });
    }

    return throwError(() => originalError);
  }

  console.log('🔄 Token expirado, intentando refresh automático...');

  // Mostrar toast de "renovando sesión"
  messageService.add({
    severity: 'info',
    summary: 'Renovando Sesión',
    detail: 'Tu sesión expiró, renovando automáticamente...',
    life: 3000
  });

  // Intentar refresh
  return authService.refresh().pipe(
    switchMap((): Observable<HttpEvent<unknown>> => {
      // Refresh exitoso → Reintentar la petición original
      console.log('✅ Token renovado, reintentando petición original');

      messageService.add({
        severity: 'success',
        summary: 'Sesión Renovada',
        detail: 'Tu sesión se renovó correctamente.',
        life: 3000
      });

      // Clonar la petición con el nuevo token (el interceptor auth lo agregará)
      return next(req);
    }),
    catchError(refreshError => {
      // Refresh falló → Sesión expirada totalmente
      console.error('❌ No se pudo renovar el token → Logout');

      messageService.add({
        severity: 'warn',
        summary: 'Sesión Expirada',
        detail: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        life: 5000
      });

      authService.logout().subscribe(() => {
        router.navigate(['/login']);
      });

      return throwError(() => refreshError);
    })
  );
}

/**
 * DEBUGGING TIP:
 * Para testear el refresh automático con toasts:
 *
 * 1. Login normal
 * 2. En DevTools → Application → Local Storage → Cambiar accessToken por uno expirado
 * 3. Hacer cualquier petición (GET /products)
 * 4. Deberías ver toasts:
 *    - Info: "Renovando sesión..."
 *    - Success: "Sesión renovada correctamente"
 *
 * EJEMPLO DE TOASTS QUE VERÁS:
 * - 400: "Datos Inválidos" (amarillo)
 * - 403: "Acceso Denegado - No tienes permisos" (rojo)
 * - 404: "No Encontrado - El recurso no existe" (amarillo)
 * - 429: "Demasiadas Peticiones - Intenta en 45 segundos" (amarillo)
 * - 500: "Error del Servidor" (rojo)
 */
