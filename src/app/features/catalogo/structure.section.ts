import { ChangeDetectionStrategy, Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { COUNTRIES, CountryCode, countryByCode } from '../../shared/domain/countries';
import { addDays, todayIso } from '../../shared/domain/dates';
import { fieldError } from '../../shared/forms/field-error';
import { zcValidators } from '../../shared/forms/validators';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { FlagComponent } from '../../shared/ui/atoms/flag/flag.component';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { ProgressComponent } from '../../shared/ui/atoms/progress/progress.component';
import { SpinnerComponent } from '../../shared/ui/atoms/spinner/spinner.component';
import { TooltipDirective } from '../../shared/ui/atoms/tooltip/tooltip.directive';
import { Crumb } from '../../shared/ui/molecules/breadcrumbs/breadcrumbs.component';
import { DateFieldComponent } from '../../shared/ui/molecules/date-field/date-field.component';
import { FieldComponent, InputDirective } from '../../shared/ui/molecules/field/field.component';
import { ZcOption } from '../../shared/ui/molecules/listbox/listbox.component';
import { MenuComponent, ZcMenuItem } from '../../shared/ui/molecules/menu/menu.component';
import { SelectComponent } from '../../shared/ui/molecules/select/select.component';
import { TaxIdFieldComponent } from '../../shared/ui/molecules/tax-id-field/tax-id-field.component';
import { ToastService } from '../../shared/ui/molecules/toast/toast.service';
import { AlertDialogComponent, AlertDialogResult } from '../../shared/ui/organisms/overlay/alert-dialog.component';
import { OverlayComponent } from '../../shared/ui/organisms/overlay/overlay.component';
import { PageHeaderComponent } from '../../shared/ui/organisms/page-header/page-header.component';
import { SidebarComponent, ZcNavGroup } from '../../shared/ui/organisms/sidebar/sidebar.component';
import { LegacyParts } from './ds/catalog-index';
import { SwitchComponent } from '../../shared/ui/atoms/switch/switch.component';
import { SegmentedComponent, ZcSegment } from '../../shared/ui/molecules/segmented/segmented.component';
import { SubnavComponent, ZcSubnavItem } from '../../shared/ui/organisms/subnav/subnav.component';
import { SessionTimeoutComponent } from '../../shared/ui/organisms/session-timeout/session-timeout.component';
import { InputGroupComponent } from '../../shared/ui/molecules/input-group/input-group.component';
import { PhoneFieldComponent } from '../../shared/ui/molecules/phone-field/phone-field.component';
import { PhoneValue } from '../../shared/forms/validators';
import { FormSummaryComponent, StepperComponent, ZcFormError } from '../../shared/ui/organisms/stepper/stepper.component';

// Datos de ejemplo de docs/design-system (secciones o-sidebar, o-filter y o-wizard).
const DEMO_NAV: ZcNavGroup[] = [{
  items: [
    { id: 'inicio', label: 'Inicio', icon: 's:home-smile', activeIcon: 's:home-smile-bold' },
    { id: 'comprar', label: 'Comprar', icon: 's:cart-large-2', activeIcon: 's:cart-large-2-bold' },
    { id: 'inventario', label: 'Inventario', icon: 's:widget-5', activeIcon: 's:widget-5-bold', children: [
      { id: 'disponibles', label: 'Disponibles' }, { id: 'vencidas', label: 'Vencidas' }, { id: 'enviadas', label: 'Enviadas' }, { id: 'descargadas', label: 'Descargadas' },
    ] },
    { id: 'finanzas', label: 'Finanzas', icon: 's:wallet', activeIcon: 's:wallet-bold', children: [
      { id: 'saldos', label: 'Saldos' }, { id: 'creditos', label: 'Créditos' }, { id: 'pedidos', label: 'Pedidos y facturas' },
    ] },
    { id: 'tarjetas', label: 'Tarjetas regalo', short: 'Tarj. regalo', icon: 's:gift', activeIcon: 's:gift-bold' },
  ],
}, { label: 'Cuenta', items: [{ id: 'ajustes', label: 'Configuración', short: 'Ajustes', icon: 's:settings', activeIcon: 's:settings-bold' }] }];

const CAMPAIGNS: ZcOption<number>[] = [{ value: 1, label: 'Navidad 2026' }, { value: 2, label: 'Bienvenida clientes' }, { value: 3, label: 'Cyber Wow' }];
const MORE: ZcMenuItem[] = [
  { id: 'carga', label: 'Carga masiva', icon: 's:import' },
  { id: 'excel', label: 'Descargar Excel', icon: 's:download-minimalistic' },
  { id: 'csv', label: 'Descargar CSV', icon: 's:download-minimalistic' },
];
const LOT_ACTIONS: ZcMenuItem[] = [
  { id: 'ver', label: 'Ver ficha', icon: 's:eye' },
  { id: 'reenviar', label: 'Reenviar códigos', icon: 's:letter' },
  { id: 'extender', label: 'Extender vigencia', icon: 's:calendar' },
  { id: 'excel', label: 'Descargar Excel', icon: 's:download-minimalistic' },
  { id: 'activar', label: 'Activar códigos', icon: 's:check-circle', disabled: true, description: 'Sin códigos pendientes' },
  { id: 'anular', label: 'Anular lote', icon: 's:close-circle', danger: true, separatorBefore: true },
];
const STEPS = ['Empresa', 'Contacto', 'Comercial', 'Resumen'];

/** Catálogo · organismos de estructura y flujos (etapa 4): sidebar, encabezado, overlays y stepper. */
@Component({
  selector: 'zc-catalogo-structure',
  imports: [
    InputGroupComponent, PhoneFieldComponent, SessionTimeoutComponent, SegmentedComponent, SubnavComponent, SwitchComponent, ReactiveFormsModule, BadgeComponent, ButtonDirective, FlagComponent, IconComponent, ProgressComponent, SpinnerComponent,
    TooltipDirective, DateFieldComponent, FieldComponent, InputDirective, MenuComponent, SelectComponent, TaxIdFieldComponent, AlertDialogComponent, OverlayComponent,
    PageHeaderComponent, SidebarComponent, StepperComponent, FormSummaryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[minmax(0,1fr)] gap-12' },
  templateUrl: './structure.section.html',
})
export class StructureSection extends LegacyParts {
  /** Secciones a dibujar (c-select, c-auto…); null = todas. */
  readonly parts = input<string[] | null>(null);
  readonly toast = inject(ToastService);

  // Sidebar
  readonly demoNav = DEMO_NAV;
  readonly sbAppearance = signal<string | null>('surface');
  readonly sbBackgrounds: ZcSegment[] = [{ value: 'surface', label: 'Superficie + borde' }, { value: 'tint', label: 'Tinte' }, { value: 'brand', label: 'Marca (oscuro)' }];
  readonly sbModes: ZcSegment[] = [{ value: 'full', label: 'Expandido' }, { value: 'rail', label: 'Riel' }];
  readonly sbSubnav = signal(false);
  readonly sessionOpen = signal(false);
  readonly subnav: ZcSubnavItem[] = ['Mi perfil', 'Empresa', 'Equipo', 'Programas', 'Marcas remitentes', 'Límites de gasto', 'Roles y permisos', 'Seguridad', 'API Keys'].map(l => ({ id: l, label: l }));
  readonly subnavCurrent = signal<string | null>('Empresa');
  readonly sbCurrent = signal<string | null>('disponibles');
  readonly sbTitle = computed(() => DEMO_NAV.flatMap(g => g.items).flatMap(i => [i, ...(i.children ?? [])]).find(i => i.id === this.sbCurrent())?.label ?? '');
  readonly asAppearance = (v: unknown) => v as 'surface' | 'tint' | 'brand';

  // Encabezado de página
  readonly crumbs: Crumb[] = [{ label: 'Inicio', link: '/inicio' }, { label: 'Operación', link: '/catalogo' }, { label: 'Lotes' }];
  readonly moreActions = MORE;
  readonly lotActions = LOT_ACTIONS;
  onLotAction(it: ZcMenuItem) { if (it.id === 'anular') this.alertOpen.set(true); else this.onAction(it); }
  onAction(it: ZcMenuItem) { this.toast.info(it.label, { text: 'Acción simulada.' }); }

  // Overlays
  readonly drawerOpen = signal(false);
  readonly modalOpen = signal(false);
  readonly alertOpen = signal(false);
  readonly confirmOpen = signal(false);
  readonly voiding = signal(false);
  readonly campaigns = CAMPAIGNS;
  readonly campaign = signal<number | number[] | null>(1);
  readonly newExpiry = signal<string | null>(null);
  readonly today = todayIso('America/Lima');
  readonly ext = new FormGroup({
    date: new FormControl<string | null>(null, Validators.required),
    reason: new FormControl('', [Validators.required, Validators.minLength(5)]),
  });
  readonly extDateError = fieldError(this.ext.controls.date, { required: 'Elige la nueva fecha.' });
  readonly extReasonError = fieldError(this.ext.controls.reason, { required: 'Escribe el motivo; queda en la auditoría.', minlength: 'Escribe al menos 5 caracteres.' });
  readonly maxExt = addDays(this.today, 90);

  requestExtension() {
    if (this.ext.invalid) { this.ext.markAllAsTouched(); return; }
    this.modalOpen.set(false);
    this.ext.reset();
    this.toast.success('Extensión solicitada', { text: 'Queda pendiente de aprobación de un segundo usuario.' });
  }
  closeExtension() { this.ext.reset(); }

  voidLot(r: AlertDialogResult) {
    this.voiding.set(true);
    setTimeout(() => {
      this.voiding.set(false);
      this.alertOpen.set(false);
      this.toast.success('Anulación solicitada', { text: `Motivo: ${r.reason}. Pendiente de aprobación de un segundo usuario.` });
    }, 900);
  }
  discard() { this.confirmOpen.set(false); this.toast.info('Borrador descartado'); }

  // Stepper y formulario
  readonly steps = STEPS;
  readonly step = signal(0);
  readonly saving = signal(false);
  readonly categoryOptions: ZcOption<string>[] = ['Banca', 'Retail', 'Telecomunicaciones', 'Consumo masivo', 'Seguros'].map(x => ({ value: x, label: x }));
  readonly category = signal<string | null>(null);
  readonly phone = signal<PhoneValue>({ country: 'pe', number: '' });
  readonly notes = signal('');
  readonly countryOptions: ZcOption<CountryCode>[] = COUNTRIES.map(c => ({ value: c.code, label: c.name, flag: c.code, meta: c.currency }));
  private readonly countryCtrl = new FormControl<CountryCode | null>(null, Validators.required);
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    country: this.countryCtrl,
    taxId: new FormControl('', { nonNullable: true, validators: [Validators.required, zcValidators.taxId(() => this.countryCtrl.value ?? 'pe')] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    commission: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(100)]),
  });
  readonly countryValue = toSignal(this.form.controls.country.valueChanges, { initialValue: null });
  readonly country = computed<CountryCode>(() => this.countryValue() ?? 'pe');
  readonly taxLabel = computed(() => (this.countryValue() ? countryByCode(this.countryValue()!).taxId : 'Identificador tributario'));
  readonly errName = fieldError(this.form.controls.name, { required: 'Ingresa la razón social.', minlength: 'Debe tener al menos 3 caracteres.' });
  readonly errCountry = fieldError(this.form.controls.country, { required: 'Selecciona el país.' });
  readonly errTax = fieldError(this.form.controls.taxId, { required: 'Ingresa el identificador tributario.' });
  readonly errEmail = fieldError(this.form.controls.email, { required: 'Ingresa el correo.', email: 'Ingresa un correo válido, ej. nombre@empresa.com.' });
  readonly errCommission = fieldError(this.form.controls.commission, { required: 'Ingresa la comisión.', min: 'Debe estar entre 0 y 100.', max: 'Debe estar entre 0 y 100.' });
  readonly summaryErrors = signal<ZcFormError[]>([]);
  private readonly summary = viewChild(FormSummaryComponent);
  private readonly fName = viewChild<FieldComponent>('fName');
  private readonly fCountry = viewChild<FieldComponent>('fCountry');
  private readonly fTax = viewChild<FieldComponent>('fTax');
  private readonly fEmail = viewChild<FieldComponent>('fEmail');
  private readonly fCommission = viewChild<FieldComponent>('fCommission');

  constructor() {
    super();
    // Cambiar de país vuelve a validar el identificador con la regla del nuevo país.
    this.form.controls.country.valueChanges.subscribe(() => this.form.controls.taxId.updateValueAndValidity());
  }

  private stepFields() {
    const c = this.form.controls;
    return [
      [[c.name, this.fName, this.errName], [c.country, this.fCountry, this.errCountry], [c.taxId, this.fTax, this.errTax]],
      [[c.email, this.fEmail, this.errEmail]],
      [[c.commission, this.fCommission, this.errCommission]],
      [],
    ][this.step()] as [FormControl, () => FieldComponent | undefined, () => string | null][];
  }

  next() {
    const fields = this.stepFields();
    fields.forEach(([c]) => c.markAsTouched());
    const errs = fields.filter(([c]) => c.invalid).map(([, f, e]) => ({ id: f()?.controlId ?? '', message: e() ?? '' }));
    this.summaryErrors.set(errs);
    if (errs.length) { setTimeout(() => this.summary()?.focus()); return; }
    if (this.step() < STEPS.length - 1) { this.step.update(s => s + 1); return; }
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.toast.success('Cliente creado', { text: `${this.form.controls.name.value} quedó activo.`, action: { label: 'Ver cliente', run: () => {} } });
      this.form.reset(); this.step.set(0);
    }, 1200);
  }
  onSubmit(e: Event) { e.preventDefault(); this.next(); }
  back() { this.summaryErrors.set([]); this.step.update(s => Math.max(0, s - 1)); }
  countryName(c: CountryCode | null) { return c ? countryByCode(c).name : ''; }
}
