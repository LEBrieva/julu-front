import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-response.model';
import {
  Order,
  OrderListItem,
  FilterOrderDto,
  UpdateOrderStatusDto
} from '../models/order.model';
import { CreateGuestOrderDto } from '../models/guest-order.model';

/**
 * DTO para crear una orden desde el carrito
 */
export interface CreateOrderDto {
  addressId: string;
  shippingCost?: number;
  paymentMethod: string;
  notes?: string;
}

/**
 * OrderService - Servicio de Órdenes
 *
 * Maneja todas las operaciones de órdenes con el backend.
 * - Crear orden desde carrito (user)
 * - Lista paginada con filtros (admin)
 * - Detalle de orden
 * - Actualizar estado (solo admin)
 * - Cancelar orden (user/admin)
 */
@Injectable({
  providedIn: 'root' // Singleton - Una sola instancia en toda la app
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`; // Endpoint plural para seguir estándar RESTful

  /**
   * Crea una orden desde el carrito (USER autenticado)
   * Endpoint: POST /orders
   *
   * El backend:
   * 1. Valida que el carrito tenga items
   * 2. Valida stock disponible
   * 3. Crea la orden con snapshots de productos y dirección
   * 4. Decrementa stock
   * 5. Limpia el carrito automáticamente
   * 6. Retorna la orden creada con orderNumber único
   */
  createOrder(dto: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, dto, { withCredentials: true });
  }

  /**
   * Crea una orden como invitado (GUEST - sin autenticación)
   * Endpoint: POST /orders/guest
   *
   * El backend:
   * 1. Valida stock de todos los items del carrito
   * 2. Crea la orden con userId = null (marca como guest)
   * 3. Usa el email del DTO en shippingAddress
   * 4. Decrementa stock de variantes
   * 5. Genera orderNumber único
   * 6. Retorna la orden creada
   *
   * NOTA: NO usa withCredentials porque no hay JWT (usuario no autenticado)
   */
  createGuestOrder(dto: CreateGuestOrderDto): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/guest`, dto);
  }

  /**
   * Obtiene lista paginada de órdenes (ADMIN)
   * Endpoint: GET /orders?page=1&limit=10&search=ORD-2025-00001&status=pending&dateFrom=...&dateTo=...
   *
   * El backend retorna todas las órdenes para admin (isAdmin=true se detecta en el backend vía JWT)
   */
  getOrders(filters?: FilterOrderDto): Observable<PaginatedResponse<OrderListItem>> {
    let params = new HttpParams();

    // Agregar parámetros de paginación
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    // Agregar búsqueda por orderNumber
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    // Agregar filtros de estado
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.paymentStatus) {
      params = params.set('paymentStatus', filters.paymentStatus);
    }

    // Agregar filtros de fecha
    if (filters?.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    // Agregar filtro de tipo de orden (guest vs registered)
    if (filters?.isGuest !== undefined) {
      params = params.set('isGuest', filters.isGuest.toString());
    }

    return this.http.get<PaginatedResponse<OrderListItem>>(this.apiUrl, { params });
  }

  /**
   * Obtiene una orden por ID (ADMIN o propietario)
   * Endpoint: GET /orders/:id
   *
   * El backend valida que el usuario sea admin o el propietario de la orden
   */
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  /**
   * Actualiza el estado de una orden (ADMIN)
   * Endpoint: PATCH /orders/:id/status
   *
   * Solo admin puede cambiar el estado.
   * El backend valida que la transición de estado sea válida.
   */
  updateOrderStatus(id: string, dto: UpdateOrderStatusDto): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}/status`, dto, { withCredentials: true });
  }

  /**
   * Cancela una orden (USER o ADMIN)
   * Endpoint: DELETE /orders/:id
   *
   * Solo se pueden cancelar órdenes en estado PENDING.
   * El backend restaura el stock automáticamente.
   */
  cancelOrder(id: string): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
