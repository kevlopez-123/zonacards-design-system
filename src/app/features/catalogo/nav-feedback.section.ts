import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { AccordionComponent, AccordionItemComponent } from '../../shared/ui/molecules/accordion/accordion.component';
import { AlertActionDirective, AlertComponent } from '../../shared/ui/molecules/alert/alert.component';
import { BreadcrumbsComponent, Crumb } from '../../shared/ui/molecules/breadcrumbs/breadcrumbs.component';
import { FieldComponent, InputDirective } from '../../shared/ui/molecules/field/field.component';
import { FileUploadComponent, UploadAdded, UploadItem, UploadRowError } from '../../shared/ui/molecules/file-upload/file-upload.component';
import { MenuComponent, ZcMenuItem } from '../../shared/ui/molecules/menu/menu.component';
import { PaginationComponent } from '../../shared/ui/molecules/pagination/pagination.component';
import { TabPanelDirective, TabsComponent, ZcTab } from '../../shared/ui/molecules/tabs/tabs.component';
import { ToastService } from '../../shared/ui/molecules/toast/toast.service';
import { LinkComponent } from '../../shared/ui/atoms/misc/misc';
import { DescriptionListComponent, ZcDescription } from '../../shared/ui/molecules/description-list/description-list.component';
import { InfoPopoverComponent } from '../../shared/ui/molecules/popover/info-popover.component';
import { SecretFieldComponent } from '../../shared/ui/molecules/secret-field/secret-field.component';
import { SegmentedComponent, ZcSegment } from '../../shared/ui/molecules/segmented/segmented.component';
import { DsSectionComponent } from './ds/ds-layout';

// Datos de ejemplo de docs/design-system (secciones m-nav, m-pager, m-feedback, m-accordion y m-upload).
const CRUMBS: Crumb[] = [
  { label: 'Inicio', link: '/inicio' }, { label: 'Clientes', link: '/catalogo' }, { label: 'Interbank', link: '/catalogo' },
  { label: 'Campañas', link: '/catalogo' }, { label: 'Navidad 2026', link: '/catalogo' }, { label: 'Lote #02829' },
];
const LOT_MENU: ZcMenuItem[] = [
  { id: 'ver', label: 'Ver ficha', icon: 's:eye', shortcut: 'Enter', group: 'Lote' },
  { id: 'enviar', label: 'Enviar códigos', icon: 's:plain', group: 'Lote' },
  { id: 'descargar', label: 'Descargar información', icon: 's:download-minimalistic', group: 'Lote' },
  { id: 'extender', label: 'Extender vigencia', icon: 's:calendar', description: 'Una sola vez, con aprobación', group: 'Lote' },
  { id: 'reenviar', label: 'Reenviar no activados', icon: 's:refresh', description: 'Sin códigos pendientes', disabled: true, group: 'Lote' },
  { id: 'anular', label: 'Anular lote', icon: 's:close-circle', danger: true, separatorBefore: true },
];
const MORE_ACTIONS: ZcMenuItem[] = [
  { id: 'carga', label: 'Carga masiva', icon: 's:import' },
  { id: 'excel', label: 'Descargar Excel', icon: 's:download-minimalistic' },
  { id: 'csv', label: 'Descargar CSV', icon: 's:download-minimalistic' },
];
const SORTS = [['reciente', 'Más recientes'], ['antiguo', 'Más antiguos'], ['valor', 'Mayor valor'], ['vence', 'Próximos a vencer']] as const;
const ROW_ERRORS: UploadRowError[] = [
  { row: 12, column: 'Teléfono', message: 'Tiene 8 dígitos; en Perú son 9' },
  { row: 48, column: 'Correo', message: 'Formato no válido' },
  { row: 203, column: 'Monto', message: 'Fuera de rango (máx. 5,000)' },
];

