import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CopyButtonComponent } from '@zonacards/ui/copy-button';
import { injectTranslate, ScrollAreaDirective } from '@zonacards/ui/core';

export type ZcCodeLanguage = 'json' | 'text' | 'bash' | 'http';
interface Token { t: string; k: 'key' | 'str' | 'num' | 'lit' | 'punct' | 'cmt' | 'plain' }

/** Resaltado mínimo y seguro (sin HTML: tokens que se dibujan como texto). JSON completo; bash y http, comentarios y cadenas. */
export function tokenize(code: string, lang: ZcCodeLanguage): Token[][] {
  const lines = code.replace(/\r\n?/g, '\n').split('\n');
  if (lang === 'text') return lines.map(l => [{ t: l, k: 'plain' }]);
  const re = lang === 'json'
    ? /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g
    : /(#.*$)|("(?:\\.|[^"\\])*"|'[^']*')|(\s-{1,2}[\w-]+)|(\$\w+|\b\d+\b)/g;
  return lines.map(line => {
    const out: Token[] = []; let last = 0; let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      if (m.index > last) out.push({ t: line.slice(last, m.index), k: 'plain' });
      if (lang === 'json') {
        if (m[1]) { out.push({ t: m[1], k: m[2] ? 'key' : 'str' }); if (m[2]) out.push({ t: m[2], k: 'punct' }); }
        else if (m[3]) out.push({ t: m[3], k: 'num' });
        else if (m[4]) out.push({ t: m[4], k: 'lit' });
        else out.push({ t: m[5], k: 'punct' });
      } else {
        out.push({ t: m[0], k: m[1] ? 'cmt' : m[2] ? 'str' : m[3] ? 'key' : 'num' });
      }
      last = m.index + m[0].length;
      if (m[0] === '') re.lastIndex++;
    }
    if (last < line.length) out.push({ t: line.slice(last), k: 'plain' });
    return out;
  });
}

/**
 * <zc-code-block [code]="payload" language="json" title="Respuesta del webhook" /> · código o JSON de solo lectura (logs, API, webhooks,
 * auditoría). Acepta un objeto en [code] y lo formatea como JSON. Resaltado con los tokens --code-* (claro y oscuro), números de línea
 * opcionales, salto de línea opcional, alto máximo con desplazamiento y botón de copiar. No ejecuta ni interpreta HTML.
 */
@Component({
  selector: 'zc-code-block',
  imports: [CopyButtonComponent, ScrollAreaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-md border border-border bg-(--code-bg)' },
  template: `
    @if (title() || copyable()) {
      <div class="flex min-h-11 items-center gap-2 border-b border-border py-1 pr-1 pl-4">
        <span class="min-w-0 flex-1 truncate text-caption font-medium text-muted">{{ title() }}</span>
        @if (language() !== 'text') { <span class="text-tiny uppercase tracking-wide text-muted" aria-hidden="true">{{ language() }}</span> }
        @if (copyable()) { <zc-copy-button [value]="text()" [label]="t('mol.codigo.copiar', { x: title() || language() })" /> }
      </div>
    }
    <div zcScrollArea role="region" [attr.aria-label]="title() || t('mol.codigo.region')" class="min-w-0 overflow-auto" [style.max-height]="maxHeight()">
      <pre class="m-0 min-w-max p-4 font-mono text-caption leading-5 text-(--code-fg)" [class.whitespace-pre-wrap]="wrap()" [class.min-w-0]="wrap()"><code>@for (line of lines(); track $index; let i = $index) {<span class="block">@if (lineNumbers()) {<span class="mr-4 inline-block w-8 text-right text-(--code-muted) select-none" aria-hidden="true">{{ i + 1 }}</span>}@for (tk of line; track $index) {<span [class]="cls[tk.k]">{{ tk.t }}</span>}</span>}</code></pre>
    </div>`,
})
export class CodeBlockComponent {
  readonly t = injectTranslate();
  /** Texto o un objeto (se formatea como JSON con 2 espacios). */
  readonly code = input.required<string | object | null>();
  readonly language = input<ZcCodeLanguage>('json');
  readonly title = input('');
  readonly lineNumbers = input(false);
  /** Salto de línea en vez de desplazamiento horizontal (logs largos). */
  readonly wrap = input(false);
  readonly copyable = input(true);
  /** Alto máximo con desplazamiento ("320px"); por defecto sin límite. */
  readonly maxHeight = input<string | null>(null);

  readonly text = computed(() => {
    const c = this.code();
    if (c === null || c === undefined) return '';
    return typeof c === 'string' ? c : JSON.stringify(c, null, 2);
  });
  readonly lines = computed(() => tokenize(this.text(), this.language()));
  readonly cls: Record<Token['k'], string> = {
    key: 'text-(--code-key)', str: 'text-(--code-string)', num: 'text-(--code-number)', lit: 'text-(--code-literal)',
    punct: 'text-(--code-muted)', cmt: 'italic text-(--code-muted)', plain: '',
  };
}
