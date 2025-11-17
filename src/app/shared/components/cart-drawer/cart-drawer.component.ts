import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartDrawerService } from '../../../core/services/cart-drawer.service';
import { formatColor, formatSize } from '../../../core/models/product.model';

// PrimeNG imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ImageModule } from 'primeng/image';

/**
 * CartDrawerComponent
 *
 * Drawer lateral que muestra un resumen del carrito.
 * Se abre automáticamente al agregar productos.
 *
 * FUNCIONALIDADES:
 * - Muestra los productos en el carrito
 * - Muestra subtotal, envío y total
 * - Botón para ir al carrito completo
 * - Se puede abrir/cerrar desde otros componentes mediante CartDrawerService
 */
@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    DividerModule,
    ImageModule
  ],
  templateUrl: './cart-drawer.component.html',
  styleUrls: ['./cart-drawer.component.css']
})
export class CartDrawerComponent {
  private cartService = inject(CartService);
  private cartDrawerService = inject(CartDrawerService);
  private router = inject(Router);

  // Signal local writable para el binding two-way de p-sidebar
  visible = signal(false);

  constructor() {
    // Sincronizar con el servicio: cuando el servicio cambia, actualizar local
    effect(() => {
      const isOpen = this.cartDrawerService.isOpen();
      this.visible.set(isOpen);
    });

    // Sincronizar inverso: cuando el usuario cierra el drawer (click overlay), notificar al servicio
    effect(() => {
      const currentVisible = this.visible();
      const serviceIsOpen = this.cartDrawerService.isOpen();
      
      // Si el drawer se cerró localmente pero el servicio aún dice que está abierto
      if (!currentVisible && serviceIsOpen) {
        this.cartDrawerService.close();
      }
    });
  }

  // Datos del carrito
  cartItems = this.cartService.cartItems;
  totalItems = this.cartService.totalItems;
  subtotal = this.cartService.subtotal;

  readonly SHIPPING_COST = 1500;

  // Helpers para template
  formatColor = formatColor;
  formatSize = formatSize;

  /**
   * Calcula el total (subtotal + envío)
   */
  get total(): number {
    return this.subtotal() + this.SHIPPING_COST;
  }

  /**
   * Abre el drawer (delegado al servicio)
   */
  open(): void {
    this.cartDrawerService.open();
  }

  /**
   * Cierra el drawer (delegado al servicio)
   */
  close(): void {
    this.cartDrawerService.close();
  }

  /**
   * Navega al carrito completo y cierra el drawer
   */
  goToCart(): void {
    this.close();
    this.router.navigate(['/cart']);
  }

  /**
   * Continua comprando (cierra el drawer)
   */
  continueShopping(): void {
    this.close();
  }
}

