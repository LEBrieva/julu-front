import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ImageModule } from 'primeng/image';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { formatColor, formatSize } from '../../core/models/product.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    ImageModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class CartComponent {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);

  cartItems = this.cartService.cartItems;
  totalItems = this.cartService.totalItems;
  subtotal = this.cartService.subtotal;
  isAuthenticated = this.authService.isAuthenticated;

  readonly SHIPPING_COST = 1500;
  total = computed(() => this.subtotal() + this.SHIPPING_COST);

  loading = signal<{ [index: number]: boolean }>({});

  formatColor = formatColor;
  formatSize = formatSize;

  updateQuantity(itemIndex: number, newQuantity: number) {
    if (newQuantity < 1 || newQuantity > 99) return;

    this.loading.update((state) => ({ ...state, [itemIndex]: true }));

    this.cartService.updateQuantity(itemIndex, newQuantity).subscribe({
      next: () => {
        this.loading.update((state) => ({ ...state, [itemIndex]: false }));
      },
      error: () => {
        this.loading.update((state) => ({ ...state, [itemIndex]: false }));
      },
    });
  }

  removeItem(itemIndex: number, productName: string) {
    this.confirmationService.confirm({
      header: 'Eliminar Producto',
      message: `¿Estás seguro de eliminar "${productName}" del carrito?`,
      icon: 'pi pi-exclamation-circle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      defaultFocus: 'reject',
      accept: () => {
        this.loading.update((state) => ({ ...state, [itemIndex]: true }));
        this.cartService.removeItem(itemIndex).subscribe({
          next: () => {
            this.loading.update((state) => ({
              ...state,
              [itemIndex]: false,
            }));
          },
          error: () => {
            this.loading.update((state) => ({
              ...state,
              [itemIndex]: false,
            }));
          },
        });
      },
    });
  }

  goToCheckout() {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }
    this.router.navigate(['/checkout']);
  }

  goToGuestCheckout() {
    this.router.navigate(['/checkout/guest']);
  }

  continueShopping() {
    this.router.navigate(['/products']);
  }
}
