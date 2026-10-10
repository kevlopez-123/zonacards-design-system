import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { HlmAvatar, HlmAvatarBadge, HlmAvatarFallback, HlmAvatarImage } from '@spartan-ng/helm/avatar';
import { AvatarSize, HLM_SIZE, initials } from './initials';

/**
 * <zc-avatar name="Lucía Mendoza" [src]="url" presence /> · sobre spartan avatar.
 * Iniciales si no hay imagen o si falla. shape="square" para empresas. Se anuncia como imagen con el nombre.
 */
@Component({
  selector: 'zc-avatar',
  imports: [HlmAvatar, HlmAvatarImage, HlmAvatarFallback, HlmAvatarBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', class: 'inline-flex shrink-0', '[attr.aria-label]': 'ariaLabel()' },
  template: `
    <hlm-avatar [size]="hlmSize()" [shape]="shape()">
      @if (src(); as s) { <img hlmAvatarImage [src]="s" alt="" /> }
      <span hlmAvatarFallback>{{ letters() }}</span>
      @if (presence()) { <span hlmAvatarBadge></span> }
    </hlm-avatar>`,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly size = input<AvatarSize>('md');
  readonly shape = input<'circle' | 'square'>('circle');
  readonly presence = input(false);
  private readonly online = toSignal(inject(TranslocoService).selectTranslate('ui.enLinea'), { initialValue: '' });

  readonly hlmSize = computed(() => HLM_SIZE[this.size()]);
  readonly letters = computed(() => initials(this.name()));
  readonly ariaLabel = computed(() => (this.presence() ? `${this.name()}, ${this.online()}` : this.name()));
}
