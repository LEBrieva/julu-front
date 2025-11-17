import { Injectable, computed, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { CartDrawerService } from './cart-drawer.service';
import {
  CartItem,
  GuestCartItem,
  AddToCartRequest,
  CartResponse,
} from '../models/cart.model';
import { Observable, tap, of, catchError } from 'rxjs';
import { MessageService } from 'primeng/api';

const GUEST_CART_KEY = 'guest_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private cartDrawerService = inject(CartDrawerService);

  private apiUrl = `${environment.apiUrl}/cart`;

  // Signals privados
  private guestCartSignal = signal<GuestCartItem[]>(this.loadGuestCart());
  private userCartSignal = signal<CartResponse | null>(null);

  // Signals públicos computados
  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly cartItems = computed(() => {
    if (this.isAuthenticated()) {
      return this.userCartSignal()?.items || [];
    }
    return this.guestCartSignal();
  });

  readonly totalItems = computed(() => {
    const items = this.cartItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  });

  readonly subtotal = computed(() => {
    const items = this.cartItems();
    return items.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );
  });

  private hasCheckedForMerge = false;

  constructor() {
    // Effect: Cargar carrito del servidor al autenticar y mergear si es necesario
    effect(() => {
      if (this.isAuthenticated()) {
        // Si hay items en el carrito guest y no hemos hecho merge aún
        const guestItems = this.guestCartSignal();
        if (guestItems.length > 0 && !this.hasCheckedForMerge) {
          this.hasCheckedForMerge = true;
          // Hacer merge primero
          this.mergeGuestCartOnLogin().subscribe({
            complete: () => {
              // Después de mergear, cargar el carrito actualizado
              this.loadUserCart().subscribe();
            }
          });
        } else {
          // Si no hay items guest, solo cargar el carrito del servidor
          this.loadUserCart().subscribe();
        }
      } else {
        this.userCartSignal.set(null);
        this.hasCheckedForMerge = false; // Reset para próximo login
      }
    });
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Abre el drawer solo si NO estamos en la página del carrito
   */
  private openDrawerIfNotInCartPage(): void {
    const currentUrl = this.router.url;
    // No abrir el drawer si estamos en /cart o /checkout
    if (!currentUrl.startsWith('/cart') && !currentUrl.startsWith('/checkout')) {
      this.cartDrawerService.open();
    }
  }

  private loadGuestCart(): GuestCartItem[] {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveGuestCart(items: GuestCartItem[]): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    this.guestCartSignal.set(items);
  }

  // ========== MÉTODOS PÚBLICOS ==========

  loadUserCart(): Observable<CartResponse> {
    return this.http
      .get<CartResponse>(this.apiUrl, { withCredentials: true })
      .pipe(
        tap((cart) => this.userCartSignal.set(cart)),
        catchError(() => {
          this.userCartSignal.set(null);
          return of({ items: [], subtotal: 0, itemCount: 0 });
        })
      );
  }

  addItem(
    request: AddToCartRequest,
    productSnapshot: {
      name: string;
      image?: string;
      size: string;
      color: string;
      price: number;
    }
  ): Observable<CartResponse | void> {
    if (this.isAuthenticated()) {
      return this.http
        .post<CartResponse>(`${this.apiUrl}/items`, request, {
          withCredentials: true,
        })
        .pipe(
          tap((cart) => {
            this.userCartSignal.set(cart);
            // Abrir el drawer automáticamente (solo si NO estamos en /cart)
            // El drawer ya indica visualmente que se agregó el producto, no necesitamos toast
            this.openDrawerIfNotInCartPage();
          }),
          catchError((error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'No se pudo agregar el producto',
            });
            throw error;
          })
        );
    } else {
      // Usuario anónimo: localStorage
      // ⚠️ IMPORTANTE: Crear una COPIA del array para que Angular detecte el cambio
      const items = [...this.guestCartSignal()];
      const existingIndex = items.findIndex(
        (i) =>
          i.productId === request.productId &&
          i.variantSKU === request.variantSKU
      );

      if (existingIndex >= 0) {
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: items[existingIndex].quantity + request.quantity
        };
      } else {
        items.push({
          productId: request.productId,
          variantSKU: request.variantSKU,
          quantity: request.quantity,
          productName: productSnapshot.name,
          productImage: productSnapshot.image,
          variantSize: productSnapshot.size,
          variantColor: productSnapshot.color,
          priceAtAdd: productSnapshot.price,
        });
      }

      this.saveGuestCart(items);
      // Abrir el drawer automáticamente (solo si NO estamos en /cart)
      // El drawer ya indica visualmente que se agregó el producto, no necesitamos toast
      this.openDrawerIfNotInCartPage();
      return of(void 0);
    }
  }

  updateQuantity(
    itemIndex: number,
    quantity: number
  ): Observable<CartResponse | void> {
    if (this.isAuthenticated()) {
      return this.http
        .patch<CartResponse>(
          `${this.apiUrl}/items/${itemIndex}`,
          { quantity },
          { withCredentials: true }
        )
        .pipe(
          tap((cart) => {
            this.userCartSignal.set(cart);
            this.messageService.add({
              severity: 'info',
              summary: 'Actualizado',
              detail: 'Cantidad actualizada',
              life: 2000,
            });
          }),
          catchError((error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'No se pudo actualizar',
            });
            throw error;
          })
        );
    } else {
      // ⚠️ IMPORTANTE: Crear una COPIA del array para que Angular detecte el cambio
      const items = [...this.guestCartSignal()];
      if (items[itemIndex]) {
        items[itemIndex] = { ...items[itemIndex], quantity };
        this.saveGuestCart(items);
        this.messageService.add({
          severity: 'info',
          summary: 'Actualizado',
          detail: 'Cantidad actualizada',
          life: 2000,
        });
      }
      return of(void 0);
    }
  }

  removeItem(itemIndex: number): Observable<CartResponse | void> {
    if (this.isAuthenticated()) {
      return this.http
        .delete<CartResponse>(`${this.apiUrl}/items/${itemIndex}`, {
          withCredentials: true,
        })
        .pipe(
          tap((cart) => {
            this.userCartSignal.set(cart);
            this.messageService.add({
              severity: 'warn',
              summary: 'Eliminado',
              detail: 'Producto eliminado del carrito',
              life: 3000,
            });
          })
        );
    } else {
      // ⚠️ IMPORTANTE: Crear una COPIA del array para que Angular detecte el cambio
      const items = [...this.guestCartSignal()];
      items.splice(itemIndex, 1);
      this.saveGuestCart(items);
      this.messageService.add({
        severity: 'warn',
        summary: 'Eliminado',
        detail: 'Producto eliminado del carrito',
        life: 3000,
      });
      return of(void 0);
    }
  }

  clearCart(): Observable<CartResponse | void> {
    if (this.isAuthenticated()) {
      return this.http
        .delete<CartResponse>(this.apiUrl, { withCredentials: true })
        .pipe(tap((cart) => this.userCartSignal.set(cart)));
    } else {
      this.saveGuestCart([]);
      return of(void 0);
    }
  }

  validateCart(): Observable<{ valid: boolean; errors: string[] }> {
    if (this.isAuthenticated()) {
      return this.http.get<{ valid: boolean; errors: string[] }>(
        `${this.apiUrl}/validate`,
        { withCredentials: true }
      );
    }
    // Para usuarios anónimos, no podemos validar stock sin llamar al backend
    return of({ valid: true, errors: [] });
  }

  // Merge al hacer login (llamado automáticamente por effect())
  private mergeGuestCartOnLogin(): Observable<void> {
    const guestItems = this.guestCartSignal();
    if (guestItems.length === 0) {
      return of(void 0);
    }

    // Agregar items uno por uno al carrito del servidor
    const requests = guestItems.map((item) =>
      this.http.post<CartResponse>(
        `${this.apiUrl}/items`,
        {
          productId: item.productId,
          variantSKU: item.variantSKU,
          quantity: item.quantity,
        },
        { withCredentials: true }
      )
    );

    // Ejecutar todas las requests
    return new Observable((observer) => {
      Promise.all(requests.map((req) => req.toPromise()))
        .then(() => {
          // Limpiar carrito guest
          localStorage.removeItem(GUEST_CART_KEY);
          this.guestCartSignal.set([]);
          // Cargar carrito actualizado
          this.loadUserCart().subscribe(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Carrito Sincronizado',
              detail: 'Tus productos fueron transferidos',
              life: 4000,
            });
            observer.next();
            observer.complete();
          });
        })
        .catch((error) => {
          console.error('Error mergeando carrito:', error);
          this.messageService.add({
            severity: 'warn',
            summary: 'Sincronización Parcial',
            detail: 'Algunos productos no pudieron transferirse',
            life: 4000,
          });
          observer.next();
          observer.complete();
        });
    });
  }
}

