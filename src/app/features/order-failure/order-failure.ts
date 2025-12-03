import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { obtenerMensajeStatusDetail, MercadoPagoReturnParams } from '../../core/models/payment.model';

@Component({
  selector: 'app-order-failure',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './order-failure.html',
  styleUrls: ['./order-failure.css']
})
export class OrderFailureComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  paymentId = signal<string | null>(null);
  orderId = signal<string | null>(null);
  statusDetail = signal<string | null>(null);
  mensajeError = signal<string>('Erro ao processar pagamento');

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParams as MercadoPagoReturnParams;

    this.paymentId.set(queryParams.payment_id || null);
    this.orderId.set(queryParams.external_reference || null);
    this.statusDetail.set(queryParams.status_detail || null);

    // Traducir status_detail a mensaje amigable en pt-BR
    if (queryParams.status_detail) {
      this.mensajeError.set(obtenerMensajeStatusDetail(queryParams.status_detail));
    }
  }

  intentarNuevamente() {
    const orderId = this.orderId();
    if (orderId) {
      this.router.navigate(['/checkout'], { state: { orderId } });
    } else {
      this.router.navigate(['/cart']);
    }
  }

  irAPedidos() {
    this.router.navigate(['/profile'], { queryParams: { tab: 'orders' } });
  }

  continuarComprando() {
    this.router.navigate(['/products']);
  }
}
