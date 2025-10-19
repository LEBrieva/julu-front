/**
 * Constantes de configuración de autenticación
 *
 * Centraliza todos los valores de configuración relacionados con:
 * - Expiración de tokens
 * - Intervalos de refresh automático
 * - Umbrales de inactividad
 *
 * IMPORTANTE: Estos valores deben estar sincronizados con el backend:
 * - ACCESS_TOKEN_EXPIRATION debe coincidir con el expiresIn del JWT en el backend
 * - SILENT_REFRESH_INTERVAL debe ser menor que ACCESS_TOKEN_EXPIRATION
 */

/**
 * Expiración del Access Token (en milisegundos)
 * Debe coincidir con el backend: signOptions: { expiresIn: '1h' }
 */
export const ACCESS_TOKEN_EXPIRATION = 60 * 60 * 1000; // 1 hora

/**
 * Intervalo para ejecutar el refresh automático (en milisegundos)
 * Se ejecuta 5 minutos antes de que expire el token
 */
export const SILENT_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutos

/**
 * Umbral de inactividad del usuario (en milisegundos)
 * Si el usuario no interactúa durante este tiempo, se considera inactivo
 * y no se renueva el token automáticamente
 */
export const USER_INACTIVITY_THRESHOLD = 15 * 60 * 1000; // 15 minutos

/**
 * Eventos del DOM que se consideran como actividad del usuario
 * Se usa para detectar si el usuario está activo en la aplicación
 */
export const ACTIVITY_EVENTS = ['click', 'keypress', 'scroll'] as const;

/**
 * Configuración para testing/desarrollo
 * Descomenta estas líneas para usar valores más cortos durante el desarrollo
 */
// export const SILENT_REFRESH_INTERVAL = 2 * 60 * 1000;  // 2 minutos
// export const USER_INACTIVITY_THRESHOLD = 1 * 60 * 1000; // 1 minuto
