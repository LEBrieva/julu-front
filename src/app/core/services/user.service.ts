import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
  UsersPaginatedResponse
} from '../models/user.model';

/**
 * UserService - Servicio para gestión de usuarios (Admin)
 *
 * Endpoints del backend:
 * - GET    /users?page=1&limit=10&role=user&status=active&search=john
 * - GET    /users/:id
 * - POST   /users (crear usuario)
 * - PATCH  /users/:id (actualizar usuario)
 * - DELETE /users/:id (eliminar usuario)
 *
 * Todos los endpoints requieren rol ADMIN excepto POST (puede ser público según configuración backend)
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  /**
   * Obtiene lista paginada de usuarios con filtros
   * @param filters Filtros opcionales (role, status, search, page, limit)
   * @returns Observable con usuarios paginados
   */
  getUsers(filters: FilterUserDto = {}): Observable<UsersPaginatedResponse> {
    let params = new HttpParams();

    if (filters.role) params = params.set('role', filters.role);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<UsersPaginatedResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene un usuario por ID
   * @param userId ID del usuario
   * @returns Observable con los datos del usuario
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Crea un nuevo usuario (admin)
   * @param userData Datos del usuario a crear
   * @returns Observable con el usuario creado
   */
  createUser(userData: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData);
  }

  /**
   * Actualiza un usuario existente
   * @param userId ID del usuario
   * @param userData Datos a actualizar
   * @returns Observable con el usuario actualizado
   */
  updateUser(userId: string, userData: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}`, userData);
  }

  /**
   * Elimina un usuario
   * @param userId ID del usuario a eliminar
   * @returns Observable vacío (204 No Content)
   */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }
}
