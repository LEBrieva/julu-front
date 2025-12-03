import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order, PaymentMethod } from '../../core/models/order.model';
import { MercadoPagoReturnParams } from '../../core/models/payment.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    DividerModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './order-success.html',
  styleUrls: ['./order-success.css'],
})
export class OrderSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  order = signal<Order | null>(null);
  loading = signal(true);
  mpReturnParams = signal<MercadoPagoReturnParams | null>(null);

  ngOnInit() {
    // Extraer query params de Mercado Pago (si existen)
    const queryParams = this.route.snapshot.queryParams as MercadoPagoReturnParams;
    if (queryParams.payment_id) {
      this.mpReturnParams.set(queryParams);
    }

    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.router.navigate(['/products']);
      return;
    }

    this.orderService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.router.navigate(['/products']);
      },
    });
  }

  goToOrders() {
    // TODO FASE 10: Implementar página de órdenes del usuario
    console.log('Navigate to user orders');
    this.router.navigate(['/products']);
  }

  continueShopping() {
    this.router.navigate(['/products']);
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Dinheiro ao receber',
      [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
      [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
      [PaymentMethod.MERCADO_PAGO]: 'Mercado Pago',
      [PaymentMethod.PIX]: 'PIX'
    };
    return labels[method] || method;
  }
}
