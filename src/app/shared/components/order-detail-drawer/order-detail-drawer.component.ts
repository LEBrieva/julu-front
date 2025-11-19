import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Order } from '../../../core/models/order.model';
import {
  formatOrderStatus,
  getOrderStatusSeverity,
  formatPaymentStatus,
  getPaymentStatusSeverity,
  formatPaymentMethod,
  getPaymentMethodIcon,
} from '../../../core/models/order.model';
import {
  formatSize,
  formatColor,
  getColorHex,
} from '../../../core/models/product.model';

/**
 * Componente Drawer de Detalle Completo de Orden
 *
 * Muestra información detallada de la orden:
 * - Header: Número, fecha, badges de estado
 * - Sección Cliente: Datos de contacto y dirección de envío
 * - Sección Items: Tabla con productos (imagen, variante, cantidad, precios)
 * - Sección Totales: Subtotal, envío, total
 * - Sección Pago: Método de pago y notas
 *
 * Two-way binding con [(visible)]
 */
@Component({
  selector: 'app-order-detail-drawer',
  standalone: true,
  imports: [
    CommonModule,
    DrawerModule,
    ButtonModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './order-detail-drawer.component.html',
  styleUrl: './order-detail-drawer.component.css',
})
export class OrderDetailDrawerComponent {
  @Input() order: Order | null = null;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  // Exponer helpers como métodos del componente
  formatOrderStatus = formatOrderStatus;
  getOrderStatusSeverity = getOrderStatusSeverity;
  formatPaymentStatus = formatPaymentStatus;
  getPaymentStatusSeverity = getPaymentStatusSeverity;
  formatPaymentMethod = formatPaymentMethod;
  getPaymentMethodIcon = getPaymentMethodIcon;
  formatSize = formatSize;
  formatColor = formatColor;
  getColorHex = getColorHex;

  onVisibleChange(newVisible: boolean) {
    this.visible = newVisible;
    this.visibleChange.emit(newVisible);
    if (!newVisible) {
      this.close.emit();
    }
  }

  onClose() {
    this.onVisibleChange(false);
  }
}
