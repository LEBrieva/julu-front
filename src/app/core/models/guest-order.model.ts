/**
 * Guest Order Models
 *
 * Define las estructuras de datos para órdenes de invitados (guest checkout).
 * Estos DTOs se usan para crear órdenes sin autenticación.
 */

import { ShippingAddress } from './order.model';

/**
 * Item de carrito para orden guest
 * Versión simplificada que solo incluye lo necesario para crear la orden
 */
export interface GuestCartItem {
  productId: string;
  variantSKU: string;
  quantity: number;
}

/**
 * DTO para crear una orden como invitado
 * Se envía al endpoint POST /order/guest
 */
export interface CreateGuestOrderDto {
  email: string;                    // Email del cliente (requerido)
  cart: GuestCartItem[];            // Items del carrito desde localStorage
  shippingAddress: ShippingAddress; // Dirección completa inline
  paymentMethod: string;            // Método de pago (ej: 'cash')
  shippingCost?: number;            // Costo de envío (opcional)
  notes?: string;                   // Notas adicionales (opcional)
}

