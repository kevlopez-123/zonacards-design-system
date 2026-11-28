import { ChangeDetectionStrategy, Component, Directive, ElementRef, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';

/** <kbd zcKbd>Ctrl</kbd> · atajo de teclado (Kbd de index.html). */
@Directive({
  selector: 'kbd[zcKbd]',
  host: { class: 'inline-block rounded-xs border border-b-2 border-border-strong bg-surface-2 px-1.5 py-1 font-sans text-xs leading-none text-fg' },
})
export class KbdDirective {}

/**
 * <zc-separator /> · línea horizontal; orientation="vertical" entre elementos de una fila (se estira a su alto).
 * Decorativo por defecto; [decorative]="false" lo expone como separador para lectores de pantalla.
 */
@Component({
  selector: 'zc-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "orientation() === 'vertical' ? 'block w-px self-stretch bg-border' : 'block h-px w-full bg-border'",
    '[attr.role]': "decorative() ? 'none' : 'separator'", '[attr.aria-orientation]': "decorative() ? null : orientation()",
  },
  template: '',
})
export class SeparatorComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly decorative = input(true);
}

/**
 * <div zcButtonGroup aria-label="Exportar"> botones outline </div> · acciones relacionadas (ButtonGroup de index.html):
 * bordes compartidos, extremos redondeados.
 */
@Directive({
  selector: '[zcButtonGroup]',
  host: {
    role: 'group',
    class: 'inline-flex [&>*]:rounded-none [&>*:first-child]:rounded-l-full [&>*:last-child]:rounded-r-full [&>*+*]:-ml-px [&>*:focus-visible]:relative [&>*:focus-visible]:z-(--z-raised)',
  },
})
export class ButtonGroupDirective {}

/** <zc-close-button label="Cerrar" (click)="…" /> · cierre de overlays, toasts y avisos (CloseButton de index.html). */
@Component({
  selector: 'zc-close-button',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-grid shrink-0', '[attr.title]': 'null' },
  template: `
    <button type="button" [attr.aria-label]="label()" [disabled]="disabled()"
      class="grid size-icon-btn cursor-pointer place-items-center rounded-full text-muted transition-colors duration-(--dur) hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-(--opacity-disabled)">
      <zc-icon name="l:x" />
    </button>`,
})
export class CloseButtonComponent {
  readonly label = input.required<string>();
  readonly disabled = input(false);
}

/**
 * <a zcLink href="…" [external]="true">Ver detalle</a> · enlace de texto (Link de index.html): subrayado suave que se
 * intensifica al pasar el mouse; externo con ícono. También en <button zcLink> para acciones de texto.
 */
@Component({
  selector: 'a[zcLink], button[zcLink]',
  imports: [IconComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-current',
    '[attr.target]': "external() && isAnchor ? '_blank' : null", '[attr.rel]': "external() && isAnchor ? 'noopener noreferrer' : null",
  },
  template: `<ng-content />@if (external()) { <zc-icon name="l:external-link" [size]="16" />@if (isAnchor) {<span class="sr-only"> ({{ 'ui.nuevaPestana' | transloco }})</span>} }`,
})
export class LinkComponent {
  /** Con <a>: abre en otra pestaña y lo anuncia. Con <button>: solo el ícono (la acción la define la página). */
  readonly external = input(false);
  readonly isAnchor = inject(ElementRef).nativeElement.tagName === 'A';
}
