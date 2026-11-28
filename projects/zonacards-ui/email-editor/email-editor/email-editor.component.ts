import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, model, output, signal } from '@angular/core';
import { ArtComponent } from '@zonacards/ui/art';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';
import { ColorFieldComponent } from '@zonacards/ui/color';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { ZcOption } from '@zonacards/ui/listbox';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import { SelectComponent } from '@zonacards/ui/select';
import { SORTABLE } from '@zonacards/ui/sortable';

export type ZcEmailBlockType = 'title' | 'text' | 'image' | 'button' | 'gift' | 'divider';
export interface ZcEmailBlock { id: string; type: ZcEmailBlockType; text?: string; align?: 'left' | 'center' | 'right'; color?: string; category?: string; small?: boolean }

const ICONS: Record<ZcEmailBlockType, IconName> = { title: 'l:heading-2', text: 's:document', image: 's:gallery', button: 's:link', gift: 's:gift', divider: 'l:minus' };
/** Luminancia aproximada para elegir texto claro u oscuro sobre el color del botón. */
const lum = (h: string) => { const n = parseInt((h || '#172948').slice(1), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };

/**
 * <zc-email-editor [(blocks)]="correo" (test)="…" /> · editor de correo por bloques (o-email de index.html).
 * Catálogo de bloques (título, texto, imagen, botón, giftcard, separador), lienzo con reordenar arrastrando (zcSortable),
 * panel para editar el bloque elegido y vista previa en escritorio y celular. El lienzo usa tokens --email-* (el correo es claro).
 */
@Component({
  selector: 'zc-email-editor',
  imports: [ArtComponent, ButtonDirective, IconComponent, TooltipDirective, ColorFieldComponent, FieldComponent, InputDirective, SegmentedComponent, SelectComponent, SORTABLE],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 min-[1100px]:grid-cols-[170px_minmax(0,1fr)_260px]' },
  template: `
    <aside class="grid min-w-0 gap-1.5" [attr.aria-label]="t('mol.correo.bloques')">
      <span class="text-caption font-semibold uppercase tracking-wide text-muted">{{ t('mol.correo.agregar') }}</span>
      <div class="flex flex-wrap gap-1.5 min-[1100px]:grid">
        @for (k of types; track k) {
          <button type="button" class="flex min-h-10 cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface px-3 text-body-sm hover:border-border-strong" (click)="add(k)">
            <zc-icon [name]="icons[k]" [size]="16" />{{ t('mol.correo.tipo.' + k) }}
          </button>
        }
      </div>
    </aside>

    <div class="grid min-w-0 gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <zc-segmented size="sm" [label]="t('mol.correo.vista')" [options]="devices()" [(value)]="device" />
        <span class="flex-1"></span>
        <button zcButton variant="outline" size="sm" (click)="test.emit()"><zc-icon name="s:letter" [size]="16" />{{ t('mol.correo.prueba') }}</button>
      </div>
      <div class="overflow-auto rounded-md bg-surface-2 px-3 py-5">
        <ul class="mx-auto grid list-none gap-1 rounded-sm bg-(--email-paper) p-4 text-(--email-ink) transition-[max-width] duration-(--dur)" [class]="device() === 'mob' ? 'max-w-[340px]' : 'max-w-[560px]'"
          [attr.aria-label]="t('mol.correo.lienzo')" [(zcSortable)]="blocks" [zcSortableLabel]="labelOf">
          @for (b of blocks(); track b.id) {
            <li [zcSortableItem]="b" [class]="itemClass(b)">
              <button type="button" zcSortableHandle [item]="b" [label]="t('mol.correo.mover', { b: labelOf(b) })"
                class="absolute top-1 left-1 z-(--z-sticky) grid size-8 place-items-center rounded-sm bg-surface text-fg opacity-0 shadow-1 group-hover:opacity-100 group-focus-within:opacity-100 aria-pressed:opacity-100 max-md:opacity-100"><zc-icon name="l:grip-vertical" [size]="16" /></button>
              <button type="button" class="absolute inset-0 z-(--z-raised) cursor-pointer rounded-[6px]" [attr.aria-label]="t('mol.correo.editarBloque', { b: labelOf(b) })" [attr.aria-pressed]="b.id === selected()" (click)="selected.set(b.id)"></button>
              @switch (b.type) {
                @case ('title') { <h2 class="m-0 text-heading text-(--email-ink)" [style.text-align]="b.align ?? 'left'">{{ b.text }}</h2> }
                @case ('text') { <p class="m-0 leading-normal" [class]="b.small ? 'text-caption text-(--email-muted)' : 'text-body text-(--email-text)'" [style.text-align]="b.align ?? 'left'">{{ b.text }}</p> }
                @case ('image') { <div class="aspect-[16/7] overflow-hidden rounded-[6px]"><zc-art [category]="b.category ?? 'Experiencias'" /></div> }
                @case ('button') {
                  <div [style.text-align]="b.align ?? 'center'"><span class="inline-block rounded-full px-[22px] py-3 font-semibold" [style.background]="b.color" [style.color]="lum(b.color!) > .4 ? 'var(--email-ink)' : 'var(--email-paper)'">{{ b.text }}</span></div>
                }
                @case ('gift') {
                  <div class="grid gap-0.5 rounded-xl bg-[radial-gradient(120%_140%_at_100%_0%,color-mix(in_srgb,var(--brand-secondary)_70%,var(--email-paper))_0%,var(--brand-secondary)_60%)] px-4 py-3.5 text-(--email-paper)">
                    <span>Giftealo</span><strong class="text-heading num">S/ 100.00</strong><span class="num">•••• 9014</span>
                  </div>
                }
                @case ('divider') { <hr class="my-1.5 border-0 border-t border-(--email-rule)" /> }
              }
            </li>
          }
        </ul>
      </div>
    </div>

    <aside class="grid min-w-0 content-start gap-3 rounded-card border border-border bg-surface p-4" [attr.aria-label]="t('mol.correo.propiedades')">
      @if (current(); as b) {
        <div class="flex items-center justify-between gap-2">
          <strong>{{ labelOf(b) }}</strong>
          <span class="flex gap-0.5">
            <button zcButton variant="ghost" size="icon-sm" [attr.aria-label]="t('mol.correo.subir')" [zcTooltip]="t('mol.orden.subir')" [disabled]="index() === 0" (click)="shift(-1)"><zc-icon name="l:arrow-up" [size]="16" /></button>
            <button zcButton variant="ghost" size="icon-sm" [attr.aria-label]="t('mol.correo.bajar')" [zcTooltip]="t('mol.orden.bajar')" [disabled]="index() === blocks().length - 1" (click)="shift(1)"><zc-icon name="l:arrow-down" [size]="16" /></button>
            <button zcButton variant="ghost" size="icon-sm" class="text-danger" [attr.aria-label]="t('mol.correo.quitar')" [zcTooltip]="t('mol.reglas.quitar')" (click)="remove()"><zc-icon name="s:trash-bin-trash" [size]="16" /></button>
          </span>
        </div>
        @if (b.type === 'title' || b.type === 'text' || b.type === 'button') {
          <zc-field [label]="t('mol.correo.texto')" [reserve]="false">
            @if (b.type === 'text') { <textarea zcInput rows="3" [value]="b.text ?? ''" (input)="patch({ text: $any($event.target).value })"></textarea> }
            @else { <input zcInput [value]="b.text ?? ''" (input)="patch({ text: $any($event.target).value })" /> }
          </zc-field>
          <div class="grid gap-1.5"><span class="text-body-sm font-medium" aria-hidden="true">{{ t('mol.correo.alineacion') }}</span>
            <zc-segmented size="sm" [label]="t('mol.correo.alineacion')" [options]="aligns()" [value]="b.align ?? (b.type === 'button' ? 'center' : 'left')" (valueChange)="patch({ align: $any($event) })" />
          </div>
        }
        @if (b.type === 'button') { <zc-field [label]="t('mol.correo.color')" [reserve]="false"><zc-color-field [value]="b.color ?? '#172948'" (valueChange)="patch({ color: $event })" /></zc-field> }
        @if (b.type === 'image') {
          <zc-field [label]="t('mol.correo.imagen')" [hint]="t('mol.correo.imagenAyuda')"><zc-select [options]="images" [value]="b.category ?? 'Experiencias'" (valueChange)="patch({ category: $any($event) })" /></zc-field>
        }
        @if (b.type === 'gift') { <p class="text-body-sm text-muted">{{ t('mol.correo.giftAyuda') }}</p> }
      } @else {
        <p class="text-body-sm text-muted">{{ t('mol.correo.elige') }}</p>
      }
    </aside>`,
})
export class EmailEditorComponent {
  readonly t = injectTranslate();
  private readonly live = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  readonly blocks = model.required<ZcEmailBlock[]>();
  readonly selected = model<string | null>(null);
  readonly test = output<void>();
  readonly types = Object.keys(ICONS) as ZcEmailBlockType[];
  readonly icons = ICONS;
  readonly lum = lum;
  readonly device = signal<string | null>('desk');
  readonly devices = computed<ZcSegment<string>[]>(() => [{ value: 'desk', label: this.t('mol.correo.escritorio'), icon: 's:monitor' }, { value: 'mob', label: this.t('mol.correo.celular'), icon: 's:smartphone' }]);
  readonly aligns = computed<ZcSegment<string>[]>(() => (['left', 'center', 'right'] as const).map(a => ({ value: a, label: this.t('mol.correo.al.' + a), icon: ('l:align-' + a) as IconName, iconOnly: true })));
  readonly images: ZcOption<string>[] = ['Gastronomía', 'Experiencias', 'Viajes', 'Tecnología', 'Moda'].map(x => ({ value: x, label: x }));
  readonly current = computed(() => this.blocks().find(b => b.id === this.selected()) ?? null);
  readonly index = computed(() => this.blocks().findIndex(b => b.id === this.selected()));
  readonly labelOf = (b: ZcEmailBlock) => this.t('mol.correo.tipo.' + b.type);
  private seq = 0;

  itemClass(b: ZcEmailBlock) {
    return 'group relative rounded-[6px] px-2 py-1.5 ' + (b.id === this.selected() ? 'outline-2 outline-solid outline-(--email-selected)' : 'outline-1 outline-dashed outline-transparent hover:outline-(--email-hover)');
  }
  patch(p: Partial<ZcEmailBlock>) { const id = this.selected(); this.blocks.update(a => a.map(b => (b.id === id ? { ...b, ...p } : b))); }
  /** Agrega después del bloque elegido (o al final) y lo deja seleccionado. */
  add(type: ZcEmailBlockType) {
    const nb: ZcEmailBlock = { id: 'nb' + ++this.seq + Date.now().toString(36), type, text: this.t('mol.correo.nuevo.' + type), color: '#172948', category: 'Viajes' };
    const i = this.index();
    this.blocks.update(a => { const c = [...a]; c.splice(i >= 0 ? i + 1 : c.length, 0, nb); return c; });
    this.selected.set(nb.id);
    this.live.announce(this.t('mol.correo.agregado', { b: this.labelOf(nb) }));
    afterNextRender(() => this.host.querySelector<HTMLElement>('[aria-pressed="true"][aria-label]')?.scrollIntoView({ block: 'nearest' }), { injector: this.injector });
  }
  shift(d: 1 | -1) { const i = this.index(); const j = i + d; this.blocks.update(a => { const c = [...a]; [c[i], c[j]] = [c[j], c[i]]; return c; }); }
  remove() {
    const i = this.index();
    const next = this.blocks()[i + 1] ?? this.blocks()[i - 1];
    this.blocks.update(a => a.filter((_, k) => k !== i));
    this.selected.set(next?.id ?? null);
    this.live.announce(this.t('mol.correo.quitado'));
  }
}
