# Integração Mercado Pago - Checkout Pro

## 📋 Visão Geral

Este documento detalha a integração completa do **Mercado Pago Checkout Pro** no e-commerce, incluindo configuração, desenvolvimento, testes e deploy em produção.

### O que é Checkout Pro?

Checkout Pro é a solução de pagamento baseada em **redirecionamento** do Mercado Pago, onde clientes são levados a uma página segura hospedada pelo MP para completar a compra, e então retornam à sua loja.

### Por que Checkout Pro?

- ✅ **Simplicidade**: Desenvolvimento mínimo, sem PCI compliance
- ✅ **Segurança**: MP gerencia todos os dados sensíveis (números de cartão, CVV)
- ✅ **Manutenção**: MP mantém e otimiza a experiência de checkout
- ✅ **Pagamento em 1 clique**: Usuários registrados pagam com métodos salvos
- ✅ **Mobile otimizado**: Design responsivo mantido pelo MP
- ✅ **Atualizações constantes**: Novos métodos de pagamento adicionados automaticamente

---

## 🔄 Fluxo de Pagamento

```
1. Cliente adiciona itens ao carrinho no seu site
2. Cliente clica em "Finalizar Compra"
3. Backend cria uma Payment Preference (via API do MP)
4. Frontend redireciona cliente para página do Mercado Pago
5. Cliente seleciona método de pagamento e completa o pagamento
6. Mercado Pago processa pagamento
7. Cliente é redirecionado de volta ao seu site (URL success/failure)
8. Webhook notifica seu backend do status do pagamento (assíncrono)
9. Backend atualiza status da Order no banco de dados
```

**Importante**: O webhook é a fonte de verdade. A página de retorno é apenas UX - sempre validar via webhook.

---

## 💳 Métodos de Pagamento Disponíveis no Brasil

Checkout Pro suporta todos os métodos brasileiros:

- **PIX** (pagamento instantâneo, requer chave PIX cadastrada na conta MP)
- **Cartões de Crédito** (Visa, Mastercard, Elo, Hipercard)
- **Cartões de Débito** (Caixa cartão virtual)
- **Boleto Bancário** (vencimento em 3 dias)
- **Mercado Pago Wallet** (métodos salvos)
- **Parcelamento sem cartão** (Mercado Crédito)
- **Saldo da Conta** (saldo MP)
- **Pagamento com 2 cartões** (divisão de pagamento)

---

## 🧪 Ambiente de Testes (Sandbox)

### Obtendo Credenciais de Teste

**Passo a passo**:

