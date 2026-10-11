import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { COUNTRIES, CountryCode, countryByCode } from '../../shared/domain/countries';
import { addDays, todayIso } from '../../shared/domain/dates';
import { fieldError } from '../../shared/forms/field-error';
import { DateRangeValue, PhoneValue, zcValidators } from '../../shared/forms/validators';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { AutocompleteComponent, AutocompletePick } from '../../shared/ui/molecules/autocomplete/autocomplete.component';
import { DateFieldComponent } from '../../shared/ui/molecules/date-field/date-field.component';
import { DateRangeComponent, presetRange } from '../../shared/ui/molecules/date-range/date-range.component';
import { FieldComponent } from '../../shared/ui/molecules/field/field.component';
import { ZcOption } from '../../shared/ui/molecules/listbox/listbox.component';
import { MoneyFieldComponent } from '../../shared/ui/molecules/money-field/money-field.component';
import { NumberFieldComponent } from '../../shared/ui/molecules/number-field/number-field.component';
import { OverlayComponent } from '../../shared/ui/organisms/overlay/overlay.component';
import { PhoneFieldComponent } from '../../shared/ui/molecules/phone-field/phone-field.component';
import { SelectComponent } from '../../shared/ui/molecules/select/select.component';
import { TagsFieldComponent } from '../../shared/ui/molecules/tags-field/tags-field.component';
import { TaxIdFieldComponent } from '../../shared/ui/molecules/tax-id-field/tax-id-field.component';
import { TimeFieldComponent } from '../../shared/ui/molecules/time-field/time-field.component';
import { ToastService } from '../../shared/ui/molecules/toast/toast.service';
import { DsSectionComponent } from './ds/ds-layout';

// Datos de ejemplo del catálogo (marcas y clientes ficticios o genéricos, como en docs/design-system).
const DOC_TYPES: ZcOption<string>[] = [
  { value: 'dni', label: 'DNI', description: 'Documento nacional' }, { value: 'ce', label: 'Carné de extranjería' },
  { value: 'pas', label: 'Pasaporte' }, { value: 'ruc', label: 'RUC', description: 'Empresas' },
];
const CLIENTS: ZcOption<string>[] = [
  ['Interbank', 'Perú'], ['BCP', 'Perú'], ['BBVA', 'Perú'], ['Banco Pichincha', 'Ecuador'], ['Bancolombia', 'Colombia'], ['Entel', 'Chile'],
  ['Tigo', 'Bolivia'], ['Bimbo', 'México'], ['Falabella', 'Chile'], ['Claro', 'Perú'], ['Movistar', 'Perú'], ['Scotiabank', 'Perú'],
].map(([label, country], i) => ({ value: 'c' + i, label, description: country }));
const CATEGORIES: ZcOption<string>[] = ['Gastronomía', 'Experiencias', 'Tecnología', 'Moda', 'Viajes', 'Entretenimiento', 'Hogar', 'Salud y belleza', 'Deportes', 'Supermercados', 'Educación', 'Mascotas']
  .map(label => ({ value: label, label }));
const CITIES: ZcOption<string>[] = ([['pe', ['Lima', 'Arequipa', 'Trujillo']], ['ec', ['Quito', 'Guayaquil', 'Cuenca']], ['bo', ['La Paz', 'Santa Cruz', 'Cochabamba']],
  ['co', ['Bogotá', 'Medellín', 'Cali']], ['cl', ['Santiago', 'Valparaíso', 'Concepción']], ['mx', ['Ciudad de México', 'Monterrey', 'Guadalajara']]] as [CountryCode, string[]][])
  .flatMap(([cc, names]) => names.map(label => ({ value: cc + ':' + label, label, flag: cc, group: countryByCode(cc).name })));