/** Catálogo · moléculas de navegación y feedback (etapa 3). */
@Component({
  selector: 'zc-catalogo-nav-feedback',
  imports: [
    BadgeComponent, ButtonDirective, IconComponent, AccordionComponent, AccordionItemComponent, AlertComponent, AlertActionDirective, BreadcrumbsComponent,
    FieldComponent, InputDirective, FileUploadComponent, MenuComponent, PaginationComponent, TabsComponent, TabPanelDirective,
    LinkComponent, DescriptionListComponent, InfoPopoverComponent, SecretFieldComponent, SegmentedComponent, DsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[minmax(0,1fr)] gap-12' },
  templateUrl: './nav-feedback.section.html',
})
export class NavFeedbackSection {
  /** Secciones a dibujar (m-nav, m-pager, m-feedback, m-accordion, m-upload); null = todas. */
  readonly parts = input<string[] | null>(null);
  show(id: string) { const p = this.parts(); return !p || p.includes(id); }
  private readonly toast = inject(ToastService);
  private readonly timers = new Set<ReturnType<typeof setInterval>>();
  constructor() { inject(DestroyRef).onDestroy(() => this.timers.forEach(t => clearInterval(t))); }

  // Pestañas y migas
  readonly segTabs: ZcTab[] = [{ value: 'resumen', label: 'Resumen' }, { value: 'programas', label: 'Programas' }, { value: 'campanas', label: 'Campañas' }, { value: 'lotes', label: 'Lotes' }];
  readonly seg = signal<string | undefined>('resumen');
  readonly lineTabs: ZcTab[] = [
    { value: 'general', label: 'General' }, { value: 'canjes', label: 'Canjes', count: 290 }, { value: 'historial', label: 'Historial' },
    { value: 'peligro', label: 'Zona de peligro' }, { value: 'auditoria', label: 'Auditoría', disabled: true },
  ];
  readonly line = signal<string | undefined>('general');
  readonly densities: ZcSegment[] = [{ value: 'comoda', label: 'Cómoda', icon: 'l:rows-3' }, { value: 'compacta', label: 'Compacta', icon: 'l:rows-4' }];
  readonly density = signal<string | null>('comoda');
  readonly crumbs = CRUMBS;
  readonly shortCrumbs = CRUMBS.slice(0, 3);

  // Paginación
  readonly page = signal(1);
  readonly size = signal(25);
  readonly numPage = signal(1);
  readonly numSize = signal(10);
  readonly onePage = signal(1);
  readonly loaded = signal(12);
  readonly loadingMore = signal(false);
  loadMore() {
    this.loadingMore.set(true);
    setTimeout(() => { this.loaded.update(n => Math.min(48, n + 12)); this.loadingMore.set(false); }, 600);
  }

  // Toast
  toastSuccess() { this.toast.success('Lote creado', { text: '500 códigos listos para enviar.', action: { label: 'Ver lote', run: () => {} } }); }
  toastError() { this.toast.error('No se pudo enviar', { text: '3 filas tienen teléfono inválido. Ref. 7F2A-91C0.' }); }
  toastInfo() { this.toast.info('Exportación en curso', { text: 'Te avisaremos cuando el archivo esté listo.', action: { label: 'Ver exportaciones', run: () => {} } }); }
  toastPersistent() { this.toast.error('No se pudo conectar con NetSuite', { text: 'La orden quedó en cola. Ref. 7F2A-91C0.', action: { label: 'Reintentar ahora', run: () => this.toast.success('Orden reenviada a NetSuite') } }); }
  toastQueue() { for (let i = 1; i <= 5; i++) this.toast.info(`Envío ${i} de 5 programado`, { text: 'Los toasts esperan en cola: se ven 3 a la vez.' }); }

  // Menú
  readonly lotMenu = LOT_MENU;
  readonly moreActions = MORE_ACTIONS;
  readonly sort = signal('reciente');
  readonly sortItems = () => SORTS.map(([id, label]) => ({ id, label, checked: this.sort() === id }) as ZcMenuItem);
  readonly sortLabel = () => SORTS.find(s => s[0] === this.sort())![1];
  onMenu(it: ZcMenuItem) {
    if (it.id === 'anular') { this.toast.info('Anular lote abre el alert dialog con motivo (etapa 4).'); return; }
    this.toast.info(it.label, { text: 'Acción simulada.' });
  }
  onSort(it: ZcMenuItem) { this.sort.set(it.id); }

  // Carga de archivos (subida simulada: +20 % cada 220 ms; un archivo sí y otro no trae errores por fila)
  readonly uploads = signal<UploadItem[]>([]);
  private uploadCount = 0;
  onAdded(files: UploadAdded[]) {
    for (const { id } of files) {
      const withErrors = this.uploadCount++ % 2 === 1;
      const t = setInterval(() => {
        const cur = this.uploads().find(u => u.id === id);
        if (!cur) { clearInterval(t); this.timers.delete(t); return; }
        const progress = Math.min(100, (cur.progress ?? 0) + 20);
        this.patch(id, progress < 100 ? { progress } : withErrors
          ? { status: 'error', message: '3 filas con errores', rowErrors: ROW_ERRORS }
          : { status: 'done', message: '480 filas válidas' });
        if (progress >= 100) { clearInterval(t); this.timers.delete(t); }
      }, 220);
      this.timers.add(t);
    }
  }
  private patch(id: string, p: Partial<UploadItem>) { this.uploads.update(l => l.map(u => (u.id === id ? { ...u, ...p } : u))); }
  downloadErrors(it: UploadItem) {
    const csv = 'Fila,Columna,Error\n' + (it.rowErrors ?? []).map(r => `${r.row},${r.column},"${r.message}"`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = it.name.replace(/\.[^.]+$/, '') + '-errores.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  // DescriptionList (m-upload)
  readonly campaignInfo: ZcDescription[] = [
    { term: 'Cliente', value: 'Interbank' }, { term: 'País', value: 'Perú · PEN', flag: 'pe' }, { term: 'Vigencia', value: '01/10 – 31/12/2026' }, { term: 'Comisión', value: '4,5 %' },
  ];
  downloadTemplate() { this.toast.info('Descargando plantilla de contactos.xlsx'); }
}
