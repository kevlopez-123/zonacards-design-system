import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, TemplateRef, computed, effect, inject, input, model, signal, untracked, viewChild, viewChildren } from '@angular/core';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { TooltipDirective } from '../../atoms/tooltip/tooltip.directive';
import { injectLang, injectTranslate } from '../../lang';
import { FieldComponent, InputDirective } from '../field/field.component';
import { Panel } from '../panel/panel';
import { ToastService } from '../toast/toast.service';

type Cmd = 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'h2' | 'quote' | 'insertUnorderedList' | 'insertOrderedList' | 'link' | 'removeFormat' | 'undo' | 'redo';
interface Tool { cmd: Cmd; icon: IconName; toggle: boolean; }
const TOOLS: (Tool | '|')[] = [
  { cmd: 'bold', icon: 'l:bold', toggle: true }, { cmd: 'italic', icon: 'l:italic', toggle: true }, { cmd: 'underline', icon: 'l:underline', toggle: true }, { cmd: 'strikeThrough', icon: 'l:strikethrough', toggle: true }, '|',
  { cmd: 'h2', icon: 'l:heading-2', toggle: true }, { cmd: 'quote', icon: 'l:quote', toggle: true }, { cmd: 'insertUnorderedList', icon: 'l:list', toggle: true }, { cmd: 'insertOrderedList', icon: 'l:list-ordered', toggle: true }, '|',
  { cmd: 'link', icon: 'l:link', toggle: false }, { cmd: 'removeFormat', icon: 'l:remove-formatting', toggle: false }, '|',
  { cmd: 'undo', icon: 'l:undo-2', toggle: false }, { cmd: 'redo', icon: 'l:redo-2', toggle: false },
];
let seq = 0;
const BUTTONS = TOOLS.filter((x): x is Tool => x !== '|');
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'A', 'H2', 'BLOCKQUOTE']);

