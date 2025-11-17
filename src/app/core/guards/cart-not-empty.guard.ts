import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { CartService } from '../services/cart.service';
import { MessageService } from 'primeng/api';

/**
 * Guard para proteger la ruta de checkout
 * Solo permite acceso si el carrito tiene items
 */
export const cartNotEmptyGuard: CanActivateFn = () => {
  const cartService = inject(CartService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  const totalItems = cartService.totalItems();

  if (totalItems === 0) {
    messageService.add({
      severity: 'warn',
      summary: 'Carrito Vacío',
      detail: 'Agrega productos antes de proceder al checkout',
      life: 4000,
    });
    router.navigate(['/products']);
    return false;
  }

  return true;
};