1. Criar conta Mercado Pago (grátis) em [mercadopago.com.br](https://www.mercadopago.com.br)
2. Acessar [Painel de Desenvolvedores](https://www.mercadopago.com.br/developers/panel)
3. Clicar em "Suas integrações" → "Criar aplicação"
4. Navegar para **Credenciais de teste** no menu esquerdo
5. Copiar **Public Key** e **Access Token** (modo teste)

**Localização das credenciais**: https://www.mercadopago.com.br/developers/panel/credentials

### Contas de Teste

Você precisa de **dois tipos de contas** para testes:

- **Conta Vendedor** (sua conta principal): Configurar aplicação e credenciais
- **Conta Comprador** (usuário teste): Simular compras de clientes

**Criando Contas de Teste de Comprador**:
- Navegar para seção "Contas de teste" no painel
- Gerar usuários teste com diferentes cenários (pagamentos aprovados/rejeitados)
- Essas contas funcionam automaticamente no ambiente sandbox

### Cartões de Teste

| Cenário | Número do Cartão | CVV | Validade |
|---------|------------------|-----|----------|
| Aprovado | `5031 4332 1540 6351` | 123 | Qualquer data futura |
| Rejeitado (fundos insuficientes) | `5031 7557 3453 0604` | 123 | Qualquer data futura |
| Rejeitado (CVV inválido) | Qualquer cartão | 000 | Qualquer data futura |

**Teste PIX**: No sandbox, você receberá um QR code e link de pagamento que auto-completa após alguns segundos.

### Notas Importantes sobre Sandbox

⚠️ **Ao usar credenciais de teste, você está automaticamente em sandbox** - nenhuma cobrança de produção ocorre
⚠️ Contas de teste têm **acesso limitado** a alguns recursos do painel
⚠️ Webhooks funcionam no sandbox - use ferramentas como **ngrok** para expor localhost para testes de webhook

---

## 🔧 Implementação Backend (NestJS)

### 1. Instalação de Dependências

```bash
npm install mercadopago
```

### 2. Variáveis de Ambiente

```env
# Mercado Pago
MP_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx
MP_WEBHOOK_SECRET=seu_webhook_secret_do_painel_mp

# URLs
FRONTEND_URL=http://localhost:4200
BACKEND_WEBHOOK_URL=https://seu-dominio.com/webhooks/mercadopago

# URLs de redirecionamento (Checkout Pro)
MP_SUCCESS_URL=http://localhost:4200/order-success
MP_FAILURE_URL=http://localhost:4200/order-failure
MP_PENDING_URL=http://localhost:4200/order-pending
```

### 3. Database Models

#### Payment Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';

export enum PaymentStatus {
  PENDING = 'pending',           // Pagamento criado, aguardando confirmação
  APPROVED = 'approved',         // Pagamento bem-sucedido
  AUTHORIZED = 'authorized',     // Pré-autorização (capturar depois)
  IN_PROCESS = 'in_process',     // Processando (boleto aguardando pagamento)
  IN_MEDIATION = 'in_mediation', // Disputa aberta
  REJECTED = 'rejected',         // Pagamento falhou
  CANCELLED = 'cancelled',       // Pagamento cancelado
  REFUNDED = 'refunded',         // Pagamento reembolsado
  CHARGED_BACK = 'charged_back'  // Chargeback
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  mercadoPagoId: string;  // ID do pagamento do MP (do webhook)

  @Column({ unique: true })
  preferenceId: string;   // ID da preference do MP

  @ManyToOne(() => Order, order => order.payments)
  order: Order;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  paymentMethod: string;  // pix, credit_card, boleto, etc.

  @Column({ nullable: true })
  paymentTypeId: string;  // Mais específico (visa, mastercard, etc.)

  @Column({ type: 'text', nullable: true })
  statusDetail: string;   // Razão de rejeição/aprovação

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;          // Resposta completa do MP para debugging

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  paidAt: Date;
}
```

#### Atualização da Order Entity

```typescript
@Entity('orders')
export class Order {
  // ... campos existentes

  @OneToMany(() => Payment, payment => payment.order)
  payments: Payment[];

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  lastWebhookProcessedAt: Date;
}
```

### 4. MercadoPagoService

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;

  constructor(private configService: ConfigService) {
    this.client = new MercadoPagoConfig({
      accessToken: this.configService.get('MP_ACCESS_TOKEN'),
      options: {
        timeout: 5000,
      }
    });
  }

  async createPreference(order: Order): Promise<{ initPoint: string; preferenceId: string }> {
    const preference = new Preference(this.client);

    const body = {
      items: order.items.map(item => ({
        id: item.productId,
        title: item.productName,
        quantity: item.quantity,
        unit_price: Number(item.price),
        currency_id: 'BRL'
      })),
      payer: {
        email: order.customerEmail,
        name: order.customerName,
        phone: order.phone ? {
          area_code: order.phone.substring(0, 2),
          number: order.phone.substring(2)
        } : undefined
      },
      back_urls: {
        success: this.configService.get('MP_SUCCESS_URL'),
        failure: this.configService.get('MP_FAILURE_URL'),
        pending: this.configService.get('MP_PENDING_URL')
      },
      auto_return: 'approved' as const,
      notification_url: `${this.configService.get('BACKEND_WEBHOOK_URL')}/webhooks/mercadopago`,
      external_reference: order.id,
      metadata: {
        orderId: order.id,
        userId: order.userId
      },
      statement_descriptor: 'SUA_LOJA', // Nome que aparece na fatura do cartão
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    };

    const response = await preference.create({ body });

    return {
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    };
  }

  async getPayment(paymentId: string): Promise<any> {
    const payment = new MPPayment(this.client);
    return await payment.get({ id: paymentId });
  }

  validateWebhookSignature(headers: any, body: string): boolean {
    const xSignature = headers['x-signature'];
    const xRequestId = headers['x-request-id'];

    if (!xSignature || !xRequestId) {
      return false;
    }

    try {
      // Extrair ts e v1 do header x-signature
      // Formato: "ts=1234567890,v1=hash_value"
      const parts = xSignature.split(',');
      const ts = parts.find(p => p.startsWith('ts=')).split('=')[1];
      const hash = parts.find(p => p.startsWith('v1=')).split('=')[1];

      // Construir manifest: "id:[data_id];request-id:[x-request-id];ts:[ts];"
      const dataId = JSON.parse(body).data.id;
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      // HMAC-SHA256 com seu webhook secret
      const expectedHash = crypto
        .createHmac('sha256', this.configService.get('MP_WEBHOOK_SECRET'))
        .update(manifest)
        .digest('hex');

      return expectedHash === hash;
    } catch (error) {
      return false;
    }
  }
}
```

### 5. PaymentService

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { MercadoPagoService } from './mercadopago.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private mercadoPagoService: MercadoPagoService
  ) {}

  async createPaymentPreference(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items']
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Pedido já foi pago ou cancelado');
    }

    // Criar preference no Mercado Pago
    const { preferenceId, initPoint, sandboxInitPoint } =
      await this.mercadoPagoService.createPreference(order);

    // Salvar payment record
    const payment = this.paymentRepository.create({
      preferenceId,
      order,
      amount: order.total,
      status: PaymentStatus.PENDING
    });

    await this.paymentRepository.save(payment);

    return {
      preferenceId,
      initPoint: process.env.NODE_ENV === 'production' ? initPoint : sandboxInitPoint
    };
  }

  async processWebhook(webhookData: any): Promise<void> {
    const { type, data } = webhookData;

    if (type !== 'payment') {
      return; // Ignorar outros tipos de notificações
    }

    const paymentId = data.id;

    // Buscar detalhes do pagamento no MP
    const mpPayment = await this.mercadoPagoService.getPayment(paymentId);

    // Buscar payment no nosso BD pelo external_reference (order ID)
    const order = await this.orderRepository.findOne({
      where: { id: mpPayment.external_reference },
      relations: ['payments']
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar idempotência (webhook já processado?)
    const existingPayment = await this.paymentRepository.findOne({
      where: { mercadoPagoId: paymentId }
    });

    if (existingPayment && existingPayment.status === mpPayment.status) {
      return; // Já processado, ignorar duplicado
    }

    // Criar ou atualizar payment record
    const payment = existingPayment || this.paymentRepository.create({
      mercadoPagoId: paymentId,
      preferenceId: mpPayment.preference_id,
      order,
      amount: mpPayment.transaction_amount
    });

    payment.status = mpPayment.status as PaymentStatus;
    payment.paymentMethod = mpPayment.payment_method_id;
    payment.paymentTypeId = mpPayment.payment_type_id;
    payment.statusDetail = mpPayment.status_detail;
    payment.metadata = mpPayment;

    if (mpPayment.status === 'approved') {
      payment.paidAt = new Date(mpPayment.date_approved);
    }

    await this.paymentRepository.save(payment);

    // Atualizar status da order
    order.paymentStatus = payment.status;
    order.lastWebhookProcessedAt = new Date();

    // Se pagamento aprovado, atualizar order status
    if (payment.status === PaymentStatus.APPROVED) {
      order.status = 'processing'; // Começar a processar pedido
    } else if (payment.status === PaymentStatus.REJECTED || payment.status === PaymentStatus.CANCELLED) {
      order.status = 'cancelled';
    }

    await this.orderRepository.save(order);
  }

  async getPaymentStatus(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments']
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return {
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      payments: order.payments.map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paidAt: p.paidAt
      }))
    };
  }
}
```

### 6. Controllers

```typescript
import { Controller, Post, Body, Param, Get, Headers, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import { MercadoPagoService } from './mercadopago.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private mercadoPagoService: MercadoPagoService
  ) {}

  @Post('create-preference')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createPreference(@Body() body: { orderId: string }) {
    return this.paymentService.createPaymentPreference(body.orderId);
  }

  @Get(':orderId/status')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }
}

