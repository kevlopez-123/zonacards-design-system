import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChipComponent } from './chip.component';

@Component({
  imports: [ChipComponent],
  template: `
    <zc-chip label="País: Perú" [removable]="true" (remove)="removed = removed + 1" />
    <zc-chip label="Propias" [selectable]="true" [(selected)]="sel" />
    <zc-chip label="correo@mal" [removable]="true" [invalid]="true" />
    <zc-chip label="Gastronomía" />`,
})
class Host { removed = 0; sel = signal(false); }

describe('zc-chip', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({ langs: { es: { ui: { quitar: 'Quitar {{label}}', invalido: 'No válido' } } }, translocoConfig: { availableLangs: ['es'], defaultLang: 'es' } })],
  }));

  it('removible: el botón dice qué quita y emite remove', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const btn = f.nativeElement.querySelector('button[aria-label="Quitar País: Perú"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(f.componentInstance.removed).toBe(1);
  });

  it('seleccionable: es un botón con aria-pressed', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const btn = f.nativeElement.querySelector('button[aria-pressed]') as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    btn.click();
    await f.whenStable();
    expect(f.componentInstance.sel()).toBe(true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('inválido: no depende solo del color (ícono y texto para lectores)', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const chip = f.nativeElement.querySelectorAll('zc-chip')[2] as HTMLElement;
    expect(chip.querySelector('zc-icon')).toBeTruthy();
    expect(chip.querySelector('.sr-only')?.textContent).toContain('No válido');
  });

  it('estático: sin botones', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect((f.nativeElement.querySelectorAll('zc-chip')[3] as HTMLElement).querySelector('button')).toBeNull();
  });
});
