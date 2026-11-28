import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '@zonacards/ui/button';
import {
  BulkColumn, BulkError, BulkResult, BulkValues, InvalidWorkbookError, MIME, bulkTemplate, downloadBlob, exportFileName, injectTranslate,
  parseCsv, processMatrix, readXlsx, toXlsxSheets, todayIso,
} from '@zonacards/ui/core';
import { FileUploadComponent, UploadAdded, UploadItem, UploadRowError } from '@zonacards/ui/file-upload';
import { IconComponent } from '@zonacards/ui/icon';

/**
 * <zc-bulk-import [columns] [keyOf] (imported)> · importación masiva desde Excel o CSV: 1) plantilla descargable (hoja de datos con
 * ejemplo y hoja de instrucciones), 2) subir el archivo, que se valida fila por fila en el navegador (una fila mala no frena a las
 * demás) con la tabla Fila · Columna · Error y "Descargar errores", y 3) "Importar N filas", que entrega los valores válidos ya
 * convertidos (números, fechas ISO, correos en minúsculas). El servidor vuelve a validar: aquí es solo ayuda para corregir antes.
 */
@Component({
  selector: 'zc-bulk-import',
  imports: [ButtonDirective, FileUploadComponent, IconComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5' },
  template: `
    <section class="grid gap-2" [attr.aria-label]="'mol.importar.paso1' | transloco">
      <h3 class="m-0 text-body font-semibold">{{ 'mol.importar.paso1' | transloco }}</h3>
      <p class="m-0 text-muted">{{ 'mol.importar.paso1Texto' | transloco }}</p>
      <div><button zcButton type="button" variant="outline" size="sm" (click)="downloadTemplate()"><zc-icon name="s:import" [size]="16" />{{ 'mol.importar.descargarPlantilla' | transloco }}</button></div>
    </section>
    <section class="grid gap-3" [attr.aria-label]="'mol.importar.paso2' | transloco">
      <h3 class="m-0 text-body font-semibold">{{ 'mol.importar.paso2' | transloco }}</h3>
      <zc-file-upload accept=".xlsx,.csv" [maxMb]="maxMb()" [label]="'mol.importar.subir' | transloco" [(items)]="items" (added)="onAdded($event)" (removed)="reset()" (downloadErrors)="downloadErrors($event)" />
      @if (result(); as r) {
        @if (!r.fileError) {
          <div class="grid gap-3 rounded-card bg-surface-2 p-4">
            <p class="m-0 font-medium num" role="status">{{ summary() }}</p>
            @if (invalidCount() && validCount()) { <p class="m-0 text-body-sm text-muted">{{ 'mol.importar.omitidas' | transloco: { n: invalidCount() } }}</p> }
            @if (!validCount()) { <p class="m-0 text-body-sm text-danger">{{ 'mol.importar.sinValidas' | transloco }}</p> }
            <div>
              <button zcButton type="button" [disabled]="!validCount() || busy()" [loading]="busy()" (click)="confirm()">{{ 'mol.importar.importar' | transloco: { n: validCount() } }}</button>
            </div>
          </div>
        }
      }
    </section>`,
})
export class BulkImportComponent {
  readonly columns = input.required<readonly BulkColumn[]>();
  /** Llave que identifica cada fila para rechazar repetidas ("el correo"). */
  readonly keyOf = input<((v: BulkValues) => string) | undefined>(undefined);
  readonly maxRows = input(1000);
  readonly maxMb = input(5);
  /** Nombre de la plantilla descargada ("plantilla-destinatarios-2026-11-20.xlsx"). */
  readonly templateName = input('plantilla');
  readonly busy = input(false);
  /** Filas válidas, con sus valores convertidos. */
  readonly imported = output<BulkValues[]>();

  private readonly t = injectTranslate();
  readonly items = signal<UploadItem[]>([]);
  readonly result = signal<BulkResult | null>(null);
  readonly validRows = computed(() => (this.result()?.rows ?? []).filter(r => !r.error));
  readonly validCount = computed(() => this.validRows().length);
  readonly invalidCount = computed(() => (this.result()?.rows.length ?? 0) - this.validCount());
  readonly summary = computed(() => (this.invalidCount()
    ? this.t('mol.importar.resumen', { validas: this.validCount(), errores: this.invalidCount() })
    : this.t('mol.importar.resumenOk', { validas: this.validCount() })));

  downloadTemplate() {
    const l = (k: string) => this.t('mol.importar.plantilla.' + k);
    const sheets = bulkTemplate(this.columns(), { data: l('datos'), instructions: l('instrucciones'), column: l('columna'), required: l('obligatoria'), whatToWrite: l('queEscribir'), example: l('ejemplo'), yes: l('si'), no: l('no') });
    downloadBlob(toXlsxSheets(sheets), MIME.xlsx, exportFileName(this.templateName(), 'xlsx', todayIso()));
  }

  private msg(e: BulkError) { return this.t('mol.importar.err.' + e.code, e.params); }

  async onAdded(added: UploadAdded[]) {
    for (const { id, file } of added) {
      let result: BulkResult;
      try {
        const matrix = /\.csv$/i.test(file.name) ? parseCsv(await file.text()) : (readXlsx(await file.arrayBuffer())[0]?.rows ?? []);
        result = processMatrix([...this.columns()], matrix, this.keyOf(), this.maxRows());
      } catch (e) {
        result = { rows: [], fileError: { code: 'invalidFile' } };
        if (!(e instanceof InvalidWorkbookError)) console.error(e);
      }
      this.result.set(result);
      const titles = new Map(this.columns().map(c => [c.key, c.title]));
      const rowErrors: UploadRowError[] = result.rows.filter(r => r.error).map(r => ({ row: r.row, column: titles.get(r.error!.field ?? '') ?? '', message: this.msg(r.error!) }));
      const valid = result.rows.length - rowErrors.length;
      const message = result.fileError ? this.msg(result.fileError)
        : rowErrors.length ? this.t('mol.importar.resumen', { validas: valid, errores: rowErrors.length }) : this.t('mol.importar.resumenOk', { validas: valid });
      this.items.update(l => l.map(it => it.id === id ? { ...it, status: result.fileError || (rowErrors.length && !valid) ? 'error' : 'done', progress: 100, message, rowErrors } : it));
    }
  }

  /** Informe de errores: CSV con Fila, Columna y Error. */
  downloadErrors(it: UploadItem) {
    const rows = [[this.t('ui.fila'), this.t('ui.columna'), this.t('ui.error')], ...(it.rowErrors ?? []).map(e => [e.row, e.column, e.message])];
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadBlob(csv, MIME.csv, exportFileName('errores-' + it.name.replace(/\.[^.]+$/, ''), 'csv', todayIso()));
  }

  confirm() { this.imported.emit(this.validRows().map(r => r.values)); }
  reset() { this.result.set(null); }
}
