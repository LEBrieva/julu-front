import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

// Services and models
import { ProductService } from '../../../core/services/product.service';
import {
  ProductListItem,
  ProductStatus,
  formatEnumValue,
  getStatusSeverity
} from '../../../core/models/product.model';
import { PaginationInfo } from '../../../core/models/api-response.model';

/**
 * AdminProductsComponent - Lista de productos (Admin)
 *
 * Funcionalidades:
 * - DataTable con paginación
 * - Búsqueda por texto
 * - Activar/Desactivar productos (no se eliminan)
 * - Navegación a formulario de crear/editar
 */
@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  // Services
  private productService = inject(ProductService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // State
  products: ProductListItem[] = [];
  loading = false;
  searchTerm = '';

  // Pagination
  totalRecords = 0;
  currentPage = 1;
  rowsPerPage = 10;
  first = 0; // Índice del primer registro en la tabla (para resetear paginación)
  pagination: PaginationInfo | null = null;

  // Helper functions (para usar en template)
  formatEnumValue = formatEnumValue;
  getStatusSeverity = getStatusSeverity;
  ProductStatus = ProductStatus;

  ngOnInit(): void {
    // Resetear estado al inicializar (importante para cuando se vuelve a esta ruta)
    this.searchTerm = '';
    this.currentPage = 1;
    this.first = 0;
    this.products = [];
    this.totalRecords = 0;
    // La tabla disparará onLazyLoad automáticamente
  }

  /**
   * Carga productos con paginación y filtros
   */
  loadProducts(page: number, rows: number): void {
    this.loading = true;

    const filters = {
      page: page,
      limit: rows,
      search: this.searchTerm || undefined
    };

    this.productService.getProducts(filters).subscribe({
      next: (response) => {
        this.products = response.data;
        this.pagination = response.pagination;
        this.totalRecords = response.pagination.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos. Intenta nuevamente.'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Maneja el evento de lazy load de PrimeNG Table
   * Este método se dispara automáticamente cuando:
   * - La tabla se inicializa
   * - Cambia la página
   * - Cambia el número de filas por página
   * - Se resetea la tabla (first cambia)
   */
  onPageChange(event: any): void {
    // Validar que event.page exista (puede ser undefined en la primera carga)
    const page = (event.page !== undefined ? event.page : 0) + 1; // PrimeNG usa índice 0, backend usa 1
    const rows = event.rows || this.rowsPerPage;
    const first = event.first !== undefined ? event.first : 0;

    this.first = first;
    this.currentPage = page;
    this.rowsPerPage = rows;

    this.loadProducts(page, rows);
  }

  /**
   * Maneja la búsqueda por texto
   * Resetea la paginación y fuerza recarga
   */
  onSearch(): void {
    this.first = 0;
    this.currentPage = 1;
    this.loadProducts(1, this.rowsPerPage);
  }

  /**
   * Limpia el filtro de búsqueda
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.first = 0;
    this.currentPage = 1;
    this.loadProducts(1, this.rowsPerPage);
  }

  /**
   * Navega al formulario de crear producto
   */
  createProduct(): void {
    this.router.navigate(['/admin/products/new']);
  }

  /**
   * Navega al formulario de editar producto
   */
  editProduct(product: ProductListItem): void {
    this.router.navigate(['/admin/products', product.id, 'edit']);
  }

  /**
   * Ver detalle del producto (navega a modo vista)
   */
  viewProduct(product: ProductListItem): void {
    this.router.navigate(['/admin/products', product.id]);
  }

  /**
   * Toggle estado del producto (activar/desactivar)
   * NOTA: No se eliminan productos, solo se cambia su estado
   */
  toggleProductStatus(product: ProductListItem): void {
    const isActive = product.status === ProductStatus.ACTIVE;
    const action = isActive ? 'desactivar' : 'activar';
    const actionCaps = isActive ? 'Desactivar' : 'Activar';

    this.confirmationService.confirm({
      message: `¿Estás seguro que deseas ${action} el producto "${product.name}"?`,
      header: `${actionCaps} Producto`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: actionCaps,
      rejectLabel: 'Cancelar',
      accept: () => {
        this.loading = true;

        const action$ = isActive
          ? this.productService.deactivateProduct(product.id)
          : this.productService.activateProduct(product.id);

        action$.subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Producto ${isActive ? 'desactivado' : 'activado'} correctamente`
            });
            // Recargar lista manteniendo paginación actual
            this.loadProducts(this.currentPage, this.rowsPerPage);
          },
          error: (error) => {
            console.error('Error cambiando estado del producto:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cambiar el estado del producto. Intenta nuevamente.'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  /**
   * Determina si el botón de toggle debe mostrar "Activar" o "Desactivar"
   */
  getToggleButtonLabel(status: string): string {
    return status === ProductStatus.ACTIVE ? 'Desactivar' : 'Activar';
  }

  /**
   * Determina el ícono del botón de toggle
   */
  getToggleButtonIcon(status: string): string {
    return status === ProductStatus.ACTIVE ? 'pi pi-times-circle' : 'pi pi-check-circle';
  }

  /**
   * Determina la severidad del botón de toggle
   */
  getToggleButtonSeverity(status: string): 'success' | 'danger' {
    return status === ProductStatus.ACTIVE ? 'danger' : 'success';
  }
}
