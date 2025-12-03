import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { formatColor, formatSize } from '../../core/models/product.model';
import { CreateGuestOrderDto } from '../../core/models/guest-order.model';
import {
  PaymentMethodOption,
  PAYMENT_METHOD_OPTIONS,
  calcularTotalConRecargo,
  calcularMontoRecargo,
  PaymentMethodType
} from '../../core/models/payment.model';

// PrimeNG imports
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService, MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputMaskModule } from 'primeng/inputmask';

@Component({
  selector: 'app-guest-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    StepsModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    CardModule,
    DividerModule,
    InputMaskModule,
  ],
  providers: [MessageService],
  templateUrl: './guest-checkout.html',
  styleUrls: ['./guest-checkout.css'],
})
export class GuestCheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  cartItems = this.cartService.cartItems;
  subtotal = this.cartService.subtotal;

  readonly SHIPPING_COST = 1500;

  // Signal para método de pago seleccionado (por defecto: PIX)
  selectedPaymentMethod = signal<PaymentMethodOption>(PAYMENT_METHOD_OPTIONS[0]);

  // Opciones de métodos de pago disponibles
  paymentMethods = PAYMENT_METHOD_OPTIONS;

  // Computed para recargo
  montoRecargo = computed(() =>
    calcularMontoRecargo(this.subtotal(), this.SHIPPING_COST, this.selectedPaymentMethod().surchargeRate)
  );

  // Computed para total con recargo
  total = computed(() =>
    calcularTotalConRecargo(this.subtotal(), this.SHIPPING_COST, this.selectedPaymentMethod().surchargeRate)
  );

  // Loading state para creación de preference de MP
  creatingPreference = signal(false);

  currentStep = signal(0);
  loading = signal(false);

  formatColor = formatColor;
  formatSize = formatSize;

  steps: MenuItem[] = [
    { label: 'Email' },
    { label: 'Endereço' },
    { label: 'Pagamento' },
    { label: 'Confirmação' },
  ];

  // Formulario de email
  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Formulario de dirección (igual que CheckoutComponent)
  addressForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    street: ['', [Validators.required, Validators.minLength(5)]],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    country: ['Argentina', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  ngOnInit() {
    // Verificar que haya items en el carrito
    if (this.cartItems().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Carrito Vacío',
        detail: 'No hay productos en tu carrito',
      });
      this.router.navigate(['/products']);
    }
  }

  nextStep() {
    const step = this.currentStep();

    // Validar step 0 (email)
    if (step === 0) {
      if (this.emailForm.invalid) {
        this.emailForm.markAllAsTouched();
        this.messageService.add({
          severity: 'warn',
          summary: 'Email Obrigatório',
          detail: 'Informe um email válido para continuar',
        });
        return;
      }
    }

    // Validar step 1 (dirección)
    if (step === 1) {
      if (this.addressForm.invalid) {
        this.addressForm.markAllAsTouched();
        this.messageService.add({
          severity: 'warn',
          summary: 'Formulário Inválido',
          detail: 'Complete todos os campos obrigatórios',
        });
        return;
      }
    }

    if (step < this.steps.length - 1) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
    }
  }

  completeOrder() {
    // Detectar si es Mercado Pago (todos los métodos excepto cash que ya no existe)
    // Todos los métodos ahora son MP: PIX, CREDIT_CARD, DEBIT_CARD
    this.redirectToMercadoPago();
  }

  private redirectToMercadoPago() {
    this.creatingPreference.set(true);

    // Validar formularios antes de continuar
    if (this.emailForm.invalid || this.addressForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.addressForm.markAllAsTouched();
      this.creatingPreference.set(false);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulário Inválido',
        detail: 'Complete todos os campos',
      });
      return;
    }

    this.createOrderAndRedirectToMP();
  }

  private createOrderAndRedirectToMP() {
    const selectedMethod = this.selectedPaymentMethod();

    // Construir DTO para orden guest
    const guestOrderDto: CreateGuestOrderDto = {
      email: this.emailForm.value.email!,
      cart: this.cartItems().map((item) => ({
        productId: item.productId,
        variantSKU: item.variantSKU,
        quantity: item.quantity,
      })),
      shippingAddress: {
        fullName: this.addressForm.value.fullName!,
        email: this.emailForm.value.email!,
        street: this.addressForm.value.street!,
        city: this.addressForm.value.city!,
        state: this.addressForm.value.state!,
        zipCode: this.addressForm.value.zipCode!,
        country: this.addressForm.value.country!,
        phone: this.addressForm.value.phone!,
      },
      paymentMethod: selectedMethod.value as any,
      shippingCost: this.SHIPPING_COST,
      notes: '',
    };

    this.orderService.createGuestOrder(guestOrderDto).subscribe({
      next: (order) => {
        // Orden creada, ahora crear preference en MP
        this.paymentService.createPreference({
          orderId: order.id,
          paymentMethod: selectedMethod.value as PaymentMethodType
        }).subscribe({
          next: (response) => {
            this.creatingPreference.set(false);

            // Limpiar carrito guest (localStorage)
            this.cartService.clearCart().subscribe();

            // Toast informativo
            this.messageService.add({
              severity: 'info',
              summary: 'Redirecionando',
              detail: 'Você será redirecionado para o Mercado Pago...',
              life: 3000
            });

            // Redirect a Mercado Pago (salida a dominio externo)
            setTimeout(() => {
              window.location.href = response.checkoutUrl;
            }, 1000);
          },
          error: () => {
            this.creatingPreference.set(false);
            // Error interceptor ya mostró toast
          }
        });
      },
      error: () => {
        this.creatingPreference.set(false);
        // Error interceptor ya mostró toast
      },
    });
  }

  selectPaymentMethod(method: PaymentMethodOption) {
    this.selectedPaymentMethod.set(method);
  }

  goBackToCart() {
    this.router.navigate(['/cart']);
  }

  getFieldError(fieldName: string, form: any = this.addressForm): string | null {
    const field = form.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return 'Este campo é obrigatório';
      if (field.errors?.['email']) return 'Email inválido';
      if (field.errors?.['minlength'])
        return `Mínimo ${field.errors?.['minlength'].requiredLength} caracteres`;
      if (field.errors?.['pattern']) return 'Formato inválido';
    }
    return null;
  }

  getEmailError(): string | null {
    return this.getFieldError('email', this.emailForm);
  }
}

