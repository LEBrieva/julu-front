import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services and models
import { OrderService } from '../../../core/services/order.service';
import {
  OrderListItem,
  OrderStatus,
  PaymentStatus,
  formatOrderStatus,
  formatPaymentStatus,
  getOrderStatusSeverity,
  getPaymentStatusSeverity,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  CHANGE_STATUS_OPTIONS
} from '../../../core/models/order.model';
import { PaginationInfo } from '../../../core/models/api-response.model';

/**
 * AdminOrdersComponent - Lista de órdenes (Admin)
 *
 * Funcionalidades:
 * - DataTable con paginación server-side
 * - Búsqueda por número de orden
 * - Filtros: estado orden, estado pago, rango de fechas
 * - Cambio rápido de estado desde tabla
 * - Navegación a vista detalle
 */
@Component({
  selector: 'app-admin-orders',
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
    ToastModule,
    TooltipModule,
    Select,
    DatePicker,
    SkeletonModule,
    ConfirmDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  // Services
  private orderService = inject(OrderService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // State
  orders: OrderListItem[] = [];
  loading = false;
  editingOrderId: string | null = null;
  originalStatus: OrderStatus | null = null;

  // Filtros
  searchTerm = '';
  selectedStatus: OrderStatus | null = null;
  selectedPaymentStatus: PaymentStatus | null = null;
  dateRange: Date[] | null = null; // [fechaDesde, fechaHasta]

  // Pagination
  totalRecords = 0;
  currentPage = 1;
  rowsPerPage = 10;
  first = 0; // Índice del primer registro en la tabla
  pagination: PaginationInfo | null = null;

  // Opciones de dropdowns
  statusOptions = ORDER_STATUS_OPTIONS;
  paymentStatusOptions = PAYMENT_STATUS_OPTIONS;
  changeStatusOptions = CHANGE_STATUS_OPTIONS;

  // Helper functions (para usar en template)
  formatOrderStatus = formatOrderStatus;
  formatPaymentStatus = formatPaymentStatus;
  getOrderStatusSeverity = getOrderStatusSeverity;
  getPaymentStatusSeverity = getPaymentStatusSeverity;

  ngOnInit(): void {
    // Resetear estado al inicializar
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedPaymentStatus = null;
    this.dateRange = null;
    this.currentPage = 1;
    this.first = 0;
    this.orders = [];
    this.totalRecords = 0;
    // La tabla disparará onLazyLoad automáticamente
  }

  /**
   * Carga órdenes con paginación y filtros
   */
  loadOrders(page: number, rows: number): void {
    this.loading = true;

    // Construir filtros
    const filters: any = {
      page: page,
      limit: rows
    };

    // Agregar búsqueda (solo si hay texto)
    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }

    // Agregar filtros de estado
    if (this.selectedStatus) {
      filters.status = this.selectedStatus;
    }
    if (this.selectedPaymentStatus) {
      filters.paymentStatus = this.selectedPaymentStatus;
    }

    // Agregar filtros de fecha (rango)
    if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      // Convertir fechas a ISO strings (YYYY-MM-DD)
      filters.dateFrom = this.dateRange[0].toISOString().split('T')[0];
      filters.dateTo = this.dateRange[1].toISOString().split('T')[0];
    }

    this.orderService.getOrders(filters).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.totalRecords = response.pagination.total;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar órdenes:', error);
        this.loading = false;
        // El error.interceptor ya muestra el toast de error
      }
    });
  }

  /**
   * Handler de lazy loading de PrimeNG Table
   * Se dispara automáticamente al cambiar página, ordenar, etc.
   */
  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = event.first !== undefined && event.rows !== undefined && event.rows !== null
      ? Math.floor(event.first / event.rows) + 1
      : 1;
    const rows = event.rows ?? this.rowsPerPage;

    this.currentPage = page;
    this.rowsPerPage = rows;

    this.loadOrders(page, rows);
  }

  /**
   * Handler de búsqueda (con debounce manual)
   */
  onSearch(): void {
    // Resetear a página 1 y recargar
    this.first = 0;
    this.currentPage = 1;
    this.loadOrders(1, this.rowsPerPage);
  }

  /**
   * Handler de cambio de filtros (status, paymentStatus, dateRange)
   */
  onFilterChange(): void {
    // Resetear a página 1 y recargar
    this.first = 0;
    this.currentPage = 1;
    this.loadOrders(1, this.rowsPerPage);
  }

  /**
   * Limpiar todos los filtros
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedPaymentStatus = null;
    this.dateRange = null;
    this.first = 0;
    this.currentPage = 1;
    this.loadOrders(1, this.rowsPerPage);
  }

  /**
   * Navega a la vista detalle de una orden
   */
  viewOrderDetail(orderId: string): void {
    this.router.navigate(['/admin/orders', orderId]);
  }

  /**
   * Verifica si se puede editar el estado de una orden
   * No se pueden editar órdenes canceladas o entregadas (estados finales)
   */
  canEditStatus(order: OrderListItem): boolean {
    return order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED;
  }

  /**
   * Inicia el modo de edición del estado de una orden
   */
  startEditOrderStatus(order: OrderListItem): void {
    // Solo permitir edición si el estado no es final
    if (!this.canEditStatus(order)) {
      return;
    }

    this.editingOrderId = order.id;
    this.originalStatus = order.status;
  }

  /**
   * Maneja el cambio de estado cuando se selecciona un nuevo valor
   */
  onOrderStatusChange(order: OrderListItem): void {
    const newStatus = order.status;

    // Si es el mismo estado, cancelar
    if (newStatus === this.originalStatus) {
      this.editingOrderId = null;
      this.originalStatus = null;
      return;
    }

    const newStatusLabel = formatOrderStatus(newStatus);
    const currentStatusLabel = formatOrderStatus(this.originalStatus!);

    // Mostrar confirmación
    this.confirmationService.confirm({
      message: `¿Cambiar estado de "${currentStatusLabel}" a "${newStatusLabel}"?`,
      header: 'Confirmar Cambio',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cambiar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.updateOrderStatus(order, newStatus);
      },
      reject: () => {
        // Cancelar: resetear al estado original
        order.status = this.originalStatus!;
        this.editingOrderId = null;
        this.originalStatus = null;
      }
    });
  }

  /**
   * Actualiza el estado de una orden en el backend
   */
  private updateOrderStatus(order: OrderListItem, newStatus: OrderStatus): void {
    this.loading = true;

    this.orderService.updateOrderStatus(order.id, { status: newStatus }).subscribe({
      next: (updatedOrder) => {
        // Actualizar orden en la lista local
        const index = this.orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          this.orders[index] = {
            ...this.orders[index],
            status: updatedOrder.status
          };
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Estado Actualizado',
          detail: `Orden ${order.orderNumber} actualizada a ${formatOrderStatus(newStatus)}`
        });

        this.loading = false;
        this.editingOrderId = null;
        this.originalStatus = null;
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
        // Resetear al estado original
        order.status = this.originalStatus!;
        this.loading = false;
        this.editingOrderId = null;
        this.originalStatus = null;
        // El error.interceptor ya muestra el toast de error
      }
    });
  }

  /**
   * Formatea una fecha a string corto (DD/MM/YYYY)
   */
  formatDate(date: Date): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  /**
   * Formatea un número a moneda (real brasileño)
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }
}
