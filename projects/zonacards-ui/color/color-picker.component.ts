import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, model, output, signal, untracked, viewChild } from '@angular/core';
import { contrastLevel, contrastRatio, hexToHsv, hexToRgb, hsvToHex, isHex, normalizeHexInput, rgbToHex } from '@zonacards/ui/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';

/** Paleta de marca por defecto (index.html): la clave se traduce en mol.color.marca.<key>. */
export const BRAND_PALETTE: { key: string; hex: string }[] = [
  { key: 'giftealoAzul', hex: '#172948' }, { key: 'giftealoAmbar', hex: '#F8AE23' }, { key: 'negro', hex: '#000000' }, { key: 'gris600', hex: '#525252' },
  { key: 'rojo', hex: '#B91C1C' }, { key: 'naranja', hex: '#E4572E' }, { key: 'verde', hex: '#15803D' }, { key: 'turquesa', hex: '#0F766E' },
  { key: 'azul', hex: '#1D4ED8' }, { key: 'violeta', hex: '#7E22CE' }, { key: 'rosa', hex: '#BE185D' }, { key: 'blanco', hex: '#FFFFFF' },
];

const RECENT_KEY = 'zc-recent-colors';
const readRecent = (): string[] => { try { const r = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); return Array.isArray(r) ? r.filter(isHex) : []; } catch { return []; } };
const writeRecent = (r: string[]) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch { /* sin almacenamiento */ } };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
let seq = 0;

type EyeDropperCtor = new () => { open(): Promise<{ sRGBHex: string }> };

/**
 * <zc-color-picker [(value)]="hex" /> · área de saturación y brillo, tono, HEX y RGB, paleta de marca, recientes,
 * cuentagotas (si el navegador lo permite) y contraste con texto blanco y negro.
 * Teclado: flechas en el área (Shift = 10 %), flechas en el tono y en R/G/B (Shift = 10), flechas en las paletas.
 * [footer]="true" agrega Cancelar/Aplicar (lo usa zc-color-field dentro del popover).
 */
