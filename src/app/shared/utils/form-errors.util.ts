import { AbstractControl, FormControl } from '@angular/forms';
import { VALIDATION_MESSAGES } from '../constants/validation-messages';

/**
 * Utilidad para manejar errores de formularios de forma centralizada
 *
 * FUNCIONES:
 * - getErrorMessage(): Obtiene el mensaje de error de un control
 * - hasError(): Verifica si un control tiene un error específico
 * - getFirstError(): Obtiene el primer error de un control (útil para mostrar solo uno)
 */

/**
 * Obtiene el mensaje de error para un control de formulario
 *
 * @param control - El FormControl a validar
 * @param customMessages - Mensajes personalizados (opcional) que sobrescriben los genéricos
 * @returns El mensaje de error o null si no hay errores
 *
 * EJEMPLO DE USO EN TEMPLATE:
 * ```html
 * @if (getErrorMessage(emailControl)) {
 *   <p-message severity="error" [text]="getErrorMessage(emailControl)!" />
 * }
 * ```
 *
 * EJEMPLO CON MENSAJES CUSTOM:
 * ```typescript
 * customMessages = { postalCode: 'Código postal de Buenos Aires inválido' };
 * getErrorMessage(postalCodeControl, customMessages);
 * ```
 */
export function getErrorMessage(
  control: AbstractControl | null,
  customMessages?: { [key: string]: string }
): string | null {
  // Si el control no existe o no tiene errores, retornar null
  if (!control || !control.errors || !control.touched) {
    return null;
  }

  // Obtener el primer error (los errores son un objeto: { required: true, minlength: {...} })
  const firstErrorKey = Object.keys(control.errors)[0];
  const errorValue = control.errors[firstErrorKey];

  // 1. Intentar usar mensaje custom si existe
  if (customMessages && customMessages[firstErrorKey]) {
    return customMessages[firstErrorKey];
  }

  // 2. Usar mensaje genérico de VALIDATION_MESSAGES
  const messageFunction = VALIDATION_MESSAGES[firstErrorKey];
  if (messageFunction) {
    // Algunos errores tienen parámetros (ej: minlength: { requiredLength: 6, actualLength: 3 })
    return messageFunction(errorValue);
  }

  // 3. Fallback: mensaje por defecto si no se encuentra el error en el mapa
  return VALIDATION_MESSAGES['default']();
}

/**
 * Verifica si un control tiene un error específico Y ha sido tocado
 *
 * @param control - El FormControl a validar
 * @param errorType - Tipo de error a verificar (ej: 'required', 'email')
 * @returns true si el control tiene ese error y fue tocado
 *
 * EJEMPLO DE USO:
 * ```typescript
 * hasError(emailControl, 'required') // true/false
 * ```
 */
export function hasError(
  control: AbstractControl | null,
  errorType: string
): boolean {
  return !!(control?.hasError(errorType) && control?.touched);
}

/**
 * Obtiene el primer error de un control (solo el key, no el mensaje)
 *
 * @param control - El FormControl a validar
 * @returns El nombre del primer error o null
 *
 * EJEMPLO DE USO:
 * ```typescript
 * const errorType = getFirstError(emailControl); // 'required' | 'email' | null
 * ```
 */
export function getFirstError(control: AbstractControl | null): string | null {
  if (!control || !control.errors || !control.touched) {
    return null;
  }

  return Object.keys(control.errors)[0];
}

/**
 * Obtiene todos los errores de un control como un array
 *
 * @param control - El FormControl a validar
 * @returns Array de mensajes de error
 *
 * EJEMPLO DE USO:
 * ```typescript
 * const errors = getAllErrors(passwordControl);
 * // ['La contraseña es requerida', 'Debe tener al menos 6 caracteres']
 * ```
 *
 * ÚTIL PARA: Mostrar TODOS los errores de un campo en lugar de solo el primero
 */
export function getAllErrors(
  control: AbstractControl | null,
  customMessages?: { [key: string]: string }
): string[] {
  if (!control || !control.errors || !control.touched) {
    return [];
  }

  return Object.keys(control.errors).map((errorKey) => {
    const errorValue = control.errors![errorKey];

    // Intentar mensaje custom primero
    if (customMessages && customMessages[errorKey]) {
      return customMessages[errorKey];
    }

    // Mensaje genérico
    const messageFunction = VALIDATION_MESSAGES[errorKey];
    if (messageFunction) {
      return messageFunction(errorValue);
    }

    // Fallback
    return VALIDATION_MESSAGES['default']();
  });
}

/**
 * NOTA SOBRE USO EN COMPONENTES:
 *
 * Puedes usar estas funciones de dos formas:
 *
 * 1. DIRECTAMENTE EN EL TEMPLATE (más simple):
 * ```typescript
 * import { getErrorMessage } from '@shared/utils/form-errors.util';
 *
 * export class MyComponent {
 *   getErrorMessage = getErrorMessage; // Exponer la función
 * }
 * ```
 * ```html
 * @if (getErrorMessage(emailControl)) {
 *   <p-message [text]="getErrorMessage(emailControl)!" />
 * }
 * ```
 *
 * 2. EN EL COMPONENT (más control):
 * ```typescript
 * import { getErrorMessage } from '@shared/utils/form-errors.util';
 *
 * export class MyComponent {
 *   getEmailError(): string | null {
 *     return getErrorMessage(this.emailControl, {
 *       uniqueEmail: 'Este email ya existe en el sistema'
 *     });
 *   }
 * }
 * ```
 */
