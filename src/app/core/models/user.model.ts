/**
 * Modelos relacionados con Usuario
 *
 * Estos interfaces representan las estructuras de datos que vienen de tu backend NestJS.
 * Son equivalentes a tus DTOs en el backend.
 */

/**
 * Roles de usuario (debe coincidir con tu enum en backend)
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

/**
 * Estados de usuario (debe coincidir con tu enum en backend)
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

/**
 * Interface del Usuario (lo que recibes del backend)
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  lastLogin?: string;
  emailVerified?: boolean;
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
