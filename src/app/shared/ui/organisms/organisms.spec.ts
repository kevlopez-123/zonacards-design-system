import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { crc32, exportFileName, toCsv, toXlsx } from '../../domain/export';
import { ChartData, ChartTheme, buildChartOption, chartRows, hasData } from './chart/chart-options';
import { DataTableComponent, ZcColumn, ZcSort, compareValues } from './data-table/data-table.component';
import { FilterBarComponent, ZcFilterChip } from './filter-bar/filter-bar.component';
import { AlertDialogComponent } from './overlay/alert-dialog.component';
import { OverlayComponent } from './overlay/overlay.component';
import { SidebarComponent, ZcNavGroup } from './sidebar/sidebar.component';
import { FormSummaryComponent, StepperComponent } from './stepper/stepper.component';

const transloco = TranslocoTestingModule.forRoot({
  langs: { es: {
    ui: { cerrar: 'Cerrar', nSeleccionados: '{{n}} seleccionados', limpiar: 'Limpiar', quitar: 'Quitar {{label}}' },
    org: {
      seleccionarTodos: 'Seleccionar todos', seleccionarFila: 'Seleccionar {{label}}', ordenadaPor: 'ordenada por {{col}}, {{dir}}', ascendente: 'ascendente', descendente: 'descendente',
      escribeParaConfirmar: 'Escribe {{word}} para confirmar', motivoMin: 'Escribe al menos {{n}} caracteres.', revisaCampos: 'Revisa {{n}} campos para continuar', revisaCampo: 'Revisa 1 campo para continuar',
      pasoDe: 'Paso {{n}} de {{total}}: {{label}}', limpiarTodo: 'Limpiar todo', filtros: 'Filtros', masFiltros: 'Más filtros', contraer: 'Contraer menú', expandir: 'Expandir menú', nav: 'Navegación principal',
    },
  } },
  translocoConfig: { availableLangs: ['es'], defaultLang: 'es' },
});

describe('exportación', () => {
  it('CSV con BOM, comillas escapadas y saltos de línea', () => {
    const csv = toCsv([['Cliente', 'Monto'], ['Pichincha, S.A.', 25], ['Dice "hola"', null]]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('"Pichincha, S.A.",25');
    expect(csv).toContain('"Dice ""hola""",');
  });

  it('XLSX: ZIP válido con la hoja y números sin formato', () => {
    const bytes = toXlsx([['Día', 'Emitidos'], ['1/10', 420]]);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('xl/worksheets/sheet1.xml');
    expect(text).toContain('<c r="B2"><v>420</v></c>');
    expect(text).toContain('<t xml:space="preserve">Día</t>');
  });

  it('CRC-32 estándar y nombre de archivo sin tildes', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(exportFileName('Gastronomía lidera las redenciones', 'csv', '2026-10-10')).toBe('gastronomia-lidera-las-redenciones-2026-10-10.csv');
  });
});

describe('gráficos: opciones', () => {
  const theme: ChartTheme = { palette: ['#111', '#222', '#333', '#444', '#555', '#666'], text: '#000', muted: '#555', border: '#ddd', surface: '#fff', surface3: '#eee', font: 'Figtree' };
  const ctx = { theme, narrow: false, format: (v: number) => String(v), totalLabel: 'redenciones', reducedMotion: true };
  const data: ChartData = { categories: ['A', 'B', 'C'], series: [{ name: 'Actual', values: [3, 1, 2] }, { name: 'Anterior', values: [1, 1, 1], dashed: true }] };

  it('sin datos cuando no hay categorías o todo es cero', () => {
    expect(hasData(data)).toBe(true);
    expect(hasData({ categories: [], series: [] })).toBe(false);
    expect(hasData({ categories: ['A'], series: [{ name: 'x', values: [0] }] })).toBe(false);
  });

  it('línea: la comparación va punteada', () => {
    const o = buildChartOption('line', data, ctx, 'es') as { series: { lineStyle: { type: string } }[] };
    expect(o.series.map(s => s.lineStyle.type)).toEqual(['solid', 'dashed']);
  });

  it('barras horizontales: el mayor (primero) va arriba y destacado', () => {
    const o = buildChartOption('bar-h', data, ctx, 'es') as { yAxis: { data: string[] }; series: { data: { itemStyle: { color: string } }[] }[] };
    expect(o.yAxis.data).toEqual(['C', 'B', 'A']);
    expect(o.series[0].data.at(-1)!.itemStyle.color).toBe('#111');
    expect(o.series[0].data[0].itemStyle.color).toBe('#eee');
  });

  it('dona: leyenda abajo en angosto y total al centro', () => {
    const o = buildChartOption('donut', data, { ...ctx, narrow: true }, 'es') as { legend: { orient: string }; series: { label: { formatter: () => string } }[] };
    expect(o.legend.orient).toBe('horizontal');
    expect(o.series[0].label.formatter()).toContain('6');
    expect(chartRows(data, 'Cat')).toEqual([['Cat', 'Actual', 'Anterior'], ['A', 3, 1], ['B', 1, 1], ['C', 2, 1]]);
  });
});

