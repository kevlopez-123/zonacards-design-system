import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS, IconName } from './icon-registry.generated';

/**
 * <zc-icon name="s:gift" /> · Solar Linear por defecto, Bold para activos, Lucide como respaldo.
 * Decorativo por defecto (aria-hidden). Si es el único contenido de un botón, el aria-label va en el botón.
 */
@Component({
  selector: 'zc-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'inline-grid shrink-0 place-items-center', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
  // El <svg> completo se escribe como HTML del contenedor: innerHTML sobre un <svg> no existe en el DOM del servidor (SSR).
  template: `<span class="contents" [innerHTML]="svg()"></span>`,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<16 | 20 | 24 | 32>(20);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly data = computed(() => ICONS[this.name()]);
  // Seguro: el contenido viene del registro generado en build desde @iconify-json, no de datos del usuario.
  readonly svg = computed(() => { const d = this.data(); return this.sanitizer.bypassSecurityTrustHtml(`<svg viewBox="0 0 ${d.w} ${d.h}" width="100%" height="100%" focusable="false">${d.body}</svg>`); });
}