@Controller('webhooks')
export class WebhookController {
  constructor(
    private paymentService: PaymentService,
    private mercadoPagoService: MercadoPagoService
  ) {}

  @Post('mercadopago')
  async handleMercadoPagoWebhook(
    @Headers() headers: any,
    @Body() body: any
  ) {
    // Validar assinatura do webhook (segurança)
    const isValid = this.mercadoPagoService.validateWebhookSignature(
      headers,
      JSON.stringify(body)
    );

    if (!isValid) {
      throw new BadRequestException('Assinatura de webhook inválida');
    }

    // Processar webhook
    await this.paymentService.processWebhook(body);

    // IMPORTANTE: Retornar 200 dentro de 22 segundos
    return { received: true };
  }
}
```

---

## 🎨 Implementação Frontend (Angular)

### 1. Instalação

```bash
npm install @mercadopago/sdk-js
```

### 2. PaymentService

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PreferenceResponse {
  preferenceId: string;
  initPoint: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    paymentMethod: string;
    paidAt: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  createPreference(orderId: string): Observable<PreferenceResponse> {
    return this.http.post<PreferenceResponse>(
      `${this.apiUrl}/create-preference`,
      { orderId }
    );
  }

  getPaymentStatus(orderId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.apiUrl}/${orderId}/status`);
  }
}
```

### 3. Atualizar CheckoutComponent

```typescript
import { Component, signal, inject } from '@angular/core';
import { PaymentService } from '../../core/services/payment.service';
import { MessageService } from 'primeng/api';

export class CheckoutComponent {
  private paymentService = inject(PaymentService);
  private messageService = inject(MessageService);

  loadingPayment = signal(false);
  currentOrderId = signal<string | null>(null);

  async proceedToPayment() {
    const orderId = this.currentOrderId();
    if (!orderId) return;

    this.loadingPayment.set(true);

    try {
      this.messageService.add({
        severity: 'info',
        summary: 'Redirecionando',
        detail: 'Você será levado ao pagamento seguro do Mercado Pago...',
        life: 3000
      });

      const { initPoint } = await this.paymentService
        .createPreference(orderId)
        .toPromise();

      // Redirecionar para Mercado Pago
      window.location.href = initPoint;

    } catch (error: any) {
      this.loadingPayment.set(false);

      this.messageService.add({
        severity: 'error',
        summary: 'Erro no Pagamento',
        detail: error.error?.message || 'Falha ao processar pagamento. Tente novamente.',
        life: 5000
      });
    }
  }
}
```

**Template**:

```html
<p-button
  label="Pagar com Mercado Pago"
  icon="pi pi-credit-card"
  [loading]="loadingPayment()"
  [disabled]="!currentOrderId()"
  (click)="proceedToPayment()"
  styleClass="w-full"
/>
```

### 4. Páginas de Retorno

#### OrderSuccessComponent

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-order-success',
  template: `
    <div class="container mx-auto p-8 text-center">
      <i class="pi pi-check-circle text-green-500 text-6xl mb-4"></i>

      <h1 class="text-3xl font-bold mb-4">Pagamento Aprovado!</h1>

      <p class="text-gray-600 mb-6">
        Seu pedido <strong>#{{ orderNumber }}</strong> foi confirmado.
      </p>

      <div class="bg-gray-50 p-4 rounded-lg mb-6" *ngIf="paymentMethod">
        <p class="text-sm text-gray-600">Método de pagamento</p>
        <p class="font-semibold">{{ paymentMethod }}</p>
      </div>

      <p-button
        label="Ver Meus Pedidos"
        icon="pi pi-shopping-bag"
        routerLink="/profile"
        [queryParams]="{ tab: 'orders' }"
      />
    </div>
  `
})
export class OrderSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private messageService = inject(MessageService);

  orderNumber: string;
  paymentMethod: string;

  ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      const paymentId = params['payment_id'];
      const status = params['status'];
      const externalReference = params['external_reference'];

      if (status !== 'approved') {
        // Redirecionar para página apropriada
        if (status === 'pending') {
          this.router.navigate(['/order-pending'], { queryParams: params });
        } else {
          this.router.navigate(['/order-failure'], { queryParams: params });
        }
        return;
      }

      // Verificar status no backend (fallback se webhook falhou)
      try {
        const { orderStatus, payments } = await this.paymentService
          .getPaymentStatus(externalReference)
          .toPromise();

        this.orderNumber = externalReference;
        this.paymentMethod = payments[0]?.paymentMethod || 'Mercado Pago';

      } catch (error) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Verificando pagamento',
          detail: 'Aguarde enquanto confirmamos seu pagamento...',
          life: 5000
        });
      }
    });
  }
}
```

#### OrderFailureComponent

```typescript
@Component({
  selector: 'app-order-failure',
  template: `
    <div class="container mx-auto p-8 text-center">
      <i class="pi pi-times-circle text-red-500 text-6xl mb-4"></i>

      <h1 class="text-3xl font-bold mb-4">Pagamento Rejeitado</h1>

      <p class="text-gray-600 mb-6">
        Infelizmente seu pagamento não foi aprovado.
      </p>

      <p class="text-sm text-gray-500 mb-6" *ngIf="statusDetail">
        Motivo: {{ statusDetail }}
      </p>

      <div class="flex gap-4 justify-center">
        <p-button
          label="Tentar Novamente"
          icon="pi pi-refresh"
          (click)="retryPayment()"
        />

        <p-button
          label="Voltar ao Carrinho"
          icon="pi pi-shopping-cart"
          severity="secondary"
          routerLink="/cart"
        />
      </div>
    </div>
  `
})
export class OrderFailureComponent implements OnInit {
  statusDetail: string;
  orderId: string;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.statusDetail = this.getStatusDetailMessage(params['status_detail']);
      this.orderId = params['external_reference'];
    });
  }

  private getStatusDetailMessage(detail: string): string {
    const messages: Record<string, string> = {
      'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão',
      'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
      'cc_rejected_card_disabled': 'Cartão desabilitado',
      'cc_rejected_call_for_authorize': 'Autorize o pagamento com seu banco'
    };
    return messages[detail] || 'Entre em contato com seu banco';
  }

  retryPayment() {
    this.router.navigate(['/checkout'], {
      queryParams: { orderId: this.orderId }
    });
  }
}
```

