import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { CheckboxComponent } from '../../atoms/checkbox/checkbox.component';
import { SwitchComponent } from '../../atoms/switch/switch.component';
import { injectTranslate } from '../../lang';

export interface ZcPermission { id: string; label: string; on: boolean; description?: string }

/**
 * <zc-permission-group title="Lotes" [(enabled)]="lotesOn" [(permissions)]="permisosLotes" /> · un módulo de la matriz de permisos (o-domain).
 * El switch activa el módulo; apagado desmarca y deshabilita sus permisos. El conteo "3/6 permisos" se actualiza solo.
 */
@Component({
  selector: 'zc-permission-group',
  imports: [BadgeComponent, CheckboxComponent, SwitchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0 rounded-md border border-border', '[attr.title]': 'null' },
  template: `
    <div class="flex min-h-target items-center gap-3 px-4">
      <span class="min-w-0 flex-1 break-words font-semibold">{{ title() }}</span>
      <zc-badge class="num">{{ t('mol.permisos.conteo', { n: count(), total: permissions().length }) }}</zc-badge>
      <zc-switch [checked]="enabled()" (checkedChange)="setEnabled($event)"><span class="sr-only">{{ t('mol.permisos.activar', { modulo: title() }) }}</span></zc-switch>
    </div>
    <div class="grid grid-cols-[minmax(0,1fr)] border-t border-border px-4 pb-2">
      @for (p of permissions(); track p.id) {
        <zc-checkbox [checked]="p.on" [disabled]="!enabled()" [description]="p.description ?? ''" (checkedChange)="set(p.id, $event)">{{ p.label }}</zc-checkbox>
      }
    </div>`,
})
export class PermissionGroupComponent {
  readonly t = injectTranslate();
  readonly title = input.required<string>();
  readonly enabled = model(true);
  readonly permissions = model.required<ZcPermission[]>();
  readonly count = computed(() => this.permissions().filter(p => p.on).length);
  set(id: string, on: boolean) { this.permissions.update(ps => ps.map(p => (p.id === id ? { ...p, on } : p))); }
  setEnabled(on: boolean) {
    this.enabled.set(on);
    if (!on) this.permissions.update(ps => ps.map(p => ({ ...p, on: false })));
  }
}
