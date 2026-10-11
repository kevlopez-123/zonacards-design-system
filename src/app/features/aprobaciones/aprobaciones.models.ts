import { CountryCode } from '@zonacards/ui/core';
import { ApprovalState } from '@zonacards/ui/core';

/** Contrato de la API de Aprobaciones (maker-checker, sección 8.10). Los mocks de MSW lo implementan. */
export type ApprovalType =
  | 'lote_void' | 'emision' | 'envio_masivo' | 'activacion_masiva' | 'reverso' | 'consumo_manual'
  | 'extension_vigencia' | 'liquidacion' | 'archivo_pago' | 'regla_antifraude';

export const APPROVAL_TYPES: readonly ApprovalType[] = [
  'lote_void', 'emision', 'envio_masivo', 'activacion_masiva', 'reverso', 'consumo_manual', 'extension_vigencia', 'liquidacion', 'archivo_pago', 'regla_antifraude',
];

/** Un cambio que la aprobación aplicará: lo que el aprobador revisa ("antes y después"). */
export interface ApprovalChange { field: string; before: string; after: string; }

export interface Approval {
  id: string;
  type: ApprovalType;
  state: ApprovalState;
  /** Qué se aprueba, en una línea: "Lote #02829 · Navidad 2026 · Interbank". */
  title: string;
  /** Registro afectado, para ir a su ficha. */
  entity: { kind: 'lote' | 'giftcard' | 'liquidacion' | 'pago' | 'regla'; id: string; label: string } | null;
  country: CountryCode;
  /** Monto en la moneda del país (sin convertir; nunca se suman monedas distintas). */
  amount: number | null;
  quantity: number | null;
  reason: string;
  requestedBy: { id: string; name: string; role: string };
  requestedAt: string;
  /** Roles que pueden aprobar (siempre otra persona, nunca quien solicitó). */
  approverRoles: string[];
  changes: ApprovalChange[];
  decidedBy: { id: string; name: string; role: string } | null;
  decidedAt: string | null;
  /** Comentario del aprobador; obligatorio al rechazar (vuelve al solicitante). */
  comment: string | null;
  executedAt: string | null;
  /** Qué puede hacer el usuario actual (lo calcula el servidor): ok = aprobar o rechazar; self = es su solicitud. */
  allowed?: 'ok' | 'not_pending' | 'self' | 'role';
}

export type ApprovalTab = 'por-aprobar' | 'mis-solicitudes';
export interface ApprovalCounts { porAprobar: number; misSolicitudes: number; }
export interface ApprovalsPage { items: Approval[]; total: number; counts: ApprovalCounts; }
export interface ApprovalsQuery {
  tab: ApprovalTab;
  type: ApprovalType[];
  country: CountryCode[];
  state: ApprovalState[];
  q: string;
  page: number;
  size: number;
}
export type Decision = 'approve' | 'reject';
export interface DecisionResult { ok: string[]; failed: { id: string; code: string; message: string }[]; }