#### OrderPendingComponent (PIX/Boleto)

```typescript
@Component({
  selector: 'app-order-pending',
  template: `
    <div class="container mx-auto p-8 text-center">
      <i class="pi pi-clock text-orange-500 text-6xl mb-4"></i>

      <h1 class="text-3xl font-bold mb-4">Pagamento Pendente</h1>

      <p class="text-gray-600 mb-6">
        Seu pedido foi registrado e aguarda confirmação do pagamento.
      </p>

      <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
        <p class="font-semibold mb-2">Instruções:</p>
        <ul class="text-left text-sm space-y-1">
          <li>• Para PIX: Escaneie o QR code ou copie o código</li>
          <li>• Para Boleto: Pague até a data de vencimento</li>
          <li>• Você receberá um email quando o pagamento for confirmado</li>
        </ul>
      </div>

      <p-button
        label="Ir para Meus Pedidos"
        icon="pi pi-shopping-bag"
        routerLink="/profile"
        [queryParams]="{ tab: 'orders' }"
      />
    </div>
  `
})
export class OrderPendingComponent {}
```

### 5. Configurar Rotas

```typescript
// app.routes.ts
export const routes: Routes = [
  // ... rotas existentes
  {
    path: 'order-success',
    loadComponent: () =>
      import('./features/checkout/order-success/order-success.component').then(
        m => m.OrderSuccessComponent
      )
  },
  {
    path: 'order-failure',
    loadComponent: () =>
      import('./features/checkout/order-failure/order-failure.component').then(
        m => m.OrderFailureComponent
      )
  },
  {
    path: 'order-pending',
    loadComponent: () =>
      import('./features/checkout/order-pending/order-pending.component').then(
        m => m.OrderPendingComponent
      )
  }
];
```

---

## 🚀 Produção

### Checklist de Preparação

#### 1. Conta Mercado Pago

