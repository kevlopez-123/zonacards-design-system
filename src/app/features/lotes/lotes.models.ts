import { CountryCode } from '../../shared/domain/countries';
import { GiftcardState } from '../../shared/domain/states';

/** Contrato de la API de Lotes (se acordará en contracts/lotes.yaml). Los mocks de MSW lo implementan. */
export type LoteChannel = 'email' | 'whatsapp' | 'zip';
export type LoteType = 'propio' | 'terceros';
export type CodeState = 'created' | 'activated' | 'expired' | 'voided';

export interface VoidRequest {
  id: string;
  /** Cantidad de códigos que se anularán. */
  count: number;
  scope: 'all' | 'selection';
  reason: string;
  requestedBy: string;
  requestedAt: string;
  /** Quién debe aprobar (un segundo usuario, nunca quien solicita). */
  approverRole: string;
  state: 'pending';
}

export interface Lote {
  /** Número sin "#": 02829. En pantalla se muestra "#02829". */
  id: string;
  name: string;
  client: string;
  program: string;
  brand: string;
  /** Giftcard del lote: marca y valor nominal. */
  giftcard: string;
  type: LoteType;
  country: CountryCode;
  state: GiftcardState;
  unitAmount: number;
  quantity: number;
  activated: number;
  /** Códigos aún disponibles para envío o activación. */
  available: number;
  voided: number;
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  channel: LoteChannel;
  purchaseOrder: string;
  pendingVoid: VoidRequest | null;
}

export interface LoteCounts { created: number; activated: number; expired: number; voided: number; }
/** total: con los filtros; overall: todos los lotes visibles para el usuario ("144 de 1.240 lotes"). */
export interface LotesPage { items: Lote[]; total: number; overall: number; counts: LoteCounts; }

export interface LoteCode { id: string; masked: string; state: CodeState; activatedAt: string | null; recipient: string | null; }
export interface CodesPage { items: LoteCode[]; total: number; }

export interface LoteSend { id: string; channel: LoteChannel; date: string; total: number; delivered: number; opened: number; activated: number; failed: number; }
export interface LoteEvent { id: string; date: string; user: string; kind: 'created' | 'sent' | 'activated' | 'extended' | 'void_requested' | 'void_cancelled'; detail: string; }

export type LoteSortKey = 'expires' | 'created' | 'amount' | 'name' | 'client' | 'quantity' | 'available';
export interface LotesQuery {
  q: string;
  country: CountryCode[];
  state: GiftcardState[];
  client: string | null;
  program: string | null;
  brand: string | null;
  type: LoteType | null;
  from: string | null;
  to: string | null;
  sort: LoteSortKey;
  desc: boolean;
  page: number;
  size: number;
}
