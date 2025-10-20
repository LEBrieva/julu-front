import { Component, OnInit, inject } from '@angular/core';
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

/**
 * OrderDetailComponent - Vista detalle de orden (Admin)
 *
 * Muestra toda la información de una orden organizada en secciones:
 * - Header con número, estados, fecha
 * - Información del cliente
 * - Dirección de envío
 * - Productos (tabla)
 * - Totales y método de pago
 * - Acciones admin (cambiar estado)
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
    SkeletonModule
  ],
  providers: [MessageService],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  // Services
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  // State
  order: Order | null = null;
  loading = true;
  updatingStatus = false;
  selectedStatus: OrderStatus | null = null;

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
        summary: 'Error',
        detail: 'ID de orden no válido'
      });
      this.router.navigate(['/admin/orders']);
      return;
    }

    this.loadOrder(orderId);
  }

  /**
   * Carga la orden por ID
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
        console.error('Error al cargar orden:', error);
        this.loading = false;
        // El error.interceptor ya muestra el toast de error
        // Redirigir de vuelta a la lista después de un delay
        setTimeout(() => {
          this.router.navigate(['/admin/orders']);
        }, 2000);
      }
    });
  }

  /**
   * Volver a la lista de órdenes
   */
  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  /**
   * Cambiar estado de la orden
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
          summary: 'Estado Actualizado',
          detail: `La orden se actualizó a ${formatOrderStatus(updatedOrder.status)}`
        });

        this.updatingStatus = false;
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
        // Resetear el dropdown al estado original
        if (this.order) {
          this.selectedStatus = this.order.status;
        }
        this.updatingStatus = false;
        // El error.interceptor ya muestra el toast de error
      }
    });
  }

  /**
   * Formatea una fecha a string largo (DD/MM/YYYY, HH:MM)
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
   * Formatea un número a moneda (real brasileño)
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  /**
   * Calcula el total de items en la orden
   */
  getTotalItems(): number {
    if (!this.order) return 0;
    return this.order.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
