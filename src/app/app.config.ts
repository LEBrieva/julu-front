import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/**
 * Configuración global de la aplicación Angular
 *
 * PROVIDERS EXPLICADOS:
 *
 * - provideRouter: Sistema de rutas de Angular
 * - provideAnimationsAsync: Habilita animaciones de forma asíncrona (mejor performance)
 * - provideHttpClient: Configura el cliente HTTP con interceptors
 *   - authInterceptor: Inyecta el JWT en cada petición
 *   - errorInterceptor: Maneja errores globalmente con toasts
 * - providePrimeNG: Configura PrimeNG con el tema Aura (diseño moderno)
 * - MessageService: Servicio global de PrimeNG para mostrar toasts/notificaciones
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // ⭐ Configurar HttpClient con interceptors (orden: auth primero, luego error)
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    providePrimeNG({
      theme: {
        preset: Aura, // Tema moderno de PrimeNG
        options: {
          darkModeSelector: false, // Deshabilitar modo oscuro por ahora
        }
      }
    }),
    // ⭐ MessageService: Servicio global para toasts (usado por error.interceptor)
    MessageService
  ]
};
