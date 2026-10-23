/**
 * Máquinas de estado (sección 4 de las reglas). Un botón de acción solo aparece
 * si la transición es válida desde el estado actual; badges, menús y mocks leen de aquí.
 */
export type GiftcardState = 'created' | 'activated' | 'expired' | 'voided';
/** 'observada' es el estado lateral de la liquidación (valor del API): se llega al rechazar la aprobación u observarla y se reenvía a aprobación. */
export type SettlementState = 'pending_approval' | 'pending_signature' | 'to_pay' | 'paying' | 'paid' | 'observada';
export type ApprovalState = 'requested' | 'pending' | 'approved' | 'executed' | 'rejected';
/** Lote de códigos, envío masivo y traslado de stock (valores del API). */
export type LotState = 'pendiente_aprobacion' | 'rechazado' | 'activo' | 'agotado' | 'parcialmente_anulado' | 'anulado';
export type ShipmentState = 'borrador' | 'pendiente_aprobacion' | 'rechazado' | 'programado' | 'en_curso' | 'con_errores' | 'completado' | 'cancelado';
export type TransferState = 'pendiente_aprobacion' | 'rechazado' | 'ejecutado';

export const GIFTCARD_TRANSITIONS: Record<GiftcardState, readonly GiftcardState[]> = {
  created: ['activated', 'voided'],
  activated: ['expired', 'voided'],
  expired: [],
  voided: [],
};
export const SETTLEMENT_TRANSITIONS: Record<SettlementState, readonly SettlementState[]> = {
  pending_approval: ['pending_signature', 'observada'],
  pending_signature: ['to_pay', 'observada'],
  to_pay: ['paying', 'observada'],
  paying: ['paid'],
  paid: [],
  observada: ['pending_approval'],
};
/** Estados desde los que Finanzas puede observar una liquidación. */
export const SETTLEMENT_OBSERVABLE: readonly SettlementState[] = ['pending_approval', 'pending_signature', 'to_pay'];
export const LOT_TRANSITIONS: Record<LotState, readonly LotState[]> = {
  pendiente_aprobacion: ['activo', 'rechazado'],
  rechazado: ['pendiente_aprobacion'],
  activo: ['parcialmente_anulado', 'anulado', 'agotado'],
  agotado: ['parcialmente_anulado', 'anulado'],
  parcialmente_anulado: ['anulado', 'agotado'],
  anulado: [],
};
export const SHIPMENT_TRANSITIONS: Record<ShipmentState, readonly ShipmentState[]> = {
  borrador: ['pendiente_aprobacion', 'cancelado'],
  pendiente_aprobacion: ['programado', 'en_curso', 'rechazado', 'cancelado'],
  rechazado: ['pendiente_aprobacion'],
  programado: ['en_curso', 'cancelado'],
  en_curso: ['completado', 'con_errores'],
  // Reenviar los fallidos vuelve a procesar el envío.
  con_errores: ['en_curso'],
  completado: [],
  cancelado: [],
};
export const TRANSFER_TRANSITIONS: Record<TransferState, readonly TransferState[]> = {
  pendiente_aprobacion: ['ejecutado', 'rechazado'],
  rechazado: ['pendiente_aprobacion'],
  ejecutado: [],
};
export const APPROVAL_TRANSITIONS: Record<ApprovalState, readonly ApprovalState[]> = {
  requested: ['pending'],
  pending: ['approved', 'rejected'],
  approved: ['executed'],
  executed: [],
  rejected: ['requested'],
};

export function canTransition<S extends string>(map: Record<S, readonly S[]>, from: S, to: S): boolean {
  return map[from].includes(to);
}

