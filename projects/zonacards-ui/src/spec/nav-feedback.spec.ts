import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertComponent } from '../../alert/alert.component';
import { formatBytes, rejectReason } from '../../file-upload/file-upload.component';
import { MenuComponent, ZcMenuItem } from '../../menu/menu.component';
import { clampPage, formatCount, numericPages, pageCount, pageRange } from '../../pagination/pages';
import { PaginationComponent } from '../../pagination/pagination.component';
import { TOAST_DURATION, ToastService } from '../../toast/toast.service';

const transloco = TranslocoTestingModule.forRoot({
  langs: { es: { ui: { paginacion: 'Paginación', rango: '{{from}}–{{to}} de {{total}}', primeraPagina: 'Primera página', ultimaPagina: 'Última página', paginaSiguiente: 'Página siguiente', paginaAnterior: 'Página anterior', irAPagina: 'Ir a la página' } } },
  translocoConfig: { availableLangs: ['es'], defaultLang: 'es' },
});

describe('paginador: cálculos', () => {
  it('páginas, rango y límites', () => {
    expect(pageCount(1240, 25)).toBe(50);
    expect(pageCount(0, 25)).toBe(1);
    expect(pageRange(2, 25, 1240)).toEqual({ from: 26, to: 50 });
    expect(pageRange(50, 25, 1240)).toEqual({ from: 1226, to: 1240 });
    expect(clampPage(99, 50)).toBe(50);
    expect(clampPage(0, 50)).toBe(1);
  });

  it('numérica: hasta 5 números con elipsis', () => {
    expect(numericPages(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(numericPages(1, 9)).toEqual([1, 2, 3, 4, 'gap', 9]);
    expect(numericPages(5, 9)).toEqual([1, 'gap', 4, 5, 6, 'gap', 9]);
    expect(numericPages(9, 9)).toEqual([1, 'gap', 6, 7, 8, 9]);
    for (let p = 1; p <= 20; p++) expect(numericPages(p, 20).filter(x => x !== 'gap').length).toBeLessThanOrEqual(5);
  });

  it('miles siempre agrupados según el idioma', () => {
    expect(formatCount(1240, 'es')).toBe('1.240');
    expect(formatCount(1240, 'en')).toBe('1,240');
  });
});

@Component({ imports: [PaginationComponent], template: `<zc-pagination [total]="total()" [(page)]="page" />` })
class PagerHost { total = signal(1240); page = signal(1); }

describe('zc-pagination', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [transloco] }));

  it('se oculta si todo cabe en una página', async () => {
    const f = TestBed.createComponent(PagerHost);
    f.componentInstance.total.set(8);
    await f.whenStable();
    expect((f.nativeElement.querySelector('zc-pagination') as HTMLElement).classList.contains('hidden')).toBe(true);
  });

  it('compacta: rango, siguiente y primera página deshabilitada al inicio', async () => {
    const f = TestBed.createComponent(PagerHost);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.textContent).toContain('1–25 de 1.240');
    expect((el.querySelector('[aria-label="Primera página"]') as HTMLButtonElement).disabled).toBe(true);
    (el.querySelector('[aria-label="Página siguiente"]') as HTMLButtonElement).click();
    await f.whenStable();
    expect(f.componentInstance.page()).toBe(2);
    expect(el.textContent).toContain('26–50 de 1.240');
  });

  it('"Ir a la página" con Enter limita al total', async () => {
    const f = TestBed.createComponent(PagerHost);
    await f.whenStable();
    const input = (f.nativeElement as HTMLElement).querySelector('[aria-label="Ir a la página"]') as HTMLInputElement;
    input.value = '999';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await f.whenStable();
    expect(f.componentInstance.page()).toBe(50);
  });
});

describe('ToastService', () => {
  afterEach(() => vi.useRealTimers());

  it('cola: 3 visibles, el resto espera', () => {
    const s = new ToastService();
    for (let i = 0; i < 5; i++) s.info(`T${i}`);
    expect(s.visible().map(t => t.title)).toEqual(['T0', 'T1', 'T2']);
    expect(s.queued()).toBe(2);
    s.dismiss(s.visible()[0].id);
    expect(s.visible().map(t => t.title)).toEqual(['T1', 'T2', 'T3']);
  });

  it('6 s por defecto; un error con acción no se cierra solo', () => {
    const s = new ToastService();
    s.success('Lote creado');
    s.error('No se pudo enviar');
    s.error('Sin conexión con NetSuite', { action: { label: 'Reintentar ahora', run: () => {} } });
    expect(s.visible().map(t => t.duration)).toEqual([TOAST_DURATION, TOAST_DURATION, null]);
  });
});

describe('carga de archivos: validación previa', () => {
  const file = (name: string, bytes: number, type = '') => new File([new Uint8Array(bytes)], name, { type });

  it('tipo por extensión o MIME, y peso máximo', () => {
    expect(rejectReason(file('a.xlsx', 10), '.xlsx', 5e6)).toBeNull();
    expect(rejectReason(file('a.XLSX', 10), '.xlsx,.csv', 5e6)).toBeNull();
    expect(rejectReason(file('a.png', 10, 'image/png'), '.xlsx', 5e6)).toBe('type');
    expect(rejectReason(file('a.png', 10, 'image/png'), 'image/*', 5e6)).toBeNull();
    expect(rejectReason(file('a.xlsx', 6e6), '.xlsx', 5e6)).toBe('size');
  });

  it('peso legible', () => {
    expect(formatBytes(86_000, 'es')).toBe('84 KB');
    expect(formatBytes(7.5 * 1024 * 1024, 'es')).toBe('7,5 MB');
  });
});

@Component({ imports: [AlertComponent], template: `<zc-alert tone="danger" title="No se pudo conectar">Ref. 7F2A</zc-alert><zc-alert title="Vence en 7 días">Texto</zc-alert>` })
class AlertHost {}

describe('zc-alert', () => {
  it('danger se anuncia con role="alert"; el resto con status; siempre ícono', async () => {
    const f = TestBed.createComponent(AlertHost);
    await f.whenStable();
    const [danger, info] = Array.from(f.nativeElement.querySelectorAll('zc-alert')) as HTMLElement[];
    expect(danger.getAttribute('role')).toBe('alert');
    expect(info.getAttribute('role')).toBe('status');
    expect(danger.querySelector('zc-icon')).toBeTruthy();
  });
});

const ITEMS: ZcMenuItem[] = [
  { id: 'ver', label: 'Ver ficha' }, { id: 'reenviar', label: 'Reenviar', disabled: true, description: 'Sin códigos pendientes' }, { id: 'anular', label: 'Anular lote', danger: true },
];
@Component({ imports: [MenuComponent], template: `<zc-menu label="Acciones del lote" [items]="items" (select)="picked = $event.id" />` })
class MenuHost { items = ITEMS; picked = ''; }

describe('zc-menu', () => {
  it('el kebab tiene nombre, abre y cierra con el mismo botón y salta los deshabilitados', async () => {
    const f = TestBed.createComponent(MenuHost);
    await f.whenStable();
    const btn = (f.nativeElement as HTMLElement).querySelector('button[aria-label="Acciones del lote"]') as HTMLButtonElement;
    expect(btn.getAttribute('aria-haspopup')).toBe('menu');
    btn.click();
    await f.whenStable();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    const menu = document.querySelector('[role="menu"]') as HTMLElement;
    const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    items[0].focus();
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);
    items[1].click();
    expect(f.componentInstance.picked).toBe('');
    btn.click();
    await f.whenStable();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });
});
