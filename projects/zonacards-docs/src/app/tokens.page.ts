import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CopyButtonComponent } from '@zonacards/ui/copy-button';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import primitives from '../../../zonacards-ui/tokens/primitives.json';
import light from '../../../zonacards-ui/tokens/semantic.light.json';
import dark from '../../../zonacards-ui/tokens/semantic.dark.json';

interface Row { path: string; cssVar: string; type: string; value: string; alias: string | null }
type Tree = { [k: string]: Tree | { $type: string; $value: unknown } };

/** Aplana un árbol DTCG en filas: ruta, variable CSS, tipo y valor (con el alias si lo hay). */
function flatten(tree: Tree, prefix: string[] = []): Row[] {
  return Object.entries(tree).flatMap(([k, v]) => {
    if (k.startsWith('$')) return [];
    if (v && typeof v === 'object' && '$value' in v) {
      const t = v as { $type: string; $value: unknown }; const p = [...prefix, k];
      const val = Array.isArray(t.$value) ? `cubic-bezier(${t.$value.join(', ')})` : String(t.$value);
      return [{ path: p.join('.'), cssVar: '--' + cssName(p), type: t.$type, value: val.startsWith('{') ? '' : val, alias: val.startsWith('{') ? val.slice(1, -1) : null }];
    }
    return flatten(v as Tree, [...prefix, k]);
  });
}
/** Ruta del token → variable CSS de tokens.css (el generador agrupa; aquí se deshace el agrupamiento). */
function cssName(p: string[]): string {
  const [g, a, b] = p;
  if (g === 'color' && a === 'neutral') return 'neutral-' + b;
  if (g === 'font') return a === 'size' ? 'fs-' + b : a === 'lineHeight' ? 'lh-' + b : 'zc-font-sans';
  if (g === 'z') return 'z-' + a;
  if (g === 'duration') return a === 'default' ? 'dur' : 'dur-' + a;
  if (g === 'easing') return a === 'default' ? 'ease' : 'motion-ease-' + a;
  if (g === 'radius') return 'r-' + a;
  if (g === 'space') return 's' + a;
  if (g === 'shadow') return ['xs', 'hairline'].includes(a) ? 'elev-' + a : 'shadow-' + a;
  return a;
}

/** Tokens: tabla filtrable con muestra, variable CSS, valor y alias, en claro y oscuro; descarga del JSON para Figma. */
@Component({
  selector: 'zc-docs-tokens',
  imports: [CopyButtonComponent, SegmentedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid max-w-6xl min-w-0 grid-cols-[minmax(0,1fr)] gap-6' },
  template: `
    <header class="grid gap-2">
      <h1 class="text-display-sm font-semibold">Tokens</h1>
      <p class="max-w-[70ch] text-body text-muted">Única fuente: <code class="font-mono text-body-sm">styles/tokens.css</code>. Se publican también en formato W3C Design Tokens
        (<code class="font-mono text-body-sm">&#64;zonacards/ui/tokens/*.json</code>) con primitivos, semánticos claro y oscuro, marcas y temas para Tokens Studio en Figma.</p>
    </header>
    <div class="flex flex-wrap items-center gap-3">
      <zc-segmented label="Conjunto" [options]="sets" [value]="set()" (valueChange)="set.set($any($event))" />
      <input type="search" class="h-target-sm min-w-0 flex-[1_1_220px] rounded-full border border-border-strong bg-surface px-4 text-body-sm" placeholder="Filtrar: surface, fs-, z-…" aria-label="Filtrar tokens" [value]="q()" (input)="q.set($any($event.target).value)" />
      <span class="text-caption text-muted num">{{ rows().length }} tokens</span>
    </div>
    <div class="relative min-w-0 overflow-x-auto rounded-md border border-border" role="region" tabindex="0" aria-label="Tabla de tokens">
      <table class="w-full min-w-[720px] border-collapse text-body-sm">
        <thead><tr class="bg-surface-2 text-left text-caption text-muted">
          <th scope="col" class="w-14 px-3 py-2 font-medium"><span class="sr-only">Muestra</span></th>
          <th scope="col" class="px-3 py-2 font-medium">Variable CSS</th><th scope="col" class="px-3 py-2 font-medium">Ruta DTCG</th>
          <th scope="col" class="px-3 py-2 font-medium">Tipo</th><th scope="col" class="px-3 py-2 font-medium">Valor</th>
        </tr></thead>
        <tbody>
          @for (r of rows(); track r.path) {
            <tr class="border-t border-border">
              <td class="px-3 py-2">@if (r.type === 'color') { <span class="block size-7 rounded-xs border border-border" [style.background]="'var(' + r.cssVar + ')'" aria-hidden="true"></span> }</td>
              <td class="px-3 py-2"><span class="inline-flex items-center gap-1"><code class="font-mono">{{ r.cssVar }}</code><zc-copy-button [value]="'var(' + r.cssVar + ')'" [label]="'Copiar var(' + r.cssVar + ')'" /></span></td>
              <td class="px-3 py-2 font-mono text-caption text-muted">{{ r.path }}</td>
              <td class="px-3 py-2 text-caption text-muted">{{ r.type }}</td>
              <td class="px-3 py-2 font-mono text-caption">@if (r.alias) { <span class="text-muted">→ {{ r.alias }}</span> } @else { {{ r.value }} }</td>
            </tr>
          }
        </tbody>
      </table>
    </div>`,
})
export class TokensPage {
  readonly sets: ZcSegment<'primitives' | 'light' | 'dark'>[] = [{ value: 'primitives', label: 'Primitivos' }, { value: 'light', label: 'Semánticos · claro' }, { value: 'dark', label: 'Semánticos · oscuro' }];
  readonly set = signal<'primitives' | 'light' | 'dark'>('light');
  readonly q = signal('');
  private readonly all = { primitives: flatten(primitives as Tree), light: flatten(light as Tree), dark: flatten(dark as Tree) };
  readonly rows = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.all[this.set()].filter(r => !q || r.cssVar.includes(q) || r.path.toLowerCase().includes(q));
  });
}
