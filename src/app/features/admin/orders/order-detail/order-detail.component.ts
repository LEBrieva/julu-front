import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Select } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

// Services and models
import { OrderService } from '../../../../core/services/order.service';
import { UserService } from '../../../../core/services/user.service';
import {
  Order,
  OrderStatus,
  formatOrderStatus,
  formatPaymentStatus,
  formatPaymentMethod,
  getOrderStatusSeverity,
  getPaymentStatusSeverity,
  getPaymentMethodIcon,
  CHANGE_STATUS_OPTIONS
} from '../../../../core/models/order.model';
import { User } from '../../../../core/models/user.model';

// Shared Components
import { UserDetailComponent } from '../../users/user-detail/user-detail.component';

/**
 * OrderDetailComponent - Vista detalhada de pedido (Admin)
 *
 * Mostra todas as informações de um pedido organizadas em seções:
 * - Header com número, estados, data
 * - Informações do cliente
 * - Endereço de entrega
 * - Produtos (tabela)
 * - Totais e método de pagamento
 * - Ações admin (alterar estado)
 */
@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    TableModule,
    ToastModule,
    Select,
    SkeletonModule,
    UserDetailComponent
  ],
  providers: [MessageService],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  // Services
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  // State
  order: Order | null = null;
  loading = true;
  updatingStatus = false;
  selectedStatus: OrderStatus | null = null;

  // User detail modal state
  showUserDetail = signal(false);
  selectedUser = signal<User | null>(null);
  loadingUser = signal(false);

  // Opciones de dropdown
  changeStatusOptions = CHANGE_STATUS_OPTIONS;

  // Helper functions
  formatOrderStatus = formatOrderStatus;
  formatPaymentStatus = formatPaymentStatus;
  formatPaymentMethod = formatPaymentMethod;
  getOrderStatusSeverity = getOrderStatusSeverity;
  getPaymentStatusSeverity = getPaymentStatusSeverity;
  getPaymentMethodIcon = getPaymentMethodIcon;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID de pedido inválido'
      });
      this.router.navigate(['/admin/orders']);
      return;
    }

    this.loadOrder(orderId);
  }

  /**
   * Carrega o pedido por ID
   */
  loadOrder(id: string): void {
    this.loading = true;

    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.selectedStatus = order.status;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregando pedido:', error);
        this.loading = false;
        // O error.interceptor já mostra o toast de erro
        // Redirecionar de volta à lista depois de um delay
        setTimeout(() => {
          this.router.navigate(['/admin/orders']);
        }, 2000);
      }
    });
  }

  /**
   * Voltar à lista de pedidos
   */
  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  /**
   * Alterar estado do pedido
   */
  changeStatus(): void {
    if (!this.order || !this.selectedStatus || this.selectedStatus === this.order.status) {
      return;
    }

    this.updatingStatus = true;

    this.orderService.updateOrderStatus(this.order.id, { status: this.selectedStatus }).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.selectedStatus = updatedOrder.status;

        this.messageService.add({
          severity: 'success',
          summary: 'Estado Atualizado',
          detail: `O pedido foi atualizado para ${formatOrderStatus(updatedOrder.status)}`
        });

        this.updatingStatus = false;
      },
      error: (error) => {
        console.error('Erro ao atualizar estado:', error);
        // Resetar o dropdown para o estado original
        if (this.order) {
          this.selectedStatus = this.order.status;
        }
        this.updatingStatus = false;
        // O error.interceptor já mostra o toast de erro
      }
    });
  }

  /**
   * Formata uma data para string longo (DD/MM/YYYY, HH:MM)
   */
  formatDateLong(date: Date): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
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

  /**
   * Calcula o total de itens no pedido
   */
  getTotalItems(): number {
    if (!this.order) return 0;
    return this.order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Abre o modal com o perfil atual do usuário (apenas se não for guest)
   */
  viewUserProfile(): void {
    if (!this.order || !this.order.userId) {
      return;
    }

    this.loadingUser.set(true);

    this.userService.getUserById(this.order.userId).subscribe({
      next: (user) => {
        this.selectedUser.set(user);
        this.showUserDetail.set(true);
        this.loadingUser.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregando usuário:', error);
        this.loadingUser.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar o perfil do usuário'
        });
      }
    });
  }

  /**
   * Fecha o modal de detalhe do usuário
   */
  closeUserDetail(): void {
    this.showUserDetail.set(false);
    this.selectedUser.set(null);
  }
}
