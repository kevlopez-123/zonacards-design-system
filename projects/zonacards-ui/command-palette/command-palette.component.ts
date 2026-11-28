import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, TemplateRef, ViewContainerRef, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { KbdDirective } from '@zonacards/ui/misc';
import { injectTranslate } from '@zonacards/ui/core';
import { ScrollAreaDirective } from '@zonacards/ui/core';

export interface ZcCommand {
  id: string;
  label: string;
  /** Grupo que se muestra como subtítulo ("Ir a", "Acciones", "Lotes"). */
  group: string;
  icon?: IconName;
  /** Palabras extra para encontrarlo ("crear", "nuevo"). */
  keywords?: string;
}

let seq = 0;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * <zc-command-palette [commands]="…" (run)="ir($event)" /> · búsqueda global (Ctrl + K o el botón Buscar).
 * Diálogo centrado (como .cmd de index.html): un campo, la lista filtrada sin tildes, ↑ ↓ para moverse, Enter abre,
 * Escape cierra y el foco vuelve a donde estaba. Ctrl + K abre y cierra desde cualquier pantalla.
 */
@Component({
  selector: 'zc-command-palette',
  imports: [ScrollAreaDirective, IconComponent, KbdDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents', '(document:keydown)': 'onGlobalKey($event)', '(document:zc-open-search)': 'open()' },
  template: `
    <ng-template #tpl>
      <div #dialog role="dialog" aria-modal="true" [attr.aria-label]="t('top.buscar.titulo')"
        class="w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-lg border border-border bg-surface text-fg shadow-2 animate-in fade-in-0 zoom-in-98 duration-180 ease-out motion-reduce:animate-none"
        (keydown)="onKey($event)">
        <div class="flex h-14 items-center border-b border-border">
          <zc-icon name="s:magnifier" class="ml-4 shrink-0 text-muted" />
          <input #inp class="zc-bare h-full min-w-0 flex-1 bg-transparent px-3 text-body text-fg outline-none placeholder:text-subtle" role="combobox"
            aria-expanded="true" aria-autocomplete="list" [attr.aria-controls]="listId" [attr.aria-activedescendant]="results().length ? listId + '-' + active() : null"
            [attr.aria-label]="t('top.buscar.titulo')" [placeholder]="placeholder() || t('top.buscar.placeholder')" [value]="q()" (input)="onInput($event)" />
        </div>
        <ul [id]="listId" role="listbox" zcScrollArea [zcScrollAreaFocusable]="false" [attr.aria-label]="t('top.buscar.resultados')" class="m-0 grid max-h-[360px] list-none content-start gap-0.5 overflow-y-auto p-2">
          @for (c of results(); track c.id; let i = $index) {
            <li [id]="listId + '-' + i" role="option" [attr.aria-selected]="i === active()" (mousemove)="active.set(i)" (click)="choose(c)"
              class="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-1.5 text-body leading-5" [class]="i === active() ? 'bg-(--state-active-bg)' : ''">
              <zc-icon [name]="c.icon ?? 's:widget-5'" [size]="16" class="shrink-0 text-muted" />
              <span class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]"><span class="truncate">{{ c.label }}</span><span class="text-caption text-muted">{{ c.group }}</span></span>
            </li>
          } @empty {
            <li class="px-3 py-6 text-center text-body-sm text-muted">{{ t('top.buscar.sinCoincidencias') }}</li>
          }
        </ul>
        <div class="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3 text-caption text-muted">
          <span class="inline-flex items-center gap-1"><kbd zcKbd>↑</kbd><kbd zcKbd>↓</kbd>{{ t('top.buscar.moverse') }}</span>
          <span class="inline-flex items-center gap-1"><kbd zcKbd>Enter</kbd>{{ t('top.buscar.abrir') }}</span>
          <span class="inline-flex items-center gap-1"><kbd zcKbd>Esc</kbd>{{ t('top.buscar.cerrar') }}</span>
        </div>
      </div>
    </ng-template>`,
})
export class CommandPaletteComponent {
  readonly t = injectTranslate();
  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly trapFactory = inject(FocusTrapFactory);
  readonly commands = input.required<ZcCommand[]>();
  readonly placeholder = input('');
  readonly run = output<ZcCommand>();
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  private readonly inp = viewChild<ElementRef<HTMLInputElement>>('inp');
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  readonly listId = `zc-cmd-${++seq}`;
  readonly isOpen = signal(false);
  readonly q = signal('');
  readonly active = signal(0);
  readonly results = computed(() => {
    const q = norm(this.q().trim());
    return q ? this.commands().filter(c => norm(`${c.label} ${c.group} ${c.keywords ?? ''}`).includes(q)) : this.commands();
  });
  private ref?: OverlayRef;
  private trap?: FocusTrap;
  private returnTo: HTMLElement | null = null;

  constructor() { inject(DestroyRef).onDestroy(() => this.close(false)); }

  open() {
    if (this.isOpen()) return;
    this.returnTo = document.activeElement as HTMLElement | null;
    this.q.set(''); this.active.set(0); this.isOpen.set(true);
    this.ref = this.overlay.create({
      hasBackdrop: true, backdropClass: 'zc-backdrop', scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().centerHorizontally().top('12vh'),
    });
    this.ref.attach(new TemplatePortal(this.tpl(), this.vcr));
    this.ref.backdropClick().subscribe(() => this.close());
    setTimeout(() => { const d = this.dialog()?.nativeElement; if (d) this.trap = this.trapFactory.create(d); this.inp()?.nativeElement.focus(); });
  }
  close(restore = true) {
    if (!this.isOpen()) return;
    this.isOpen.set(false); this.trap?.destroy(); this.ref?.dispose(); this.ref = undefined;
    if (restore) this.returnTo?.focus({ preventScroll: true });
  }
  toggle() { if (this.isOpen()) this.close(); else this.open(); }

  onGlobalKey(e: KeyboardEvent) {
    // Si un componente ya usó Ctrl + K (el editor de texto: insertar enlace), la búsqueda no se abre.
    if (e.defaultPrevented) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.toggle(); }
  }
  onInput(e: Event) { this.q.set((e.target as HTMLInputElement).value); this.active.set(0); }
  onKey(e: KeyboardEvent) {
    const n = this.results().length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); this.active.set((this.active() + 1) % n); this.scroll(); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); this.active.set((this.active() - 1 + n) % n); this.scroll(); }
    else if (e.key === 'Enter' && n) { e.preventDefault(); this.choose(this.results()[this.active()]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); }
    else if (e.key === 'Tab') e.preventDefault(); // el foco se queda en la búsqueda
  }
  private scroll() { setTimeout(() => document.getElementById(`${this.listId}-${this.active()}`)?.scrollIntoView({ block: 'nearest' })); }
  choose(c: ZcCommand) { this.close(false); this.run.emit(c); }
}
