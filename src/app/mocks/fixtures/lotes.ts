import { CountryCode } from '../../shared/domain/countries';
import { GiftcardState } from '../../shared/domain/states';
import type { CodeState, Lote, LoteChannel, LoteCode, LoteCounts, LoteEvent, LoteSend, LotesPage, LotesQuery, LoteType } from '../../features/lotes/lotes.models';

export type { Lote } from '../../features/lotes/lotes.models';

/** Fecha de referencia fija: los estados (vencido, por vencer) no cambian con el día en que se corre la demo o las pruebas. */
export const REF_DATE = '2026-10-10';

/** Generador determinista (mulberry32). */
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLIENTS: Record<CountryCode, string[]> = {
  pe: ['Interbank', 'BCP', 'BBVA Perú', 'Alicorp', 'Backus'], ec: ['Banco Pichincha', 'Produbanco', 'Corporación Favorita'],
  bo: ['Tigo', 'Banco Unión', 'Cervecería Boliviana'], co: ['Bancolombia', 'Davivienda', 'Grupo Éxito'],
  cl: ['Entel', 'Falabella', 'Cencosud'], mx: ['Bimbo', 'Banorte', 'Femsa'],
};
const PROGRAMS = ['Incentivos', 'Fidelización', 'Bienestar', 'Reconocimiento', 'Fuerza de ventas'];
const CAMPAIGNS = ['Navidad 2026', 'Bienvenida clientes', 'Día del Padre', 'Día de la Madre', 'Cyber Wow', 'Fiestas Patrias', 'Aniversario', 'Cierre de año', 'Verano 2027', 'Regreso a clases', 'Premio ventas Q3', 'Bono de productividad'];
const BRANDS: [string, LoteType][] = [['Giftealo', 'propio'], ['Starbucks', 'terceros'], ['Cineplanet', 'terceros'], ['Falabella', 'terceros'], ['Spa Relax', 'propio'], ['Rappi', 'terceros'], ['Tour Andino', 'propio']];
const FACE: Record<CountryCode, number[]> = { pe: [50, 100, 200], ec: [25, 50, 100], bo: [100, 200], co: [50000, 100000], cl: [20000, 30000, 50000], mx: [500, 1000] };
const CURRENCY_TEXT: Record<CountryCode, (v: number) => string> = {
  pe: v => `S/ ${v}`, ec: v => `$${v}`, bo: v => `Bs ${v}`, co: v => `$${v.toLocaleString('es-CO')}`, cl: v => `$${v.toLocaleString('es-CL')}`, mx: v => `$${v}`,
};
const USERS = ['Ana Torres', 'Carlos Ríos', 'Lucía Mendoza', 'Iván Baca'];
const COUNTRY_ORDER: CountryCode[] = ['pe', 'pe', 'co', 'cl', 'mx', 'ec', 'bo', 'pe', 'cl', 'co'];

const addDaysIso = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function generate(): Lote[] {
  const r = rng(2829);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  return Array.from({ length: 200 }, (_, i): Lote => {
    const country = COUNTRY_ORDER[i % COUNTRY_ORDER.length];
    const [brand, type] = pick(BRANDS);
    const unit = pick(FACE[country]);
    const quantity = [100, 150, 250, 300, 500, 800, 1000, 1200, 2000][Math.floor(r() * 9)];
    const createdAt = addDaysIso(REF_DATE, -Math.floor(r() * 420));
    const expiresAt = addDaysIso(createdAt, 180 + Math.floor(r() * 300));
    const roll = r();
    const state: GiftcardState = expiresAt < REF_DATE ? 'expired' : roll < 0.08 ? 'voided' : roll < 0.28 ? 'created' : 'activated';
    const activated = state === 'created' || state === 'voided' ? 0 : Math.round(quantity * (0.2 + r() * 0.75));
    const voided = state === 'voided' ? quantity : 0;
    return {
      id: String(2829 + i).padStart(5, '0'),
      name: pick(CAMPAIGNS), client: pick(CLIENTS[country]), program: pick(PROGRAMS), brand,
      giftcard: `${brand} ${CURRENCY_TEXT[country](unit)}`, type, country, state, unitAmount: unit, quantity, activated,
      available: state === 'expired' || state === 'voided' ? 0 : quantity - activated, voided,
      createdAt, createdBy: pick(USERS), expiresAt, channel: pick<LoteChannel>(['email', 'email', 'whatsapp', 'zip']),
      purchaseOrder: `OC-${2026}-${String(1000 + i * 7).padStart(5, '0')}`, pendingVoid: null,
    };
  });
}

/** Base en memoria: las solicitudes de anulación quedan aquí mientras dure la sesión del navegador. */
export const LOTES: Lote[] = generate();

export const lotesClients = () => [...new Set(LOTES.map(l => l.client))].sort((a, b) => a.localeCompare(b, 'es'));
export const lotesPrograms = () => [...new Set(LOTES.map(l => l.program))].sort((a, b) => a.localeCompare(b, 'es'));
export const lotesBrands = () => [...new Set(LOTES.map(l => l.brand))].sort((a, b) => a.localeCompare(b, 'es'));