describe('tabla: orden', () => {
  it('números por valor, textos sin tildes ni mayúsculas, vacíos al final', () => {
    expect([10, 2, 33].sort((a, b) => compareValues(a, b))).toEqual([2, 10, 33]);
    expect(['Ñandú', 'ana', 'Álvaro', 'beto'].sort((a, b) => compareValues(a, b))).toEqual(['Álvaro', 'ana', 'beto', 'Ñandú']);
    expect(['b', null, 'a'].sort((a, b) => compareValues(a, b))).toEqual(['a', 'b', null]);
    expect(['lote 10', 'lote 9'].sort((a, b) => compareValues(a, b))).toEqual(['lote 9', 'lote 10']);
  });
});

interface Row { id: string; name: string; amount: number; }
@Component({
  imports: [DataTableComponent],
  template: `<zc-data-table caption="Lotes" [data]="rows()" [columns]="cols" [rowId]="id" [selectable]="true" [(sort)]="sort" [(selection)]="sel">
    <p zcTableEmpty>Sin lotes</p></zc-data-table>`,
})
class TableHost {
  rows = signal<Row[]>([{ id: 'a', name: 'Navidad', amount: 30 }, { id: 'b', name: 'Bienvenida', amount: 10 }, { id: 'c', name: 'Cyber', amount: 20 }]);
  cols: ZcColumn<Row>[] = [{ id: 'name', header: 'Lote', value: r => r.name, sortable: true }, { id: 'amount', header: 'Monto', value: r => r.amount, align: 'end', sortable: true }];
  id = (r: Row) => r.id;
  sort = signal<ZcSort>(null);
  sel = signal<string[]>([]);
}

describe('zc-data-table', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [transloco] }));
  const cellTexts = (el: HTMLElement) => Array.from(el.querySelectorAll('tbody tr')).map(tr => tr.querySelectorAll('td')[1]?.textContent?.trim());

  it('ordena con aria-sort: primer clic ascendente y el siguiente descendente', async () => {
    const f = TestBed.createComponent(TableHost);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const th = el.querySelectorAll('th')[2] as HTMLElement;
    expect(th.getAttribute('aria-sort')).toBe('none');
    (th.querySelector('button') as HTMLButtonElement).click();
    await f.whenStable();
    expect(f.componentInstance.sort()).toEqual({ id: 'amount', desc: false });
    expect(th.getAttribute('aria-sort')).toBe('ascending');
    expect(cellTexts(el)).toEqual(['Bienvenida', 'Cyber', 'Navidad']);
    (th.querySelector('button') as HTMLButtonElement).click();
    await f.whenStable();
    expect(th.getAttribute('aria-sort')).toBe('descending');
    expect(el.querySelector('caption')!.textContent).toContain('ordenada por Monto, descendente');
  });

  it('"Seleccionar todos" marca las filas visibles y muestra la barra de acciones masivas', async () => {
    const f = TestBed.createComponent(TableHost);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const all = el.querySelector('th [role="checkbox"], th button[role="checkbox"]') as HTMLElement;
    all.click();
    await f.whenStable();
    expect(f.componentInstance.sel().sort()).toEqual(['a', 'b', 'c']);
    expect(el.querySelector('[role="region"]')!.textContent).toContain('3 seleccionados');
    expect(el.querySelectorAll('tr[aria-selected="true"]').length).toBe(3);
  });

  it('sin filas muestra el estado vacío en lugar de la tabla', async () => {
    const f = TestBed.createComponent(TableHost);
    f.componentInstance.rows.set([]);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('table')).toBeNull();
    expect(el.textContent).toContain('Sin lotes');
  });
});

@Component({
  imports: [OverlayComponent],
  template: `<button id="opener" (click)="open.set(true)">Abrir</button>
    <zc-modal title="Extender vigencia" subtitle="Una sola vez" [(open)]="open"><input id="first" /><div zcOverlayFooter><button>Cancelar</button></div></zc-modal>`,
})
class ModalHost { open = signal(false); }

describe('zc-modal', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [transloco] }));

  it('abre como diálogo modal, enfoca el primer control y Escape cierra devolviendo el foco', async () => {
    const f = TestBed.createComponent(ModalHost);
    document.body.appendChild(f.nativeElement);
    await f.whenStable();
    const opener = document.getElementById('opener') as HTMLButtonElement;
    opener.focus(); opener.click();
    await f.whenStable();
    await new Promise(r => setTimeout(r));
    const dlg = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dlg.getAttribute('aria-labelledby')!)!.textContent).toBe('Extender vigencia');
    expect(document.activeElement?.id).toBe('first');
    dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await f.whenStable();
    expect(f.componentInstance.open()).toBe(false);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
    f.nativeElement.remove();
  });
});

