/**
 * Máquinas de estado (sección 4 de las reglas). Un botón de acción solo aparece
 * si la transición es válida desde el estado actual; badges, menús y mocks leen de aquí.
 */
export type GiftcardState = 'created' | 'activated' | 'expired' | 'voided';
export type SettlementState = 'pending_approval' | 'pending_signature' | 'to_pay' | 'paying' | 'paid';
export type ApprovalState = 'requested' | 'pending' | 'approved' | 'executed' | 'rejected';

export const GIFTCARD_TRANSITIONS: Record<GiftcardState, readonly GiftcardState[]> = {
  created: ['activated', 'voided'],
  activated: ['expired', 'voided'],
  expired: [],
  voided: [],
};
export const SETTLEMENT_TRANSITIONS: Record<SettlementState, readonly SettlementState[]> = {
  pending_approval: ['pending_signature'],
  pending_signature: ['to_pay'],
  to_pay: ['paying'],
  paying: ['paid'],
  paid: [],
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