- [ ] Registrar conta em [mercadopago.com.br](https://www.mercadopago.com.br)
- [ ] Completar verificação de identidade:
  - **Pessoa Física**: CPF válido + foto do documento (RG/CNH)
  - **Pessoa Jurídica**: CNPJ + documentos da empresa + documento do representante legal
- [ ] Adicionar comprovante de endereço (conta de luz, banco)
- [ ] Aguardar aprovação (1-3 dias úteis)

#### 2. Configuração PIX

- [ ] Registrar pelo menos uma chave PIX na conta MP
- [ ] Tipos disponíveis: CPF/CNPJ, email, telefone, chave aleatória
- [ ] Necessário para aceitar pagamentos PIX

#### 3. Conta Bancária

- [ ] Cadastrar conta bancária para receber fundos
- [ ] Verificação pode levar 1-2 dias úteis
- [ ] Retiradas disponíveis após verificação

#### 4. Certificação da Integração

- [ ] Acessar Developer Panel → Integration Quality
- [ ] Executar testes automáticos do MP:
  - Criação de preference
  - Recebimento de webhooks
  - Validação de assinatura
  - Tratamento de erros
- [ ] Corrigir quaisquer problemas identificados
- [ ] Obter certificado de qualidade

#### 5. Configuração de Produção

**Credenciais**:
- [ ] Obter credenciais de produção (diferentes das de teste!)
- [ ] Atualizar variáveis de ambiente:
  ```env
  MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxx
  ```

**URLs**:
- [ ] Configurar URLs de produção:
  ```env
  MP_SUCCESS_URL=https://seudominio.com.br/order-success
  MP_FAILURE_URL=https://seudominio.com.br/order-failure
  MP_PENDING_URL=https://seudominio.com.br/order-pending
  BACKEND_WEBHOOK_URL=https://api.seudominio.com.br/webhooks/mercadopago
  ```

**Webhook Secret**:
- [ ] Gerar novo webhook secret no painel MP
- [ ] Atualizar `MP_WEBHOOK_SECRET` no backend
- [ ] Testar validação de assinatura

#### 6. SSL/HTTPS

⚠️ **CRÍTICO**: Webhooks de produção **só funcionam com HTTPS**

- [ ] Configurar certificado SSL (Let's Encrypt grátis)
- [ ] Garantir que API backend use HTTPS
- [ ] Validar certificado em [SSL Labs](https://www.ssllabs.com/ssltest/)

#### 7. Monitoramento

- [ ] Configurar logging de erros (Sentry, CloudWatch, etc.)
- [ ] Criar alertas para:
  - Webhooks falhando (taxa de erro > 5%)
  - Pagamentos rejeitados (taxa > 20%)
  - Timeout de API do MP
- [ ] Dashboard para métricas:
  - Taxa de aprovação de pagamentos
  - Métodos de pagamento mais usados
  - Tempo médio de processamento

#### 8. Testes em Produção

- [ ] Fazer pagamento real de R$ 0,01 (menor valor permitido)
- [ ] Verificar webhook chega e atualiza order
- [ ] Verificar fundos aparecem na conta MP
- [ ] Testar PIX, cartão, boleto (se disponíveis)
- [ ] Verificar emails transacionais (se configurados)

---

## 💰 Custos e Comissões

### Taxas Padrão no Brasil (2025)

**Taxa Base de Transação**: A partir de **3,99%** por transação

**Por Método de Pagamento**:
- **Cartão de Crédito**: ~3,99% + taxa fixa
- **Cartão de Débito**: ~2,99% + taxa fixa
- **PIX**: ~0,99% - 1,99%
- **Boleto**: Taxa fixa (~R$ 3,49) + percentual

**Taxas Adicionais**:
- **Parcelamento**: Taxas maiores para 2x, 3x, etc.
- **Chargeback**: Taxa se cliente contestar pagamento
- **Retirada**: Pode haver taxa ao transferir para banco

**Negociação**: Taxas podem ser reduzidas para alto volume de vendas (negociar com MP)

### Prazo de Recebimento

- **PIX**: Disponível imediatamente após aprovação
- **Cartão de Crédito**: D+14 ou D+30 (configurável)
- **Boleto**: D+2 após pagamento ser confirmado

---

## 💰 Estrategia de Precios Recomendada - PIX + Tarjetas con Recargo

### Visão Geral

Esta é a estratégia mais comum no e-commerce brasileiro:

- **PIX**: Precio base (método más barato, incentivas seu uso)
- **Tarjetas (Crédito/Débito)**: Precio base + recargo para cubrir fees del MP

**Ventajas**:
- ✅ Cliente ve precios claros antes de ir a MP
- ✅ Tu margen se mantiene constante en todos los métodos
- ✅ Incentivas PIX (fee más bajo para ti)
- ✅ Simple de implementar (solo 2 preferences)

---

### Cálculo de Recargos

**Premisa**: Quieres recibir el mismo valor líquido independiente del método de pago.

#### Ejemplo Práctico: Producto que quieres recibir R$ 100 líquido

| Método | Fee MP | Precio Cliente | Cálculo | Recibes |
|--------|--------|----------------|---------|---------|
| **PIX** | 1,99% | **R$ 102,04** | 100 / 0,9801 | R$ 100,00 ✅ |
| **Tarjetas** | 3,99% | **R$ 104,16** | 100 / 0,9601 | R$ 100,00 ✅ |

**Fórmula**:
```
Precio de Venta = Valor Líquido Deseado / (1 - Fee%)
```

#### Recargos Simplificados (Recomendado)

Para facilitar, usa porcentajes redondos:

| Método | Recargo Sugerido | Ejemplo R$ 100 base |
|--------|------------------|---------------------|
| **PIX** | 0% (precio base) | R$ 100,00 |
| **Tarjetas** | +5% | R$ 105,00 |

**Por qué 5%**: Cubre el fee de MP (~4%) + margen extra para cuotas (~1%)

---

### Implementación Backend (NestJS + Mongoose)

#### 1. Constantes de Configuración

**Arquivo**: `src/payment/payment.constants.ts`

```typescript
export const PAYMENT_CONFIG = {
  // Recargos por método de pago
  SURCHARGES: {
    PIX: 0,      // Sin recargo (precio base)
    CARD: 0.05   // 5% de recargo
  },

  // Fees de Mercado Pago (para referencia)
  MP_FEES: {
    PIX: 0.0199,      // 1.99%
    CREDIT: 0.0399,   // 3.99%
    DEBIT: 0.0299,    // 2.99%
  },

  // Límites de cuotas
  MAX_INSTALLMENTS: 6,
  DEFAULT_INSTALLMENTS: 1
};
```

---

#### 2. Helper para Calcular Precio Final

**Arquivo**: `src/payment/payment.helpers.ts`

```typescript
import { PAYMENT_CONFIG } from './payment.constants';

export class PaymentHelpers {
  /**
   * Calcula precio final aplicando recargo
   * @param baseAmount - Monto base del producto
   * @param paymentType - 'pix' o 'card'
   * @returns Precio final con recargo aplicado
   */
  static calculateFinalPrice(
    baseAmount: number,
    paymentType: 'pix' | 'card'
  ): number {
    const surcharge = paymentType === 'pix'
      ? PAYMENT_CONFIG.SURCHARGES.PIX
      : PAYMENT_CONFIG.SURCHARGES.CARD;

    const finalPrice = baseAmount * (1 + surcharge);

    // Redondear a 2 decimales
    return Math.round(finalPrice * 100) / 100;
  }

  /**
   * Calcula el monto del recargo
   */
  static calculateSurchargeAmount(
    baseAmount: number,
    paymentType: 'pix' | 'card'
  ): number {
    const finalPrice = this.calculateFinalPrice(baseAmount, paymentType);
    return finalPrice - baseAmount;
  }

  /**
   * Formatea precio para display (R$ 100,00)
   */
  static formatPrice(amount: number): string {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`;
  }
}
```

---

#### 3. PaymentService - Preferences Separadas

**Arquivo**: `src/payment/payment.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../order/order.schema';
import { Payment, PaymentDocument } from './payment.schema';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentHelpers } from './payment.helpers';
import { PAYMENT_CONFIG } from './payment.constants';
import { PaymentStatus } from './payment.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private mercadoPagoService: MercadoPagoService
  ) {}

  /**
   * Cria preference para pagamento com PIX (sem recargo)
   */
  async createPixPreference(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('items.productId');

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Pedido já foi pago ou cancelado');
    }

    // PIX = precio base sin recargo
    const finalAmount = order.total;
    const surchargeAmount = 0;

    const preferenceData = {
      items: [{
        id: order.orderNumber,
        title: `Pedido #${order.orderNumber}`,
        description: `${order.items.length} produto(s)`,
        quantity: 1,
        unit_price: finalAmount,
        currency_id: 'BRL'
      }],

      payer: {
        email: order.shippingAddress.email,
        name: order.shippingAddress.fullName,
        phone: {
          area_code: order.shippingAddress.phone?.substring(0, 2) || '',
          number: order.shippingAddress.phone?.substring(2) || ''
        }
      },

      // 🔒 SOLO PIX
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' }
        ]
      },

      back_urls: {
        success: process.env.MP_SUCCESS_URL,
        failure: process.env.MP_FAILURE_URL,
        pending: process.env.MP_PENDING_URL
      },

      auto_return: 'approved' as const,

      external_reference: order._id.toString(),

      notification_url: `${process.env.BACKEND_WEBHOOK_URL}/webhooks/mercadopago`,

      statement_descriptor: 'SUA_LOJA',

      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),

      metadata: {
        order_id: order._id.toString(),
        order_number: order.orderNumber,
        payment_type: 'pix',
        base_amount: order.total,
        surcharge_amount: surchargeAmount,
        final_amount: finalAmount
      }
    };

    const { preferenceId, initPoint, sandboxInitPoint } =
      await this.mercadoPagoService.createPreference(preferenceData);

    // Guardar Payment record
    const payment = new this.paymentModel({
      preferenceId,
      order: order._id,
      amount: finalAmount,
      paymentMethod: 'pix',
      status: PaymentStatus.PENDING,
      metadata: {
        baseAmount: order.total,
        surchargeAmount,
        surchargePercentage: 0
      }
    });

    await payment.save();

    return {
      preferenceId,
      initPoint: process.env.NODE_ENV === 'production' ? initPoint : sandboxInitPoint,
      paymentInfo: {
        baseAmount: order.total,
        surchargeAmount,
        finalAmount,
        paymentMethod: 'pix'
      }
    };
  }

  /**
   * Cria preference para pagamento com Tarjetas (con recargo 5%)
   */
  async createCardPreference(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('items.productId');

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Pedido já foi pago ou cancelado');
    }

    // Tarjetas = precio base + 5% recargo
    const finalAmount = PaymentHelpers.calculateFinalPrice(order.total, 'card');
    const surchargeAmount = PaymentHelpers.calculateSurchargeAmount(order.total, 'card');

    const preferenceData = {
      items: [{
        id: order.orderNumber,
        title: `Pedido #${order.orderNumber}`,
        description: `${order.items.length} produto(s)`,
        quantity: 1,
        unit_price: finalAmount,
        currency_id: 'BRL'
      }],

      payer: {
        email: order.shippingAddress.email,
        name: order.shippingAddress.fullName,
        phone: {
          area_code: order.shippingAddress.phone?.substring(0, 2) || '',
          number: order.shippingAddress.phone?.substring(2) || ''
        }
      },

      // 🔒 SOLO Tarjetas (crédito + débito)
      payment_methods: {
        excluded_payment_methods: [
          { id: 'pix' }
        ],
        excluded_payment_types: [
          { id: 'ticket' } // Excluir boleto
        ],
        installments: PAYMENT_CONFIG.MAX_INSTALLMENTS,
        default_installments: PAYMENT_CONFIG.DEFAULT_INSTALLMENTS
      },

      back_urls: {
        success: process.env.MP_SUCCESS_URL,
        failure: process.env.MP_FAILURE_URL,
        pending: process.env.MP_PENDING_URL
      },

      auto_return: 'approved' as const,

      external_reference: order._id.toString(),

      notification_url: `${process.env.BACKEND_WEBHOOK_URL}/webhooks/mercadopago`,

      statement_descriptor: 'SUA_LOJA',

      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),

      metadata: {
        order_id: order._id.toString(),
        order_number: order.orderNumber,
        payment_type: 'card',
        base_amount: order.total,
        surcharge_amount: surchargeAmount,
        final_amount: finalAmount
      }
    };

    const { preferenceId, initPoint, sandboxInitPoint } =
      await this.mercadoPagoService.createPreference(preferenceData);

    // Guardar Payment record
    const payment = new this.paymentModel({
      preferenceId,
      order: order._id,
      amount: finalAmount,
      paymentMethod: 'card',
      status: PaymentStatus.PENDING,
      metadata: {
        baseAmount: order.total,
        surchargeAmount,
        surchargePercentage: PAYMENT_CONFIG.SURCHARGES.CARD
      }
    });

    await payment.save();

    return {
      preferenceId,
      initPoint: process.env.NODE_ENV === 'production' ? initPoint : sandboxInitPoint,
      paymentInfo: {
        baseAmount: order.total,
        surchargeAmount,
        finalAmount,
        paymentMethod: 'card',
        maxInstallments: PAYMENT_CONFIG.MAX_INSTALLMENTS
      }
    };
  }

  /**
   * Obtém informações de preço para todos os métodos de pagamento
   * (usado no frontend para exibir opções)
   */
  async getPaymentOptions(orderId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const pixAmount = order.total;
    const cardAmount = PaymentHelpers.calculateFinalPrice(order.total, 'card');

    return {
      baseAmount: order.total,
      options: [
        {
          method: 'pix',
          finalAmount: pixAmount,
          surchargeAmount: 0,
          surchargePercentage: 0,
          formattedPrice: PaymentHelpers.formatPrice(pixAmount),
          discount: true // Badge visual
        },
        {
          method: 'card',
          finalAmount: cardAmount,
          surchargeAmount: cardAmount - order.total,
          surchargePercentage: PAYMENT_CONFIG.SURCHARGES.CARD * 100, // 5%
          formattedPrice: PaymentHelpers.formatPrice(cardAmount),
          maxInstallments: PAYMENT_CONFIG.MAX_INSTALLMENTS
        }
      ]
    };
  }
}
```

---

#### 4. PaymentController

**Arquivo**: `src/payment/payment.controller.ts`

```typescript
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  /**
   * Obtém opções de pagamento com preços calculados
   */
  @Get('options/:orderId')
  async getPaymentOptions(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentOptions(orderId);
  }

  /**
   * Cria preference para PIX
   */
  @Post('create-preference/pix')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createPixPreference(@Body() body: { orderId: string }) {
    return this.paymentService.createPixPreference(body.orderId);
  }

  /**
   * Cria preference para Tarjetas
   */
  @Post('create-preference/card')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createCardPreference(@Body() body: { orderId: string }) {
    return this.paymentService.createCardPreference(body.orderId);
  }
}
```

---

### Implementação Frontend (Angular)

#### 1. PaymentService

**Arquivo**: `src/app/core/services/payment.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentOption {
  method: 'pix' | 'card';
  finalAmount: number;
  surchargeAmount: number;
  surchargePercentage: number;
  formattedPrice: string;
  discount?: boolean;
  maxInstallments?: number;
}

