import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, effect, inject, input, model, viewChild } from '@angular/core';
import { COUNTRIES, CountryCode, countryByCode } from '@zonacards/ui/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { FlagComponent } from '@zonacards/ui/flag';
import { injectTranslate } from '@zonacards/ui/core';
import { Panel } from '@zonacards/ui/panel';

let seq = 0;

/**
 * País de operación en la barra superior (index.html: bandera + moneda). Abre la lista de países con moneda,
 * identificador tributario y zona horaria; elegir uno filtra los datos y define moneda, impuesto y zona horaria.
 * Popover en desktop y bottom sheet en móvil; flechas recorren y Enter o Espacio eligen.
 * [allowed] limita la lista al alcance del rol: con un solo país se muestra fijo (sin menú) y un valor fuera del alcance
 * pasa al primer país permitido.
 */
@Component({
  selector: 'zc-country-switcher',
  imports: [ButtonDirective, FlagComponent],
  providers: [Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    @if (countries().length < 2) {
      <span class="inline-flex h-target-sm items-center gap-2 px-3 text-sm" role="img" [attr.aria-label]="t('top.pais.fijo', { pais: info().name, moneda: info().currency })">
        <zc-flag [code]="value()" [size]="18" /><span class="num max-sm:hidden">{{ info().currency }}</span>
      </span>
    } @else {
    <button #trigger zcButton variant="ghost" size="sm" aria-haspopup="dialog" [attr.aria-expanded]="panel.isOpen()"
      [attr.aria-label]="t('top.pais.boton', { pais: info().name, moneda: info().currency })" (click)="toggle()">
      <zc-flag [code]="value()" [size]="18" /><span class="num max-sm:hidden">{{ info().currency }}</span>
    </button>
    }
    <ng-template #tpl>
      <div class="grid grid-cols-[minmax(0,1fr)] gap-1 p-1">
        <!-- Rótulo visible solo en el popover; en sheet el título ya es del sheet (el grupo conserva su nombre accesible). --><span class="px-2 pt-1 text-xs text-muted" [class.sr-only]="panel.mode() !== 'popover'" [id]="uid">{{ t('top.pais.titulo') }}</span>
        <div role="radiogroup" [attr.aria-labelledby]="uid" class="grid gap-0.5" (keydown)="onKey($event)">
          @for (c of countries(); track c.code) {
            <button type="button" role="radio" [attr.aria-checked]="c.code === value()" [tabIndex]="c.code === value() ? 0 : -1" [attr.data-autofocus]="c.code === value() ? '' : null"
              class="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-1.5 text-left hover:bg-surface-2 focus-visible:bg-surface-2" (click)="pick(c.code)">
              <span class="grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-border-strong" [class.border-primary]="c.code === value()">
                @if (c.code === value()) { <span class="size-2 rounded-full bg-primary"></span> }
              </span>
              <zc-flag [code]="c.code" [size]="18" />
              <span class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
                <span class="text-body leading-5">{{ c.name }}</span>
                <span class="text-caption text-muted">{{ c.currency }} · {{ c.taxId }} · {{ city(c.timeZone) }}</span>
              </span>
            </button>
          }
        </div>
        <p class="m-0 px-2 pt-1 pb-1.5 text-caption leading-4.5 text-muted">{{ t('top.pais.ayuda') }}</p>
      </div>
    </ng-template>`,
})
export class CountrySwitcherComponent {
  readonly panel = inject(Panel);
  readonly t = injectTranslate();
  readonly value = model<CountryCode>('pe');
  /** Países del alcance del rol; null = todos. */
  readonly allowed = input<readonly CountryCode[] | null>(null);
  readonly countries = computed(() => { const a = this.allowed(); return a ? COUNTRIES.filter(c => a.includes(c.code)) : COUNTRIES; });
  readonly uid = `zc-cty-${++seq}`;
  readonly info = computed(() => countryByCode(this.value()));
  private readonly trigger = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  constructor() {
    // Un país fuera del alcance (cambio de rol o valor guardado) pasa al primero permitido.
    effect(() => {
      const list = this.countries();
      if (list.length && !list.some(c => c.code === this.value())) this.value.set(list[0].code);
    });
  }
  city(tz: string) { return tz.split('/')[1].replace(/_/g, ' '); }

  toggle() {
    if (this.panel.isOpen()) { this.panel.close(); return; }
    this.panel.open(this.tpl(), { title: this.t('top.pais.titulo'), ariaLabel: this.t('top.pais.titulo'), role: 'dialog', origin: this.trigger()!.nativeElement, width: 320, align: 'end', trap: true });
  }
  pick(c: CountryCode) { this.value.set(c); this.panel.close(); }
  onKey(e: KeyboardEvent) {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const list = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role=radio]')];
    const i = list.indexOf(document.activeElement as HTMLElement);
    list[(i + d + list.length) % list.length]?.focus();
  }
}
