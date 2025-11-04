/**
 * Modelos relacionados con Usuario
 *
 * Estos interfaces representan las estructuras de datos que vienen de tu backend NestJS.
 * Son equivalentes a tus DTOs en el backend.
 */

/**
 * Roles de usuario (debe coincidir con tu enum en backend)
 * IMPORTANTE: Los valores deben ser lowercase para coincidir con el backend
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

/**
 * Estados de usuario (debe coincidir con tu enum en backend)
 * IMPORTANTE: Los valores deben ser lowercase para coincidir con el backend
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

/**
 * Interface del Usuario (lo que recibes del backend)
 * firstName y lastName son opcionales porque el JWT solo contiene id, email, role
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatar?: string;
  lastLogin?: Date;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * DTO para crear usuario (admin)
 */
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar?: string;
}

/**
 * DTO para actualizar usuario
 */
export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar?: string;
  emailVerified?: boolean;
}

/**
 * DTO para filtros de búsqueda de usuarios
 */
export interface FilterUserDto {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada de usuarios
 */
export interface UsersPaginatedResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Respuesta del endpoint /auth/login
 */
export interface LoginResponse {
  accessToken: string;  // JWT que guardamos en localStorage
  user: User;           // Datos del usuario
  // refreshToken NO viene aquí, viene en httpOnly cookie
}

/**
 * Respuesta del endpoint /auth/refresh
 */
export interface RefreshResponse {
  accessToken: string;  // Nuevo JWT
}

/**
 * Payload del JWT decodificado (lo que viene dentro del token)
 * Este es el contenido que podemos VER pero NO modificar (firmado por el backend)
 */
export interface JwtPayload {
  sub: string;          // userId
  email: string;
  role: UserRole;
  permissions?: string[];
  isDashboard?: boolean;
  iat?: number;         // Issued at (timestamp)
  exp?: number;         // Expiration (timestamp)
}
