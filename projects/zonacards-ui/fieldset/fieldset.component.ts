import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let seq = 0;

/**
 * <zc-fieldset legend="Datos de contacto" description="Para avisarte del envío."> …campos… </zc-fieldset>
 * Agrupa campos relacionados con una leyenda que los lectores de pantalla anuncian al entrar al grupo (`<fieldset>` + `<legend>`).
 * Con `disabled`, deshabilita todos los controles de adentro. `bordered` lo dibuja como una tarjeta suave. 16 px entre la leyenda y cada campo,
 * como `.fieldset` de index.html.
 */
@Component({
  selector: 'zc-fieldset',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <fieldset class="m-0 grid min-w-0 content-start gap-4 border-0 p-0" [class]="bordered() ? 'rounded-card border border-border p-4' : ''"
      [disabled]="disabled()" [attr.aria-describedby]="description() ? descriptionId : null">
      <legend class="float-left w-full p-0 text-body-sm font-medium leading-5">{{ legend() }}</legend>
      @if (description()) { <p [id]="descriptionId" class="m-0 -mt-2 clear-both text-caption text-muted">{{ description() }}</p> }
      <ng-content />
    </fieldset>`,
})
export class FieldsetComponent {
  /** Título del grupo: obligatorio, porque sin él el grupo no tiene nombre para quien no lo ve. */
  readonly legend = input.required<string>();
  readonly description = input('');
  readonly bordered = input(false);
  readonly disabled = input(false);
  readonly descriptionId = `zc-fs-${++seq}`;
}
