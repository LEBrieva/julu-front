import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AddressService } from '../../core/services/address.service';
import { OrderService, CreateOrderDto } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { Address } from '../../core/models/address.model';
import { formatColor, formatSize } from '../../core/models/product.model';
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
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StepsModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    CardModule,
    DividerModule,
    InputMaskModule,
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private addressService = inject(AddressService);
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
  addresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  creatingNewAddress = signal(false);

  formatColor = formatColor;
  formatSize = formatSize;

  steps: MenuItem[] = [
    { label: 'Revisão' },
    { label: 'Endereço' },
    { label: 'Pagamento' },
    { label: 'Confirmação' },
  ];

  addressForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    street: ['', [Validators.required, Validators.minLength(5)]],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    country: ['Argentina', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    isDefault: [false],
  });

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        const defaultAddress = addresses.find((a) => a.isDefault);
        if (defaultAddress) {
          this.selectedAddressId.set(defaultAddress.id);
        } else if (addresses.length > 0) {
          this.selectedAddressId.set(addresses[0].id);
        }
      },
      error: (error) => {
        console.error('Error loading addresses:', error);
      },
    });
  }

  nextStep() {
    const step = this.currentStep();

    // Validar step 1 (dirección)
    if (step === 1) {
      if (this.creatingNewAddress()) {
        if (this.addressForm.invalid) {
          this.addressForm.markAllAsTouched();
          this.messageService.add({
            severity: 'warn',
            summary: 'Formulario Inválido',
            detail: 'Completa todos los campos requeridos',
          });
          return;
        }
      } else if (!this.selectedAddressId()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Dirección Requerida',
          detail: 'Selecciona o crea una dirección de envío',
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

  toggleNewAddress() {
    this.creatingNewAddress.update((v) => !v);
    if (!this.creatingNewAddress()) {
      this.addressForm.reset({ country: 'Argentina' });
    }
  }

  selectAddress(addressId: string) {
    this.selectedAddressId.set(addressId);
    this.creatingNewAddress.set(false);
  }

  completeOrder() {
    // Detectar si es Mercado Pago (todos los métodos excepto cash que ya no existe)
    // Todos los métodos ahora son MP: PIX, CREDIT_CARD, DEBIT_CARD
    this.redirectToMercadoPago();
  }

  private redirectToMercadoPago() {
    this.creatingPreference.set(true);

    // Primero crear dirección si es nueva
    if (this.creatingNewAddress()) {
      if (this.addressForm.invalid) {
        this.addressForm.markAllAsTouched();
        this.creatingPreference.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Formulário Inválido',
          detail: 'Complete todos os campos',
        });
        return;
      }

      this.addressService
        .createAddress(this.addressForm.value as any)
        .subscribe({
          next: (address) => {
            this.createOrderAndRedirectToMP(address.id);
          },
          error: () => {
            this.creatingPreference.set(false);
          },
        });
    } else {
      const addressId = this.selectedAddressId();
      if (!addressId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Erro',
          detail: 'Selecione um endereço',
        });
        this.creatingPreference.set(false);
        return;
      }
      this.createOrderAndRedirectToMP(addressId);
    }
  }

  private createOrderAndRedirectToMP(addressId: string) {
    const selectedMethod = this.selectedPaymentMethod();

    const orderData: CreateOrderDto = {
      addressId,
      shippingCost: this.SHIPPING_COST,
      paymentMethod: selectedMethod.value as any,
      notes: '',
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        // Orden creada, ahora crear preference en MP
        this.paymentService.createPreference({
          orderId: order.id,
          paymentMethod: selectedMethod.value as PaymentMethodType
        }).subscribe({
          next: (response) => {
            this.creatingPreference.set(false);

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

  getFieldError(fieldName: string): string | null {
    const field = this.addressForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return 'Este campo es requerido';
      if (field.errors?.['minlength'])
        return `Mínimo ${field.errors?.['minlength'].requiredLength} caracteres`;
      if (field.errors?.['pattern']) return 'Formato inválido';
    }
    return null;
  }
}