/** Deja solo las etiquetas de formato permitidas; los enlaces, solo http(s) o mailto y en otra pestaña. */
export function sanitizeRichText(html: string): string {
  const t = document.createElement('template'); t.innerHTML = html;
  t.content.querySelectorAll('*').forEach(n => {
    if (!ALLOWED.has(n.tagName)) { n.replaceWith(...Array.from(n.childNodes)); return; }
    [...n.attributes].forEach(a => { if (!(n.tagName === 'A' && a.name === 'href')) n.removeAttribute(a.name); });
    if (n.tagName === 'A') {
      if (!/^(https?:|mailto:)/i.test(n.getAttribute('href') ?? '')) n.removeAttribute('href');
      n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return t.innerHTML.replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>').replace(/^<br>$/, '');
}

/**
 * <zc-field label="Mensaje" [counter]="r.counter()" [error]="r.error()"><zc-rich-text #r [(value)]="html" [maxLength]="1000" /></zc-field>
 * Negrita, cursiva, subrayado, tachado, título, cita, listas, enlace, quitar formato, deshacer y rehacer.
 * Atajos Ctrl+B/I/U/K; la barra es un toolbar (flechas, Inicio y Fin). Pegar quita el formato de origen.
 * value es el HTML ya sanitizado (sanitizeRichText).
 */
@Component({
  selector: 'zc-rich-text',
  imports: [ButtonDirective, IconComponent, TooltipDirective, FieldComponent, InputDirective],
  providers: [Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  styles: `
    .zc-rte:empty::before { content: attr(data-ph); color: var(--text-subtle); }
    .zc-rte h2 { font-size: 20px; line-height: 28px; font-weight: 600; margin: .3em 0; }
    .zc-rte p { margin: 0 0 .5em; } .zc-rte ul, .zc-rte ol { margin: 0 0 .5em; padding-left: 1.4em; }
    .zc-rte ul { list-style: disc; } .zc-rte ol { list-style: decimal; }
    .zc-rte blockquote { margin: 0 0 .5em; padding-left: 12px; border-left: 3px solid var(--border-strong); color: var(--text-muted); }
    .zc-rte a { color: var(--info-fg); text-decoration: underline; }`,
  template: `
    <div class="min-w-0 rounded-sm border bg-surface transition focus-within:border-focus focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]"
      [class]="over() ? 'border-danger' : 'border-border-strong'">
      <div #bar role="toolbar" [attr.aria-label]="t('mol.rte.barra')" [attr.aria-controls]="edId"
        class="flex flex-wrap gap-0.5 rounded-t-sm border-b border-border bg-surface-2 p-1" (keydown)="barKey($event)" (mousedown)="keepSelection($event)">
        @for (tool of tools; track $index) {
          @if (tool === '|') { <span class="mx-1 my-1.5 w-px bg-border-strong" role="separator"></span> }
          @else {
            <button #btn type="button" class="grid size-9 cursor-pointer place-items-center rounded-xs text-muted hover:bg-surface hover:text-fg aria-pressed:bg-surface aria-pressed:text-fg aria-pressed:shadow-[inset_0_0_0_1px_var(--border-strong)]"
              [attr.aria-label]="t('mol.rte.' + tool.cmd)" [zcTooltip]="t('mol.rte.' + tool.cmd)" [attr.aria-pressed]="tool.toggle ? !!active()[tool.cmd] : null"
              [tabIndex]="tool.cmd === focusCmd() ? 0 : -1" (click)="run(tool.cmd)"><zc-icon [name]="tool.icon" [size]="16" /></button>
          }
        }
      </div>
      <div #ed [id]="edId" contenteditable="true" role="textbox" aria-multiline="true" [attr.aria-labelledby]="field?.labelId" [attr.aria-describedby]="field?.messageId"
        [attr.aria-invalid]="over() || null" [attr.data-ph]="placeholder()"
        class="zc-rte max-h-[360px] min-h-40 overflow-auto px-4 py-3 text-[15px] leading-[1.6] text-fg outline-none"
        (input)="sync()" (keydown)="edKey($event)" (paste)="paste($event)" (focus)="state()"></div>
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
  readonly tools = TOOLS;
  readonly edId = this.field?.controlId ?? `zc-rte-${++seq}`;
  private readonly ed = viewChild.required<ElementRef<HTMLElement>>('ed');
  private readonly btns = viewChildren<ElementRef<HTMLButtonElement>>('btn');
  private readonly linkTpl = viewChild.required<TemplateRef<unknown>>('linkTpl');
  readonly active = signal<Partial<Record<Cmd, boolean>>>({});
  readonly focusCmd = signal<Cmd>('bold');
  readonly length = signal(0);
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
    document.addEventListener('selectionchange', onSel);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('selectionchange', onSel));
  }

  /** Estado de los botones y contador. */
  state() {
    const blk = (document.queryCommandValue('formatBlock') || '').toLowerCase();
    const a: Partial<Record<Cmd, boolean>> = {};
    for (const tool of TOOLS) {
      if (tool === '|' || !tool.toggle) continue;
      try { a[tool.cmd] = tool.cmd === 'h2' ? blk === 'h2' : tool.cmd === 'quote' ? blk === 'blockquote' : document.queryCommandState(tool.cmd); } catch { a[tool.cmd] = false; }
    }
    this.active.set(a);
    this.length.set(this.ed().nativeElement.textContent?.length ?? 0);
  }
  sync() {
    const html = sanitizeRichText(this.ed().nativeElement.innerHTML);
    this.written = html; this.value.set(html); this.state();
  }

  run(cmd: Cmd) {
    const ed = this.ed().nativeElement; ed.focus();
    if (cmd === 'h2' || cmd === 'quote') {
      const tag = cmd === 'h2' ? 'h2' : 'blockquote';
      const blk = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      document.execCommand('formatBlock', false, blk === tag ? 'p' : tag);
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
    this.focusCmd.set(BUTTONS[n].cmd); list[n].focus();
  }
  edKey(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    const map: Record<string, Cmd> = { b: 'bold', i: 'italic', u: 'underline' };
    if (k === 'k') { e.preventDefault(); this.openLink(); }
    else if (map[k]) { e.preventDefault(); this.run(map[k]); }
  }
  paste(e: ClipboardEvent) {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData?.getData('text/plain') ?? '');
    this.toast.info(this.t('mol.rte.pegado'), { text: this.t('mol.rte.pegadoTexto') });
    this.sync();
  }

  private openLink() {
    const s = window.getSelection();
    this.savedRange = s && s.rangeCount && this.ed().nativeElement.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null;
    this.url.set(''); this.linkError.set(null);
    const origin = this.btns()[BUTTONS.findIndex(b => b.cmd === 'link')].nativeElement;
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