const LOTE_STATES: ZcOption<string>[] = [
  { value: 'cre', label: 'Creado', icon: 's:add-circle' }, { value: 'act', label: 'Activado', icon: 's:check-circle' },
  { value: 'anu', label: 'Anulado', icon: 's:close-circle' }, { value: 'exp', label: 'Expirado', icon: 's:clock-circle' },
];
const COUNTRY_OPTIONS: ZcOption<CountryCode>[] = COUNTRIES.map(c => ({ value: c.code, label: c.name, flag: c.code, meta: c.currency }));
const SEARCH_DATA: ZcOption<string>[] = [
  ...['Navidad 2026', 'Bienvenida clientes', 'Cyber Wow', 'Día del Padre', 'Fiestas Patrias', 'Reconocimiento anual'].map(l => ({ value: 'camp:' + l, label: l, group: 'Campañas', icon: 's:flag' as const })),
  ...['Interbank', 'BCP', 'BBVA', 'Banco Pichincha', 'Bancolombia', 'Entel', 'Tigo', 'Bimbo'].map(l => ({ value: 'cli:' + l, label: l, group: 'Clientes', icon: 's:buildings-2' as const })),
  ...['Repsol', 'Falabella', 'Ripley', 'KFC', 'Starbucks', 'Pizza Hut', 'Bembos', 'Burger King', 'Cencosud', 'Comercial Li'].map(l => ({ value: 'mar:' + l, label: l, group: 'Marcas', icon: 's:shop-2' as const })),
  ...['#02829 Navidad 2026', '#02830 Bienvenida clientes', '#02835 Cyber Wow'].map(l => ({ value: 'lot:' + l, label: l, group: 'Lotes', icon: 's:box' as const })),
];

/**
 * Catálogo · moléculas de formulario (etapa 2). Replica las secciones m-select, m-auto, m-special y m-dates
 * de docs/design-system/index.html con formularios reactivos reales y validación por país.
 */
