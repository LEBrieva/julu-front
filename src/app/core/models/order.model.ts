/**
 * Order Models & Enums
 *
 * Define las estructuras de datos para el módulo de órdenes.
 * Estos tipos deben coincidir con los DTOs del backend (order.response.ts).
 */

// ============================================================================
// ENUMS (deben coincidir con backend: order.enum.ts)
// ============================================================================

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  MERCADO_PAGO = 'mercado_pago',
  PIX = 'pix'  // ✅ Agregado por el usuario
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Item de orden (snapshot de producto al momento de compra)
 */
export interface OrderItem {
  productId: string;
  variantSKU: string;
  productName: string;
  productImage?: string;
  variantSize: string;
  variantColor: string;
  quantity: number;
  price: number;
  subtotal: number;
}

/**
 * Dirección de envío (snapshot al momento de compra)
 * Incluye email del cliente para tener todos los datos de contacto
 */
export interface ShippingAddress {
  fullName: string;
  email: string;        // ✅ Agregado por el usuario
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

/**
 * Orden completa (vista detalle)
 */
export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  isGuest: boolean;  // true = orden de invitado, false = usuario registrado
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Item de lista de órdenes (tabla admin - menos datos)
 */
export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;    // shippingAddress.fullName
  customerEmail: string;   // shippingAddress.email
  itemsCount: number;      // items.length
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  isGuest: boolean;        // true = orden de invitado, false = usuario registrado
  createdAt: Date;
}

// ============================================================================
// DTOs (para requests al backend)
// ============================================================================

/**
 * Filtros para listado de órdenes
 */
export interface FilterOrderDto {
  page?: number;
  limit?: number;
  search?: string;           // Búsqueda por orderNumber
  status?: OrderStatus;      // Filtro por estado de orden
  paymentStatus?: PaymentStatus; // Filtro por estado de pago
  dateFrom?: string;         // Fecha desde (ISO string: YYYY-MM-DD)
  dateTo?: string;           // Fecha hasta (ISO string: YYYY-MM-DD)
  isGuest?: boolean;         // Filtro por tipo: true = solo invitados, false = solo registrados, undefined = todas
}

/**
 * DTO para actualizar estado de orden
 */
export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formatea el enum de OrderStatus a texto legible
 */
export function formatOrderStatus(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Pendiente',
    [OrderStatus.PAID]: 'Pagada',
    [OrderStatus.PROCESSING]: 'En Proceso',
    [OrderStatus.SHIPPED]: 'Enviada',
    [OrderStatus.DELIVERED]: 'Entregada',
    [OrderStatus.CANCELLED]: 'Cancelada'
  };
  return statusMap[status] || status;
}

/**
 * Devuelve la severidad de PrimeNG para badges de OrderStatus
 */
export function getOrderStatusSeverity(
  status: OrderStatus
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  const severityMap: Record<OrderStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    [OrderStatus.PENDING]: 'warn',
    [OrderStatus.PAID]: 'info',
    [OrderStatus.PROCESSING]: 'info',
    [OrderStatus.SHIPPED]: 'secondary',
    [OrderStatus.DELIVERED]: 'success',
    [OrderStatus.CANCELLED]: 'danger'
  };
  return severityMap[status] || 'secondary';
}

/**
 * Formatea el enum de PaymentStatus a texto legible
 */
export function formatPaymentStatus(status: PaymentStatus): string {
  const statusMap: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pendiente',
    [PaymentStatus.COMPLETED]: 'Completado',
    [PaymentStatus.FAILED]: 'Fallido',
    [PaymentStatus.REFUNDED]: 'Reembolsado'
  };
  return statusMap[status] || status;
}

/**
 * Devuelve la severidad de PrimeNG para badges de PaymentStatus
 */
export function getPaymentStatusSeverity(
  status: PaymentStatus
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  const severityMap: Record<PaymentStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    [PaymentStatus.PENDING]: 'warn',
    [PaymentStatus.COMPLETED]: 'success',
    [PaymentStatus.FAILED]: 'danger',
    [PaymentStatus.REFUNDED]: 'secondary'
  };
  return severityMap[status] || 'secondary';
}

