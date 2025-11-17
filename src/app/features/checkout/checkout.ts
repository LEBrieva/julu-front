import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AddressService } from '../../core/services/address.service';
import { OrderService, CreateOrderDto } from '../../core/services/order.service';
import { Address } from '../../core/models/address.model';
import { formatColor, formatSize } from '../../core/models/product.model';

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
  private router = inject(Router);
  private messageService = inject(MessageService);

  cartItems = this.cartService.cartItems;
  subtotal = this.cartService.subtotal;

  readonly SHIPPING_COST = 1500;
  total = computed(() => this.subtotal() + this.SHIPPING_COST);

  currentStep = signal(0);
  loading = signal(false);
  addresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  creatingNewAddress = signal(false);

  formatColor = formatColor;
  formatSize = formatSize;

  steps: MenuItem[] = [
    { label: 'Revisión' },
    { label: 'Dirección' },
    { label: 'Pago' },
    { label: 'Confirmación' },
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
    this.loading.set(true);

    // Si está creando nueva dirección, crearla primero
    if (this.creatingNewAddress()) {
      if (this.addressForm.invalid) {
        this.addressForm.markAllAsTouched();
        this.loading.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Formulario Inválido',
          detail: 'Completa todos los campos',
        });
        return;
      }

      this.addressService
        .createAddress(this.addressForm.value as any)
        .subscribe({
          next: (address) => {
            this.createOrder(address.id);
          },
          error: () => {
            this.loading.set(false);
          },
        });
    } else {
      const addressId = this.selectedAddressId();
      if (!addressId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Error',
          detail: 'Selecciona una dirección',
        });
        this.loading.set(false);
        return;
      }
      this.createOrder(addressId);
    }
  }

  private createOrder(addressId: string) {
    const orderData: CreateOrderDto = {
      addressId,
      shippingCost: this.SHIPPING_COST,
      paymentMethod: 'cash', // Por ahora solo efectivo
      notes: '',
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Orden Creada',
          detail: `Tu orden ${order.orderNumber} fue creada exitosamente`,
          life: 5000,
        });
        this.router.navigate(['/order-success', order.id]);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error creating order:', error);
      },
    });
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
