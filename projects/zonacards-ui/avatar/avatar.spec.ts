import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { AvatarGroupComponent } from './avatar-group.component';
import { AvatarComponent } from './avatar.component';
import { initials } from './initials';

@Component({
  imports: [AvatarComponent, AvatarGroupComponent],
  template: `
    <zc-avatar name="Lucía Mendoza" [presence]="true" />
    <zc-avatar name="Interbank" shape="square" size="lg" />
    <zc-avatar-group label="5 aprobadores" [people]="people" [max]="3" />`,
})
class Host { people = ['Ana Torres', 'Lucía Mendoza', 'Carlos Ríos', 'Iván Baca', 'Rosa Paz'].map((name) => ({ name })); }

describe('zc-avatar', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({ langs: { es: { ui: { enLinea: 'En línea', masPersonas: '{{n}} más' } } }, translocoConfig: { availableLangs: ['es'], defaultLang: 'es' }, preloadLangs: true })],
  }));

  it('calcula iniciales de las dos primeras palabras', () => {
    expect(initials('Lucía Mendoza Paz')).toBe('LM');
    expect(initials('  ana  ')).toBe('A');
  });

  it('se anuncia como imagen con nombre y presencia', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const a = f.nativeElement.querySelector('zc-avatar') as HTMLElement;
    expect(a.getAttribute('role')).toBe('img');
    expect(a.getAttribute('aria-label')).toBe('Lucía Mendoza, En línea');
    expect(a.textContent).toContain('LM');
    expect(a.querySelector('[data-slot="avatar-badge"]')).toBeTruthy();
  });

  it('cuadrado y grande para empresas', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const h = f.nativeElement.querySelectorAll('hlm-avatar')[1] as HTMLElement;
    expect(h.dataset['shape']).toBe('square');
    expect(h.dataset['size']).toBe('lg');
  });

  it('el grupo muestra hasta max y "+N" con texto accesible', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const g = f.nativeElement.querySelector('zc-avatar-group') as HTMLElement;
    expect(g.getAttribute('aria-label')).toBe('5 aprobadores');
    expect(g.querySelectorAll('hlm-avatar').length).toBe(3);
    const more = g.querySelector('[data-slot="avatar-group-count"]') as HTMLElement;
    expect(more.textContent?.trim()).toBe('+2');
    expect(more.getAttribute('aria-label')).toBe('2 más');
  });
});