export interface PaymentOptionsResponse {
  baseAmount: number;
  options: PaymentOption[];
}

export interface PreferenceResponse {
  preferenceId: string;
  initPoint: string;
  paymentInfo: {
    baseAmount: number;
    surchargeAmount: number;
    finalAmount: number;
    paymentMethod: string;
    maxInstallments?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Obtém opções de pagamento com preços
   */
  getPaymentOptions(orderId: string): Observable<PaymentOptionsResponse> {
    return this.http.get<PaymentOptionsResponse>(`${this.apiUrl}/options/${orderId}`);
  }

  /**
   * Cria preference para PIX
   */
  createPixPreference(orderId: string): Observable<PreferenceResponse> {
    return this.http.post<PreferenceResponse>(
      `${this.apiUrl}/create-preference/pix`,
      { orderId }
    );
  }

  /**
   * Cria preference para Tarjetas
   */
  createCardPreference(orderId: string): Observable<PreferenceResponse> {
    return this.http.post<PreferenceResponse>(
      `${this.apiUrl}/create-preference/card`,
      { orderId }
    );
  }
}
```

---

#### 2. CheckoutComponent

**Arquivo**: `src/app/features/checkout/checkout.component.ts`

```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { PaymentService, PaymentOption, PaymentOptionsResponse } from '../../core/services/payment.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  orderId = signal<string>(''); // Obtenido de la ruta o contexto
  paymentOptions = signal<PaymentOptionsResponse | null>(null);
  loadingOptions = signal(true);
  loadingPayment = signal(false);

