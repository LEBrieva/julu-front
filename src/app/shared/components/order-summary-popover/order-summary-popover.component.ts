import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Order } from '../../../core/models/order.model';
import {
  formatOrderStatus,
  getOrderStatusSeverity,
  formatPaymentStatus,
  getPaymentStatusSeverity,
} from '../../../core/models/order.model';

/**
 * Componente Popover de Resumen de Orden
 *
 * Muestra un resumen rápido de la orden con:
 * - Número de orden
 * - Badges de estado (orden + pago)
 * - Preview de items (máx 4, con scroll)
 * - Total
 * - Botón para ver detalle completo
 *
 * Se usa dentro de un <p-popover> parent
 */
@Component({
  selector: 'app-order-summary-popover',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule],
  templateUrl: './order-summary-popover.component.html',
  styleUrl: './order-summary-popover.component.css',
})
export class OrderSummaryPopoverComponent {
  @Input() order: Order | null = null;
  @Output() viewFullDetail = new EventEmitter<Order>();

  // Exponer helpers como métodos del componente
  formatOrderStatus = formatOrderStatus;
  getOrderStatusSeverity = getOrderStatusSeverity;
  formatPaymentStatus = formatPaymentStatus;
  getPaymentStatusSeverity = getPaymentStatusSeverity;

  onViewFullDetail() {
    if (this.order) {
      this.viewFullDetail.emit(this.order);
    }
  }
}
