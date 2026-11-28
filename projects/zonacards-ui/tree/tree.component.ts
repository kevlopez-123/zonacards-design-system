import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, output } from '@angular/core';
import { injectTranslate } from '@zonacards/ui/core';
import { IconComponent, IconName } from '@zonacards/ui/icon';

export interface ZcTreeNode {
  id: string;
  label: string;
  icon?: IconName;
  /** Dato a la derecha (conteo, código). */
  meta?: string;
  disabled?: boolean;
  children?: readonly ZcTreeNode[];
}
export type ZcTreeSelection = 'none' | 'single' | 'checkbox';

interface Row { node: ZcTreeNode; level: number; parent: string | null; posinset: number; setsize: number }
const allIds = (n: ZcTreeNode): string[] => [n.id, ...(n.children ?? []).flatMap(allIds)];
const leafIds = (n: ZcTreeNode): string[] => (n.children?.length ? n.children.flatMap(leafIds) : [n.id]);

/**
 * <zc-tree [nodes]="categorias" [(expanded)]="abiertos" [(selected)]="elegidos" selection="checkbox" label="Permisos" />
 * Jerarquías: categorías, estructura de clientes y locales, permisos, carpetas. Patrón ARIA tree con foco itinerante.
 * - Teclado: ↑ ↓ recorren lo visible, → abre o baja al primer hijo, ← cierra o sube al padre, Inicio/Fin, Enter o Espacio eligen,
 *   * abre los hermanos, y escribir salta al nodo que empieza con esas letras.
 * - selection: 'none' (navegación), 'single' (uno elegido) o 'checkbox' (casillas con estado mixto: elegir un padre elige sus hojas).
 * - En checkbox, [(selected)] guarda solo hojas; los padres se muestran marcados o mixtos según sus hijos.
 */
