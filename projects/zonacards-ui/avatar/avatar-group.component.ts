import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { HlmAvatar, HlmAvatarFallback, HlmAvatarGroup, HlmAvatarGroupCount, HlmAvatarImage } from '@zonacards/ui/helm';
import { AvatarSize, HLM_SIZE, initials } from './initials';

export interface AvatarPerson { name: string; src?: string | null }

/**
 * <zc-avatar-group label="4 aprobadores" [people]="aprobadores" [max]="3" /> · muestra hasta max y "+N".
 * Único solapamiento permitido por las reglas (sección 16); por eso lleva data-allow-overlap para la auditoría.
 */
@Component({
  selector: 'zc-avatar-group',
  imports: [HlmAvatar, HlmAvatarImage, HlmAvatarFallback, HlmAvatarGroupCount, TranslocoPipe],
  hostDirectives: [HlmAvatarGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', 'data-allow-overlap': '', '[attr.aria-label]': 'label()' },
  template: `
    @for (p of visible(); track $index) {
      <hlm-avatar [size]="hlmSize()" role="img" [attr.aria-label]="p.name">
        @if (p.src; as s) { <img hlmAvatarImage [src]="s" alt="" /> }
        <span hlmAvatarFallback>{{ letters(p.name) }}</span>
      </hlm-avatar>
    }
    @if (rest() > 0) {
      <span hlmAvatarGroupCount role="img" [attr.aria-label]="'ui.masPersonas' | transloco: { n: rest() }">+{{ rest() }}</span>
    }`,
})
export class AvatarGroupComponent {
  readonly label = input.required<string>();
  readonly people = input.required<AvatarPerson[]>();
  readonly max = input(3);
  readonly size = input<AvatarSize>('sm');
  readonly hlmSize = computed(() => HLM_SIZE[this.size()]);
  readonly visible = computed(() => this.people().slice(0, this.max()));
  readonly rest = computed(() => Math.max(0, this.people().length - this.max()));
  readonly letters = initials;
}
