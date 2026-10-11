import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { injectTranslate } from '@zonacards/ui/core';
import { PageHeaderComponent } from '@zonacards/ui/page-header';
import { StateComponent } from '@zonacards/ui/state';

/** Nuevo lote: el asistente de 4 pasos llega en la etapa 6. La ruta ya existe para que "Nuevo lote" no lleve a un 404. */
@Component({
  selector: 'zc-nuevo-lote-page',
  imports: [RouterLink, TranslocoPipe, ButtonDirective, IconComponent, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-[minmax(0,1fr)] gap-4">
      <zc-page-header [title]="'lotes.nuevoLote.titulo' | transloco" [crumbs]="crumbs()" />
      <zc-state icon="s:box" [title]="'lotes.nuevoLote.titulo' | transloco" [text]="'lotes.nuevoLote.texto' | transloco">
        <a zcButton variant="outline" routerLink="/lotes"><zc-icon name="s:alt-arrow-left" [size]="16" />{{ 'lotes.nuevoLote.volver' | transloco }}</a>
      </zc-state>
    </div>`,
})
export class NuevoLotePage {
  private readonly t = injectTranslate();
  readonly crumbs = computed(() => [{ label: this.t('nav.inicio'), link: '/inicio' }, { label: this.t('lotes.titulo'), link: '/lotes' }, { label: this.t('lotes.nuevoLote.titulo') }]);
}
