import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';
import { COUNTRIES } from '@zonacards/ui/core';
import { formatDate, formatRange, formatRelative } from '@zonacards/ui/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { ChipComponent } from '@zonacards/ui/chip';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { LogoComponent } from '@zonacards/ui/logo';
import { LOGOS } from '@zonacards/ui/logo';
import { SeparatorComponent } from '@zonacards/ui/misc';
import { SwitchComponent } from '@zonacards/ui/switch';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { AlertComponent } from '@zonacards/ui/alert';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import { TabPanelDirective, TabsComponent, ZcTab } from '@zonacards/ui/tabs';
import { ToastService } from '@zonacards/ui/toast';
import { ScrollAreaDirective } from '@zonacards/ui/core';
import { CATALOG } from './ds/catalog-index';
import { DsGroupComponent, DsLevelComponent, DsSectionComponent } from './ds/ds-layout';

// Datos de docs/design-system/index.html (secciones color, f-palette, tipo, f-dates, espacio, scroll, iconos y f-logos).
const SWATCHES: [string, string, string][] = [
  ['Fondo', '--bg', '--text'], ['Superficie', '--surface', '--text'], ['Superficie 2', '--surface-2', '--text'], ['Texto secundario', '--surface', '--text-muted'],
  ['Primario', '--primary', '--on-primary'], ['Secundario Giftealo', '--secondary', '--on-secondary'], ['Éxito', '--success-bg', '--success-fg'],
  ['Advertencia', '--warning-bg', '--warning-fg'], ['Peligro', '--danger-bg', '--danger-fg'], ['Información', '--info-bg', '--info-fg'],
  ['Acento', '--accent-bg', '--accent-fg'], ['Neutro', '--neutral-bg', '--neutral-fg'],
];
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const PAL: [string, string[]][] = [
  ['Navy Giftealo (marca)', ['#eef3fa', '#d9e3f3', '#b6c8e6', '#8aa6d4', '#5d7fbd', '#3f61a3', '#2f4b85', '#253c6b', '#1e3157', '#172948', '#0e1a30']],
  ['Celeste Giftealo', ['#ecfaff', '#d4f2ff', '#b0e8ff', '#78dcff', '#38c6ff', '#009ede', '#0084bd', '#0077a8', '#005f86', '#064f6e', '#04324a']],
  ['Ámbar (acento Enjoy)', ['#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', '#451a03']],
  ['Neutro', ['#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626', '#171717', '#0a0a0a']],
  ['Verde (éxito)', ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#052e16']],
  ['Rojo (peligro)', ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a']],
  ['Azul (información)', ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554']],
  ['Violeta (acento)', ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#3b0764']],
  ['Turquesa (Motiva)', ['#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a', '#042f2e']],
];
const DV: [string, string[]][] = [
  ['Categórica (8, apta para daltonismo)', ['#172948', '#E69F00', '#56B4E9', '#009E73', '#D55E00', '#0072B2', '#CC79A7', '#8C8C8C']],
  ['Secuencial (mapas de calor, intensidad)', ['#eef3fa', '#b6c8e6', '#8aa6d4', '#5d7fbd', '#3f61a3', '#2f4b85', '#172948']],
  ['Divergente (variación negativa a positiva)', ['#b91c1c', '#ef4444', '#fca5a5', '#e5e5e5', '#86efac', '#22c55e', '#15803d']],
];
const ICONS: [IconName, string][] = [
  ['s:widget-5', 'Dashboard'], ['s:buildings-2', 'Clientes'], ['s:flag', 'Campañas'], ['s:gift', 'Giftcards'], ['s:box', 'Lotes'], ['s:plain', 'Envíos'],
  ['s:layers', 'Stock'], ['s:headphones-round', 'ATC'], ['s:bill-list', 'Liquidaciones'], ['s:wallet-money', 'Pagos'], ['s:chart-2', 'Reportes'],
  ['s:checklist-minimalistic', 'Aprobaciones'], ['s:shield-warning', 'Antifraude'], ['s:history', 'Auditoría'], ['s:settings', 'Configuración'],
  ['s:tuning-2', 'Filtros'], ['s:download-minimalistic', 'Exportar'], ['s:magnifier', 'Buscar'], ['s:bell', 'Notificaciones'],
  ['s:widget-5-bold', 'Activo (Bold)'], ['l:columns-3', 'Lucide: columnas'], ['l:rows-3', 'Lucide: densidad'],
];
const LOGO_GROUPS: [string, string[]][] = [
  ['Medios de pago', ['visa', 'mastercard', 'americanexpress', 'dinersclub', 'paypal', 'applepay', 'googlepay', 'mercadopago']],
  ['Redes sociales y mensajería', ['whatsapp', 'facebook', 'instagram', 'youtube', 'tiktok', 'x', 'telegram']],
  ['Marcas (ejemplos)', ['starbucks', 'kfc', 'burgerking', 'mcdonalds', 'netflix', 'spotify', 'uber', 'airbnb', 'playstation', 'steam', 'adidas', 'nike', 'zara', 'ikea', 'shell', 'apple', 'google']],
];
const DATE_ROWS: [string, string, string][] = [
  ['short', 'Short', 'Tablas densas, celdas estrechas, campos'], ['medium', 'Medium', 'Por defecto: tarjetas, listas, detalle'],
  ['long', 'Long', 'Documentos, correos, textos legales'], ['full', 'Full', 'Agenda, programación de envíos, confirmaciones'],
  ['time', 'Hora', 'Junto a una fecha, en textos y fichas'], ['time-pad', 'Hora en tablas', 'Columnas de tablas y registros: 2 dígitos para que las horas se alineen'],
  ['dt-medium', 'Fecha y hora', 'Auditoría, historial, transacciones'], ['dt-short', 'Fecha y hora corta', 'Tablas densas'],
  ['rel','Relativa', 'Notificaciones y actividad reciente (con la fecha completa en tooltip)'], ['range', 'Rango', 'Periodos, vigencias, filtros'],
  ['month', 'Mes', 'Reportes mensuales, liquidaciones'], ['iso', 'ISO 8601', 'Exportaciones CSV/Excel, API y nombres de archivo'],
];

/** Contraste WCAG entre dos colores rgb()/rgba() ya resueltos por el navegador (con la transparencia mezclada sobre el fondo). */
function parse(c: string) { const m = c.match(/[\d.]+/g)!.map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; }
function blend(f: ReturnType<typeof parse>, b: ReturnType<typeof parse>) { return { r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 }; }
function lum(c: { r: number; g: number; b: number }) { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
export function contrast(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; };

/** Catálogo · Fundamentos (tokens): réplica de las secciones del mismo nombre en docs/design-system/index.html. */
@Component({
  selector: 'zc-catalogo-fundamentos',
  imports: [
    BadgeComponent, ButtonDirective, ChipComponent, FlagComponent, IconComponent, LogoComponent, SeparatorComponent, SwitchComponent, TooltipDirective, AlertComponent,
    SegmentedComponent, TabsComponent, TabPanelDirective, ScrollAreaDirective, DsLevelComponent, DsGroupComponent, DsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fundamentos.page.html',
})
export class FundamentosPage {
  readonly level = CATALOG[0];
  readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);
  private readonly tick = signal(0);

  // Color: contraste real del tema activo (se recalcula al cambiar de tema o de marca).
  readonly swatches = computed(() => {
    this.tick();
    if (typeof document === 'undefined' || !document.body) return SWATCHES.map(([name, bg, fg]) => ({ name, bg, fg, ratio: 0 }));
    const resolve = (v: string) => { const el = document.createElement('span'); el.style.color = `var(${v})`; document.body.appendChild(el); const c = getComputedStyle(el).color; el.remove(); return parse(c); };
    const surface = resolve('--surface');
    return SWATCHES.map(([name, bg, fg]) => { const b = blend(resolve(bg), surface); const f = blend(resolve(fg), b); return { name, bg, fg, ratio: contrast(f, b) }; });
  });
  level_ = (r: number) => (r >= 4.5 ? 'AA' : r >= 3 ? 'AA grande' : 'No cumple');

  // Paleta
  readonly steps = STEPS;
  readonly pal = PAL.map(([name, hexes]) => ({ name, chips: hexes.map((h, i) => {
    const w = contrast(hexRgb(h), hexRgb('#ffffff')) >= 4.5, k = contrast(hexRgb(h), hexRgb('#000000')) >= 4.5;
    return { hex: h, step: STEPS[i], text: w ? '#fff' : '#000', mark: w ? '●' : k ? '○' : '', label: `${name} ${STEPS[i]}, ${h}${w ? ', cumple AA con texto blanco' : ''}${k ? ', cumple AA con texto negro' : ''}. Copiar` };
  }) }));
  readonly dv = DV.map(([name, hexes]) => ({ name, hexes }));
  copy(hex: string) {
    try { void navigator.clipboard.writeText(hex.toUpperCase()); } catch { /* sin portapapeles */ }
    this.toast.success(`Copiado ${hex.toUpperCase()}`);
  }

  // Tipografía: prueba en vivo de --zc-font-sans (se restaura al salir de la página).
  readonly fonts: ZcSegment[] = [{ value: 'Figtree', label: 'Figtree' }, { value: 'Outfit', label: 'Outfit' }];
  readonly font = signal<string | null>('Figtree');
  setFont(f: string | null) {
    this.font.set(f);
    const root = document.documentElement.style;
    if (f === 'Outfit') root.setProperty('--zc-font-sans', '"Outfit Variable", "Outfit", ui-sans-serif, system-ui, sans-serif');
    else root.removeProperty('--zc-font-sans');
  }

  // Fechas (base fija: domingo 1 de marzo de 2026, 2:30 p. m. en Lima)
  private readonly base = new Date('2026-03-01T19:30:00Z');
  /** Formato de hora: 12 h por defecto en LatAm, 24 h en España; preferencia del perfil del usuario. */
  readonly hourCycle = signal<string | null>('h12');
  readonly hourCycles: ZcSegment[] = [{ value: 'h12', label: '12 h · 2:30 p. m.' }, { value: 'h23', label: '24 h · 14:30' }];
  readonly dateRows = computed(() => DATE_ROWS.map(([k, name, use]) => ({ name, use, es: this.fmt(k, 'es'), en: this.fmt(k, 'en') })));
  private fmt(k: string, lang: 'es' | 'en') {
    const hourCycle = (this.hourCycle() ?? 'h12') as 'h12' | 'h23';
    const now = new Date();
    if (k === 'rel') return `${formatRelative(new Date(now.getTime() - 3 * 3600e3), now, lang)} · ${formatRelative(new Date(now.getTime() + 3 * 86400e3), now, lang)}`;
    if (k === 'range') return formatRange(this.base, new Date('2026-03-15T15:00:00Z'), { lang });
    return formatDate(this.base, k as Parameters<typeof formatDate>[1], { lang, hourCycle });
  }
  readonly updated = formatRelative(new Date(Date.now() - 3 * 3600e3), new Date(), 'es');
  readonly updatedFull = formatDate(new Date(Date.now() - 3 * 3600e3), 'dt-medium');
  readonly expires = formatDate(new Date(Date.now() + 7 * 86400e3), 'medium');
  readonly validity = formatRange(this.base, new Date('2026-12-31T15:00:00Z'));

  // Espacio y targets
  readonly spaces = [4, 8, 12, 16, 24, 32, 48];
  /** Espaciado semántico (tokens.css): token, valor y dónde se usa. */
  readonly semanticSpace: readonly string[][] = [
    ["--space-inline", "8 px", "Ícono y texto, botones de una fila, chips"],
    ["--space-group", "12 px", "Elementos de un mismo grupo (accesos con terceros, opciones bajo un campo)"],
    ["--space-field", "16 px", "Entre campos (vertical) y dentro de drawers, modales y sheets"],
    ["--space-field-x", "20 px", "Entre campos en horizontal"],
    ["--space-block", "16 px", "Entre bloques de un panel o de una lista (tarjetas, KPI, filtros)"],
    ["--space-page-block", "16 px · 24 px desde 768", "Entre los bloques de una página"],
    ["--space-card", "16 px", "Entre los elementos de una tarjeta"],
    ["--space-card-inset", "16 px · 20 px desde 768", "Borde interno de una tarjeta"],
    ["--space-section", "40 px", "Entre secciones de una página (32 a 48)"],
    ["--margin-page", "16 px · 32 px desde 768", "Margen lateral de la página"],
    ["--margin-page-y", "24 px", "Margen superior e inferior de la página"],
    ["--content-max", "1200 px", "Ancho máximo del contenido"],
    ["--content-narrow", "880 px", "Ancho máximo de un formulario o flujo de un paso"]
];
  readonly radii: [string, string][] = [['8', 'rounded-sm'], ['16', 'rounded-md'], ['24', 'rounded-lg'], ['full', 'rounded-full']];
  readonly target = signal('');

  // Scroll
  readonly moves = Array.from({ length: 18 }, (_, i) => `Movimiento #${4210 + i} · consumo de S/ ${20 + i * 5}.00`);
  readonly scrollTabs: ZcTab[] = ['Resumen', 'Programas', 'Campañas', 'Lotes', 'Envíos', 'Liquidaciones', 'Reportes', 'Auditoría', 'Zona de peligro'].map(t => ({ value: t, label: t }));
  readonly scrollTab = signal<string | undefined>('Resumen');

  // Íconos, banderas y logos
  readonly icons = ICONS.map(([k, n]) => ({ k, n, code: k.replace('s:', 'solar ').replace('l:', 'lucide ') }));
  readonly countries = COUNTRIES;
  readonly logoMode = signal<string | null>('color');
  readonly logoModes: ZcSegment[] = [{ value: 'color', label: 'Color de marca' }, { value: 'mono', label: 'Monocromo' }];
  readonly logoGroups = LOGO_GROUPS.map(([g, slugs]) => ({ g, items: slugs.filter(s => LOGOS[s]).map(s => ({ s, t: LOGOS[s].t })) }));
  readonly logoCount = Object.keys(LOGOS).length;
  readonly payStrip = ['visa', 'mastercard', 'americanexpress', 'dinersclub', 'paypal', 'mercadopago'];
  readonly socials = ['facebook', 'instagram', 'youtube', 'tiktok', 'whatsapp'].map(s => ({ s, t: LOGOS[s]?.t ?? s }));

  constructor() {
    const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(() => { this.tick.update(n => n + 1); this.readTarget(); });
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-brand'] });
    afterNextRender(() => { this.tick.update(n => n + 1); this.readTarget(); });
    const onResize = () => this.readTarget();
    addEventListener('resize', onResize);
    inject(DestroyRef).onDestroy(() => { mo?.disconnect(); removeEventListener('resize', onResize); this.setFont(null); });
  }
  private readTarget() { this.target.set(getComputedStyle(document.documentElement).getPropertyValue('--target').trim()); }
}
