import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';

let seq = 0;

export interface ChatMessage {
  id: string;
  from: 'bot' | 'me';
  text: string;
  /** Hora ya formateada ("09:13"). */
  time: string;
  /** Solo mensajes propios: enviado o leído. */
  status?: 'sent' | 'read';
  /** Artículo del centro de ayuda sugerido. */
  article?: { title: string; meta: string };
}

/**
 * Centro de ayuda y chat (o-chat de index.html): burbujas con estado de envío y lectura, indicador de escritura,
 * respuestas rápidas, adjuntos, enlaces a artículos y paso a un asesor. Enter envía y Shift + Enter hace un salto de línea.
 * El componente solo dibuja y emite (send); las respuestas las agrega la app.
 */
@Component({
  selector: 'zc-chat',
  imports: [ButtonDirective, IconComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-[520px] min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-bg' },
  styles: `@keyframes zc-blink { 0%, 80%, 100% { opacity: .25 } 40% { opacity: 1 } } .zc-dot { animation: zc-blink 1.2s infinite; } .zc-dot:nth-child(2) { animation-delay: .2s } .zc-dot:nth-child(3) { animation-delay: .4s }`,
  template: `
    <header class="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
      <span class="grid size-10 place-items-center rounded-full bg-secondary text-on-secondary" aria-hidden="true"><zc-icon name="s:headphones-round" [size]="16" /></span>
      <div class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
        <strong>{{ title() }}</strong>
        <small class="inline-flex items-center gap-1 text-[12.5px] text-muted"><span class="size-2 rounded-full bg-success" aria-hidden="true"></span>{{ status() }}</small>
      </div>
      <button zcButton variant="ghost" size="sm" (click)="human.emit()"><zc-icon name="s:user-rounded" [size]="16" />{{ t('chat.asesor') }}</button>
    </header>
    <div #log role="log" aria-live="polite" [attr.aria-label]="t('chat.conversacion')" tabindex="0" class="flex flex-1 flex-col gap-3 overflow-auto p-4">
      <div class="flex items-center gap-2 text-xs text-subtle before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">{{ t('chat.hoy') }}</div>
      @for (m of messages(); track m.id) {
        <div class="flex max-w-[82%] items-end gap-2" [class]="m.from === 'me' ? 'flex-row-reverse self-end' : ''">
          @if (m.from === 'bot') { <span class="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-on-secondary" aria-hidden="true">Z</span> }
          <div class="grid gap-1">
            <div class="whitespace-pre-wrap border px-3.5 py-2.5 text-[15px] leading-[21px]"
              [class]="m.from === 'me' ? 'rounded-[18px_18px_6px_18px] border-primary bg-primary text-on-primary' : 'rounded-[18px_18px_18px_6px] border-border bg-surface'">{{ m.text }}
              @if (m.article; as a) {
                <button type="button" class="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-[10px] bg-surface-2 px-2.5 py-2 text-left text-fg" (click)="openArticle.emit(m)">
                  <zc-icon name="s:document" [size]="16" /><span class="grid leading-[18px]"><strong class="text-sm">{{ a.title }}</strong><small class="text-xs text-muted">{{ a.meta }}</small></span>
                </button>
              }
            </div>
            <span class="flex items-center gap-1 text-[11.5px] text-subtle" [class.justify-end]="m.from === 'me'">
              <span class="sr-only">{{ t(m.from === 'me' ? 'chat.tu' : 'chat.asistente') }}, </span>{{ m.time }}
              @if (m.from === 'me') {
                <span class="inline-flex" data-allow-overlap [class]="m.status === 'read' ? 'text-info' : 'text-subtle'" role="img" [attr.aria-label]="t(m.status === 'read' ? 'chat.leido' : 'chat.enviado')">
                  <zc-icon name="l:check" [size]="16" />@if (m.status === 'read') { <zc-icon name="l:check" [size]="16" class="-ml-[9px]" /> }
                </span>
              }
            </span>
          </div>
        </div>
      }
      @if (typing()) {
        <div class="flex items-end gap-2" role="status" [attr.aria-label]="t('chat.escribiendo')">
          <span class="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-on-secondary" aria-hidden="true">Z</span>
          <div class="flex gap-1 rounded-[18px_18px_18px_6px] border border-border bg-surface p-3.5" aria-hidden="true">
            <i class="zc-dot size-[7px] rounded-full bg-subtle"></i><i class="zc-dot size-[7px] rounded-full bg-subtle"></i><i class="zc-dot size-[7px] rounded-full bg-subtle"></i>
          </div>
        </div>
      }
    </div>
    @if (quick().length) {
      <div class="flex min-w-0 gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        @for (q of quick(); track q) {
          <button type="button" class="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface-2 px-3 text-[13px] hover:border-border-strong" (click)="send.emit(q)">{{ q }}</button>
        }
      </div>
    }
    <form class="flex items-end gap-2 border-t border-border bg-surface px-3 py-2" (submit)="submit($event)">
      <button type="button" class="grid size-icon-btn shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" [attr.aria-label]="t('chat.adjuntar')" [zcTooltip]="t('chat.adjuntarCorto')"><zc-icon name="s:paperclip" /></button>
      <label class="sr-only" [for]="inputId">{{ t('chat.escribe') }}</label>
      <textarea #ta [id]="inputId" rows="1" [placeholder]="t('chat.escribe')" [value]="draft()" (input)="onInput($event)" (keydown)="onKey($event)"
        class="max-h-[120px] min-w-0 flex-1 resize-none rounded-[20px] border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] leading-5 text-fg outline-none focus:border-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]"></textarea>
      <button zcButton type="submit" size="icon-sm" [attr.aria-label]="t('chat.enviar')" [disabled]="!draft().trim()"><zc-icon name="s:plain" [size]="16" /></button>
    </form>`,
})
export class ChatComponent {
  readonly t = injectTranslate();
  readonly title = input('');
  readonly status = input('');
  readonly messages = input<ChatMessage[]>([]);
  readonly quick = input<string[]>([]);
  readonly typing = input(false);
  readonly send = output<string>();
  readonly human = output<void>();
  readonly openArticle = output<ChatMessage>();
  readonly inputId = `zc-chat-${++seq}`;
  readonly draft = signal('');
  private readonly log = viewChild.required<ElementRef<HTMLElement>>('log');
  private readonly ta = viewChild.required<ElementRef<HTMLTextAreaElement>>('ta');

  constructor() {
    // Cada mensaje nuevo (o el indicador de escritura) baja al final de la conversación.
    effect(() => { this.messages(); this.typing(); queueMicrotask(() => { const el = this.log().nativeElement; el.scrollTop = el.scrollHeight; }); });
  }
  onInput(e: Event) { this.draft.set((e.target as HTMLTextAreaElement).value); this.autosize(); }
  onKey(e: KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.submit(e); } }
  submit(e: Event) {
    e.preventDefault();
    const v = this.draft().trim(); if (!v) return;
    this.send.emit(v); this.draft.set(''); queueMicrotask(() => this.autosize());
  }
  private autosize() { const t = this.ta().nativeElement; t.style.height = 'auto'; t.style.height = Math.min(120, t.scrollHeight) + 'px'; }
}