@Component({
  selector: 'zc-color-picker',
  imports: [BadgeComponent, ButtonDirective, IconComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 gap-3' },
  styles: `
    /* Muestra decorativa: puede tener poco contraste a propósito, por eso no es texto del documento. */
    .zc-aa::before { content: 'Aa'; }
    .zc-hue::-webkit-slider-thumb { -webkit-appearance:none; width:24px; height:24px; border-radius:50%; background:var(--surface); border:2px solid var(--text); box-shadow:0 1px 3px rgb(0 0 0 / .25); cursor:grab; }
    .zc-hue::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background:var(--surface); border:2px solid var(--text); cursor:grab; }
    .zc-hue:focus-visible::-webkit-slider-thumb { outline:2px solid var(--focus); outline-offset:2px; }
    .zc-hue:focus-visible::-moz-range-thumb { outline:2px solid var(--focus); outline-offset:2px; }`,
  template: `
    <div #area role="slider" tabindex="0" [attr.aria-label]="t('mol.color.area')" aria-valuemin="0" aria-valuemax="100"
      [attr.aria-valuenow]="round(s() * 100)" [attr.aria-valuetext]="t('mol.color.areaValor', { s: round(s() * 100), v: round(v() * 100) })"
      class="relative h-[168px] cursor-crosshair touch-none rounded-sm"
      [style.background]="'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(' + h() + ' 100% 50%))'"
      (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up($event)" (pointercancel)="up($event)" (keydown)="areaKey($event)">
      <span class="pointer-events-none absolute -mt-2.5 -ml-2.5 size-5 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgb(0_0_0/.35),0_2px_6px_rgb(0_0_0/.3)]"
        [style.left.%]="s() * 100" [style.top.%]="(1 - v()) * 100" [style.background]="hex()"></span>
    </div>

    <div class="flex items-center gap-3">
      <span class="size-9 shrink-0 rounded-[10px] border border-border" [style.background]="hex()" aria-hidden="true"></span>
      <div class="relative flex h-9 min-w-0 flex-1 items-center">
        <span class="absolute inset-x-0 h-3 rounded-full bg-[linear-gradient(90deg,#f00,#ff0_17%,#0f0_33%,#0ff_50%,#00f_67%,#f0f_83%,#f00)]" aria-hidden="true"></span>
        <input type="range" min="0" max="359" step="1" [value]="round(h())" [attr.aria-label]="t('mol.color.tono')" [attr.aria-valuetext]="t('mol.color.grados', { n: round(h()) })"
          class="zc-hue absolute inset-x-0 m-0 h-9 w-full cursor-pointer appearance-none bg-transparent focus:outline-none" (input)="setHue($event)" />
      </div>
      @if (eyeDropper) {
        <button type="button" class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
          [attr.aria-label]="t('mol.color.cuentagotas')" [zcTooltip]="t('mol.color.cuentagotasCorto')" (click)="pick()"><zc-icon name="l:pipette" /></button>
      }
    </div>

    <div class="grid grid-cols-[1.5fr_repeat(3,minmax(0,1fr))] gap-1.5">
      <input class="h-target-sm min-w-0 rounded-sm border bg-surface px-1.5 text-sm text-fg num outline-none focus:border-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]"
        [class]="hexInvalid() ? 'border-danger' : 'border-border-strong'" maxlength="7" spellcheck="false" autocomplete="off" [attr.aria-label]="t('mol.color.hex')"
        [attr.aria-invalid]="hexInvalid() || null" [value]="hexDraft() ?? hex()" (input)="onHex($event)" (blur)="hexDraft.set(null)" />
      @for (c of channels; track c.k; let i = $index) {
        <label class="flex h-target-sm min-w-0 items-center rounded-control border border-field-bd bg-field-bg focus-within:border-focus focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]">
          <span class="pl-2 text-caption text-muted" aria-hidden="true">{{ c.k }}</span>
          <input class="zc-bare h-full w-full min-w-0 bg-transparent px-1.5 text-sm text-fg num outline-none" inputmode="numeric" maxlength="3"
            [attr.aria-label]="t(c.label)" [value]="rgb()[i]" (beforeinput)="digitsOnly($event)" (input)="onRgb(i, $event)" (keydown)="rgbKey(i, $event)" />
        </label>
      }
    </div>

    <div class="grid gap-1.5">
      <span class="text-caption font-semibold text-muted" [id]="uid + '-pal'">{{ t('mol.color.paleta') }}</span>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(32px,40px))] gap-1.5" role="listbox" [attr.aria-labelledby]="uid + '-pal'" (keydown)="chipKey($event)">
        @for (p of palette(); track p.hex) {
          <button type="button" role="option" class="aspect-square min-h-8 cursor-pointer rounded-sm border border-black/12 p-0 aria-selected:shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--text)]"
            [style.background]="p.hex" [attr.aria-selected]="p.hex === hex()" [attr.aria-label]="t('mol.color.marca.' + p.key) + ' ' + p.hex"
            [zcTooltip]="t('mol.color.marca.' + p.key) + ' · ' + p.hex" (click)="setHex(p.hex)"></button>
        }
      </div>
    </div>
    @if (recent().length) {
      <div class="grid gap-1.5">
        <span class="text-caption font-semibold text-muted" [id]="uid + '-rec'">{{ t('mol.color.recientes') }}</span>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(32px,40px))] gap-1.5" role="listbox" [attr.aria-labelledby]="uid + '-rec'" (keydown)="chipKey($event)">
          @for (r of recent(); track r) {
            <button type="button" role="option" class="aspect-square min-h-8 cursor-pointer rounded-sm border border-black/12 p-0 aria-selected:shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--text)]"
              [style.background]="r" [attr.aria-selected]="r === hex()" [attr.aria-label]="t('mol.color.recienteX', { hex: r })" [zcTooltip]="r" (click)="setHex(r)"></button>
          }
        </div>
      </div>
    }

    <div class="grid gap-1.5 border-t border-border pt-2" aria-live="polite">
      @for (c of contrast(); track c.on) {
        <span class="flex flex-wrap items-center gap-2 text-sm">
          <span class="grid h-7 w-9 place-items-center rounded-xs border border-border text-sm font-semibold" [style.background]="hex()" [style.color]="c.color" aria-hidden="true"><span class="zc-aa"></span></span>
          <span>{{ t('mol.color.textoSobre', { c: t('mol.color.' + c.on) }) }} <strong class="num">{{ c.ratio.toFixed(1) }}:1</strong></span>
          <zc-badge class="ml-auto" [tone]="c.level === 'aa' ? 'success' : c.level === 'large' ? 'warning' : 'danger'"
            [icon]="c.level === 'aa' ? 's:check-circle' : c.level === 'large' ? 's:danger-triangle' : 's:close-circle'">{{ t('mol.color.nivel.' + c.level) }}</zc-badge>
        </span>
      }
      <span class="text-caption leading-4.5 text-muted">{{ t('mol.color.recomendado', { c: t('mol.color.' + best()) }) }}</span>
    </div>

    @if (footer()) {
      <div class="flex justify-end gap-2 border-t border-border pt-3">
        <button zcButton variant="ghost" size="sm" (click)="cancel.emit()">{{ t('ui.cancelar') }}</button>
        <button zcButton size="sm" (click)="apply()">{{ t('ui.aplicar') }}</button>
      </div>
    }`,
})
export class ColorPickerComponent {
  readonly t = injectTranslate();
  readonly value = model('#172948');
  readonly palette = input(BRAND_PALETTE);
  readonly footer = input(false);
  readonly applied = output<string>();
  readonly cancel = output<void>();
  readonly uid = `zc-cp-${++seq}`;
  readonly channels = [{ k: 'R', label: 'mol.color.r' }, { k: 'G', label: 'mol.color.g' }, { k: 'B', label: 'mol.color.b' }];
  readonly eyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  readonly round = Math.round;
  private readonly area = viewChild.required<ElementRef<HTMLElement>>('area');

  /** HSV interno: el tono se conserva aunque el color sea gris o negro. */
  readonly h = signal(0); readonly s = signal(0); readonly v = signal(0);
  readonly hex = computed(() => hsvToHex(this.h(), this.s(), this.v()));
  readonly rgb = computed(() => hexToRgb(this.hex()));
  readonly hexDraft = signal<string | null>(null);
  readonly hexInvalid = computed(() => { const d = this.hexDraft(); return d !== null && d.length === 7 && !isHex(d); });
  readonly recent = signal<string[]>(readRecent());
  readonly contrast = computed(() => (['blanco', 'negro'] as const).map(on => {
    const color = on === 'blanco' ? '#FFFFFF' : '#000000'; const ratio = contrastRatio(this.hex(), color);
    return { on, color, ratio, level: contrastLevel(ratio) };
  }));
  readonly best = computed(() => (this.contrast()[0].ratio >= this.contrast()[1].ratio ? 'blanco' : 'negro'));

  private last = '';
  constructor() {
    // Sincroniza el HSV con el valor externo solo cuando cambia desde fuera (así no se pierde el tono de un gris).
    effect(() => { const x = this.value(); untracked(() => { if (isHex(x) && x.toUpperCase() !== this.last) this.load(x.toUpperCase()); }); });
  }

  private load(x: string) { const [h, s, v] = hexToHsv(x); if (s > 0) this.h.set(h); this.s.set(s); this.v.set(v); this.last = x; }
  private emit() { this.last = this.hex(); this.value.set(this.hex()); }
  setHex(x: string) { if (!isHex(x)) return; this.load(x.toUpperCase()); this.value.set(x.toUpperCase()); }

  // Área
  private dragging = false;
  private fromPointer(e: PointerEvent) {
    const r = this.area().nativeElement.getBoundingClientRect();
    this.s.set(clamp((e.clientX - r.left) / r.width, 0, 1)); this.v.set(clamp(1 - (e.clientY - r.top) / r.height, 0, 1)); this.emit();
  }
  down(e: PointerEvent) { e.preventDefault(); const el = this.area().nativeElement; el.focus(); el.setPointerCapture?.(e.pointerId); this.dragging = true; this.fromPointer(e); }
  move(e: PointerEvent) { if (this.dragging) this.fromPointer(e); }
  up(e: PointerEvent) { this.dragging = false; this.area().nativeElement.releasePointerCapture?.(e.pointerId); }
  areaKey(e: KeyboardEvent) {
    const st = e.shiftKey ? 0.1 : 0.01;
    const m = ({ ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] } as Record<string, number[]>)[e.key];
    if (!m) return;
    e.preventDefault(); this.s.set(clamp(this.s() + m[0], 0, 1)); this.v.set(clamp(this.v() + m[1], 0, 1)); this.emit();
  }
  setHue(e: Event) { this.h.set(+(e.target as HTMLInputElement).value); this.emit(); }

  // HEX y RGB
  onHex(e: Event) {
    const el = e.target as HTMLInputElement; const v = normalizeHexInput(el.value);
    el.value = v; this.hexDraft.set(v);
    if (isHex(v)) { this.load(v); this.value.set(v); }
  }
  digitsOnly(e: Event) { const d = (e as InputEvent).data; if (d && /\D/.test(d)) e.preventDefault(); }
  onRgb(i: number, e: Event) {
    const el = e.target as HTMLInputElement; const n = Math.min(255, +el.value.replace(/\D/g, '') || 0);
    if (+el.value > 255) el.value = '255';
    const c = [...this.rgb()] as [number, number, number]; c[i] = n; this.setHex(rgbToHex(...c));
  }
  rgbKey(i: number, e: KeyboardEvent) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const c = [...this.rgb()] as [number, number, number];
    c[i] = clamp(c[i] + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1), 0, 255); this.setHex(rgbToHex(...c));
  }

  // Paletas: flechas recorren (6 por fila).
  chipKey(e: KeyboardEvent) {
    const d = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: 6, ArrowUp: -6 } as Record<string, number>)[e.key];
    if (!d) return;
    const all = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role=option]')];
    const i = all.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault(); (all[i + d] ?? all[i]).focus();
  }

  async pick() {
    try { const r = await new (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper().open(); this.setHex(r.sRGBHex.toUpperCase()); } catch { /* cancelado */ }
  }

  /** Guarda el color en recientes (máximo 8) y lo confirma. */
  apply() {
    const x = this.hex(); const r = [x, ...readRecent().filter(c => c !== x)].slice(0, 8);
    writeRecent(r); this.recent.set(r); this.applied.emit(x);
  }
  refreshRecent() { this.recent.set(readRecent()); }
}
