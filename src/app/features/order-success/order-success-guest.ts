import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, PaymentMethod } from '../../core/models/order.model';
import { formatColor, formatSize } from '../../core/models/product.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-order-success-guest',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    DividerModule,
  ],
  templateUrl: './order-success-guest.html',
  styleUrls: ['./order-success-guest.css'],
})
export class OrderSuccessGuestComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order = signal<Order | null>(null);
  formatColor = formatColor;
  formatSize = formatSize;

  ngOnInit() {
    // Obtener la orden del state pasado por el router
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;
    
    if (state && state['order']) {
      this.order.set(state['order']);
    } else {
      // Si no hay orden en el state, redirigir a productos
      this.router.navigate(['/products']);
    }
  }

  goToRegister() {
    const currentOrder = this.order();

    if (!currentOrder) {
      this.router.navigate(['/register']);
      return;
    }

    // Separar fullName en firstName + lastName
    const nameParts = currentOrder.shippingAddress.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    this.router.navigate(['/register'], {
      state: {
        email: currentOrder.shippingAddress.email,
        firstName,
        lastName,
        phone: currentOrder.shippingAddress.phone,
        orderId: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
      },
    });
  }

  continueShopping() {
    this.router.navigate(['/products']);
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Efectivo al recibir',
      [PaymentMethod.CREDIT_CARD]: 'Tarjeta de Crédito',
      [PaymentMethod.DEBIT_CARD]: 'Tarjeta de Débito',
      [PaymentMethod.MERCADO_PAGO]: 'Mercado Pago',
      [PaymentMethod.PIX]: 'PIX'
    };
    return labels[method] || method;
  }
}

