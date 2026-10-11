import { describe, expect, it } from 'vitest';
import { toPdf } from '../../shared/domain/export';
import { LOTES, REF_DATE, lotCodes, queryLotes } from '../../mocks/fixtures/lotes';
import { DEFAULT_QUERY, activeFilterCount, lotesApiParams, lotesQueryParams, parseLotesQuery } from './lotes-query';
import { voidBlock } from './lotes-ui';
import { Lote } from './lotes.models';

const parse = (qs: string) => { const p = new URLSearchParams(qs); return parseLotesQuery(k => p.get(k)); };

describe('Lotes: estado en la URL', () => {
  it('lee filtros, orden y página, e ignora lo que no es válido', () => {
    const q = parse('q=navidad&pais=pe,cl,xx&estado=activated,foo&orden=-amount&pagina=3&filas=50&desde=2026-01-01&hasta=nope&tipo=otro');
    expect(q.q).toBe('navidad');
    expect(q.country).toEqual(['pe', 'cl']);
    expect(q.state).toEqual(['activated']);
    expect(q).toMatchObject({ sort: 'amount', desc: true, page: 3, size: 50, from: '2026-01-01', to: null, type: null });
    expect(parse('pagina=-2&filas=7&orden=hack')).toMatchObject({ page: 1, size: 25, sort: 'expires', desc: false });
  });

  it('escribe URLs cortas: sin valores por defecto, y vuelve a leerse igual', () => {
    expect(Object.values(lotesQueryParams(DEFAULT_QUERY)).every(v => v === null)).toBe(true);
    const q = { ...DEFAULT_QUERY, country: ['pe' as const], state: ['voided' as const], sort: 'created' as const, desc: true, page: 2, client: 'BCP' };
    const params = lotesQueryParams(q);
    expect(params).toMatchObject({ pais: 'pe', estado: 'voided', orden: '-created', pagina: '2', cliente: 'BCP' });
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== null) as [string, string][]).toString();
    expect(parse(qs)).toEqual(q);
    expect(lotesApiParams(DEFAULT_QUERY)).toEqual({ pagina: '1', filas: '25' });
    expect(activeFilterCount(q)).toBe(3);
  });
});

describe('Lotes: datos simulados y consulta del servidor', () => {
  it('200 lotes con semilla fija, de los 6 países y con estados coherentes con las fechas', () => {
    expect(LOTES).toHaveLength(200);
    expect(new Set(LOTES.map(l => l.country)).size).toBe(6);
    expect(new Set(LOTES.map(l => l.id)).size).toBe(200);
    expect(LOTES.filter(l => l.state === 'expired').every(l => l.expiresAt < REF_DATE)).toBe(true);
    expect(LOTES.every(l => l.available + l.activated + l.voided <= l.quantity)).toBe(true);
    expect(LOTES[0]).toEqual(LOTES.slice()[0]);
  });

  it('filtra, cuenta por estado sin el filtro de estado, ordena y pagina', () => {
    const all = queryLotes(LOTES, { ...DEFAULT_QUERY, country: ['pe'] });
    const pe = LOTES.filter(l => l.country === 'pe');
    expect(all.total).toBe(pe.length);
    const onlyVoided = queryLotes(LOTES, { ...DEFAULT_QUERY, country: ['pe'], state: ['voided'] });
    expect(onlyVoided.counts).toEqual(all.counts);
    expect(onlyVoided.total).toBe(all.counts.voided);
    const byAmount = queryLotes(LOTES, { ...DEFAULT_QUERY, sort: 'amount', desc: true, size: 100 }).items.map(l => l.unitAmount * l.quantity);
    expect(byAmount).toEqual([...byAmount].sort((a, b) => b - a));
    const p2 = queryLotes(LOTES, { ...DEFAULT_QUERY, page: 2, size: 25 });
    expect(p2.items[0].id).toBe(queryLotes(LOTES, { ...DEFAULT_QUERY, size: 50 }).items[25].id);
  });

  it('"Próximos a vencer" deja los vencidos al final', () => {
    const items = queryLotes(LOTES, { ...DEFAULT_QUERY, size: 200 }).items;
    const firstExpired = items.findIndex(l => l.expiresAt < REF_DATE);
    expect(items.slice(firstExpired).every(l => l.expiresAt < REF_DATE)).toBe(true);
    expect(items[0].expiresAt >= REF_DATE).toBe(true);
  });

  it('los códigos siempre llegan enmascarados', () => {
    const codes = lotCodes(LOTES[0]);
    expect(codes).toHaveLength(LOTES[0].quantity);
    expect(codes.every(c => /^•••• \d{4}$/.test(c.masked))).toBe(true);
  });
});

describe('Lotes: anulación', () => {
  const base = LOTES.find(l => l.state === 'activated' && l.available > 0)!;
  it('solo si la máquina de estados lo permite, hay códigos y no hay otra solicitud pendiente', () => {
    expect(voidBlock(base)).toBeNull();
    expect(voidBlock({ ...base, state: 'expired' })).toBe('state');
    expect(voidBlock({ ...base, available: 0 })).toBe('empty');
    expect(voidBlock({ ...base, pendingVoid: { id: 'AP-1' } as Lote['pendingVoid'] })).toBe('pending');
  });
});

describe('exportación a PDF', () => {
  it('PDF válido, paginado y con tildes y enmascarado en WinAnsi', () => {
    const rows = [['Lote', 'Código'], ...Array.from({ length: 80 }, (_, i) => [`Día del Padre ${i}`, '•••• 1234'])];
    const pdf = toPdf(rows, { title: 'Lotes', subtitle: 'Filtros: País: Perú' });
    const text = String.fromCharCode(...pdf);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('/Count 3');
    // "Día" en WinAnsi: D=44, í=ED, a=61. Viñeta del enmascarado: 95.
    expect(text).toContain('44ed61');
    expect(text).toContain('95959595');
  });
});
