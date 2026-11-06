import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, output, signal, viewChild } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { injectTranslate } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';

type Point = [x: number, y: number, w: number];
export interface SignatureResult { mode: 'draw' | 'type'; /** PNG de la firma dibujada. */ image: string | null; /** Nombre escrito. */ name: string | null; at: Date; }

/**
 * <zc-field label="Firma del responsable" [required]="true" [hint]="…" [error]="s.error()" [success]="s.success()">
 *   <zc-signature #s (signed)="guardar($event)" />
 * </zc-field>
 * Dibujar con dedo, lápiz o mouse (el grosor sigue la presión y la velocidad), o escribir el nombre como alternativa accesible.
 * Deshacer trazo, limpiar y validación de firma vacía (menos de 8 puntos, o nombre sin apellido).
 */
@Component({
  selector: 'zc-signature',
  imports: [ButtonDirective, IconComponent, SegmentedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 gap-2' },
  template: `
    <zc-segmented class="justify-self-start" size="sm" [label]="t('mol.firma.modo')" [options]="modes()" [value]="mode()" (valueChange)="setMode($event)" />
    <div class="relative h-[200px] touch-none overflow-hidden rounded-md border bg-surface" [class]="error() ? 'border-solid border-danger' : 'border-dashed border-border-strong'">
      <canvas #cv class="absolute inset-0 size-full cursor-crosshair" [hidden]="mode() === 'type'" role="img" [attr.aria-label]="t('mol.firma.area')"
        (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up()" (pointercancel)="up()"></canvas>
      @if (mode() === 'draw' && !strokes().length) { <span class="pointer-events-none absolute bottom-11 left-5 text-body text-subtle">{{ t('mol.firma.aqui') }}</span> }
      <span class="pointer-events-none absolute right-5 bottom-9 left-5 h-px bg-border-strong" aria-hidden="true"></span>
      @if (mode() === 'type') {
        <div class="absolute inset-0 grid content-center gap-1.5 p-5">
          <input #nameIn class="border-0 border-b border-border bg-transparent py-1.5 text-body text-fg outline-none focus-visible:border-focus" autocomplete="name"
            [id]="field?.controlId" [attr.aria-describedby]="field?.messageId" [placeholder]="t('mol.firma.escribeNombre')" [value]="name()" (input)="setName($event)" />
          <span class="min-h-11 font-['Segoe_Script','Brush_Script_MT','Apple_Chancery',cursive] text-display-lg leading-[1.2] text-fg" aria-hidden="true">{{ name() }}</span>
        </div>
      }
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="flex gap-1">
        @if (mode() === 'draw') {
          <button zcButton variant="ghost" size="sm" [disabled]="!strokes().length" (click)="undo()"><zc-icon name="l:undo-2" [size]="16" />{{ t('mol.firma.deshacer') }}</button>
          <button zcButton variant="ghost" size="sm" [disabled]="!strokes().length" (click)="clear()">{{ t('ui.limpiar') }}</button>
        }
      </span>
      <button zcButton size="sm" (click)="confirm()">{{ t('mol.firma.confirmar') }}</button>
    </div>`,
})
export class SignatureComponent {
  readonly field = inject(FieldComponent, { optional: true });
  readonly t = injectTranslate();
  readonly signed = output<SignatureResult>();
  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly nameIn = viewChild<ElementRef<HTMLInputElement>>('nameIn');
  readonly mode = signal<'draw' | 'type'>('draw');
  readonly strokes = signal<Point[][]>([]);
  readonly name = signal('');
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly modes = computed<ZcSegment<'draw' | 'type'>[]>(() => [
    { value: 'draw', label: this.t('mol.firma.dibujar'), icon: 's:pen' }, { value: 'type', label: this.t('mol.firma.escribir'), icon: 'l:heading-2' },
  ]);
  private cur: Point[] | null = null;

  constructor() {
    // El trazo usa el color de texto del tema: se redibuja al cambiar de tema. Observadores solo en el navegador (SSR).
    let ro: ResizeObserver | undefined; let mo: MutationObserver | undefined;
    afterNextRender(() => {
      ro = new ResizeObserver(() => this.size()); mo = new MutationObserver(() => this.redraw());
      ro.observe(this.cv().nativeElement); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); this.size();
    });
    inject(DestroyRef).onDestroy(() => { ro?.disconnect(); mo?.disconnect(); });
  }

  private size() {
    const c = this.cv().nativeElement; const r = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    if (!r.width) return;
    c.width = r.width * dpr; c.height = r.height * dpr; c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0); this.redraw();
  }
  private redraw() {
    const c = this.cv().nativeElement; const ctx = c.getContext('2d'); if (!ctx) return;
    const r = c.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#000';
    for (const s of this.strokes()) for (let i = 1; i < s.length; i++) {
      ctx.lineWidth = s[i][2]; ctx.beginPath(); ctx.moveTo(s[i - 1][0], s[i - 1][1]); ctx.lineTo(s[i][0], s[i][1]); ctx.stroke();
    }
  }
  private pt(e: PointerEvent): Point {
    const r = this.cv().nativeElement.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top, Math.max(1.4, Math.min(3.6, 2.6 * (e.pressure > 0 && e.pointerType !== 'mouse' ? e.pressure * 2 : 1)))];
  }
  down(e: PointerEvent) {
    e.preventDefault(); this.cv().nativeElement.setPointerCapture?.(e.pointerId);
    this.cur = [this.pt(e)]; this.strokes.update(s => [...s, this.cur!]);
  }
  move(e: PointerEvent) {
    if (!this.cur) return;
    const p = this.pt(e); const l = this.cur[this.cur.length - 1];
    p[2] = Math.max(1.2, Math.min(3.4, 3.6 - Math.hypot(p[0] - l[0], p[1] - l[1]) / 8)); // más rápido, más fino
    this.cur.push(p); this.redraw();
  }
  up() { if (!this.cur) return; this.cur = null; this.error.set(null); this.strokes.update(s => [...s]); }
  undo() { this.strokes.update(s => s.slice(0, -1)); this.redraw(); }
  clear() { this.strokes.set([]); this.redraw(); }
  setName(e: Event) { this.name.set((e.target as HTMLInputElement).value); this.error.set(null); }
  setMode(m: 'draw' | 'type' | null) {
    this.mode.set(m ?? 'draw'); this.error.set(null);
    if (this.mode() === 'type') setTimeout(() => this.nameIn()?.nativeElement.focus()); else setTimeout(() => this.size());
  }

  confirm() {
    const draw = this.mode() === 'draw';
    const empty = draw ? this.strokes().reduce((a, s) => a + s.length, 0) < 8 : this.name().trim().split(/\s+/).filter(Boolean).length < 2;
    if (empty) { this.success.set(null); this.error.set(this.t(draw ? 'mol.firma.vaciaDibujo' : 'mol.firma.vaciaNombre')); return; }
    this.error.set(null); this.success.set(this.t('mol.firma.registrada'));
    this.signed.emit({ mode: this.mode(), image: draw ? this.cv().nativeElement.toDataURL('image/png') : null, name: draw ? null : this.name().trim(), at: new Date() });
  }
}
