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
  template: `<svg [attr.viewBox]="viewBox()" width="100%" height="100%" focusable="false" [innerHTML]="body()"></svg>`,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<16 | 20 | 24 | 32>(20);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly data = computed(() => ICONS[this.name()]);
  readonly viewBox = computed(() => `0 0 ${this.data().w} ${this.data().h}`);
  // Seguro: el contenido viene del registro generado en build desde @iconify-json, no de datos del usuario.
  readonly body = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.data().body));
}
