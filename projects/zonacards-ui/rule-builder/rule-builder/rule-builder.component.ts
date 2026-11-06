import { NgTemplateOutlet } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { COUNTRIES, CountryCode, countryByCode } from '@zonacards/ui/core';
import { currencySymbol, formatMoney } from '@zonacards/ui/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';
import { InputDirective } from '@zonacards/ui/field';
import { InputGroupComponent } from '@zonacards/ui/input-group';
import { ZcOption } from '@zonacards/ui/listbox';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import { SelectComponent } from '@zonacards/ui/select';

export type ZcRuleFieldType = 'money' | 'num' | 'country' | 'enum' | 'text';
/** Opción de un campo enum: el valor se guarda en la regla y la etiqueta se muestra (un string sirve de ambos). */
export type ZcRuleOption = string | { value: string; label: string };
export interface ZcRuleField {
  id: string; label: string; type: ZcRuleFieldType;
  /** Opciones de un campo enum. */ options?: readonly ZcRuleOption[];
  /** Decimales permitidos en money/num (por defecto: los de la moneda del país en money, 0 en num). */ decimals?: number;
}
export interface ZcRuleCond { field: string; op: string; value: string }
export interface ZcRuleGroup { op: 'and' | 'or'; items: (ZcRuleCond | ZcRuleGroup)[] }

const OPS: Record<ZcRuleFieldType, string[]> = { money: ['gt', 'gte', 'lt', 'lte', 'eq'], num: ['gt', 'gte', 'lt', 'lte', 'eq'], country: ['in', 'nin'], enum: ['in', 'nin'], text: ['has', 'eq'] };
const optValue = (o: ZcRuleOption) => (typeof o === 'string' ? o : o.value);
const optLabel = (o: ZcRuleOption) => (typeof o === 'string' ? o : o.label);
const isGroup = (x: ZcRuleCond | ZcRuleGroup): x is ZcRuleGroup => 'items' in x;
type Path = number[];

/**
 * <zc-rule-builder [fields]="campos" [(rule)]="regla" country="pe" /> · constructor de reglas y segmentos (o-rules de index.html).
 * Condiciones con campo, operador y valor, unidas con Todas (Y) / Alguna (O), con un nivel de grupos anidados.
 * Debajo, la frase que resume la regla. Sirve para antifraude, promociones, límites y segmentación.
 */
