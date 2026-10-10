import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, inject, input, output, viewChild } from '@angular/core';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { normalize } from '../listbox/listbox.component';
import { Panel } from '../panel/panel';

export interface ZcMenuItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Atajo de teclado que se muestra a la derecha ("Enter", "Ctrl+E"). */
  shortcut?: string;
  /** Segunda línea: detalle o motivo de un ítem deshabilitado ("Sin códigos pendientes"). */
  description?: string;
  disabled?: boolean;
  /** Acción destructiva (rojo); normalmente abre un alert dialog. */
  danger?: boolean;
  /** Opción marcada (ordenamiento): el ítem pasa a menuitemradio con check. */
  checked?: boolean;
  /** Rótulo de grupo antes del ítem. */
  group?: string;
  separatorBefore?: boolean;
}

let seq = 0;

/**
 * <zc-menu label="Acciones del lote #02829" [items]="…" (select)="…" /> · menú de acciones.
 * - Disparador: kebab vertical (Solar Bold, nunca tres puntos horizontales) o, con triggerText, un botón con texto y flecha.
 * - El mismo botón abre y cierra; flecha abajo también abre. Flechas recorren (con vuelta), Inicio/Fin, escribir para saltar,
 *   Enter/Espacio eligen, Tab cierra, Escape cierra y devuelve el foco al botón.
 * - Ítem deshabilitado con el motivo visible; destructivo en rojo. En móvil se abre como bottom sheet
 *   (o subpantalla con Volver dentro de otro sheet o drawer).
 */
@Component({
  selector: 'zc-menu',
  imports: [ButtonDirective, IconComponent],
  providers: [Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    @if (triggerText()) {
      <button #trigger zcButton [variant]="triggerVariant()" size="sm" aria-haspopup="menu" [attr.aria-expanded]="panel.isOpen()" [attr.aria-controls]="panel.isOpen() ? menuId : null"
        (click)="toggle()" (keydown)="onTriggerKey($event)">{{ triggerText() }}<zc-icon name="s:alt-arrow-down" [size]="16" class="transition-transform duration-(--dur)" [class.rotate-180]="panel.isOpen()" /></button>
    } @else {
      <button #trigger zcButton [variant]="triggerVariant()" [size]="dense() ? 'icon-sm' : 'icon'" aria-haspopup="menu" [attr.aria-label]="label()"
        [attr.aria-expanded]="panel.isOpen()" [attr.aria-controls]="panel.isOpen() ? menuId : null" (click)="toggle()" (keydown)="onTriggerKey($event)">
        <zc-icon name="s:menu-dots-vertical-bold" />
      </button>
    }

    <ng-template #menuTpl>
      <div role="menu" [id]="menuId" [attr.aria-label]="label()" class="grid gap-0.5" (keydown)="onMenuKey($event)">
        @for (it of items(); track it.id; let i = $index) {
          @if (it.separatorBefore && i > 0) { <div role="separator" class="my-1 h-px bg-border"></div> }
          @if (it.group && it.group !== items()[i - 1]?.group) { <div role="presentation" class="px-3 pt-2 pb-0.5 text-xs text-muted">{{ it.group }}</div> }
          <button type="button" tabindex="-1" data-menuitem [attr.role]="it.checked !== undefined ? 'menuitemradio' : 'menuitem'" [attr.aria-checked]="it.checked ?? null"
            [attr.aria-disabled]="it.disabled || null" [attr.data-autofocus]="i === firstEnabled() ? '' : null"
            class="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-1.5 text-left text-[15px] leading-5 outline-none hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:shadow-[inset_3px_0_0_var(--focus)] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 max-md:min-h-12 pointer-coarse:min-h-12"
            [class.text-danger]="it.danger" (mousemove)="focusItem($event)" (click)="choose(it)">
            @if (it.icon) { <zc-icon [name]="it.icon" [size]="16" [class.text-muted]="!it.danger" /> }
            <span class="grid min-w-0 flex-1">
              <span class="break-words">{{ it.label }}</span>
              @if (it.description) { <span class="text-[13px] text-muted">{{ it.description }}</span> }
            </span>
            @if (it.shortcut) { <kbd class="shrink-0 rounded-xs border border-b-2 border-border-strong bg-surface-2 px-1.5 py-1 font-sans text-xs leading-none text-muted max-md:hidden">{{ it.shortcut }}</kbd> }
            @if (it.checked !== undefined) { <zc-icon name="l:check" [size]="16" class="shrink-0" [class.invisible]="!it.checked" /> }
          </button>
        }
      </div>
    </ng-template>`,
})
export class MenuComponent {
  readonly items = input.required<readonly ZcMenuItem[]>();
  /** Nombre accesible del botón y título del sheet: "Acciones del lote #02829". */
  readonly label = input.required<string>();
  /** Con texto, el disparador es un botón "Más acciones ⌄" en vez del kebab. */
  readonly triggerText = input('');
  readonly triggerVariant = input<'ghost' | 'outline'>('ghost');
  /** Kebab de 36 px (44 en táctil) para tarjetas y filas densas. */
  readonly dense = input(false);
  readonly select = output<ZcMenuItem>();

  readonly panel = inject(Panel);
  readonly menuId = `zc-menu-${++seq}`;
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuTpl = viewChild.required<TemplateRef<unknown>>('menuTpl');
  readonly firstEnabled = computed(() => this.items().findIndex(i => !i.disabled));
  private typed = ''; private typedAt = 0;

  toggle() { this.panel.isOpen() ? this.panel.close() : this.open(); }

  open() {
    const el = this.trigger().nativeElement;
    this.panel.open(this.menuTpl(), { title: this.label(), origin: el, align: 'end', width: 260, closeOnTab: true });
  }

  onTriggerKey(e: KeyboardEvent): void {
    if (!this.panel.isOpen() && e.key === 'ArrowDown') { e.preventDefault(); this.open(); }
  }

  choose(it: ZcMenuItem) {
    if (it.disabled) return;
    this.panel.close();
    this.select.emit(it);
  }

  focusItem(e: MouseEvent) {
    const b = e.currentTarget as HTMLElement;
    if (document.activeElement !== b) b.focus({ preventScroll: true });
  }

  onMenuKey(e: KeyboardEvent): void {
    const menu = e.currentTarget as HTMLElement;
    const all = Array.from(menu.querySelectorAll<HTMLElement>('[data-menuitem]'));
    const enabled = all.filter(b => !b.hasAttribute('aria-disabled'));
    if (!enabled.length) return;
    const cur = enabled.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    switch (e.key) {
      case 'ArrowDown': next = (cur + 1) % enabled.length; break;
      case 'ArrowUp': next = (cur - 1 + enabled.length) % enabled.length; break;
      case 'Home': next = 0; break;
      case 'End': next = enabled.length - 1; break;
      default:
        if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = Date.now();
          this.typed = now - this.typedAt > 600 ? e.key : this.typed + e.key; this.typedAt = now;
          const q = normalize(this.typed);
          const from = this.typed.length === 1 ? cur + 1 : Math.max(cur, 0);
          for (let k = 0; k < enabled.length; k++) {
            const j = (from + k) % enabled.length;
            if (normalize(enabled[j].textContent?.trim() ?? '').startsWith(q)) { next = j; break; }
          }
        }
        if (next < 0) return;
    }
    e.preventDefault();
    enabled[next].focus();
  }
}
