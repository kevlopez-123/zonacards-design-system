import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';
import { injectTranslate } from '../../lang';

/**
 * <zc-offline-banner [pending]="cola()" /> · aviso de sin conexión con los cambios en cola (o-errors y o-mobile).
 * Es role="status": se anuncia al aparecer. La app lo muestra mientras navigator.onLine es false.
 */
@Component({
  selector: 'zc-offline-banner',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', class: 'flex min-w-0 items-center gap-2 rounded-sm bg-fg px-3 py-2.5 text-sm text-surface' },
  template: `<zc-icon name="l:wifi-off" [size]="16" /><span class="min-w-0 break-words">{{ t('mol.offline.texto', { n: pending() }) }}</span>`,
})
export class OfflineBannerComponent {
  readonly t = injectTranslate();
  readonly pending = input(0);
}
