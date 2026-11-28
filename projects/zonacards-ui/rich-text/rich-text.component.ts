import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, input, model, signal, TemplateRef, untracked, viewChild, viewChildren, ViewEncapsulation } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectLang, injectTranslate } from '@zonacards/ui/core';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { Panel } from '@zonacards/ui/panel';
import { ToastService } from '@zonacards/ui/toast';
import { pasteToRichHtml, sanitizeRichText } from './rich-text-html';

type Cmd = 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'h2' | 'h3' | 'quote' | 'insertUnorderedList' | 'insertOrderedList' | 'indent' | 'outdent' | 'link' | 'removeFormat' | 'undo' | 'redo' | 'preview';
interface Tool { cmd: Cmd; icon: IconName; toggle: boolean; }
const TOOLS: (Tool | '|')[] = [
  { cmd: 'bold', icon: 'l:bold', toggle: true }, { cmd: 'italic', icon: 'l:italic', toggle: true }, { cmd: 'underline', icon: 'l:underline', toggle: true }, { cmd: 'strikeThrough', icon: 'l:strikethrough', toggle: true }, '|',
  { cmd: 'h2', icon: 'l:heading-2', toggle: true }, { cmd: 'h3', icon: 'l:heading-3', toggle: true }, { cmd: 'quote', icon: 'l:quote', toggle: true }, '|',
  { cmd: 'insertUnorderedList', icon: 'l:list', toggle: true }, { cmd: 'insertOrderedList', icon: 'l:list-ordered', toggle: true },
  { cmd: 'outdent', icon: 'l:indent-decrease', toggle: false }, { cmd: 'indent', icon: 'l:indent-increase', toggle: false }, '|',
  { cmd: 'link', icon: 'l:link', toggle: false }, { cmd: 'removeFormat', icon: 'l:remove-formatting', toggle: false }, '|',
  { cmd: 'undo', icon: 'l:undo-2', toggle: false }, { cmd: 'redo', icon: 'l:redo-2', toggle: false },
];
const PREVIEW_TOOL: Tool = { cmd: 'preview', icon: 's:eye', toggle: true };
let seq = 0;

/**
 * <zc-field label="Mensaje" [counter]="r.counter()" [error]="r.error()"><zc-rich-text #r [(value)]="html" [maxLength]="1000" /></zc-field>
 * Negrita, cursiva, subrayado, tachado, título (H2) y subtítulo (H3), cita, listas con sublistas (Tab y Mayús+Tab dentro de una lista, o los
 * botones de sangría), enlace, quitar formato, deshacer y rehacer. Atajos Ctrl+B/I/U/K; la barra es un toolbar (flechas, Inicio y Fin).
 * Pegar conserva la estructura de lo que se copia de Word, Google Docs o una web (títulos, listas con niveles, tablas, enlaces, negrita,
 * cursiva) y quita colores, fuentes y tamaños de origen; con Ctrl+Mayús+V se pega como texto. `value` es el HTML ya saneado (`sanitizeRichText`).
 * Con `[previewable]="true"` la barra suma "Vista previa": muestra el contenido como lo verá quien lo lee (al costado desde 640 px de ancho, debajo
 * si es más angosto). Es para textos que se publican, como términos y políticas: **vuelve a sanear el HTML en el servidor** con la misma lista de
 * etiquetas (`RICH_TEXT_ALLOWED`).
 */
