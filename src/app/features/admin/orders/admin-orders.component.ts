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
  formatOrderType,
  getOrderTypeSeverity,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  CHANGE_STATUS_OPTIONS,
  ORDER_TYPE_OPTIONS
} from '../../../core/models/order.model';
import { PaginationInfo } from '../../../core/models/api-response.model';

/**
 * AdminOrdersComponent - Lista de pedidos (Admin)
 *
 * Funcionalidades:
 * - DataTable com paginação server-side
 * - Busca por número de pedido
 * - Filtros: estado do pedido, estado do pagamento, intervalo de datas
 * - Mudança rápida de estado da tabela
 * - Navegação para vista detalhada
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

  // Para headless dialog
  pendingStatusChange: { from: string; to: string } | null = null;

  // Filtros
  searchTerm = '';
  selectedStatus: OrderStatus | null = null;
  selectedPaymentStatus: PaymentStatus | null = null;
  selectedOrderType: boolean | null = null; // null = todos, true = guest, false = registered
  dateRange: Date[] | null = null; // [dataDesde, dataAté]

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
  orderTypeOptions = ORDER_TYPE_OPTIONS;

  // Helper functions (para usar en template)
  formatOrderStatus = formatOrderStatus;
  formatPaymentStatus = formatPaymentStatus;
  getOrderStatusSeverity = getOrderStatusSeverity;
  getPaymentStatusSeverity = getPaymentStatusSeverity;
  formatOrderType = formatOrderType;
  getOrderTypeSeverity = getOrderTypeSeverity;

  ngOnInit(): void {
    // Resetear estado al inicializar
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedPaymentStatus = null;
    this.selectedOrderType = null;
    this.dateRange = null;
    this.currentPage = 1;
    this.first = 0;
    this.orders = [];
    this.totalRecords = 0;
    // La tabla disparará onLazyLoad automáticamente
  }

  /**
   * Carrega pedidos com paginação e filtros
   */
  loadOrders(page: number, rows: number): void {
    this.loading = true;

    // Construir filtros
    const filters: any = {
      page: page,
      limit: rows
    };

    // Adicionar busca (só se houver texto)
    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }

    // Adicionar filtros de estado
    if (this.selectedStatus) {
      filters.status = this.selectedStatus;
    }
    if (this.selectedPaymentStatus) {
      filters.paymentStatus = this.selectedPaymentStatus;
    }

    // Adicionar filtros de data (intervalo)
    if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      // Converter datas para ISO strings (YYYY-MM-DD)
      filters.dateFrom = this.dateRange[0].toISOString().split('T')[0];
      filters.dateTo = this.dateRange[1].toISOString().split('T')[0];
    }

    // Adicionar filtro de tipo de pedido (guest vs registered)
    if (this.selectedOrderType !== null) {
      filters.isGuest = this.selectedOrderType;
    }

    this.orderService.getOrders(filters).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.totalRecords = response.pagination.total;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregando pedidos:', error);
        this.loading = false;
        // O error.interceptor já mostra o toast de erro
      }
    });
  }

  /**
   * Handler de lazy loading de PrimeNG Table
   * Acionado automaticamente ao mudar página, ordenar, etc.
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
   * Handler de busca (com debounce manual)
   */
  onSearch(): void {
    // Resetar para página 1 e recarregar
    this.first = 0;
    this.currentPage = 1;
    this.loadOrders(1, this.rowsPerPage);
  }

  /**
   * Handler de mudança de filtros (status, paymentStatus, dateRange)
   */
  onFilterChange(): void {
    // Resetar para página 1 e recarregar
    this.first = 0;
    this.currentPage = 1;
    this.loadOrders(1, this.rowsPerPage);
  }

  /**
   * Limpar todos os filtros
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedPaymentStatus = null;
    this.selectedOrderType = null;
    this.dateRange = null;
    this.first = 0;
    this.currentPage = 1;
    this.loadOrders(1, this.rowsPerPage);
  }

  /**
   * Navega para a vista detalhada de um pedido
   */
  viewOrderDetail(orderId: string): void {
    this.router.navigate(['/admin/orders', orderId]);
  }

  /**
   * Verifica se o estado de um pedido pode ser editado
   * Não é possível editar pedidos cancelados ou entregues (estados finais)
   */
  canEditStatus(order: OrderListItem): boolean {
    return order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED;
  }

  /**
   * Inicia o modo de edição do estado de um pedido
   */
  startEditOrderStatus(order: OrderListItem): void {
    // Apenas permitir edição se o estado não for final
    if (!this.canEditStatus(order)) {
      return;
    }

    this.editingOrderId = order.id;
    this.originalStatus = order.status;
  }

  /**
   * Manipula a mudança de estado quando um novo valor é selecionado
   */
  onOrderStatusChange(order: OrderListItem): void {
    const newStatus = order.status;

    // Se for o mesmo estado, cancelar
    if (newStatus === this.originalStatus) {
      this.editingOrderId = null;
      this.originalStatus = null;
      return;
    }

    const newStatusLabel = formatOrderStatus(newStatus);
    const currentStatusLabel = formatOrderStatus(this.originalStatus!);

    // Guardar mudança pendente para mostrar no diálogo headless
    this.pendingStatusChange = {
      from: currentStatusLabel,
      to: newStatusLabel
    };

    // Mostrar confirmação com template headless
    this.confirmationService.confirm({
      key: 'changeStatus',
      message: `Deseja alterar o estado do pedido ${order.orderNumber}?`,
      header: 'Confirmar Mudança de Estado',
      icon: 'pi pi-refresh',
      acceptLabel: 'Sim, alterar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.updateOrderStatus(order, newStatus);
      },
      reject: () => {
        // Cancelar: resetar para o estado original
        order.status = this.originalStatus!;
        this.editingOrderId = null;
        this.originalStatus = null;
      }
    });
  }

  /**
   * Atualiza o estado de um pedido no backend
   */
  private updateOrderStatus(order: OrderListItem, newStatus: OrderStatus): void {
    this.loading = true;

    this.orderService.updateOrderStatus(order.id, { status: newStatus }).subscribe({
      next: (updatedOrder) => {
        // Atualizar pedido na lista local
        const index = this.orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          this.orders[index] = {
            ...this.orders[index],
            status: updatedOrder.status
          };
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Estado Atualizado',
          detail: `Pedido ${order.orderNumber} atualizado para ${formatOrderStatus(newStatus)}`
        });

        this.loading = false;
        this.editingOrderId = null;
        this.originalStatus = null;
      },
      error: (error) => {
        console.error('Erro ao atualizar estado:', error);
        // Resetar para o estado original
        order.status = this.originalStatus!;
        this.loading = false;
        this.editingOrderId = null;
        this.originalStatus = null;
        // O error.interceptor já mostra o toast de erro
      }
    });
  }

  /**
   * Formata uma data para string curto (DD/MM/YYYY)
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
   * Formata um número para moeda (real brasileiro)
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }
}