/** Apariencia de cada estado: tono semántico, ícono y texto. Nunca solo color. */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';
export interface StateLook { tone: Tone; icon: string; labelKey: string; }
export const GIFTCARD_LOOK: Record<GiftcardState, StateLook> = {
  created: { tone: 'neutral', icon: 's:add-circle', labelKey: 'estado.creado' },
  activated: { tone: 'success', icon: 's:check-circle', labelKey: 'estado.activado' },
  expired: { tone: 'warning', icon: 's:clock-circle', labelKey: 'estado.expirado' },
  voided: { tone: 'danger', icon: 's:close-circle', labelKey: 'estado.anulado' },
};
export const APPROVAL_LOOK: Record<ApprovalState, StateLook> = {
  requested: { tone: 'neutral', icon: 's:add-circle', labelKey: 'estadoAprobacion.requested' },
  pending: { tone: 'warning', icon: 's:hourglass', labelKey: 'estadoAprobacion.pending' },
  approved: { tone: 'info', icon: 's:check-circle', labelKey: 'estadoAprobacion.approved' },
  executed: { tone: 'success', icon: 's:check-circle', labelKey: 'estadoAprobacion.executed' },
  rejected: { tone: 'danger', icon: 's:close-circle', labelKey: 'estadoAprobacion.rejected' },
};
export const SETTLEMENT_LOOK: Record<SettlementState, StateLook> = {
  pending_approval: { tone: 'warning', icon: 's:hourglass', labelKey: 'estadoLiquidacion.pending_approval' },
  pending_signature: { tone: 'info', icon: 's:pen', labelKey: 'estadoLiquidacion.pending_signature' },
  to_pay: { tone: 'info', icon: 's:wallet', labelKey: 'estadoLiquidacion.to_pay' },
  paying: { tone: 'info', icon: 's:refresh', labelKey: 'estadoLiquidacion.paying' },
  paid: { tone: 'success', icon: 's:check-circle', labelKey: 'estadoLiquidacion.paid' },
  observada: { tone: 'danger', icon: 's:danger-triangle', labelKey: 'estadoLiquidacion.observada' },
};
export const LOT_LOOK: Record<LotState, StateLook> = {
  pendiente_aprobacion: { tone: 'warning', icon: 's:hourglass', labelKey: 'estadoLote.pendiente_aprobacion' },
  rechazado: { tone: 'danger', icon: 's:close-circle', labelKey: 'estadoLote.rechazado' },
  activo: { tone: 'success', icon: 's:check-circle', labelKey: 'estadoLote.activo' },
  agotado: { tone: 'neutral', icon: 's:box', labelKey: 'estadoLote.agotado' },
  parcialmente_anulado: { tone: 'warning', icon: 's:danger-triangle', labelKey: 'estadoLote.parcialmente_anulado' },
  anulado: { tone: 'danger', icon: 's:close-circle', labelKey: 'estadoLote.anulado' },
};
export const SHIPMENT_LOOK: Record<ShipmentState, StateLook> = {
  borrador: { tone: 'neutral', icon: 's:pen', labelKey: 'estadoEnvio.borrador' },
  pendiente_aprobacion: { tone: 'warning', icon: 's:hourglass', labelKey: 'estadoEnvio.pendiente_aprobacion' },
  rechazado: { tone: 'danger', icon: 's:close-circle', labelKey: 'estadoEnvio.rechazado' },
  programado: { tone: 'info', icon: 's:clock-circle', labelKey: 'estadoEnvio.programado' },
  en_curso: { tone: 'info', icon: 's:letter', labelKey: 'estadoEnvio.en_curso' },
  con_errores: { tone: 'danger', icon: 's:danger-triangle', labelKey: 'estadoEnvio.con_errores' },
  completado: { tone: 'success', icon: 's:check-circle', labelKey: 'estadoEnvio.completado' },
  cancelado: { tone: 'neutral', icon: 's:close-circle', labelKey: 'estadoEnvio.cancelado' },
};
export const TRANSFER_LOOK: Record<TransferState, StateLook> = {
  pendiente_aprobacion: { tone: 'warning', icon: 's:hourglass', labelKey: 'estadoTraslado.pendiente_aprobacion' },
  rechazado: { tone: 'danger', icon: 's:close-circle', labelKey: 'estadoTraslado.rechazado' },
  ejecutado: { tone: 'success', icon: 's:check-circle', labelKey: 'estadoTraslado.ejecutado' },
};
