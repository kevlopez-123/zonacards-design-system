import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { describe, expect, it } from 'vitest';
import { RatingComponent } from './rating.component';

@Component({
  imports: [RatingComponent],
  template: `
    <zc-rating label="Calificación del servicio" [(value)]="stars" [allowHalf]="half()" [disabled]="disabled()" />
    <zc-rating label="Calificación del producto" [value]="4.3" [readonly]="true" [count]="128" [showValue]="true" />
    <zc-rating label="Calificación del comercio" [value]="0" [readonly]="true" />`,
})
class Host {
  stars = signal<number | null>(0);
  half = signal(false);
  disabled = signal(false);
}

async function setup() {
  TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({
      langs: { es: { ui: { calificacion: '{{label}}: {{value}} de {{max}}', sinCalificar: '{{label}}: sin calificar', nOpiniones: '{{n}} opiniones' } } },
      translocoConfig: { availableLangs: ['es'], defaultLang: 'es' },
      preloadLangs: true,
    })],
  });
  const f = TestBed.createComponent(Host);
  // Las traducciones llegan en una microtarea (injectTranslate avisa por eventos): se deja pasar antes de leer los textos.
  await f.whenStable(); await new Promise(r => setTimeout(r)); f.detectChanges(); await f.whenStable();
  const el = f.nativeElement as HTMLElement;
  const slider = () => el.querySelector('[role="slider"]') as HTMLElement;
  const imgs = () => [...el.querySelectorAll('[role="img"]')] as HTMLElement[];
  const key = async (k: string) => { slider().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })); await f.whenStable(); };
  /** Clic en la fracción `frac` (0 a 1) del ancho del control. */
  const clickAt = async (frac: number) => {
    const r = slider().getBoundingClientRect();
    slider().dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * frac, bubbles: true }));
    await f.whenStable();
  };
  return { f, host: f.componentInstance, el, slider, imgs, key, clickAt };
}

describe('zc-rating', () => {
  it('la interactiva es un slider con nombre, rango y texto de valor', async () => {
    const { slider } = await setup();
    expect(slider().getAttribute('aria-label')).toBe('Calificación del servicio');
    expect(slider().getAttribute('aria-valuemin')).toBe('0');
    expect(slider().getAttribute('aria-valuemax')).toBe('5');
    expect(slider().getAttribute('aria-valuenow')).toBe('0');
    expect(slider().getAttribute('aria-valuetext')).toBe('Calificación del servicio: sin calificar');
    expect(slider().getAttribute('tabindex')).toBe('0');
  });

  it('el teclado sube, baja, salta y acota', async () => {
    const { host, key } = await setup();
    await key('ArrowRight'); expect(host.stars()).toBe(1);
    await key('ArrowUp'); expect(host.stars()).toBe(2);
    await key('End'); expect(host.stars()).toBe(5);
    await key('ArrowRight'); expect(host.stars()).toBe(5);
    await key('PageDown'); expect(host.stars()).toBe(4);
    await key('ArrowLeft'); expect(host.stars()).toBe(3);
    await key('Home'); expect(host.stars()).toBe(0);
    await key('ArrowLeft'); expect(host.stars()).toBe(0);
  });

  it('con medias estrellas, las flechas avanzan de a 0,5 y el valor se anuncia', async () => {
    const { host, f, slider, key } = await setup();
    host.half.set(true); await f.whenStable();
    await key('ArrowRight'); expect(host.stars()).toBe(0.5);
    await key('ArrowRight'); await key('ArrowRight'); expect(host.stars()).toBe(1.5);
    expect(slider().getAttribute('aria-valuetext')).toBe('Calificación del servicio: 1,5 de 5');
  });

  it('un clic elige la estrella; con medias, la mitad izquierda vale 0,5', async () => {
    const { host, f, clickAt } = await setup();
    // jsdom/Chromium sin layout: se simula un control de 100 px de ancho.
    const original = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function () { return this.getAttribute('role') === 'slider' ? ({ left: 0, width: 100, top: 0, height: 20, right: 100, bottom: 20, x: 0, y: 0, toJSON() {} } as DOMRect) : original.call(this); };
    try {
      await clickAt(0.5); expect(host.stars()).toBe(3);      // tercera estrella (40 a 60 %)
      host.half.set(true); await f.whenStable();
      await clickAt(0.05); expect(host.stars()).toBe(0.5);   // mitad izquierda de la primera
      await clickAt(0.15); expect(host.stars()).toBe(1);     // mitad derecha de la primera
      await clickAt(0.99); expect(host.stars()).toBe(5);
    } finally { HTMLElement.prototype.getBoundingClientRect = original; }
  });

  it('deshabilitada no responde ni entra en el orden de Tab', async () => {
    const { host, f, slider, key } = await setup();
    host.disabled.set(true); await f.whenStable();
    expect(slider().getAttribute('tabindex')).toBeNull();
    expect(slider().getAttribute('aria-disabled')).toBe('true');
    await key('End'); expect(host.stars()).toBe(0);
  });

  it('solo lectura es una imagen con nota y opiniones, y no un control', async () => {
    const { imgs, el } = await setup();
    expect(imgs()[0].getAttribute('aria-label')).toBe('Calificación del producto: 4,3 de 5, 128 opiniones');
    expect(imgs()[1].getAttribute('aria-label')).toBe('Calificación del comercio: sin calificar');
    expect(imgs()[0].getAttribute('tabindex')).toBeNull();
    expect(el.querySelectorAll('[role="slider"]').length).toBe(1);
    expect(el.textContent).toContain('(128)');
    expect(el.textContent).toContain('4,3');
  });

  it('rellena las estrellas enteras y la parte de la fraccionaria', async () => {
    const { imgs } = await setup();
    const fills = [...imgs()[0].querySelectorAll('span.overflow-hidden')].map(s => Math.round(parseFloat((s as HTMLElement).style.width)));
    expect(fills).toEqual([100, 100, 100, 100, 30]);
  });
});