@Component({
  selector: 'zc-tree',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <ul role="tree" [attr.aria-label]="label()" [attr.aria-multiselectable]="selection() === 'checkbox' || null" class="m-0 grid list-none gap-0.5 p-0" (keydown)="onKey($event)">
      @for (r of rows(); track r.node.id) {
        @let n = r.node;
        @let kids = !!n.children?.length;
        @let state = checkState(n);
        <li role="treeitem" [attr.id]="uid + '-' + n.id" [attr.data-id]="n.id" [attr.aria-level]="r.level" [attr.aria-setsize]="r.setsize" [attr.aria-posinset]="r.posinset"
          [attr.aria-expanded]="kids ? isOpen(n.id) : null" [attr.aria-disabled]="n.disabled || null"
          [attr.aria-selected]="selection() === 'single' ? selected().includes(n.id) : null"
          [attr.aria-checked]="selection() === 'checkbox' ? (state === 'mixed' ? 'mixed' : state === 'on') : null"
          [tabIndex]="n.id === focusId() ? 0 : -1"
          class="flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-sm pr-2 text-body outline-none hover:bg-(--state-hover-bg) focus-visible:bg-(--state-active-bg) focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-offset-[-2px] focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:opacity-(--opacity-disabled) aria-selected:bg-(--state-active-bg) aria-selected:font-medium pointer-coarse:min-h-12"
          [style.padding-left]="'calc(' + (r.level - 1) + ' * var(--tree-indent, 1.25rem) + 0.25rem)'" (click)="onClick(n, $event)">
          <span class="grid size-6 shrink-0 place-items-center text-muted" (click)="kids && toggle(n.id, $event)" aria-hidden="true">
            @if (kids) { <zc-icon name="s:alt-arrow-right" [size]="16" class="transition-transform duration-(--dur-base) ease-standard" [class.rotate-90]="isOpen(n.id)" /> }
          </span>
          @if (selection() === 'checkbox') {
            <span class="grid size-5 shrink-0 place-items-center rounded-xs border-[1.5px] text-on-primary" aria-hidden="true"
              [class]="state === 'off' ? 'border-border-strong' : 'border-primary bg-primary'">
              @if (state === 'on') { <zc-icon name="l:check" [size]="16" /> } @else if (state === 'mixed') { <span class="h-0.5 w-2.5 rounded-full bg-on-primary"></span> }
            </span>
          }
          @if (n.icon) { <zc-icon [name]="n.icon" [size]="16" class="shrink-0 text-muted" /> }
          <span class="min-w-0 flex-1 break-words">{{ n.label }}</span>
          @if (n.meta) { <span class="shrink-0 text-caption text-muted num">{{ n.meta }}</span> }
        </li>
      }
    </ul>`,
})
export class TreeComponent {
  readonly t = injectTranslate();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly nodes = input.required<readonly ZcTreeNode[]>();
  /** Nombre accesible del árbol. */
  readonly label = input.required<string>();
  readonly selection = input<ZcTreeSelection>('single');
  readonly expanded = model<string[]>([]);
  readonly selected = model<string[]>([]);
  /** Nodo activado con Enter o clic (navegar a su detalle). */
  readonly activate = output<ZcTreeNode>();
  readonly uid = 'zc-tree-' + Math.random().toString(36).slice(2, 8);
  private typed = ''; private typedAt = 0;
  private focused: string | null = null;

  /** Nodos visibles en orden, con nivel y posición (para aria-level/posinset). */
  readonly rows = computed<Row[]>(() => {
    const open = new Set(this.expanded()); const out: Row[] = [];
    const walk = (list: readonly ZcTreeNode[], level: number, parent: string | null) => list.forEach((node, i) => {
      out.push({ node, level, parent, posinset: i + 1, setsize: list.length });
      if (node.children?.length && open.has(node.id)) walk(node.children, level + 1, node.id);
    });
    walk(this.nodes(), 1, null);
    return out;
  });
  private readonly byId = computed(() => {
    const m = new Map<string, ZcTreeNode>();
    const walk = (l: readonly ZcTreeNode[]) => l.forEach(n => { m.set(n.id, n); if (n.children) walk(n.children); });
    walk(this.nodes()); return m;
  });
  /** El nodo con tabindex 0: el último enfocado, el elegido o el primero. */
  readonly focusId = computed(() => {
    const ids = this.rows().map(r => r.node.id);
    const pref = [this.focused, this.selected()[0]].find(x => x && ids.includes(x));
    return pref ?? ids[0] ?? null;
  });

  isOpen(id: string) { return this.expanded().includes(id); }
  checkState(n: ZcTreeNode): 'on' | 'off' | 'mixed' {
    const leaves = leafIds(n); const sel = new Set(this.selected());
    const c = leaves.filter(id => sel.has(id)).length;
    return c === 0 ? 'off' : c === leaves.length ? 'on' : 'mixed';
  }

  toggle(id: string, e?: Event) {
    e?.stopPropagation();
    this.expanded.update(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]));
  }
  private choose(n: ZcTreeNode) {
    if (n.disabled) return;
    const mode = this.selection();
    if (mode === 'single') this.selected.set([n.id]);
    else if (mode === 'checkbox') {
      const leaves = leafIds(n).filter(id => !this.byId().get(id)?.disabled);
      const on = this.checkState(n) === 'on';
      this.selected.update(s => (on ? s.filter(x => !leaves.includes(x)) : [...new Set([...s, ...leaves])]));
    }
    this.activate.emit(n);
  }
  onClick(n: ZcTreeNode, e: MouseEvent) {
    this.focused = n.id;
    if (n.children?.length && this.selection() === 'none') this.toggle(n.id);
    else this.choose(n);
    (e.currentTarget as HTMLElement).focus();
  }

  private focus(id: string) {
    this.focused = id;
    queueMicrotask(() => this.host.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus());
  }
  onKey(e: KeyboardEvent): void {
    const rows = this.rows(); const cur = rows.findIndex(r => r.node.id === (document.activeElement as HTMLElement)?.dataset['id']);
    if (cur < 0) return;
    const r = rows[cur]; const n = r.node; const kids = !!n.children?.length;
    const go = (i: number) => { if (rows[i]) this.focus(rows[i].node.id); };
    switch (e.key) {
      case 'ArrowDown': go(cur + 1); break;
      case 'ArrowUp': go(cur - 1); break;
      case 'Home': go(0); break;
      case 'End': go(rows.length - 1); break;
      case 'ArrowRight': if (kids) { if (this.isOpen(n.id)) go(cur + 1); else this.toggle(n.id); } else return; break;
      case 'ArrowLeft': if (kids && this.isOpen(n.id)) this.toggle(n.id); else if (r.parent) this.focus(r.parent); else return; break;
      case 'Enter': case ' ': this.choose(n); break;
      case '*': {
        const sibs = rows.filter(x => x.parent === r.parent && x.node.children?.length).map(x => x.node.id);
        this.expanded.update(a => [...new Set([...a, ...sibs])]); break;
      }
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = Date.now(); this.typed = now - this.typedAt > 600 ? e.key : this.typed + e.key; this.typedAt = now;
          const q = this.typed.toLowerCase();
          for (let k = 1; k <= rows.length; k++) { const j = (cur + k) % rows.length; if (rows[j].node.label.toLowerCase().startsWith(q)) { go(j); break; } }
          break;
        }
        return;
    }
    e.preventDefault();
  }
}

/** Todos los ids de un árbol (expandir todo). */
export const treeIds = (nodes: readonly ZcTreeNode[]) => nodes.flatMap(allIds);
