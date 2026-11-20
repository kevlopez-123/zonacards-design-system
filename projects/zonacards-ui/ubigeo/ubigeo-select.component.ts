import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { FieldComponent } from '@zonacards/ui/field';
import { SelectComponent } from '@zonacards/ui/select';
import { ZcOption } from '@zonacards/ui/listbox';
import { Ubigeo, UbigeoDistrict, loadUbigeo } from './ubigeo';

/**
 * <zc-ubigeo-select [(value)]="distrito" /> · departamento › provincia › distrito del Perú (INEI).
 * El valor es el código del distrito (6 dígitos) o null. Cambiar el departamento limpia la provincia y el distrito; la provincia,
 * el distrito. Cada nivel es un combobox con búsqueda. `located` entrega el distrito con sus coordenadas (centro de mapa).
 * Carga `geo/ubigeo-pe.json` una sola vez (o pásale `[data]` si ya lo tienes).
 */
@Component({
  selector: 'zc-ubigeo-select',
  imports: [FieldComponent, SelectComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))]' },
  template: `
    <zc-field [label]="'ui.ubigeo.departamento' | transloco" [required]="required()">
      <zc-select [options]="departmentOptions()" [value]="department()" (valueChange)="setDepartment($event)" [disabled]="disabled() || !tree()"
        [placeholder]="(tree() ? 'ui.ubigeo.eligeDepartamento' : 'ui.cargando') | transloco" />
    </zc-field>
    <zc-field [label]="'ui.ubigeo.provincia' | transloco" [required]="required()">
      <zc-select [options]="provinceOptions()" [value]="province()" (valueChange)="setProvince($event)" [disabled]="disabled() || !department()"
        [placeholder]="'ui.ubigeo.eligeProvincia' | transloco" />
    </zc-field>
    <zc-field [label]="'ui.ubigeo.distrito' | transloco" [required]="required()" [error]="error()">
      <zc-select [options]="districtOptions()" [value]="value()" (valueChange)="setDistrict($event)" [disabled]="disabled() || !province()"
        [invalid]="!!error()" [placeholder]="'ui.ubigeo.eligeDistrito' | transloco" />
    </zc-field>`,
})
export class UbigeoSelectComponent {
  /** Código del distrito (INEI, 6 dígitos). */
  readonly value = model<string | null>(null);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly error = input<string | null>(null);
  /** Datos ya cargados; si se omite, se descargan de `url`. */
  readonly data = input<Ubigeo | null>(null);
  readonly url = input('geo/ubigeo-pe.json');
  /** Distrito elegido, con sus coordenadas, para centrar un mapa. */
  readonly located = output<UbigeoDistrict>();

  private readonly loaded = signal<Ubigeo | null>(null);
  readonly tree = computed(() => this.data() ?? this.loaded());
  // Departamento y provincia se siguen del valor cuando llega uno (del formulario) y los manda la persona al elegir:
  // al limpiar el valor por un cambio de nivel no se borran, por eso no son derivados.
  readonly department = signal<string | null>(null);
  readonly province = signal<string | null>(null);

  readonly departmentOptions = computed<ZcOption<string>[]>(() => (this.tree()?.departments() ?? []).map(d => ({ value: d.codigo, label: d.nombre })));
  readonly provinceOptions = computed<ZcOption<string>[]>(() => (this.tree()?.provinces(this.department()) ?? []).map(p => ({ value: p.codigo, label: p.nombre })));
  readonly districtOptions = computed<ZcOption<string>[]>(() => (this.tree()?.districts(this.province()) ?? []).map(d => ({ value: d.codigo, label: d.nombre })));

  constructor() {
    effect(() => {
      const v = this.value();
      if (v) { this.department.set(v.slice(0, 2)); this.province.set(v.slice(0, 4)); }
    });
    queueMicrotask(() => {
      if (!this.data()) loadUbigeo(this.url()).then(t => this.loaded.set(t)).catch(() => this.loaded.set(null));
    });
  }

  private one(v: string | null | (string | null)[]) { return Array.isArray(v) ? v[0] ?? null : v; }

  setDepartment(code: string | null | (string | null)[]) {
    this.department.set(this.one(code)); this.province.set(null); this.value.set(null);
  }
  setProvince(code: string | null | (string | null)[]) {
    this.province.set(this.one(code)); this.value.set(null);
  }
  setDistrict(code: string | null | (string | null)[]) {
    const c = this.one(code);
    this.value.set(c);
    const d = this.tree()?.district(c);
    if (d) this.located.emit(d);
  }
}
