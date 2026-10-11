import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, output, signal, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { ProgressComponent } from '@zonacards/ui/progress';
import { injectLang, injectTranslate } from '@zonacards/ui/core';
import { ScrollAreaDirective } from '@zonacards/ui/core';
import { Viewport } from '@zonacards/ui/core';

export interface UploadRowError { row: number; column: string; message: string; }

export interface UploadItem {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  status: 'uploading' | 'done' | 'error';
  /** 0–100 mientras sube. */
  progress?: number;
  /** Resultado: "480 filas válidas", "3 filas con errores", "Pesa 7,2 MB; el máximo es 5 MB". */
  message?: string;
  /** Rechazo antes de subir: el texto se traduce al dibujar (si se guardara al elegir, podría quedar la clave sin traducir). */
  rejected?: 'type' | 'size';
  /** Detalle por fila del archivo procesado. */
  rowErrors?: readonly UploadRowError[];
}

export interface UploadAdded { id: string; file: File; }

let seq = 0;

/** Peso legible: "84 KB", "7,2 MB". */
export function formatBytes(bytes: number, lang: 'es' | 'en'): string {
  const nf = (n: number, d: number) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: d }).format(n);
  if (bytes < 1024 * 1024) return `${nf(Math.max(1, Math.round(bytes / 1024)), 0)} KB`;
  return `${nf(bytes / 1024 / 1024, 1)} MB`;
}

/** Valida tipo (por extensión o MIME, como el atributo accept) y peso. Devuelve el motivo del rechazo o null. */
export function rejectReason(file: File, accept: string, maxBytes: number): 'type' | 'size' | null {
  const rules = accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase(); const mime = (file.type || '').toLowerCase();
  const okType = !rules.length || rules.some(r => (r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? mime.startsWith(r.slice(0, -1)) : mime === r));
  if (!okType) return 'type';
  if (maxBytes > 0 && file.size > maxBytes) return 'size';
  return null;
}

/**
 * <zc-file-upload accept=".xlsx" [maxMb]="5" label="Subir archivo XLSX de contactos" [(items)]="…" (added)="subir($event)" />
 * - Desktop: zona para arrastrar o elegir. Móvil o táctil: solo el botón "Elegir archivo".
 * - Valida tipo y peso antes de subir: lo rechazado entra a la lista como error con el motivo y no se emite.
 * - Lo válido entra como "subiendo" y se emite en (added); la página actualiza progreso, resultado y errores por fila en [(items)].
 * - Errores por fila: tabla Fila · Columna · Error y "Descargar errores" (downloadErrors).
 * Slot: texto extra de ayuda (ej. el enlace a la plantilla) dentro de la zona.
 */
