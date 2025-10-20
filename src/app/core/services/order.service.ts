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

/**
 * OrderService - Servicio de Órdenes
 *
 * Maneja todas las operaciones de órdenes con el backend.
 * - Lista paginada con filtros (admin)
 * - Detalle de orden
 * - Actualizar estado (solo admin)
 */
@Injectable({
  providedIn: 'root' // Singleton - Una sola instancia en toda la app
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

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

    return this.http.get<PaginatedResponse<OrderListItem>>(this.apiUrl, { params });
  }

  /**
   * Obtiene una orden por ID (ADMIN o propietario)
   * Endpoint: GET /orders/:id
   *
   * El backend valida que el usuario sea admin o el propietario de la orden
   */
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza el estado de una orden (ADMIN)
   * Endpoint: PATCH /orders/:id/status
   *
   * Solo admin puede cambiar el estado.
   * El backend valida que la transición de estado sea válida.
   */
  updateOrderStatus(id: string, dto: UpdateOrderStatusDto): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}/status`, dto);
  }

  /**
   * Cancela una orden (USER o ADMIN)
   * Endpoint: PATCH /orders/:id/cancel
   *
   * Solo se pueden cancelar órdenes en estado PENDING.
   * El backend restaura el stock automáticamente.
   */
  cancelOrder(id: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}/cancel`, {});
  }
}
