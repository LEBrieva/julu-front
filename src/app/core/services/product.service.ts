import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-response.model';
import {
  Product,
  ProductListItem,
  CreateProductDto,
  UpdateProductDto,
  FilterProductDto
} from '../models/product.model';

/**
 * ProductService - Servicio de Productos
 *
 * Maneja todas las operaciones CRUD de productos con el backend.
 * Incluye gestión de paginación, filtros y cambios de estado (activar/desactivar).
 */
@Injectable({
  providedIn: 'root' // Singleton - Una sola instancia en toda la app
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  /**
   * Obtiene lista paginada de productos (ADMIN)
   * Endpoint: GET /products?page=1&limit=10&search=...
   */
  getProducts(filters?: FilterProductDto): Observable<PaginatedResponse<ProductListItem>> {
    let params = new HttpParams();

    // Agregar parámetros de paginación
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    // Agregar búsqueda por texto
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    // Agregar filtros opcionales
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.style) {
      params = params.set('style', filters.style);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.code) {
      params = params.set('code', filters.code);
    }

    return this.http.get<PaginatedResponse<ProductListItem>>(this.apiUrl, { params });
  }

  /**
   * Obtiene un producto por ID (ADMIN)
   * Endpoint: GET /products/findById?id=xxx
   */
  getProductById(id: string): Observable<Product> {
    const params = new HttpParams().set('id', id);
    return this.http.get<Product>(`${this.apiUrl}/findById`, { params });
  }

  /**
   * Obtiene un producto por código (ADMIN)
   * Endpoint: GET /products/findByCode?code=xxx
   */
  getProductByCode(code: string): Observable<Product> {
    const params = new HttpParams().set('code', code);
    return this.http.get<Product>(`${this.apiUrl}/findByCode`, { params });
  }

  /**
   * Crea un nuevo producto (ADMIN)
   * Endpoint: POST /products
   */
  createProduct(data: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, data);
  }

  /**
   * Actualiza un producto existente (ADMIN)
   * Endpoint: PATCH /products/:id
   */
  updateProduct(id: string, data: UpdateProductDto): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Activa un producto (ADMIN)
   * Endpoint: PATCH /products/:id/activate
   *
   * NOTA: No se eliminan productos, solo se activan/desactivan
   * para mantener el historial y trazabilidad.
   */
  activateProduct(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Desactiva un producto (ADMIN)
   * Endpoint: PATCH /products/:id/deactivate
   *
   * NOTA: No se eliminan productos, solo se activan/desactivan
   * para mantener el historial y trazabilidad.
   */
  deactivateProduct(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  /**
   * Obtiene catálogo público de productos (solo activos)
   * Endpoint: GET /products/catalog
   *
   * NOTA: Este endpoint es público (no requiere autenticación)
   * y solo devuelve productos con status ACTIVE.
   */
  getPublicCatalog(filters?: FilterProductDto): Observable<PaginatedResponse<ProductListItem>> {
    let params = new HttpParams();

    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.style) {
      params = params.set('style', filters.style);
    }

    return this.http.get<PaginatedResponse<ProductListItem>>(`${this.apiUrl}/catalog`, { params });
  }

  /**
   * Obtiene detalle de producto público (solo si está activo)
   * Endpoint: GET /products/catalog/:id
   *
   * NOTA: Este endpoint es público y solo devuelve el producto
   * si su status es ACTIVE.
   */
  getPublicProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/catalog/${id}`);
  }
}
