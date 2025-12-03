/**
 * Modelos y Enums de Pagos - Integración Mercado Pago
 *
 * Define las estructuras de datos para el módulo de pagos.
 * Incluye enums, interfaces, constantes y helpers para pagos con MP.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Estados de pago de Mercado Pago
 * Referencia: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments_id/get
 */
export enum MercadoPagoPaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back'
}

/**
 * Tipos de método de pago
 */
export enum PaymentMethodType {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card'
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Opción de método de pago para UI
 */
export interface PaymentMethodOption {
  value: PaymentMethodType;
  label: string;            // pt-BR: "PIX (Grátis)", "Cartão de Crédito (+5%)", etc.
  icon: string;            // PrimeIcons: "pi-qrcode", "pi-credit-card"
  surchargeRate: number;   // 0 para PIX, 0.05 para tarjetas
  description: string;     // pt-BR: "Aprovação instantânea", "Parcelamento disponível"
}

/**
 * Request para crear preferencia de pago
 */
export interface CreatePreferenceRequest {
  orderId: string;
  paymentMethod: PaymentMethodType;
}

/**
 * Response de creación de preferencia
 */
export interface CreatePreferenceResponse {
  checkoutUrl: string;     // init_point de MP para redirect
  preferenceId: string;    // ID de la preferencia en MP
  paymentId: string;       // ID del Payment en nuestra BD
}

/**
 * Query params retornados por Mercado Pago después del pago
 */
export interface MercadoPagoReturnParams {
  payment_id?: string;
  status?: string;
  status_detail?: string;
  external_reference?: string;  // orderId
  merchant_order_id?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Opciones de métodos de pago disponibles (solo Mercado Pago)
 * IMPORTANTE: labels y descriptions en pt-BR (visible al usuario)
 */
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    value: PaymentMethodType.PIX,
    label: 'PIX (Grátis)',
    icon: 'pi-qrcode',
    surchargeRate: 0,
    description: 'Aprovação instantânea'
  },
  {
    value: PaymentMethodType.CREDIT_CARD,
    label: 'Cartão de Crédito (+5%)',
    icon: 'pi-credit-card',
    surchargeRate: 0.05,
    description: 'Parcelamento em até 6x sem juros'
  },
  {
    value: PaymentMethodType.DEBIT_CARD,
    label: 'Cartão de Débito (+5%)',
    icon: 'pi-credit-card',
    surchargeRate: 0.05,
    description: 'Pagamento à vista'
  }
];

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Calcula el total con recargo
 * @param subtotal Subtotal de los productos
 * @param shippingCost Costo de envío
 * @param surchargeRate Tasa de recargo (ej: 0.05 = 5%)
 * @returns Total final con recargo
 */
export function calcularTotalConRecargo(
  subtotal: number,
  shippingCost: number,
  surchargeRate: number
): number {
  const baseTotal = subtotal + shippingCost;
  return baseTotal * (1 + surchargeRate);
}

/**
 * Calcula el valor absoluto del recargo
 * @param subtotal Subtotal de los productos
 * @param shippingCost Costo de envío
 * @param surchargeRate Tasa de recargo (ej: 0.05 = 5%)
 * @returns Valor del recargo en reales
 */
export function calcularMontoRecargo(
  subtotal: number,
  shippingCost: number,
  surchargeRate: number
): number {
  const baseTotal = subtotal + shippingCost;
  return baseTotal * surchargeRate;
}

/**
 * Mapea status_detail de MP a mensajes amigables en pt-BR
 * @param statusDetail Código de status_detail de MP
 * @returns Mensaje amigable para mostrar al usuario (pt-BR)
 */
export function obtenerMensajeStatusDetail(statusDetail: string): string {
  const mensajes: Record<string, string> = {
    'cc_rejected_insufficient_funds': 'Saldo insuficiente no cartão',
    'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
    'cc_rejected_bad_filled_date': 'Data de validade inválida',
    'cc_rejected_bad_filled_other': 'Erro no preenchimento dos dados',
    'cc_rejected_card_disabled': 'Cartão desabilitado',
    'cc_rejected_duplicated_payment': 'Pagamento duplicado',
    'cc_rejected_max_attempts': 'Máximo de tentativas excedido',
    'cc_rejected_high_risk': 'Pagamento rejeitado por risco alto',
    'cc_rejected_blacklist': 'Cartão na lista de bloqueio',
    'cc_rejected_call_for_authorize': 'Necessário autorização do banco',
    'cc_rejected_other_reason': 'Pagamento rejeitado'
  };
  return mensajes[statusDetail] || 'Erro ao processar pagamento';
}

/**
 * Formatea el enum de MercadoPagoPaymentStatus a texto legible en pt-BR
 * @param status Estado del pago en MP
 * @returns Texto formateado (pt-BR)
 */
export function formatearStatusMP(status: MercadoPagoPaymentStatus): string {
  const statusMap: Record<MercadoPagoPaymentStatus, string> = {
    [MercadoPagoPaymentStatus.PENDING]: 'Pendente',
    [MercadoPagoPaymentStatus.APPROVED]: 'Aprovado',
    [MercadoPagoPaymentStatus.AUTHORIZED]: 'Autorizado',
    [MercadoPagoPaymentStatus.IN_PROCESS]: 'Em Processamento',
    [MercadoPagoPaymentStatus.IN_MEDIATION]: 'Em Mediação',
    [MercadoPagoPaymentStatus.REJECTED]: 'Rejeitado',
    [MercadoPagoPaymentStatus.CANCELLED]: 'Cancelado',
    [MercadoPagoPaymentStatus.REFUNDED]: 'Reembolsado',
    [MercadoPagoPaymentStatus.CHARGED_BACK]: 'Estornado'
  };
  return statusMap[status] || status;
}
