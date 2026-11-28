import { ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, input, linkedSignal, model, signal, untracked } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { IsoDate, isIsoDate, isValidHm } from '@zonacards/ui/core';
import { DateFieldComponent } from '@zonacards/ui/date-field';
import { FieldComponent } from '@zonacards/ui/field';
import { TimeFieldComponent } from '@zonacards/ui/time-field';

/**
 * <zc-field label="Envío programado"><zc-datetime-field [(value)]="envio" [min]="hoy" /></zc-field>
 * Fecha y hora en un solo campo (equivale al `granularity` de DatePicker de HeroUI): un campo de fecha y uno de hora lado a lado, con un solo valor
 * "aaaa-mm-ddThh:mm" (hora local de la operación, sin zona). Mientras falte una de las dos partes el valor es `null` y las dos partes se conservan
 * en pantalla, así `Validators.required` falla hasta que estén completas. `min`, `max` y `unavailable` valen para la fecha.
 * Funciona con [(value)] o con formularios reactivos.
 */
@Component({
  selector: 'zc-datetime-field',
  imports: [DateFieldComponent, TimeFieldComponent, TranslocoPipe],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateTimeFieldComponent), multi: true }],
  // Los dos campos de adentro no deben tomar el id ni la etiqueta del zc-field que contiene a este.
  viewProviders: [{ provide: FieldComponent, useValue: null }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div role="group" class="grid grid-cols-[minmax(0,1fr)_minmax(0,9rem)] gap-3"
      [attr.aria-labelledby]="field?.labelId" [attr.aria-label]="field ? null : (ariaLabel() || ('ui.fechaYHora' | transloco))"
      [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null">
      <zc-date-field [value]="date()" (valueChange)="setDate($event)" [min]="min()" [max]="max()" [unavailable]="unavailable()" [timeZone]="timeZone()"
        [shortcuts]="[]" [disabled]="isDisabled()" [invalid]="invalidState()" [fieldLink]="false" [ariaLabel]="'ui.fecha' | transloco" (focusout)="onTouched()" />
      <zc-time-field [value]="time()" (valueChange)="setTime($event)" [from]="timeFrom()" [to]="timeTo()" [step]="step()" [disabled]="isDisabled()"
        [invalid]="invalidState()" [fieldLink]="false" [ariaLabel]="'ui.hora' | transloco" (focusout)="onTouched()" />
    </div>`,
})
export class DateTimeFieldComponent implements ControlValueAccessor {
  readonly min = input<IsoDate | null>(null);
  readonly max = input<IsoDate | null>(null);
  readonly unavailable = input<((d: IsoDate) => boolean) | null>(null);
  readonly timeZone = input('America/Lima');
  /** Horas que se ofrecen en la lista (la hora también se puede escribir). */
  readonly timeFrom = input('00:00');
  readonly timeTo = input('23:30');
  readonly step = input(30);
  /** Nombre accesible si no hay un zc-field que lo nombre. */
  readonly ariaLabel = input('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  /** "aaaa-mm-ddThh:mm" o `null` mientras falte una parte. */
  readonly value = model<string | null>(null);

  // skipSelf: los viewProviders de este componente (null, para los dos campos de adentro) no cuentan; interesa el zc-field que lo contiene.
  readonly field = inject(FieldComponent, { optional: true, skipSelf: true });
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());

  // Las dos partes viven aparte para no perder lo ya elegido cuando falta la otra (el valor es null mientras falte una).
  readonly date = signal<IsoDate | string | null>(null);
  readonly time = signal<string | null>(null);
  /** Lo último que emitió este campo: un valor distinto que llega de afuera (`[(value)]`) reemplaza las dos partes; `''` las limpia. */
  private lastEmitted: string | null = null;

  constructor() {
    effect(() => {
      const v = this.value();
      untracked(() => {
        if (v === this.lastEmitted) return;
        this.lastEmitted = v;
        this.date.set(this.partOf(v, 0));
        this.time.set(this.partOf(v, 1));
      });
    });
  }

  private onChange: (v: string | null) => void = () => {};
  onTouched: () => void = () => {};

  private partOf(v: string | null, i: 0 | 1): string | null {
    if (!v) return null;
    const [d, t] = v.split('T');
    return (i === 0 ? d : t) || null;
  }

  setDate(v: IsoDate | string | null) { this.date.set(v); this.emit(); }
  setTime(v: string | null) { this.time.set(v); this.emit(); }

  private emit() {
    const d = this.date(), t = this.time();
    const v = isIsoDate(d) && t && isValidHm(t) ? `${d}T${t}` : null;
    this.lastEmitted = v;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: string | null) {
    this.lastEmitted = v ?? null;
    this.value.set(v ?? null);
    this.date.set(this.partOf(v ?? null, 0));
    this.time.set(this.partOf(v ?? null, 1));
  }
  registerOnChange(fn: (v: string | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