@Component({
  imports: [AlertDialogComponent],
  template: `<zc-alert-dialog title="¿Anular 500 códigos?" reasonLabel="Motivo" confirmWord="ANULAR" cancelLabel="Cancelar" confirmLabel="Solicitar anulación" [(open)]="open" (confirm)="reason = $event.reason" />`,
})
class AlertHost { open = signal(true); reason = ''; }

describe('zc-alert-dialog', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [transloco] }));

  it('confirmar queda deshabilitado hasta escribir el motivo y la palabra exacta', async () => {
    const f = TestBed.createComponent(AlertHost);
    await f.whenStable();
    const dlg = document.querySelector('[role="alertdialog"]') as HTMLElement;
    const [reason, word] = Array.from(dlg.querySelectorAll('input'));
    const ok = Array.from(dlg.querySelectorAll('button')).find(b => b.textContent?.includes('Solicitar anulación'))!;
    if (!ok) throw new Error(dlg.innerHTML);
    expect(ok.disabled).toBe(true);
    reason.value = 'Error en la orden'; reason.dispatchEvent(new Event('input'));
    word.value = 'anular'; word.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(ok.disabled).toBe(true);
    word.value = 'ANULAR'; word.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(ok.disabled).toBe(false);
    ok.click();
    expect(f.componentInstance.reason).toBe('Error en la orden');
    f.componentInstance.open.set(false);
    await f.whenStable();
  });
});

@Component({
  imports: [StepperComponent, FormSummaryComponent],
  template: `<zc-stepper label="Nuevo cliente" [steps]="['Empresa', 'Contacto', 'Resumen']" [current]="1" />
    <zc-form-summary [errors]="errors" /><input id="f-mail" />`,
})
class StepperHost { errors = [{ id: 'f-name', message: 'Ingresa la razón social.' }, { id: 'f-mail', message: 'Ingresa el correo.' }]; }

describe('zc-stepper y zc-form-summary', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [transloco] }));

  it('marca el paso actual y el resumen enlaza cada error con su campo', async () => {
    const f = TestBed.createComponent(StepperHost);
    document.body.appendChild(f.nativeElement);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('[aria-current="step"]')!.textContent).toContain('Contacto');
    expect(el.textContent).toContain('Paso 2 de 3: Contacto');
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Revisa 2 campos para continuar');
    (el.querySelectorAll('[role="alert"] a')[1] as HTMLAnchorElement).click();
    expect(document.activeElement?.id).toBe('f-mail');
    f.nativeElement.remove();
  });
});

@Component({
  imports: [FilterBarComponent],
  template: `<zc-filter-bar searchLabel="Buscar lotes" [chips]="chips()" (removeChip)="removed = $event.id" (clearAll)="cleared = true" />`,
})
class FilterHost { chips = signal<ZcFilterChip[]>([{ id: 'country:pe', label: 'País: Perú' }]); removed = ''; cleared = false; }

describe('zc-filter-bar', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [transloco] }));

  it('chips removibles con "Limpiar todo"', async () => {
    const f = TestBed.createComponent(FilterHost);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    (el.querySelector('button[aria-label="Quitar País: Perú"]') as HTMLButtonElement).click();
    expect(f.componentInstance.removed).toBe('country:pe');
    (Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Limpiar todo')) as HTMLButtonElement).click();
    expect(f.componentInstance.cleared).toBe(true);
  });
});

const NAV: ZcNavGroup[] = [{ items: [
  { id: 'inicio', label: 'Inicio', icon: 's:home-smile' },
  { id: 'inventario', label: 'Inventario', icon: 's:widget-5', children: [{ id: 'disponibles', label: 'Disponibles' }] },
] }];
@Component({ imports: [SidebarComponent], template: `<zc-sidebar [groups]="nav" storageKey="zc-sb-test" [(current)]="current" />` })
class SidebarHost { nav = NAV; current = signal<string | null>('disponibles'); }

describe('zc-sidebar', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [transloco], providers: [provideRouter([])] }));

  it('marca el actual, abre el grupo que lo contiene y alterna a riel a riel', async () => {
    const f = TestBed.createComponent(SidebarHost);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('[aria-current="page"]')!.textContent).toContain('Disponibles');
    expect(el.querySelector('button[aria-expanded="true"]')!.textContent).toContain('Inventario');
    (el.querySelector('button[aria-label="Contraer menú"]') as HTMLButtonElement).click();
    await f.whenStable();
    expect(el.querySelector('button[aria-label="Expandir menú"]')).toBeTruthy();
    // En el riel, el grupo con la página actual se marca como actual y lleva su nombre completo.
    expect(el.querySelector('[aria-current="page"]')!.getAttribute('aria-label')).toBe('Inventario');
  });
});
