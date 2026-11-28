import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { BadgeComponent } from '@zonacards/ui/badge';

/**
 * Piezas de maquetación del catálogo, copiadas de docs/design-system/index.html (.level-head, .group-head, .ds, .ds-head, .panel).
 * Solo para /catalogo: las pantallas del producto no las usan.
 */
@Component({
  selector: 'zc-ds-level',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-baseline gap-3 border-t-2 border-fg pt-4 scroll-mt-24', '[attr.title]': 'null' },
  template: `<h1 class="text-display-sm font-semibold leading-9">{{ title() }}</h1><p class="text-muted">{{ subtitle() }}</p>`,
})
export class DsLevelComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}

@Component({
  selector: 'zc-ds-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex items-center gap-2 pt-2 scroll-mt-24', '[attr.title]': 'null' },
  template: `
    <h2 class="text-caption font-semibold uppercase tracking-wide text-muted">{{ title() }}</h2>
    <span class="text-caption text-subtle num">{{ count() }}</span>
    <span class="h-px flex-1 bg-border" aria-hidden="true"></span>`,
})
export class DsGroupComponent {
  readonly title = input.required<string>();
  readonly count = input(0);
}

/** Sección: título (h3), descripción y un panel con las demos. [panel]="false" deja el contenido sin panel (varios paneles). */
@Component({
  selector: 'zc-ds-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 scroll-mt-24', '[attr.id]': 'dsId()', role: 'region', '[attr.aria-labelledby]': "dsId() + '-t'", '[attr.title]': 'null' },
  template: `
    <div class="grid gap-1">
      <h3 [id]="dsId() + '-t'" class="text-heading font-semibold">{{ title() }}</h3>
      @if (description()) { <p class="max-w-[76ch] text-body text-muted">{{ description() }}</p> }
    </div>
    <!-- Un solo ng-content: dentro de @if/@else Angular solo proyecta en uno de los dos. -->
    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)]" [class]="panel() ? 'gap-5 rounded-lg border border-border bg-surface p-5 shadow-1 md:p-6' : 'gap-4'"><ng-content /></div>`,
})
export class DsSectionComponent {
  readonly dsId = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly panel = input(true);
}

/** Sección aún no portada: queda en su lugar del índice, con el motivo y dónde verla. */
@Component({
  selector: 'zc-ds-pending',
  imports: [IconComponent, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 scroll-mt-24', '[attr.id]': 'dsId()', role: 'region', '[attr.aria-labelledby]': "dsId() + '-t'", '[attr.title]': 'null' },
  template: `
    <div class="flex flex-wrap items-center gap-2">
      <h3 [id]="dsId() + '-t'" class="text-heading font-semibold">{{ title() }}</h3>
      <zc-badge tone="warning" icon="s:hourglass">Pendiente de portar</zc-badge>
    </div>
    <p class="flex items-start gap-2 rounded-lg border border-dashed border-border-strong p-5 text-body text-muted">
      <zc-icon name="s:info-circle" [size]="16" class="mt-1 shrink-0" />
      <span>Esta sección existe en <code>docs/design-system/index.html</code> (#{{ dsId() }}) y todavía no tiene versión en Angular. El avance está en <code>docs/design-system-port.md</code>.</span>
    </p>`,
})
export class DsPendingComponent {
  readonly dsId = input.required<string>();
  readonly title = input.required<string>();
}