@Component({
  selector: 'zc-rich-text',
  imports: [ButtonDirective, IconComponent, TooltipDirective, FieldComponent, InputDirective],
  providers: [Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Sin encapsulación: el HTML del editor y de la vista previa se escribe en el DOM (innerHTML) y no lleva los atributos de Angular.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block min-w-0' },
  styles: `
    .zc-rte:empty::before { content: attr(data-ph); color: var(--text-subtle); }
    .zc-rte h2, .zc-prose h2 { font-size: var(--fs-heading); line-height: var(--lh-heading); font-weight: var(--fw-semibold); margin: .9em 0 .35em; }
    .zc-rte h3, .zc-prose h3 { font-size: var(--fs-title-sm); line-height: var(--lh-title-sm); font-weight: var(--fw-semibold); margin: .8em 0 .3em; }
    .zc-rte > :first-child, .zc-prose > :first-child { margin-top: 0; }
    .zc-rte p, .zc-prose p { margin: 0 0 .6em; }
    .zc-rte ul, .zc-rte ol, .zc-prose ul, .zc-prose ol { margin: 0 0 .6em; padding-left: 1.5em; }
    .zc-rte li > ul, .zc-rte li > ol, .zc-prose li > ul, .zc-prose li > ol { margin: .2em 0 0; }
    .zc-rte ul, .zc-prose ul { list-style: disc; } .zc-rte ol, .zc-prose ol { list-style: decimal; }
    .zc-rte ul ul, .zc-prose ul ul { list-style: circle; } .zc-rte ol ol, .zc-prose ol ol { list-style: lower-alpha; }
    .zc-rte blockquote, .zc-prose blockquote { margin: 0 0 .6em; padding-left: 12px; border-left: 3px solid var(--border-strong); color: var(--text-muted); }
    .zc-rte a, .zc-prose a { color: var(--info-fg); text-decoration: underline; }
    .zc-rte table, .zc-prose table { width: 100%; border-collapse: collapse; margin: 0 0 .8em; font-size: var(--fs-body-sm); line-height: var(--lh-body-sm); }
    .zc-rte th, .zc-rte td, .zc-prose th, .zc-prose td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; vertical-align: top; }
    .zc-rte th, .zc-prose th { background: var(--surface-2); font-weight: var(--fw-semibold); }`,
  template: `
    <div class="@container min-w-0">
      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-3" [class]="previewOn() ? '@min-[40rem]:grid-cols-2' : ''">
        <div class="min-w-0 rounded-sm border bg-surface transition focus-within:border-focus focus-within:shadow-(--focus-halo)"
          [class]="over() ? 'border-danger' : 'border-border-strong'">
          <div #bar role="toolbar" [attr.aria-label]="t('mol.rte.barra')" [attr.aria-controls]="edId"
            class="flex flex-wrap gap-0.5 rounded-t-sm border-b border-border bg-surface-2 p-1" (keydown)="barKey($event)" (mousedown)="keepSelection($event)">
            @for (tool of tools(); track $index) {
              @if (tool === '|') { <span class="mx-1 my-1.5 w-px bg-border-strong" role="separator"></span> }
              @else {
                <button #btn type="button" class="grid size-9 cursor-pointer place-items-center rounded-xs text-muted hover:bg-(--state-hover-bg) hover:text-fg aria-pressed:bg-surface aria-pressed:text-fg aria-pressed:shadow-[inset_0_0_0_1px_var(--border-strong)] aria-disabled:cursor-not-allowed aria-disabled:opacity-(--opacity-disabled) aria-disabled:hover:bg-transparent"
                  [attr.aria-label]="t('mol.rte.' + tool.cmd)" [zcTooltip]="t('mol.rte.' + tool.cmd)" [attr.aria-pressed]="tool.cmd === 'preview' ? previewOn() : tool.toggle ? !!active()[tool.cmd] : null"
                  [attr.aria-disabled]="(tool.cmd === 'indent' || tool.cmd === 'outdent') && !inList() ? 'true' : null"
                  [tabIndex]="tool.cmd === focusCmd() ? 0 : -1" (click)="run(tool.cmd)"><zc-icon [name]="tool.icon" [size]="16" /></button>
              }
            }
          </div>
          <div #ed [id]="edId" contenteditable="true" role="textbox" aria-multiline="true" [attr.aria-labelledby]="field?.labelId" [attr.aria-describedby]="field?.messageId"
            [attr.aria-invalid]="over() || null" [attr.data-ph]="placeholder()"
            class="zc-rte max-h-[360px] min-h-40 overflow-auto px-4 py-3 text-body leading-[1.6] text-fg outline-none"
            (input)="sync()" (keydown)="edKey($event)" (paste)="paste($event)" (focus)="state()"></div>
        </div>

        @if (previewOn()) {
          <div class="min-w-0 rounded-sm border border-border bg-surface">
            <p class="m-0 rounded-t-sm border-b border-border bg-surface-2 px-4 py-2 text-caption font-medium text-muted">{{ t('mol.rte.vistaPrevia') }}</p>
            @if (value()) {
              <div class="zc-prose max-h-[360px] min-h-40 overflow-auto px-4 py-3 text-body leading-[1.6] text-fg" tabindex="0" role="region" [attr.aria-label]="t('mol.rte.vistaPrevia')"
                [innerHTML]="value()"></div>
            } @else {
              <p class="m-0 min-h-40 px-4 py-3 text-body text-subtle">{{ t('mol.rte.vistaVacia') }}</p>
            }
          </div>
        }
      </div>
    </div>

    <ng-template #linkTpl>
      <form class="grid gap-2 p-1.5" novalidate (submit)="insertLink($event)">
        <zc-field [label]="t('mol.rte.direccion')" [error]="linkError()">
          <input zcInput type="url" placeholder="https://" data-autofocus [value]="url()" (input)="url.set($any($event.target).value); linkError.set(null)" />
        </zc-field>
        <div class="flex justify-end gap-2">
          <button zcButton variant="ghost" size="sm" type="button" (click)="panel.close()">{{ t('ui.cancelar') }}</button>
          <button zcButton size="sm" type="submit">{{ t('mol.rte.insertar') }}</button>
        </div>
      </form>
    </ng-template>`,
})
export class RichTextComponent {
  readonly field = inject(FieldComponent, { optional: true });
  readonly panel = inject(Panel);
  private readonly toast = inject(ToastService);
  readonly t = injectTranslate();
  private readonly lang = injectLang();
  readonly value = model('');
  readonly maxLength = input(1000);
  readonly placeholder = input('');
  /** Suma el botón "Vista previa" a la barra (el contenido como lo verá quien lo lee). */
  readonly previewable = input(false);
  /** La vista previa está abierta. */
  readonly previewOn = model(false);
  readonly tools = computed(() => (this.previewable() ? [...TOOLS, '|' as const, PREVIEW_TOOL] : TOOLS));
  private readonly buttonList = computed(() => this.tools().filter((x): x is Tool => x !== '|'));
  readonly edId = this.field?.controlId ?? `zc-rte-${++seq}`;
  private readonly ed = viewChild.required<ElementRef<HTMLElement>>('ed');
  private readonly btns = viewChildren<ElementRef<HTMLButtonElement>>('btn');
  private readonly linkTpl = viewChild.required<TemplateRef<unknown>>('linkTpl');
  readonly active = signal<Partial<Record<Cmd, boolean>>>({});
  readonly focusCmd = signal<Cmd>('bold');
  readonly length = signal(0);
  readonly inList = signal(false);
  readonly over = computed(() => this.length() > this.maxLength());
  readonly counter = computed(() => `${new Intl.NumberFormat(this.lang() === 'en' ? 'en-US' : 'es-PE').format(this.length())}/${new Intl.NumberFormat(this.lang() === 'en' ? 'en-US' : 'es-PE').format(this.maxLength())}`);
  readonly error = computed(() => (this.over() ? this.t('mol.rte.excede', { n: this.maxLength() }) : null));
  readonly url = signal('');
  readonly linkError = signal<string | null>(null);
  private savedRange: Range | null = null;
  private written = '';

  constructor() {
    // El HTML externo se escribe solo si cambió desde fuera (escribir en cada tecla movería el cursor).
    // Lo que llega de fuera también se sanea, y el valor queda saneado.
    effect(() => {
      const v = this.value();
      untracked(() => {
        if (v === this.written) return;
        const clean = sanitizeRichText(v);
        this.ed().nativeElement.innerHTML = clean; this.written = clean; this.state();
        if (clean !== v) this.value.set(clean);
      });
    });
    const onSel = () => { if (document.activeElement === this.ed().nativeElement) this.state(); };
    // Solo en el navegador (SSR).
    afterNextRender(() => document.addEventListener('selectionchange', onSel));
    inject(DestroyRef).onDestroy(() => { if (typeof document !== 'undefined') document.removeEventListener('selectionchange', onSel); });
  }

  /** Estado de los botones y contador. */
  state() {
    const blk = (document.queryCommandValue('formatBlock') || '').toLowerCase();
    const a: Partial<Record<Cmd, boolean>> = {};
    for (const tool of TOOLS) {
      if (tool === '|' || !tool.toggle) continue;
      try { a[tool.cmd] = tool.cmd === 'h2' ? blk === 'h2' : tool.cmd === 'h3' ? blk === 'h3' : tool.cmd === 'quote' ? blk === 'blockquote' : document.queryCommandState(tool.cmd); } catch { a[tool.cmd] = false; }
    }
    this.active.set(a);
    this.inList.set(!!(a.insertUnorderedList || a.insertOrderedList));
    this.length.set(this.ed().nativeElement.textContent?.length ?? 0);
  }
  sync() {
    const html = sanitizeRichText(this.ed().nativeElement.innerHTML);
    this.written = html; this.value.set(html); this.state();
  }

  run(cmd: Cmd) {
    if (cmd === 'preview') { this.previewOn.update(v => !v); return; }
    const ed = this.ed().nativeElement; ed.focus();
    if (cmd === 'h2' || cmd === 'h3' || cmd === 'quote') {
      const tag = cmd === 'quote' ? 'blockquote' : cmd;
      const blk = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      document.execCommand('formatBlock', false, blk === tag ? 'p' : tag);
    } else if (cmd === 'indent' || cmd === 'outdent') {
      // La sangría solo anida elementos de una lista: en un párrafo el navegador haría una cita con margen.
      if (!this.inList()) return;
      document.execCommand(cmd, false);
    } else if (cmd === 'link') { this.openLink(); return; }
    else document.execCommand(cmd, false);
    this.sync();
  }
  /** Los botones no roban la selección del texto. */
  keepSelection(e: MouseEvent) { if ((e.target as HTMLElement).closest('button')) e.preventDefault(); }

  barKey(e: KeyboardEvent) {
    const list = this.btns().map(b => b.nativeElement); const i = list.indexOf(document.activeElement as HTMLButtonElement);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % list.length; else if (e.key === 'ArrowLeft') n = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = list.length - 1;
    if (n < 0) return;
    e.preventDefault();
    this.focusCmd.set(this.buttonList()[n].cmd); list[n].focus();
  }
  edKey(e: KeyboardEvent) {
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) { this.tabInList(e); return; }
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    const map: Record<string, Cmd> = { b: 'bold', i: 'italic', u: 'underline' };
    if (k === 'k') { e.preventDefault(); this.openLink(); }
    else if (map[k]) { e.preventDefault(); this.run(map[k]); }
  }
  /**
   * Tab y Mayús+Tab anidan y suben un nivel en una lista. Solo se intercepta cuando sirve (no se puede anidar el primer elemento ni subir
   * de nivel el de primer nivel): en cualquier otro caso Tab sigue moviendo el foco, para no atrapar a quien navega con teclado.
   */
  private tabInList(e: KeyboardEvent) {
    const s = window.getSelection();
    const li = (s?.anchorNode instanceof Element ? s.anchorNode : s?.anchorNode?.parentElement)?.closest('li');
    if (!li || !this.ed().nativeElement.contains(li)) return;
    // Nivel por listas ancestras: el navegador deja la sublista como hermana (<ul><li/><ul/></ul>) y solo al guardar pasa a ir dentro de un <li>.
    const nested = !!li.parentElement?.parentElement?.closest('ul, ol');
    if (e.shiftKey) { if (!nested) return; }
    else if (!li.previousElementSibling) return;
    e.preventDefault();
    this.run(e.shiftKey ? 'outdent' : 'indent');
  }
  paste(e: ClipboardEvent) {
    e.preventDefault();
    const html = e.clipboardData?.getData('text/html') ?? '';
    if (html.trim()) {
      const clean = pasteToRichHtml(html);
      if (clean) {
        document.execCommand('insertHTML', false, clean);
        this.toast.info(this.t('mol.rte.pegado'), { text: this.t('mol.rte.pegadoTexto') });
        this.sync();
        return;
      }
    }
    document.execCommand('insertText', false, e.clipboardData?.getData('text/plain') ?? '');
    this.sync();
  }

  private openLink() {
    const s = window.getSelection();
    this.savedRange = s && s.rangeCount && this.ed().nativeElement.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null;
    this.url.set(''); this.linkError.set(null);
    const origin = this.btns()[this.buttonList().findIndex(b => b.cmd === 'link')].nativeElement;
    this.panel.open(this.linkTpl(), { title: this.t('mol.rte.link'), ariaLabel: this.t('mol.rte.link'), role: 'dialog', origin, width: 320, trap: true });
  }
  insertLink(e: Event) {
    e.preventDefault();
    const u = this.url().trim();
    if (!/^(https?:\/\/|mailto:)\S+\.\S+/i.test(u)) { this.linkError.set(this.t('mol.rte.urlInvalida')); return; }
    this.panel.close(false);
    const ed = this.ed().nativeElement; ed.focus();
    const s = window.getSelection();
    if (this.savedRange && s) { s.removeAllRanges(); s.addRange(this.savedRange); }
    if (!s || s.isCollapsed) {
      const a = document.createElement('a'); a.href = u; a.textContent = u;
      document.execCommand('insertHTML', false, a.outerHTML);
    } else document.execCommand('createLink', false, u);
    this.sync();
  }
}