  ngOnInit() {
    this.loadPaymentOptions();
  }

  private loadPaymentOptions() {
    const orderId = this.orderId();

    if (!orderId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Pedido não encontrado',
        life: 5000
      });
      this.router.navigate(['/cart']);
      return;
    }

    this.paymentService.getPaymentOptions(orderId).subscribe({
      next: (options) => {
        this.paymentOptions.set(options);
        this.loadingOptions.set(false);
      },
      error: (err) => {
        this.loadingOptions.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao carregar opções de pagamento',
          life: 5000
        });
      }
    });
  }

  async payWithPix() {
    this.loadingPayment.set(true);

    try {
      this.messageService.add({
        severity: 'info',
        summary: 'Redirecionando',
        detail: 'Você será levado ao pagamento PIX do Mercado Pago...',
        life: 3000
      });

      const response = await this.paymentService
        .createPixPreference(this.orderId())
        .toPromise();

      if (response) {
        // Redirecionar a Mercado Pago (SOLO mostrará PIX)
        window.location.href = response.initPoint;
      }

    } catch (error: any) {
      this.loadingPayment.set(false);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro no Pagamento',
        detail: error.error?.message || 'Falha ao processar pagamento PIX',
        life: 5000
      });
    }
  }

  async payWithCard() {
    this.loadingPayment.set(true);

    try {
      this.messageService.add({
        severity: 'info',
        summary: 'Redirecionando',
        detail: 'Você será levado ao pagamento com cartão...',
        life: 3000
      });

      const response = await this.paymentService
        .createCardPreference(this.orderId())
        .toPromise();

      if (response) {
        // Redirecionar a Mercado Pago (SOLO mostrará tarjetas)
        window.location.href = response.initPoint;
      }

    } catch (error: any) {
      this.loadingPayment.set(false);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro no Pagamento',
        detail: error.error?.message || 'Falha ao processar pagamento com cartão',
        life: 5000
      });
    }
  }

  getPixOption(): PaymentOption | undefined {
    return this.paymentOptions()?.options.find(opt => opt.method === 'pix');
  }

  getCardOption(): PaymentOption | undefined {
    return this.paymentOptions()?.options.find(opt => opt.method === 'card');
  }
}
```

---

#### 3. Template HTML

**Arquivo**: `src/app/features/checkout/checkout.component.html`

```html
<div class="checkout-container" *ngIf="!loadingOptions(); else loadingTemplate">
  <div class="payment-section">
    <h2 class="section-title">Escolha a forma de pagamento</h2>

    <div class="payment-options">
      <!-- Opción PIX (precio base) -->
      <div
        class="payment-card pix-card"
        [class.disabled]="loadingPayment()"
        (click)="!loadingPayment() && payWithPix()"
      >
        <div class="card-header">
          <div class="icon-wrapper pix-icon">
            <i class="pi pi-bolt"></i>
          </div>
          <div class="badge-wrapper">
            <span class="badge badge-success">Melhor Preço</span>
          </div>
        </div>

        <div class="card-body">
          <h3 class="payment-method">PIX</h3>

          <div class="price-display">
            <span class="price-amount">{{ getPixOption()?.formattedPrice || 'R$ 0,00' }}</span>
          </div>

          <ul class="benefits-list">
            <li>
              <i class="pi pi-check-circle"></i>
              <span>Aprovação instantânea</span>
            </li>
            <li>
              <i class="pi pi-check-circle"></i>
              <span>Pagamento seguro</span>
            </li>
            <li>
              <i class="pi pi-check-circle"></i>
              <span>Sem taxas adicionais</span>
            </li>
          </ul>
        </div>

        <div class="card-footer">
          <p-button
            label="Pagar com PIX"
            icon="pi pi-arrow-right"
            iconPos="right"
            [loading]="loadingPayment()"
            styleClass="w-full"
          />
        </div>
      </div>

      <!-- Opción Tarjeta (con recargo) -->
      <div
        class="payment-card card-card"
        [class.disabled]="loadingPayment()"
        (click)="!loadingPayment() && payWithCard()"
      >
        <div class="card-header">
          <div class="icon-wrapper card-icon">
            <i class="pi pi-credit-card"></i>
          </div>
        </div>

        <div class="card-body">
          <h3 class="payment-method">Cartão de Crédito ou Débito</h3>

          <div class="price-display">
            <span class="price-amount">{{ getCardOption()?.formattedPrice || 'R$ 0,00' }}</span>
            <span class="price-detail" *ngIf="getCardOption()?.surchargePercentage">
              (+ {{ getCardOption()?.surchargePercentage }}%)
            </span>
          </div>

          <ul class="benefits-list">
            <li>
              <i class="pi pi-check-circle"></i>
              <span>Crédito ou Débito</span>
            </li>
            <li>
              <i class="pi pi-check-circle"></i>
              <span>Até {{ getCardOption()?.maxInstallments }}x sem juros</span>
            </li>
            <li>
              <i class="pi pi-check-circle"></i>
              <span>Todas as bandeiras</span>
            </li>
          </ul>
        </div>

        <div class="card-footer">
          <p-button
            label="Pagar com Cartão"
            icon="pi pi-arrow-right"
            iconPos="right"
            [loading]="loadingPayment()"
            styleClass="w-full"
            severity="secondary"
          />
        </div>
      </div>
    </div>

    <!-- Informação adicional -->
    <div class="info-box">
      <i class="pi pi-info-circle"></i>
      <p>
        Você será redirecionado para o ambiente seguro do Mercado Pago para concluir o pagamento.
      </p>
    </div>
  </div>
</div>

<!-- Loading State -->
<ng-template #loadingTemplate>
  <div class="loading-container">
    <p-progressSpinner />
    <p>Carregando opções de pagamento...</p>
  </div>
</ng-template>

<!-- Overlay durante redirect -->
<div class="payment-overlay" *ngIf="loadingPayment()">
  <div class="overlay-content">
    <p-progressSpinner />
    <h3>Redirecionando para pagamento seguro</h3>
    <p>Aguarde um momento...</p>
  </div>
