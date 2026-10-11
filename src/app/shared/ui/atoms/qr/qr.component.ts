import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * <zc-qr [seed]="42" /> · código QR de muestra para vistas previas (pase Wallet, vales). Decorativo: no codifica datos.
 * En producción el QR real lo genera el backend o Apple/Google; aquí solo se dibuja la forma (3 marcas de posición + módulos).
 * Siempre negro sobre blanco (tokens --qr-*) para que el contraste sea el de un código legible.
 */
@Component({
  selector: 'zc-qr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="-1 -1 23 23" class="block size-full">
      <rect x="-1" y="-1" width="23" height="23" fill="var(--qr-bg)" />
      <g fill="var(--qr-fg)">@for (c of cells(); track $index) { <rect [attr.x]="c[0]" [attr.y]="c[1]" width="1" height="1" /> }</g>
    </svg>`,
})
export class QrComponent {
  readonly seed = input(7);
  readonly cells = computed(() => {
    let s = this.seed(); const out: [number, number][] = []; const N = 21;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      const fx = x > 13 ? x - 14 : x, fy = y > 13 ? y - 14 : y;
      const on = finder ? fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4) : rnd() > 0.5;
      if (on) out.push([x, y]);
    }
    return out;
  });
}
