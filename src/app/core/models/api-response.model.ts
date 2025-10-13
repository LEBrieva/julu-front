/**
 * Modelos genéricos de respuestas de la API
 *
 * Estos tipos ayudan a tipar las respuestas paginadas y estandarizadas del backend.
 */

/**
 * Información de paginación (como la que devuelve tu backend en listings)
 */
export interface PaginationInfo {
  total: number;       // Total de items en BD
  page: number;        // Página actual
  limit: number;       // Items por página
  totalPages: number;  // Total de páginas
}

/**
 * Respuesta paginada genérica
 * Ejemplo: GET /products devuelve PaginatedResponse<Product>
 */
export interface PaginatedResponse<T> {
  data: T[];                    // Array de items (productos, órdenes, etc.)
  pagination: PaginationInfo;   // Info de paginación
}

/**
 * Error estándar de NestJS
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];  // Puede ser un string o array de errores de validación
  error: string;               // Ej: "Bad Request", "Unauthorized", etc.
}
