import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AlertComponent } from '@zonacards/ui/alert';
import { ButtonDirective } from '@zonacards/ui/button';
import { CheckboxComponent } from '@zonacards/ui/checkbox';
import { BadgeComponent } from '@zonacards/ui/badge';
import { OverlayComponent } from '@zonacards/ui/overlay';
import { SkeletonComponent } from '@zonacards/ui/skeleton';

/** Una sección de un documento legal: encabezado y párrafos. */
export interface LegalSection { title: string; paragraphs: string[] }
/** Términos o política de privacidad: título, versión y secciones. */
export interface LegalDocument { title: string; version?: string; sections: LegalSection[] }

/**
 * <zc-legal-sheet [(open)] [document] [loading] [error] (confirm) (retry)> · términos o privacidad en una hoja (bottom sheet en móvil,
 * modal en desktop): encabezados y párrafos, versión en el subtítulo y un botón en el pie. En un registro, `confirmLabel` es "Aceptar"
 * y `(confirm)` marca la casilla; en el resto, "Entendido" solo cierra. El texto lo trae la app (`document`): aquí no hay HTTP.
 * Con `loading` muestra un esqueleto y con `error`, el aviso con Reintentar.
 */
@Component({
  selector: 'zc-legal-sheet',
  imports: [AlertComponent, ButtonDirective, OverlayComponent, SkeletonComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <zc-modal [title]="document()?.title ?? title()" [subtitle]="subtitle()" size="lg" [(open)]="open">
      @if (error()) {
        <zc-alert tone="warning" [title]="'mol.legal.error.titulo' | transloco">
          {{ 'mol.legal.error.texto' | transloco }}
          <button zcButton type="button" variant="outline" size="sm" class="mt-2" (click)="retry.emit()">{{ 'mol.legal.error.reintentar' | transloco }}</button>
        </zc-alert>
      } @else if (document(); as d) {
        <div class="grid gap-5">
          @for (s of d.sections; track $index) {
            <section class="grid gap-2">
              <h3 class="m-0 text-body font-semibold">{{ s.title }}</h3>
              @for (p of s.paragraphs; track $index) { <p class="m-0 text-muted">{{ p }}</p> }
            </section>
          }
        </div>
      } @else {
        <zc-skeleton variant="line" [lines]="6" />
      }
      <div zcOverlayFooter>
        <button zcButton class="w-full" [disabled]="!document()" (click)="confirm.emit(); open.set(false)">{{ confirmLabel() || ('mol.legal.entendido' | transloco) }}</button>
      </div>
    </zc-modal>`,
})
export class LegalSheetComponent {
  readonly open = model(false);
  /** Documento cargado; null mientras carga o si falló. */
  readonly document = input<LegalDocument | null>(null);
  /** Título mientras el documento no llega ("Términos y condiciones"). */
  readonly title = input.required<string>();
  readonly loading = input(false);
  readonly error = input(false);
  /** Texto del botón del pie; por defecto "Entendido". */
  readonly confirmLabel = input('');
  readonly confirm = output<void>();
  readonly retry = output<void>();
  readonly subtitle = computed(() => (this.document()?.version ? `v${this.document()!.version}` : ''));
}

/**
 * <zc-legal-consent [(checked)] [error] (openTerms) (openPrivacy)> · aceptación de términos en una caja: casilla, enlaces para leer
 * los términos y la política (la app abre `zc-legal-sheet`) y, ya aceptados, el chip "Términos aceptados". `error` marca la casilla
 * cuando se intenta continuar sin aceptar.
 */
@Component({
  selector: 'zc-legal-consent',
  imports: [BadgeComponent, ButtonDirective, CheckboxComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 gap-3 rounded-card bg-surface-2 p-4' },
  template: `
    <zc-checkbox [(checked)]="checked" [invalid]="error()">{{ 'mol.legal.acepto' | transloco }}</zc-checkbox>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <button zcButton type="button" variant="link" (click)="openTerms.emit()">{{ 'mol.legal.leerTerminos' | transloco }}</button>
      <button zcButton type="button" variant="link" (click)="openPrivacy.emit()">{{ 'mol.legal.leerPrivacidad' | transloco }}</button>
    </div>
    @if (error() && !checked()) { <p class="m-0 text-body-sm text-danger" role="alert">{{ 'mol.legal.requerido' | transloco }}</p> }
    @if (checked()) { <zc-badge tone="success" icon="s:check-circle" class="justify-self-start">{{ 'mol.legal.aceptados' | transloco }}</zc-badge> }`,
})
export class LegalConsentComponent {
  readonly checked = model(false);
  readonly error = input(false);
  readonly openTerms = output<void>();
  readonly openPrivacy = output<void>();
}
