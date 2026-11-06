import { ChangeDetectionStrategy, Component, computed, contentChildren, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrnAccordion, BrnAccordionContent, BrnAccordionHeader, BrnAccordionItem, BrnAccordionTrigger } from '@spartan-ng/brain/accordion';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

let seq = 0;

/**
 * <zc-accordion-item title="…" subtitle="…" icon="…" [open]="true">contenido<zc-badge zcAccordionAside … /></zc-accordion-item>
 * Encabezado con ícono, título, subtítulo, estado (slot zcAccordionAside) y flecha. Deshabilitado con [disabled].
 */
@Component({
  selector: 'zc-accordion-item',
  imports: [BrnAccordionHeader, BrnAccordionTrigger, BrnAccordionContent, IconComponent],
  hostDirectives: [{ directive: BrnAccordionItem, inputs: ['isOpened: open', 'disabled'], outputs: ['openedChange: openChange'] }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h3 brnAccordionHeader class="m-0 flex text-[15px] font-medium">
      <button brnAccordionTrigger type="button" [class]="triggerClass()">
        @if (icon(); as i) { <span class="grid size-9 shrink-0 place-items-center rounded-ms bg-surface-2 text-fg"><zc-icon [name]="i" [size]="16" /></span> }
        <span class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1 leading-[22px]">
          <span class="break-words">{{ title() }}</span>
          @if (subtitle()) { <small class="text-[13px] font-normal leading-[18px] text-muted break-words">{{ subtitle() }}</small> }
        </span>
        <span class="ml-auto shrink-0 empty:hidden max-[400px]:hidden"><ng-content select="[zcAccordionAside]" /></span>
        <zc-icon name="s:alt-arrow-down" [size]="16" class="text-muted transition-transform duration-(--dur-base) ease-standard group-aria-expanded/acc:rotate-180" />
      </button>
    </h3>
    <div brnAccordionContent class="overflow-hidden text-[15px] text-muted transition-[height] duration-(--dur-base) ease-standard motion-reduce:transition-none data-[state=closed]:h-0 data-[state=open]:h-(--brn-accordion-content-height)">
      <div [class]="panelClass()"><ng-content /></div>
    </div>`,
})
export class AccordionItemComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly icon = input<IconName | null>(null);
  readonly item = inject(BrnAccordionItem);
  private readonly parent = inject(AccordionComponent);
  readonly triggerClass = computed(() => 'group/acc flex min-h-target w-full cursor-pointer items-center gap-3 py-3 text-left transition-colors hover:bg-surface-2/60 aria-disabled:cursor-not-allowed aria-disabled:opacity-55 focus-visible:outline-offset-[-2px] '
    + (this.parent.variant() === 'flush' ? 'px-0 hover:bg-transparent' : 'px-4'));
  readonly panelClass = computed(() => (this.parent.variant() === 'flush' ? 'pb-4' : 'px-4 pb-4'));
}

/**
 * <zc-accordion> · sobre spartan brain accordion. Flechas arriba/abajo, Inicio y Fin recorren los encabezados; Enter o Espacio abren.
 * - type="single": uno abierto a la vez (preguntas frecuentes).
 * - type="multiple": varios abiertos (formularios largos por secciones); con label muestra "Expandir todo / Contraer todo".
 * - variant="flush": sin bordes, dentro de paneles y drawers.
 */
@Component({
  selector: 'zc-accordion',
  imports: [TranslocoPipe],
  hostDirectives: [{ directive: BrnAccordion, inputs: ['type'] }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2' },
  template: `
    @if (label()) {
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-x-3">
        <span [id]="labelId" class="text-sm font-medium">{{ label() }}</span>
        @if (brn.type() === 'multiple') {
          <button type="button" class="min-h-8 cursor-pointer text-[13px] text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-current" (click)="toggleAll()">
            {{ (allOpen() ? 'ui.contraerTodo' : 'ui.expandirTodo') | transloco }}
          </button>
        }
      </div>
    }
    <div [attr.role]="label() ? 'group' : null" [attr.aria-labelledby]="label() ? labelId : null" [class]="listClass()"><ng-content /></div>`,
})
export class AccordionComponent {
  readonly variant = input<'card' | 'flush'>('card');
  /** Título del grupo; en multiple agrega el botón Expandir todo / Contraer todo. */
  readonly label = input('');
  readonly brn = inject(BrnAccordion);
  readonly labelId = `zc-acc-${++seq}`;
  private readonly items = contentChildren(AccordionItemComponent);
  private readonly enabled = computed(() => this.items().filter(i => !i.item.disabled()));
  readonly allOpen = computed(() => this.enabled().length > 0 && this.enabled().every(i => i.item.state() === 'open'));

  readonly listClass = computed(() => this.variant() === 'flush'
    ? 'grid grid-cols-[minmax(0,1fr)] border-y border-border [&>*+*]:border-t [&>*+*]:border-border'
    : 'grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-md border border-border bg-surface [&>*+*]:border-t [&>*+*]:border-border');

  /** Expandir o contraer todo: solo los ítems habilitados. */
  toggleAll() {
    const open = !this.allOpen();
    for (const i of this.enabled()) open ? i.item.open() : i.item.close();
  }
}
