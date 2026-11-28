import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { describe, expect, it } from 'vitest';
import { ActionBarAction, ActionBarComponent } from './action-bar.component';

const ACTIONS: ActionBarAction[] = [
  { id: 'send', label: 'Enviar', icon: 's:plain' },
  { id: 'export', label: 'Exportar', icon: 's:download-minimalistic', disabled: true, disabledReason: 'Elige solo lotes activos' },
  { id: 'void', label: 'Anular', icon: 's:close-circle', danger: true },
];

@Component({
  imports: [ActionBarComponent],
  template: `<zc-action-bar [count]="count()" [actions]="actions" [floating]="floating()" (action)="ran.push($event)" (cleared)="cleared = cleared + 1" />`,
})
class Host {
  count = signal(0);
  floating = signal(true);
  actions = ACTIONS;
  ran: string[] = [];
  cleared = 0;
}

async function setup() {
  TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({
      langs: { es: { ui: { nSeleccionados: '{{n}} seleccionados', quitarSeleccion: 'Quitar selección', accionesSeleccion: 'Acciones sobre la selección' } } },
      translocoConfig: { availableLangs: ['es'], defaultLang: 'es' },
    })],
  });
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  const el = f.nativeElement as HTMLElement;
  const bar = () => el.querySelector('[role="region"]') as HTMLElement | null;
  const buttons = () => [...(bar()?.querySelectorAll('button') ?? [])] as HTMLButtonElement[];
  const set = async (n: number) => { f.componentInstance.count.set(n); await f.whenStable(); };
  return { f, host: f.componentInstance, el, bar, buttons, set };
}

describe('zc-action-bar', () => {
  it('no se dibuja sin selección y aparece con ella', async () => {
    const { bar, set } = await setup();
    expect(bar()).toBeNull();
    await set(3);
    expect(bar()).not.toBeNull();
    expect(bar()!.getAttribute('aria-label')).toBe('Acciones sobre la selección');
    expect(bar()!.textContent).toContain('3 seleccionados');
    await set(0);
    expect(bar()).toBeNull();
  });

  it('anuncia el conteo en una región de voz que siempre existe', async () => {
    const { el, set } = await setup();
    const live = el.querySelector('[aria-live="polite"]')!;
    expect(live.textContent?.trim()).toBe('');
    await set(2);
    expect(live.textContent?.trim()).toBe('2 seleccionados');
  });

  it('emite el id de la acción pulsada y la X quita la selección', async () => {
    const { host, buttons, set } = await setup();
    await set(2);
    const byText = (t: string) => buttons().find(b => b.textContent?.includes(t))!;
    byText('Enviar').click();
    byText('Anular').click();
    expect(host.ran).toEqual(['send', 'void']);
    buttons().find(b => b.getAttribute('aria-label') === 'Quitar selección')!.click();
    expect(host.cleared).toBe(1);
  });

  it('una acción deshabilitada no emite y su motivo queda en un contenedor enfocable', async () => {
    const { host, bar, buttons, set, f } = await setup();
    await set(1);
    const exp = buttons().find(b => b.textContent?.includes('Exportar'))!;
    expect(exp.disabled).toBe(true);
    exp.click();
    expect(host.ran).toEqual([]);
    expect(exp.parentElement?.getAttribute('tabindex')).toBe('0');
    expect(f).toBeTruthy();
    expect(bar()).not.toBeNull();
  });

  it('con ícono, el texto sigue ahí (nombre accesible) pero se oculta en una barra angosta', async () => {
    const { buttons, set } = await setup();
    await set(1);
    const label = [...buttons().find(b => b.textContent?.includes('Enviar'))!.querySelectorAll('span')].find(sp => sp.textContent?.trim() === 'Enviar')!;
    expect(label.className).toContain('@max-[30rem]:sr-only');
  });

  it('flotante por defecto; en el flujo con floating=false', async () => {
    const { el, host, set, f } = await setup();
    await set(1);
    expect(el.querySelector('[role="region"]')!.parentElement!.className).toContain('fixed');
    host.floating.set(false);
    await f.whenStable();
    expect(el.querySelector('[role="region"]')!.parentElement!.className).not.toContain('fixed');
  });

  it('la acción destructiva usa la variante de peligro', async () => {
    const { buttons, set } = await setup();
    await set(1);
    expect(buttons().find(b => b.textContent?.includes('Anular'))!.getAttribute('data-variant')).toBe('danger-soft');
    expect(buttons().find(b => b.textContent?.includes('Enviar'))!.getAttribute('data-variant')).toBe('ghost');
  });
});