@Component({
  selector: 'zc-rule-builder',
  imports: [NgTemplateOutlet, ButtonDirective, IconComponent, TooltipDirective, InputDirective, InputGroupComponent, SegmentedComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    <ng-container *ngTemplateOutlet="groupTpl; context: { $implicit: rule(), path: [], depth: 0 }" />
    <div class="flex items-start gap-3 rounded-md bg-surface-2 p-4 leading-5.5" aria-live="polite">
      <zc-icon name="s:checklist-minimalistic" [size]="20" class="mt-px shrink-0" />
      <span class="min-w-0 break-words">{{ t('mol.reglas.seActiva') }} <strong>{{ summary() }}</strong>.</span>
    </div>

    <ng-template #groupTpl let-g let-path="path" let-depth="depth">
      <div role="group" [attr.aria-label]="t('mol.reglas.grupo')" class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 rounded-md border border-border p-3"
        [class]="depth ? 'border-dashed bg-surface-2' : 'bg-surface'">
        <div class="flex flex-wrap items-center gap-2">
          <zc-segmented size="sm" [label]="t('mol.reglas.unir')" [options]="joins()" [value]="g.op" (valueChange)="setOp(path, $any($event))" />
          @if (depth) {
            <button zcButton variant="ghost" size="icon-sm" class="ml-auto" [attr.aria-label]="t('mol.reglas.quitarGrupo')" [zcTooltip]="t('mol.reglas.quitarGrupo')" (click)="remove(path)"><zc-icon name="s:trash-bin-trash" [size]="16" /></button>
          }
        </div>
        @for (c of g.items; track $index; let i = $index) {
          @if (i) { <span class="justify-self-start rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-muted" aria-hidden="true">{{ g.op === 'and' ? t('mol.reglas.y') : t('mol.reglas.o') }}</span> }
          @if (isGroup(c)) {
            <ng-container *ngTemplateOutlet="groupTpl; context: { $implicit: c, path: path.concat(i), depth: depth + 1 }" />
          } @else {
            <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <zc-select class="max-md:col-start-1" [ariaLabel]="t('mol.reglas.campo')" [options]="fieldOptions()" [value]="c.field" (valueChange)="setField(path.concat(i), $any($event))" />
              <zc-select class="max-md:col-start-1" [ariaLabel]="t('mol.reglas.operador')" [options]="opOptions(c)" [value]="c.op" (valueChange)="setCond(path.concat(i), { op: $any($event) })" />
              @switch (type(c)) {
                @case ('country') { <zc-select class="max-md:col-start-1" [ariaLabel]="t('mol.reglas.pais')" [options]="countries" [value]="c.value" (valueChange)="setCond(path.concat(i), { value: $any($event) })" /> }
                @case ('enum') { <zc-select class="max-md:col-start-1" [ariaLabel]="fieldOf(c).label" [options]="enumOptions(c)" [value]="c.value" (valueChange)="setCond(path.concat(i), { value: $any($event) })" /> }
                @default {
                  <zc-input-group class="max-md:col-start-1" [prefixText]="type(c) === 'money' ? currency() : ''">
                    <input zcInput [attr.inputmode]="type(c) === 'text' ? 'text' : decimals(fieldOf(c)) ? 'decimal' : 'numeric'" [attr.aria-label]="t('mol.reglas.valor')" [value]="c.value"
                      (input)="setValue(path.concat(i), $any($event.target))" />
                  </zc-input-group>
                }
              }
              <button zcButton variant="ghost" size="icon-sm" class="max-md:col-start-2 max-md:row-start-1" [attr.aria-label]="t('mol.reglas.quitarCondicion')" [zcTooltip]="t('mol.reglas.quitar')" (click)="remove(path.concat(i))"><zc-icon name="l:x" [size]="16" /></button>
            </div>
          }
        }
        <div class="flex flex-wrap gap-2">
          <button zcButton variant="ghost" size="sm" (click)="addCond(path)"><zc-icon name="s:add-circle" [size]="16" />{{ t('mol.reglas.condicion') }}</button>
          @if (!depth) { <button zcButton variant="ghost" size="sm" (click)="addGroup()"><zc-icon name="s:add-circle" [size]="16" />{{ t('mol.reglas.grupoBtn') }}</button> }
        </div>
      </div>
    </ng-template>`,
})
export class RuleBuilderComponent {
  readonly t = injectTranslate();
  private readonly live = inject(LiveAnnouncer);
  readonly fields = input.required<readonly ZcRuleField[]>();
  readonly rule = model.required<ZcRuleGroup>();
  readonly country = input<CountryCode>('pe');
  readonly isGroup = isGroup;

  readonly countries: ZcOption<string>[] = COUNTRIES.map(c => ({ value: c.code, label: c.name, flag: c.code }));
  readonly currency = computed(() => currencySymbol(this.country()));
  readonly joins = computed<ZcSegment<'and' | 'or'>[]>(() => [{ value: 'and', label: this.t('mol.reglas.todas') }, { value: 'or', label: this.t('mol.reglas.alguna') }]);
  readonly fieldOptions = computed<ZcOption<string>[]>(() => this.fields().map(f => ({ value: f.id, label: f.label })));

  fieldOf(c: ZcRuleCond) { return this.fields().find(f => f.id === c.field) ?? this.fields()[0]; }
  type(c: ZcRuleCond) { return this.fieldOf(c).type; }
  opOptions(c: ZcRuleCond): ZcOption<string>[] { return OPS[this.type(c)].map(o => ({ value: o, label: this.t('mol.reglas.op.' + o) })); }
  enumOptions(c: ZcRuleCond): ZcOption<string>[] { return (this.fieldOf(c).options ?? []).map(o => ({ value: optValue(o), label: optLabel(o) })); }
  /** Decimales del campo: los indicados, o los de la moneda del país (S/ 2, CLP 0) en money. */
  decimals(f: ZcRuleField) { return f.decimals ?? (f.type === 'money' ? countryByCode(this.country()).decimals : 0); }

  /** Frase de la regla: "monto de la compra es mayor que S/ 1.000,00 y país es Perú y (canal es API o …)". */
  readonly summary = computed(() => this.groupText(this.rule()));
  private condText(c: ZcRuleCond) {
    const f = this.fieldOf(c);
    const v = f.type === 'country' ? (c.value ? countryByCode(c.value as CountryCode).name : '…')
      : f.type === 'money' ? (c.value ? formatMoney(+c.value, this.country()) : '…')
      : f.type === 'enum' ? this.enumLabel(f, c.value)
      : c.value || '…';
    return f.label.toLowerCase() + ' ' + this.t('mol.reglas.op.' + c.op) + ' ' + v;
  }
  private enumLabel(f: ZcRuleField, value: string) {
    const o = f.options?.find(x => optValue(x) === value);
    return o ? optLabel(o) : value || '…';
  }
  private groupText(g: ZcRuleGroup): string {
    const sep = ' ' + (g.op === 'and' ? this.t('mol.reglas.y') : this.t('mol.reglas.o')).toLowerCase() + ' ';
    return g.items.map(x => (isGroup(x) ? '(' + this.groupText(x) + ')' : this.condText(x))).join(sep);
  }

  // ---- Cambios: se clona, se modifica por ruta y se publica ----
  private mutate(fn: (root: ZcRuleGroup) => void) { const r = structuredClone(this.rule()); fn(r); this.rule.set(r); }
  private at(root: ZcRuleGroup, path: Path): ZcRuleGroup | ZcRuleCond { return path.reduce<ZcRuleGroup | ZcRuleCond>((n, i) => (n as ZcRuleGroup).items[i], root); }
  private newCond(): ZcRuleCond { const f = this.fields()[0]; return { field: f.id, op: OPS[f.type][0], value: this.defaultValue(f) }; }
  private defaultValue(f: ZcRuleField) { return f.type === 'country' ? this.country() : f.type === 'enum' && f.options?.length ? optValue(f.options[0]) : ''; }

  setOp(path: Path, op: 'and' | 'or') { this.mutate(r => { (this.at(r, path) as ZcRuleGroup).op = op; }); }
  setCond(path: Path, p: Partial<ZcRuleCond>) { this.mutate(r => Object.assign(this.at(r, path), p)); }
  setField(path: Path, id: string) {
    const f = this.fields().find(x => x.id === id)!;
    this.setCond(path, { field: id, op: OPS[f.type][0], value: this.defaultValue(f) });
  }
  setValue(path: Path, el: HTMLInputElement) {
    const c = this.at(this.rule(), path) as ZcRuleCond;
    const f = this.fieldOf(c);
    const v = f.type === 'text' ? el.value : this.cleanNumber(el.value, this.decimals(f));
    if (v !== el.value) el.value = v;
    this.setCond(path, { value: v });
  }
  /** Solo dígitos y un separador decimal (punto o coma, se guarda con punto), con el máximo de decimales del campo. */
  private cleanNumber(raw: string, decimals: number) {
    const [int, ...rest] = raw.replace(',', '.').replace(/[^\d.]/g, '').split('.');
    return decimals && rest.length ? int + '.' + rest.join('').slice(0, decimals) : int;
  }
  addCond(path: Path) { this.mutate(r => (this.at(r, path) as ZcRuleGroup).items.push(this.newCond())); }
  addGroup() { this.mutate(r => r.items.push({ op: 'or', items: [this.newCond()] })); }
  remove(path: Path) {
    if (path.length === 1 && this.rule().items.length === 1) { this.live.announce(this.t('mol.reglas.minimo')); return; }
    this.mutate(r => {
      const parent = this.at(r, path.slice(0, -1)) as ZcRuleGroup;
      parent.items.splice(path[path.length - 1], 1);
      // Un grupo anidado que queda vacío se quita.
      if (path.length > 1 && !parent.items.length) (this.at(r, path.slice(0, -2)) as ZcRuleGroup).items.splice(path[path.length - 2], 1);
    });
  }
}
