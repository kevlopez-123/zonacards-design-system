import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent } from '../../../shared/ui/atoms/icon/icon.component';

/**
 * Marco de teléfono solo para el catálogo (o-scanner, o-mobile, o-perm): barra de estado, contenido y una hoja inferior
 * propia ([(sheet)] + contenido [dsPhoneSheet]) para que los resultados se vean dentro del dispositivo, como en index.html.
 * En la app real esa hoja es <zc-drawer> (bottom sheet en móvil).
 */
@Component({
  selector: 'ds-phone',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div class="relative mx-auto flex w-full max-w-[360px] flex-col overflow-hidden rounded-[44px] border-[10px] border-(--device-frame) bg-bg shadow-2" [style.height.px]="height()">
      <div class="flex h-8 shrink-0 items-center justify-between px-[22px] text-[13px] font-semibold" aria-hidden="true">
        <span class="num">9:41</span><span class="flex items-center gap-1"><zc-icon name="l:wifi" [size]="16" /><span class="relative h-[11px] w-[22px] rounded-[3px] border-[1.5px] border-current after:absolute after:inset-[1px_4px_1px_1px] after:rounded-[1px] after:bg-current after:content-['']"></span></span>
      </div>
      <ng-content />
      @if (sheet()) {
        <div class="absolute inset-0 z-[5] bg-(--overlay)" (click)="sheet.set(false)" aria-hidden="true"></div>
        <div role="dialog" aria-modal="true" [attr.aria-label]="sheetLabel()" class="absolute inset-x-0 bottom-0 z-[6] grid gap-4 rounded-t-3xl bg-surface px-5 pt-2 pb-7" (keydown.escape)="sheet.set(false)">
          <span class="mx-auto mt-1 h-[5px] w-10 rounded-full bg-border-strong" aria-hidden="true"></span>
          <ng-content select="[dsPhoneSheet]" />
        </div>
      }
    </div>`,
})
export class DsPhoneComponent {
  readonly height = input(720);
  readonly sheet = model(false);
  readonly sheetLabel = input('');
}
