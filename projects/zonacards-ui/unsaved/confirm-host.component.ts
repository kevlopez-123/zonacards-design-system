import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AlertDialogComponent } from '@zonacards/ui/overlay';
import { ConfirmService } from './confirm.service';

/** <zc-confirm-host /> · dibuja la confirmación pendiente de ConfirmService. Un solo host, en el shell. */
@Component({
  selector: 'zc-confirm-host',
  imports: [AlertDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (request(); as r) {
      <zc-alert-dialog [title]="r.title" [text]="r.text ?? ''" [confirmLabel]="r.confirmLabel" [cancelLabel]="r.cancelLabel"
        [confirmVariant]="r.confirmVariant ?? 'danger'" [open]="true" (openChange)="!$event && service.answer(false)" (confirm)="service.answer(true)" />
    }`,
})
export class ConfirmHostComponent {
  readonly service = inject(ConfirmService);
  readonly request = computed(() => this.service.current());
}