</div>
```

---

#### 4. Estilos CSS

**Arquivo**: `src/app/features/checkout/checkout.component.css`

```css
.checkout-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.payment-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
  text-align: center;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.payment-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-card:hover:not(.disabled) {
  border-color: #3b82f6;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
  transform: translateY(-4px);
}

.payment-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* PIX Card - Destacado */
.pix-card {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  position: relative;
}

.pix-card:hover:not(.disabled) {
  border-color: #10b981;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.pix-icon {
  background: #d1fae5;
  color: #10b981;
}

.card-icon {
  background: #dbeafe;
  color: #3b82f6;
}

.badge-wrapper {
  margin-top: 0.25rem;
}

.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success {
  background: #10b981;
  color: white;
}

.card-body {
  flex: 1;
}

.payment-method {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.price-display {
  margin-bottom: 1.5rem;
}

.price-amount {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  display: block;
  line-height: 1.2;
}

.price-detail {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
  display: block;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.benefits-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.benefits-list li i {
  color: #10b981;
  font-size: 1rem;
}

.card-footer {
  margin-top: auto;
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  align-items: flex-start;
}

.info-box i {
  color: #3b82f6;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.info-box p {
  margin: 0;
  font-size: 0.875rem;
  color: #1e40af;
  line-height: 1.5;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.payment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.overlay-content {
  text-align: center;
  color: white;
}

.overlay-content h3 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1.5rem;
}

.overlay-content p {
  margin: 0;
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 768px) {
  .payment-options {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .price-amount {
    font-size: 1.75rem;
  }
}
```

---

### Ejemplo de Cómo se Ve para el Cliente

**En tu checkout**:

```
┌─────────────────────────────────────────┐
│  💚 PIX - Melhor Preço                  │
│  R$ 100,00                              │
│  ✓ Aprovação instantânea                │
│  ✓ Sem taxas adicionais                 │
│  [Pagar com PIX →]                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  💳 Cartão de Crédito ou Débito         │
│  R$ 105,00 (+5%)                        │
│  ✓ Até 6x sem juros                     │
│  ✓ Todas as bandeiras                   │
│  [Pagar com Cartão →]                   │
└─────────────────────────────────────────┘
```

**Cuando hace clic en PIX** → Va a MP y SOLO ve opción PIX (paga R$ 100)
**Cuando hace clic en Tarjeta** → Va a MP y SOLO ve tarjetas (paga R$ 105, puede parcelar)

---

### Resumen de Precios

| Escenario | Producto Base | Cliente Paga | Fee MP | Recibes |
|-----------|---------------|--------------|--------|---------|
| **PIX** | R$ 100 | R$ 100 | -R$ 1,99 | R$ 98,01 |
| **Tarjeta** | R$ 100 | R$ 105 (+5%) | -R$ 4,19 | R$ 100,81 |

**Ganancia extra con tarjeta**: R$ 2,80 más que PIX (compensa riesgo de cuotas)

---

## 🐛 Troubleshooting

### Webhook não chegando

**Sintomas**: Pagamento aprovado no MP mas order não atualiza

**Checklist**:
1. ✅ URL do webhook está correta e acessível publicamente?
2. ✅ Backend retorna 200/201 dentro de 22 segundos?
3. ✅ HTTPS configurado corretamente em produção?
4. ✅ Firewall/security group permite requisições do MP?
5. ✅ Validação de assinatura não está rejeitando?

**Solução**: Implementar verificação manual quando usuário retorna (GET /payments/:orderId/status)

### Pagamento aprovado mas webhook falhou

**Sintomas**: Cliente vê página de sucesso mas order fica "pending"

**Causa**: Webhook falhou ou atrasou

**Solução**:
- MP reintenta webhooks a cada 15 minutos (até 24h)
- Implementar verificação manual na OrderSuccessComponent
- Logar todos os webhooks recebidos para auditar falhas

### Signature validation falhando

**Sintomas**: Webhook chega mas é rejeitado (400 Bad Request)

**Checklist**:
1. ✅ `MP_WEBHOOK_SECRET` correto no .env?
2. ✅ Código de validação corresponde à documentação MP?
3. ✅ Headers `x-signature` e `x-request-id` sendo lidos?

**Debug**: Logar manifest e hash gerado vs hash recebido

### Preference creation falhando

**Sintomas**: Erro ao criar preference (400/401)

**Checklist**:
1. ✅ `MP_ACCESS_TOKEN` correto?
2. ✅ Estrutura do body corresponde ao esperado?
3. ✅ Items têm `unit_price` como número (não string)?
4. ✅ Email do payer é válido?
5. ✅ URLs de retorno são válidas?

### Timeout na API do MP

**Sintomas**: Erro 504 ou timeout exception

**Solução**:
- Aumentar timeout do HttpClient (padrão 5s → 10s)
- Implementar retry logic (máximo 3 tentativas)
- Mostrar mensagem ao usuário para tentar novamente

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Checkout Pro - Overview](https://www.mercadopago.com.br/developers/en/docs/checkout-pro/landing)
- [Webhooks - Notifications](https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks)
- [Test Accounts](https://www.mercadopago.com.br/developers/en/docs/your-integrations/test/accounts)
- [Test Cards](https://www.mercadopago.com.br/developers/en/docs/your-integrations/test/cards)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)

### Ferramentas Úteis

- [Painel de Desenvolvedores](https://www.mercadopago.com.br/developers/panel)
- [ngrok](https://ngrok.com/) - Expor localhost para testes de webhook
- [Postman Collection](https://github.com/mercadopago/checkout-payment-sample) - Exemplos de API

---

## 🎯 Próximos Passos

Após integração completa:

1. **Analytics**: Rastrear conversão de checkout → pagamento
2. **Checkout Transparente**: Migrar para experiência in-site (opcional)
3. **Parcelamento**: Configurar opções de parcelamento sem juros
4. **Assinaturas**: Implementar cobrança recorrente (se aplicável)
5. **Split de Pagamento**: Dividir receita com vendedores (marketplace)

---

**Última atualização**: 2025-11-23
**Versão do SDK**: mercadopago@2.0.x
**Compatibilidade**: NestJS 10+, Angular 20+