@Component({
  selector: 'zc-catalogo-form-molecules',
  imports: [
    OverlayComponent, ReactiveFormsModule, ButtonDirective, IconComponent, FieldComponent, SelectComponent, AutocompleteComponent, PhoneFieldComponent, TaxIdFieldComponent,
    NumberFieldComponent, MoneyFieldComponent, TagsFieldComponent, DateFieldComponent, DateRangeComponent, TimeFieldComponent, DsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[minmax(0,1fr)] gap-12' },
  templateUrl: './form-molecules.section.html',
})
export class FormMoleculesSection {
  /** Secciones a dibujar (m-select, m-auto, m-special, m-dates); null = todas. */
  readonly parts = input<string[] | null>(null);
  show(id: string) { const p = this.parts(); return !p || p.includes(id); }
  private readonly toast = inject(ToastService);
  readonly docTypes = DOC_TYPES;
  readonly clients = CLIENTS;
  readonly categories = CATEGORIES;
  readonly cities = CITIES;
  readonly loteStates = LOTE_STATES;
  readonly countryOptions = COUNTRY_OPTIONS;
  readonly brands = SEARCH_DATA.filter(o => o.group === 'Marcas');

  // Select y combobox
  readonly docType = signal<unknown>(null);
  readonly client = signal<unknown>(null);
  readonly cats = signal<unknown>(['Gastronomía', 'Viajes']);
  readonly city = signal<unknown>(null);
  readonly state = signal<unknown>('act');
  readonly states = signal<unknown>(['act']);
  readonly currency = signal<unknown>('pe');
  readonly tipoLote = new FormControl<string | null>(null, Validators.required);
  readonly tipoLoteError = fieldError(this.tipoLote, { required: 'Elige el tipo de lote.' });

  // Bottom sheet con selectores dentro (subpantalla en móvil)
  readonly sheetOpen = signal(false);
  readonly sheetCity = signal<unknown>(null);
  readonly sheetStates = signal<unknown>([]);
  readonly sheetDate = signal<string | null>(null);
  clearSheet() { this.sheetCity.set(null); this.sheetStates.set([]); this.sheetDate.set(null); }

  // Autocomplete
  readonly globalSearch = (q: string) => new Promise<ZcOption<string>[]>(r => setTimeout(() => r(SEARCH_DATA.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))), 400));
  onPick(p: AutocompletePick) {
    if (p.kind === 'create') this.toast.success('Marca creada', { text: `En la app, ${p.text} queda como borrador.` });
    else this.toast.info(p.kind === 'all' ? 'Buscar en todo' : 'Abrir', { text: p.text });
  }

  // Campos especiales (formulario reactivo con validación por país)
  readonly country = new FormControl<CountryCode>('pe', { nonNullable: true });
  readonly countryCode = toSignal(this.country.valueChanges, { initialValue: this.country.value });
  readonly special = new FormGroup({
    phone: new FormControl<PhoneValue>({ country: 'pe', number: '' }, { nonNullable: true, validators: [zcValidators.phone(), (c) => (c.value.number ? null : { required: true })] }),
    amount: new FormControl<number | null>(null, [Validators.required, zcValidators.amount({ country: () => this.country.value, min: 10, max: 5000 })]),
    qty: new FormControl<number | null>(500, Validators.required),
    taxId: new FormControl('', [Validators.required, zcValidators.taxId(() => this.country.value)]),
    mails: new FormControl<string[]>(['ana@interbank.pe', 'finanzas@interbank'], { nonNullable: true, validators: zcValidators.emails(5) }),
  });
  readonly phoneError = fieldError(this.special.controls.phone, { required: 'Ingresa el número de WhatsApp.' });
  readonly amountError = fieldError(this.special.controls.amount, { required: 'Ingresa el monto.' });
  readonly qtyError = fieldError(this.special.controls.qty, { required: 'Ingresa la cantidad.' });
  readonly taxIdError = fieldError(this.special.controls.taxId);
  readonly mailsError = fieldError(this.special.controls.mails);
  readonly taxIdHint = computed(() => countryByCode(this.countryCode()).taxIdHint);
  readonly amountHint = computed(() => `Entre 10 y 5000. ${countryByCode(this.countryCode()).decimals ? 'Con' : 'Sin'} decimales en ${countryByCode(this.countryCode()).currency}.`);
  validateSpecial() { this.special.markAllAsTouched(); }

  // Fechas y horas
  readonly today = todayIso();
  readonly maxExpiry = addDays(this.today, 730);
  readonly dates = new FormGroup({
    expiry: new FormControl<string | null>(null, [Validators.required, zcValidators.date({ min: this.today, max: this.maxExpiry })]),
    period: new FormControl<DateRangeValue | null>(this.last30(), zcValidators.dateRange(366)),
    from: new FormControl<string | null>('09:00', [Validators.required, zcValidators.time()]),
    to: new FormControl<string | null>('18:00', [Validators.required, zcValidators.time()]),
    issued: new FormControl<string | null>({ value: addDays(this.today, -12), disabled: true }),
  }, { validators: zcValidators.timeRange('from', 'to') });
  readonly expiryError = fieldError(this.dates.controls.expiry, { required: 'Ingresa la fecha de vencimiento.' });
  readonly periodError = fieldError(this.dates.controls.period);
  private readonly fromError = fieldError(this.dates.controls.from, { required: 'Ingresa la hora de inicio.' });
  private readonly toError = fieldError(this.dates.controls.to, { required: 'Ingresa la hora de fin.' });
  readonly windowError = computed(() => this.fromError() ?? this.toError());
  validateDates() { this.dates.markAllAsTouched(); }
  private last30(): DateRangeValue { const [from, to] = presetRange('ult30', todayIso())!; return { from, to, preset: 'ult30' }; }

  constructor() {
    // Como index.html: el correo inválido precargado muestra su error desde el inicio.
    this.special.controls.mails.markAsTouched();
  }

}
