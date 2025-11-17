import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { formatColor, formatSize } from '../../core/models/product.model';
import { CreateGuestOrderDto } from '../../core/models/guest-order.model';

// PrimeNG imports
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputMaskModule } from 'primeng/inputmask';

@Component({
  selector: 'app-guest-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    StepsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    DividerModule,
    InputMaskModule,
  ],
  templateUrl: './guest-checkout.html',
  styleUrls: ['./guest-checkout.css'],
})
export class GuestCheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  cartItems = this.cartService.cartItems;
  subtotal = this.cartService.subtotal;

  readonly SHIPPING_COST = 1500;
  total = computed(() => this.subtotal() + this.SHIPPING_COST);

  currentStep = signal(0);
  loading = signal(false);

  formatColor = formatColor;
  formatSize = formatSize;

  steps: MenuItem[] = [
    { label: 'Email' },
    { label: 'Dirección' },
    { label: 'Confirmación' },
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
          summary: 'Email Requerido',
          detail: 'Ingresa un email válido para continuar',
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
          summary: 'Formulario Inválido',
          detail: 'Completa todos los campos requeridos',
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
    if (this.emailForm.invalid || this.addressForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Inválido',
        detail: 'Completa todos los campos requeridos',
      });
      return;
    }

    this.loading.set(true);

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
        email: this.emailForm.value.email!, // Incluir email en shipping address
        street: this.addressForm.value.street!,
        city: this.addressForm.value.city!,
        state: this.addressForm.value.state!,
        zipCode: this.addressForm.value.zipCode!,
        country: this.addressForm.value.country!,
        phone: this.addressForm.value.phone!,
      },
      paymentMethod: 'cash',
      shippingCost: this.SHIPPING_COST,
      notes: '',
    };

    this.orderService.createGuestOrder(guestOrderDto).subscribe({
      next: (order) => {
        this.loading.set(false);

        // Limpiar carrito guest (localStorage)
        this.cartService.clearCart().subscribe();

        this.messageService.add({
          severity: 'success',
          summary: 'Orden Creada',
          detail: `Tu orden ${order.orderNumber} fue creada exitosamente`,
          life: 5000,
        });

        // Navegar a order-success guest con la orden en el state
        this.router.navigate(['/order-success-guest', order.id], {
          state: { order },
        });
      },
      error: () => {
        this.loading.set(false);
        // El error.interceptor ya muestra el toast
      },
    });
  }

  goBackToCart() {
    this.router.navigate(['/cart']);
  }

  getFieldError(fieldName: string, form: any = this.addressForm): string | null {
    const field = form.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return 'Este campo es requerido';
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

