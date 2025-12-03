import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-order-pending',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ProgressSpinnerModule],
  templateUrl: './order-pending.html',
  styleUrls: ['./order-pending.css']
})
export class OrderPendingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  paymentId = signal<string | null>(null);
  order = signal<Order | null>(null);
  loading = signal(true);

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParams;
    this.paymentId.set(queryParams['payment_id'] || null);

    const orderId = queryParams['external_reference'];
    if (orderId) {
      this.orderService.getOrderById(orderId).subscribe({
        next: (order) => {
          this.order.set(order);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  irAPedidos() {
    this.router.navigate(['/profile'], { queryParams: { tab: 'orders' } });
  }

  continuarComprando() {
    this.router.navigate(['/products']);
  }
}