/**
 * Formatea el enum de PaymentMethod a texto legible
 */
export function formatPaymentMethod(method: PaymentMethod): string {
  const methodMap: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Efectivo al recibir',
    [PaymentMethod.CREDIT_CARD]: 'Tarjeta de Crédito',
    [PaymentMethod.DEBIT_CARD]: 'Tarjeta de Débito',
    [PaymentMethod.MERCADO_PAGO]: 'Mercado Pago',
    [PaymentMethod.PIX]: 'PIX'  // ✅ Agregado
  };
  return methodMap[method] || method;
}

/**
 * Devuelve el icono de PrimeIcons para el método de pago
 */
export function getPaymentMethodIcon(method: PaymentMethod): string {
  const iconMap: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'pi-money-bill',
    [PaymentMethod.CREDIT_CARD]: 'pi-credit-card',
    [PaymentMethod.DEBIT_CARD]: 'pi-credit-card',
    [PaymentMethod.MERCADO_PAGO]: 'pi-wallet',
    [PaymentMethod.PIX]: 'pi-qrcode'  // ✅ Agregado (PIX usa QR)
  };
  return iconMap[method] || 'pi-money-bill';
}

/**
 * Opciones de OrderStatus para dropdowns (todos los estados)
 */
export const ORDER_STATUS_OPTIONS = [
  { label: 'Todos', value: null },
  { label: formatOrderStatus(OrderStatus.PENDING), value: OrderStatus.PENDING },
  { label: formatOrderStatus(OrderStatus.PAID), value: OrderStatus.PAID },
  { label: formatOrderStatus(OrderStatus.PROCESSING), value: OrderStatus.PROCESSING },
  { label: formatOrderStatus(OrderStatus.SHIPPED), value: OrderStatus.SHIPPED },
  { label: formatOrderStatus(OrderStatus.DELIVERED), value: OrderStatus.DELIVERED },
  { label: formatOrderStatus(OrderStatus.CANCELLED), value: OrderStatus.CANCELLED }
];

/**
 * Opciones de PaymentStatus para dropdowns
 */
export const PAYMENT_STATUS_OPTIONS = [
  { label: 'Todos', value: null },
  { label: formatPaymentStatus(PaymentStatus.PENDING), value: PaymentStatus.PENDING },
  { label: formatPaymentStatus(PaymentStatus.COMPLETED), value: PaymentStatus.COMPLETED },
  { label: formatPaymentStatus(PaymentStatus.FAILED), value: PaymentStatus.FAILED },
  { label: formatPaymentStatus(PaymentStatus.REFUNDED), value: PaymentStatus.REFUNDED }
];

/**
 * Opciones de OrderStatus para cambiar estado (admin)
 * Incluye todos los estados posibles
 */
export const CHANGE_STATUS_OPTIONS = [
  { label: formatOrderStatus(OrderStatus.PENDING), value: OrderStatus.PENDING },
  { label: formatOrderStatus(OrderStatus.PAID), value: OrderStatus.PAID },
  { label: formatOrderStatus(OrderStatus.PROCESSING), value: OrderStatus.PROCESSING },
  { label: formatOrderStatus(OrderStatus.SHIPPED), value: OrderStatus.SHIPPED },
  { label: formatOrderStatus(OrderStatus.DELIVERED), value: OrderStatus.DELIVERED },
  { label: formatOrderStatus(OrderStatus.CANCELLED), value: OrderStatus.CANCELLED }
];

/**
 * Formatea el tipo de orden (guest vs registered)
 */
export function formatOrderType(isGuest: boolean): string {
  return isGuest ? 'Invitado' : 'Registrado';
}

/**
 * Devuelve la severidad de PrimeNG para badges de tipo de orden
 */
export function getOrderTypeSeverity(isGuest: boolean): 'secondary' | 'info' {
  return isGuest ? 'secondary' : 'info';
}

/**
 * Opciones de tipo de orden para filtros
 */
export const ORDER_TYPE_OPTIONS = [
  { label: 'Todos', value: null },
  { label: 'Invitado', value: true },
  { label: 'Registrado', value: false }
];
