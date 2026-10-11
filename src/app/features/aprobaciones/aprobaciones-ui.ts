import { countryByCode } from '@zonacards/ui/core';
import { formatDate } from '@zonacards/ui/core';
import { formatMoney } from '@zonacards/ui/core';
import { IconName } from '@zonacards/ui/icon';
import { Approval, ApprovalType } from './aprobaciones.models';

export const TYPE_ICON: Record<ApprovalType, IconName> = {
  lote_void: 's:close-circle', emision: 's:box', envio_masivo: 's:plain', activacion_masiva: 's:check-circle', reverso: 's:refresh',
  consumo_manual: 's:shop-2', extension_vigencia: 's:calendar', liquidacion: 's:bill-list', archivo_pago: 's:wallet-money', regla_antifraude: 's:shield-warning',
};

export interface DecisionSummary {
  count: number;
  byType: { type: ApprovalType; n: number }[];
  /** Un total por moneda: no hay tipo de cambio, nunca se suman monedas distintas (C-003). */
  money: { currency: string; text: string }[];
  quantity: number;
}

/** Resumen que el aprobador ve antes de confirmar (momento crítico del journey "Aprobar en lote"). */
export function decisionSummary(items: readonly Approval[]): DecisionSummary {
  const byType = new Map<ApprovalType, number>();
  const byCountry = new Map<string, { country: Approval['country']; total: number }>();
  let quantity = 0;
  for (const a of items) {
    byType.set(a.type, (byType.get(a.type) ?? 0) + 1);
    quantity += a.quantity ?? 0;
    if (a.amount !== null) {
      const cur = countryByCode(a.country).currency;
      const g = byCountry.get(cur) ?? { country: a.country, total: 0 };
      g.total += a.amount;
      byCountry.set(cur, g);
    }
  }
  return {
    count: items.length,
    byType: [...byType].map(([type, n]) => ({ type, n })).sort((a, b) => b.n - a.n),
    money: [...byCountry].map(([currency, g]) => ({ currency, text: formatMoney(g.total, g.country) })).sort((a, b) => a.currency.localeCompare(b.currency)),
    quantity,
  };
}

export const approvalMoney = (a: Approval) => (a.amount === null ? null : formatMoney(a.amount, a.country));
export const approvalDate = (iso: string, lang: 'es' | 'en') => formatDate(new Date(iso), 'dt-medium', { lang });
