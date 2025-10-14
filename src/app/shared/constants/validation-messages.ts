/**
 * Mensajes de validación centralizados
 *
 * Este archivo contiene todos los mensajes de error de validación
 * reutilizables en toda la aplicación.
 *
 * VENTAJAS:
 * - Consistencia: Mismo mensaje para el mismo error en todos los formularios
 * - Mantenimiento: Cambiar un mensaje en un solo lugar
 * - i18n Ready: Fácil de integrar con un sistema de traducciones
 * - Reutilización: No repetir código en cada componente
 *
 * USO:
 * import { VALIDATION_MESSAGES } from '@shared/constants/validation-messages';
 * const message = VALIDATION_MESSAGES['required'];
 */

/**
 * Interface para los mensajes de error que requieren parámetros
 * Ejemplo: minlength necesita saber cuál es el mínimo (minlength: 6)
 */
export interface ValidationMessage {
  (params?: any): string;
}

/**
 * Mensajes de validación por tipo de error
 *
 * TIPOS DE ERRORES COMUNES:
 * - required: Campo obligatorio
 * - email: Email inválido
 * - minlength: Longitud mínima
 * - maxlength: Longitud máxima
 * - min: Valor mínimo (números)
 * - max: Valor máximo (números)
 * - pattern: Patrón regex no cumplido
 * - Custom: Validaciones personalizadas (ej: passwordMismatch)
 */
export const VALIDATION_MESSAGES: { [key: string]: ValidationMessage } = {
  // Campo requerido
  required: () => 'Este campo es requerido',

  // Email
  email: () => 'Ingresa un email válido',

  // Longitud de texto
  minlength: (params) =>
    `Debe tener al menos ${params.requiredLength} caracteres`,
  maxlength: (params) =>
    `No puede tener más de ${params.requiredLength} caracteres`,

  // Valores numéricos
  min: (params) => `El valor mínimo es ${params.min}`,
  max: (params) => `El valor máximo es ${params.max}`,

  // Pattern (regex)
  pattern: () => 'El formato ingresado no es válido',

  // Validaciones personalizadas comunes
  passwordMismatch: () => 'Las contraseñas no coinciden',
  whitespace: () => 'No puede contener solo espacios en blanco',
  alphanumeric: () => 'Solo se permiten letras y números',
  phone: () => 'Ingresa un número de teléfono válido',
  url: () => 'Ingresa una URL válida',
  date: () => 'Ingresa una fecha válida',
  strongPassword: () =>
    'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',

  // Validaciones específicas de negocio (ejemplos)
  uniqueEmail: () => 'Este email ya está registrado',
  uniqueUsername: () => 'Este nombre de usuario no está disponible',
  invalidCredentials: () => 'Email o contraseña incorrectos',

  // Default para errores no mapeados
  default: () => 'Este campo contiene un error'
};

/**
 * NOTA PARA VALIDACIONES MUY ESPECÍFICAS:
 *
 * Si tienes una validación MUY específica de un formulario en particular
 * (ej: "El código postal de Buenos Aires debe empezar con C1"),
 * es mejor definirla directamente en el componente:
 *
 * // En tu component.ts
 * customErrorMessages = {
 *   postalCodeBuenosAires: 'El código postal de Buenos Aires debe empezar con C1'
 * };
 *
 * Y en el template usar getErrorMessage() para errores genéricos
 * y customErrorMessages para los específicos.
 */
