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
  FilterProductDto,
  AddVariantDto,
  UpdateSingleVariantDto
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

  // ===========================
  // GESTIÓN DE VARIANTES
  // ===========================

  /**
   * Agrega una nueva variante a un producto existente (ADMIN)
   * Endpoint: POST /products/:id/variants
   *
   * @param productId ID del producto
   * @param variant Datos de la variante (size, color, stock, price)
   * @returns Producto actualizado con la nueva variante
   */
  addVariant(productId: string, variant: AddVariantDto): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/${productId}/variants`, variant);
  }

  /**
   * Actualiza una variante específica de un producto (ADMIN)
   * Endpoint: PATCH /products/:id/variants/:sku
   *
   * @param productId ID del producto
   * @param sku SKU de la variante a actualizar
   * @param data Datos a actualizar (stock, price)
   * @returns Producto actualizado
   */
  updateVariant(productId: string, sku: string, data: UpdateSingleVariantDto): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${productId}/variants/${sku}`, data);
  }

  /**
   * Elimina una variante de un producto (ADMIN)
   * Endpoint: DELETE /products/:id/variants/:sku
   *
   * NOTA: El backend puede rechazar la eliminación si la variante
   * tiene órdenes asociadas (error 409 Conflict).
   *
   * @param productId ID del producto
   * @param sku SKU de la variante a eliminar
   * @returns Producto actualizado sin la variante
   */
  deleteVariant(productId: string, sku: string): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/${productId}/variants/${sku}`);
  }

  // ===========================
  // GESTIÓN DE IMÁGENES
  // ===========================

  /**
   * Sube imágenes a un producto (ADMIN)
   * Endpoint: POST /products/:id/images
   *
   * @param productId ID del producto
   * @param files Array de archivos de imagen (máx 5)
   * @returns Response con producto actualizado e imágenes
   */
  uploadImages(productId: string, files: File[]): Observable<{ id: string; images: string[]; message: string }> {
    const formData = new FormData();

    // Agregar cada archivo al FormData con la key 'images'
    files.forEach((file) => {
      formData.append('images', file, file.name);
    });

    return this.http.post<{ id: string; images: string[]; message: string }>(
      `${this.apiUrl}/${productId}/images`,
      formData
    );
  }

  /**
   * Elimina una imagen de un producto (ADMIN)
   * Endpoint: DELETE /products/:id/images/:index
   *
   * @param productId ID del producto
   * @param imageIndex Índice de la imagen en el array (0-4)
   * @returns Producto actualizado sin la imagen eliminada
   */
  deleteImage(productId: string, imageIndex: number): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/${productId}/images/${imageIndex}`);
  }

  /**
   * Establece la imagen destacada/portada de un producto (ADMIN)
   * Endpoint: PATCH /products/:id/featured-image
   *
   * @param productId ID del producto
   * @param imageIndex Índice de la imagen a establecer como portada (0-4)
   * @returns Producto actualizado con la nueva imagen destacada
   */
  setFeaturedImage(productId: string, imageIndex: number): Observable<Product> {
    return this.http.patch<Product>(
      `${this.apiUrl}/${productId}/featured-image`,
      { index: imageIndex }
    );
  }

  // ===========================
  // PRODUCTOS DESTACADOS
  // ===========================

  /**
   * Obtiene los productos destacados para mostrar en el home (PÚBLICO)
   * Endpoint: GET /products/destacados
   *
   * Retorna hasta 12 productos marcados como destacados y activos,
   * ordenados por fecha de actualización (más recientes primero).
   *
   * @returns Array de productos destacados (máximo 12)
   */
  getProductosDestacados(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/destacados`);
  }

  /**
   * Cuenta cuántos productos están marcados como destacados (ADMIN)
   * Endpoint: GET /products/destacados/count
   *
   * Útil para validar antes de marcar un nuevo producto como destacado
   * (límite: 12 productos destacados).
   *
   * @returns Objeto con la cantidad de productos destacados
   */
  countDestacados(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/destacados/count`);
  }
}
