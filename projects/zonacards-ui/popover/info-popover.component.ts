import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, inject, input, viewChild } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { Panel } from '@zonacards/ui/panel';

/**
 * <zc-info-popover heading="Breakage" triggerText="¿Qué es breakage?">Texto… <a zcLink …>Ver reporte</a></zc-info-popover>
 * Popover informativo (Popover de index.html): explica un término o dato sin sacar al usuario de la pantalla.
 * Clic abre y cierra; Escape o clic fuera cierran y el foco vuelve al botón. En móvil, bottom sheet.
 * Sin triggerText es un botón de solo ícono (?) con aria-label = heading.
 */
@Component({
  selector: 'zc-info-popover',
  imports: [ButtonDirective, IconComponent],
  providers: [Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex', '[attr.title]': 'null' },
  template: `
    <button #trigger zcButton variant="ghost" [size]="triggerText() ? 'md' : 'icon-sm'" aria-haspopup="dialog"
      [attr.aria-expanded]="panel.isOpen()" [attr.aria-label]="triggerText() ? null : heading()" (click)="toggle()">
      <zc-icon name="s:question-circle" [size]="16" />{{ triggerText() }}
    </button>
    <ng-template #tpl>
      <div class="grid gap-2 p-2">
        <strong class="text-[15px]">{{ heading() }}</strong>
        <div class="grid gap-2 text-sm leading-5 text-muted"><ng-content /></div>
      </div>
    </ng-template>`,
})
export class InfoPopoverComponent {
  readonly panel = inject(Panel);
  readonly heading = input.required<string>();
  readonly triggerText = input('');
  readonly width = input(320);
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  toggle() {
    if (this.panel.isOpen()) { this.panel.close(); return; }
    this.panel.open(this.tpl(), { title: this.heading(), ariaLabel: this.heading(), role: 'dialog', origin: this.trigger().nativeElement, width: this.width(), align: 'start' });
  }
}
