import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { SkeletonComponent } from './skeleton.component';

@Component({
  imports: [SkeletonComponent],
  template: `<zc-skeleton [lines]="4" /><zc-skeleton variant="card" /><zc-skeleton variant="table-row" [columns]="5" />`,
})
class Host {}

describe('zc-skeleton', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({ langs: { es: { ui: { cargando: 'Cargando' } } }, translocoConfig: { availableLangs: ['es'], defaultLang: 'es' } })],
  }));

  it('marca el contenedor como ocupado y anuncia "Cargando" solo a lectores de pantalla', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const s = f.nativeElement.querySelector('zc-skeleton') as HTMLElement;
    expect(s.getAttribute('aria-busy')).toBe('true');
    expect(s.querySelector('.sr-only[role="status"]')?.textContent).toContain('Cargando');
  });

  it('dibuja la forma del contenido: líneas, tarjeta y celdas', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const [line, card, row] = Array.from(f.nativeElement.querySelectorAll('zc-skeleton')) as HTMLElement[];
    const bars = line.querySelectorAll('[data-slot="skeleton"]');
    expect(bars.length).toBe(4);
    expect(bars[3].className).toContain('w-3/5');
    expect(card.querySelectorAll('[data-slot="skeleton"]').length).toBe(5);
    expect(row.querySelectorAll('[data-slot="skeleton"]').length).toBe(5);
  });
});