const SORT_VALUE: Record<LotesQuery['sort'], (l: Lote) => string | number> = {
  // "Próximos a vencer": primero los vigentes por fecha; los ya vencidos van al final.
  expires: l => (l.expiresAt < REF_DATE ? 'z' : '') + l.expiresAt, created: l => l.createdAt, amount: l => l.unitAmount * l.quantity, name: l => l.name.toLowerCase(),
  client: l => l.client.toLowerCase(), quantity: l => l.quantity, available: l => l.available,
};

/**
 * Lo que hará el backend: filtrar, contar por estado (sin el filtro de estado, para los KPI), ordenar y paginar.
 * Función pura para probarla sin MSW.
 */
export function queryLotes(all: readonly Lote[], q: LotesQuery): LotesPage {
  const text = q.q.trim().toLowerCase();
  const base = all.filter(l => (!text || `${l.id} ${l.name} ${l.client} ${l.giftcard}`.toLowerCase().includes(text))
    && (!q.country.length || q.country.includes(l.country))
    && (!q.client || l.client === q.client) && (!q.program || l.program === q.program)
    && (!q.brand || l.brand === q.brand) && (!q.type || l.type === q.type)
    && (!q.from || l.createdAt >= q.from) && (!q.to || l.createdAt <= q.to));
  const counts: LoteCounts = { created: 0, activated: 0, expired: 0, voided: 0 };
  for (const l of base) counts[l.state]++;
  const get = SORT_VALUE[q.sort];
  const items = base.filter(l => !q.state.length || q.state.includes(l.state))
    .sort((a, b) => { const x = get(a), y = get(b); return (x > y ? 1 : x < y ? -1 : a.id.localeCompare(b.id)) * (q.desc ? -1 : 1); });
  const start = (q.page - 1) * q.size;
  return { items: items.slice(start, start + q.size), total: items.length, overall: all.length, counts };
}

/** Ejecuta una anulación aprobada: todo el lote (queda Anulado) o una cantidad de códigos disponibles. */
export function applyLotVoid(l: Lote, count: number, scope: 'all' | 'selection') {
  const n = Math.min(count, l.available);
  l.voided += n;
  l.available -= n;
  if (scope === 'all' && l.activated === 0) l.state = 'voided';
  l.pendingVoid = null;
}

/** Códigos del lote, siempre enmascarados (•••• 1234). Se generan al vuelo con la semilla del lote. */
export function lotCodes(l: Lote): LoteCode[] {
  const r = rng(Number(l.id));
  return Array.from({ length: l.quantity }, (_, i): LoteCode => {
    const last4 = String(Math.floor(r() * 10000)).padStart(4, '0');
    const state: CodeState = l.state === 'voided' ? 'voided' : i < l.activated ? (l.state === 'expired' ? 'expired' : 'activated') : l.state === 'expired' ? 'expired' : 'created';
    return {
      id: `${l.id}-${i + 1}`, masked: `•••• ${last4}`, state,
      activatedAt: i < l.activated ? addDaysIso(l.createdAt, 1 + (i % 60)) : null,
      recipient: i < l.activated ? `${['ana', 'luis', 'maria', 'jorge', 'rosa'][i % 5]}•••@${['gmail.com', 'empresa.com', 'outlook.com'][i % 3]}` : null,
    };
  });
}

export function lotSends(l: Lote): LoteSend[] {
  if (l.state === 'created' || l.state === 'voided') return [];
  const r = rng(Number(l.id) + 7);
  const n = 1 + Math.floor(r() * 3);
  return Array.from({ length: n }, (_, i) => {
    const total = Math.round(l.activated / n) + (i === 0 ? l.activated % n : 0);
    const failed = Math.floor(total * r() * 0.04);
    return { id: `E-${l.id}-${i + 1}`, channel: l.channel, date: addDaysIso(l.createdAt, 1 + i * 9), total: total + failed, delivered: total, opened: Math.round(total * 0.92), activated: total, failed };
  });
}

export function lotHistory(l: Lote): LoteEvent[] {
  const ev: LoteEvent[] = [{ id: `${l.id}-h1`, date: l.createdAt + 'T09:12:00', user: l.createdBy, kind: 'created', detail: `${l.quantity}` }];
  lotSends(l).forEach((s, i) => ev.push({ id: `${l.id}-s${i}`, date: s.date + 'T10:30:00', user: l.createdBy, kind: 'sent', detail: `${s.total}` }));
  if (l.pendingVoid) ev.push({ id: l.pendingVoid.id, date: l.pendingVoid.requestedAt, user: l.pendingVoid.requestedBy, kind: 'void_requested', detail: `${l.pendingVoid.count}` });
  return ev.sort((a, b) => (a.date < b.date ? 1 : -1));
}
