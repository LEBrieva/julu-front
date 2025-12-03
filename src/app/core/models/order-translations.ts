import { OrderStatus, PaymentStatus } from './order.model';

/**
 * Traduções de enums de pedidos para Português (pt-BR)
 */

// Status do Pedido
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

// Status do Pagamento
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  completed: 'Pago',
  failed: 'Falhou',
  refunded: 'Reembolsado',
  // Estados adicionales de Mercado Pago
  approved: 'Aprovado',
  authorized: 'Autorizado',
  in_process: 'Em Processamento',
  in_mediation: 'Em Mediação',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  charged_back: 'Estornado'
};

/**
 * Helpers para obter labels traduzidos
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] || status;
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status] || status;
}

/**
 * Arrays para dropdowns
 */
export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as OrderStatus, label })
);

export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as PaymentStatus, label })
);

/**
 * Classes CSS para badges de status (cores semânticas)
 */
export const ORDER_STATUS_SEVERITY: Record<OrderStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  pending: 'warning',
  paid: 'success',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger'
};

export const PAYMENT_STATUS_SEVERITY: Record<PaymentStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  pending: 'warning',
  completed: 'success',
  failed: 'danger',
  refunded: 'info',
  // Estados adicionales de Mercado Pago
  approved: 'success',
  authorized: 'info',
  in_process: 'info',
  in_mediation: 'warning',
  rejected: 'danger',
  cancelled: 'info',
  charged_back: 'danger'
};