@Component({
  selector: 'zc-file-upload',
  imports: [ButtonDirective, IconComponent, ProgressComponent, ScrollAreaDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    <input #picker type="file" class="sr-only" tabindex="-1" aria-hidden="true" [accept]="accept()" [multiple]="multiple()" (change)="onPicked(picker)" />
    <div role="group" [attr.aria-label]="label()" (click)="onZoneClick($event)" (dragenter)="onDrag($event, true)" (dragover)="onDrag($event, true)"
      (dragleave)="onDrag($event, false)" (drop)="onDrop($event)"
      class="grid justify-items-center gap-2 rounded-md border-[1.5px] border-dashed border-border-strong bg-surface px-4 py-6 text-center transition-[border-color,background] duration-(--dur) hover:border-fg hover:bg-surface-2 max-md:cursor-auto max-md:border-none max-md:bg-transparent max-md:p-0 max-md:hover:bg-transparent pointer-coarse:border-none pointer-coarse:bg-transparent pointer-coarse:p-0 md:cursor-pointer"
      [class]="dragging() ? '!border-fg !bg-surface-2' : ''">
      <span class="grid size-12 place-items-center rounded-ms bg-surface-2 max-md:hidden pointer-coarse:hidden"><zc-icon name="s:cloud-upload" /></span>
      <strong class="font-semibold max-md:hidden pointer-coarse:hidden">{{ title() || ('ui.arrastraArchivo' | transloco) }}</strong>
      <button zcButton variant="outline" size="sm" class="max-md:w-full pointer-coarse:w-full" (click)="picker.click()"><zc-icon name="s:upload-minimalistic" [size]="16" />{{ 'ui.elegirArchivo' | transloco }}</button>
      <span class="text-[13px] text-muted">{{ hintText() }} <ng-content /></span>
    </div>

    @if (items().length) {
      <ul class="m-0 grid list-none gap-2 p-0" [attr.aria-label]="'ui.archivos' | transloco">
        @for (it of items(); track it.id) {
          <li class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
            <div class="flex min-w-0 items-center gap-3 rounded-md border border-border p-3" [class.border-danger-bd]="it.status === 'error'">
              <span class="grid size-10 shrink-0 place-items-center rounded-ms bg-surface-2 max-[360px]:hidden"><zc-icon name="s:file" /></span>
              <div class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1 gap-1.5">
                <span class="break-words font-medium leading-5">{{ it.name }}</span>
                <span class="num flex flex-wrap items-center gap-x-2 text-[13px] text-muted" aria-live="polite">
                  @switch (it.status) {
                    @case ('uploading') { <span>{{ 'ui.subiendo' | transloco: { p: it.progress ?? 0 } }}</span> }
                    @case ('done') { <span class="inline-flex items-center gap-1 text-success"><zc-icon name="s:check-circle" [size]="16" />{{ it.message || ('ui.listo' | transloco) }}</span> }
                    @case ('error') { <span class="inline-flex items-center gap-1 text-danger"><zc-icon name="s:danger-circle" [size]="16" />{{ it.rejected ? rejectText(it) : it.message }}</span> }
                  }
                  <span>{{ bytes(it.size) }}</span>
                </span>
                @if (it.status === 'uploading') {
                  <zc-progress [label]="'ui.progresoDe' | transloco: { name: it.name }" [value]="it.progress ?? 0" [showLabel]="false" />
                }
              </div>
              <button type="button" class="grid size-icon-btn shrink-0 cursor-pointer place-items-center self-start rounded-full text-muted hover:bg-surface-2 hover:text-fg"
                [attr.aria-label]="'ui.quitar' | transloco: { label: it.name }" (click)="remove(it)"><zc-icon name="s:trash-bin-trash" [size]="16" /></button>
            </div>
            @if (it.rowErrors?.length) {
              <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
                <div zcScrollArea tabindex="0" class="max-h-[200px] overflow-auto rounded-md border border-border" [attr.aria-label]="'ui.erroresDe' | transloco: { name: it.name }" role="region">
                  <table class="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead class="sticky top-0 bg-surface-2 text-[13px] text-muted">
                      <tr><th scope="col" class="h-11 px-3 font-medium">{{ 'ui.fila' | transloco }}</th><th scope="col" class="px-3 font-medium">{{ 'ui.columna' | transloco }}</th><th scope="col" class="px-3 font-medium">{{ 'ui.error' | transloco }}</th></tr>
                    </thead>
                    <tbody>
                      @for (r of it.rowErrors; track $index) {
                        <tr class="border-t border-border"><td class="num h-11 px-3">{{ r.row }}</td><td class="px-3">{{ r.column }}</td><td class="px-3">{{ r.message }}</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
                <button zcButton variant="link" size="sm" class="justify-self-start" (click)="downloadErrors.emit(it)"><zc-icon name="s:download-minimalistic" [size]="16" />{{ 'ui.descargarErrores' | transloco }}</button>
              </div>
            }
          </li>
        }
      </ul>
    }`,
})
export class FileUploadComponent {
  /** Tipos aceptados como en <input accept>: ".xlsx,.csv". */
  readonly accept = input('');
  readonly maxMb = input(5);
  readonly multiple = input(false);
  /** Nombre accesible de la zona: "Subir archivo XLSX de contactos". */
  readonly label = input.required<string>();
  /** Texto principal de la zona (desktop). */
  readonly title = input('');
  /** Ayuda; por defecto, "Solo .xlsx, hasta 5 MB." */
  readonly hint = input('');
  readonly items = model<UploadItem[]>([]);
  readonly added = output<UploadAdded[]>();
  readonly removed = output<UploadItem>();
  readonly downloadErrors = output<UploadItem>();

  private readonly lang = injectLang();
  private readonly viewport = inject(Viewport);
  private readonly t = injectTranslate();
  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');
  readonly dragging = signal(false);
  readonly hintText = computed(() => this.hint() || this.t('ui.ayudaArchivo', { types: this.accept() || '—', max: this.maxMb() }));

  bytes(n: number) { return formatBytes(n, this.lang()); }

  onZoneClick(e: MouseEvent) {
    // Clic en cualquier parte de la zona (desktop) abre el selector, salvo sobre un botón o enlace propio.
    if ((e.target as HTMLElement).closest('button, a')) return;
    if (this.viewport.mobile()) return;
    this.picker().nativeElement.click();
  }

  onDrag(e: DragEvent, over: boolean) { e.preventDefault(); this.dragging.set(over); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    this.addFiles(Array.from(e.dataTransfer?.files ?? []));
  }

  onPicked(input: HTMLInputElement) {
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  addFiles(files: File[]) {
    if (!files.length) return;
    const list = this.multiple() ? files : files.slice(0, 1);
    const ok: UploadAdded[] = []; const rows: UploadItem[] = [];
    for (const file of list) {
      const id = `zc-up-${++seq}`;
      const why = rejectReason(file, this.accept(), this.maxMb() * 1024 * 1024);
      if (why) {
        rows.push({ id, name: file.name, size: file.size, status: 'error', rejected: why });
      } else {
        rows.push({ id, name: file.name, size: file.size, status: 'uploading', progress: 0 });
        ok.push({ id, file });
      }
    }
    this.items.update(l => [...rows, ...(this.multiple() ? l : [])]);
    if (ok.length) this.added.emit(ok);
  }

  rejectText(it: UploadItem): string {
    return it.rejected === 'type' ? this.t('ui.tipoNoPermitido', { types: this.accept() }) : this.t('ui.pesoMaximo', { size: this.bytes(it.size), max: this.maxMb() });
  }

  remove(it: UploadItem) {
    this.items.update(l => l.filter(x => x.id !== it.id));
    this.removed.emit(it);
  }
}
