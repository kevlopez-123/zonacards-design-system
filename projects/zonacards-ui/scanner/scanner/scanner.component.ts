import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { injectTranslate } from '@zonacards/ui/core';
import { ToastService } from '@zonacards/ui/toast';

interface Detector { detect(src: HTMLVideoElement): Promise<{ rawValue: string }[]> }
type DetectorCtor = new (o: { formats: string[] }) => Detector;

/**
 * <zc-scanner (scanned)="validar($event)" (manual)="ingresarCodigo()" /> · escáner QR y de código de barras para canjes
 * (o-scanner de index.html). Visor con guía de encuadre de 240 px, línea de escaneo (se detiene con movimiento reducido),
 * linterna, cambio de cámara e "Ingresar código" siempre visible. start() pide la cámara; usa BarcodeDetector si el navegador
 * lo tiene (en la app: ZXing, ML Kit o AVFoundation). La vista de cámara usa tokens --camera-* (siempre oscura).
 */
@Component({
  selector: 'zc-scanner',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-1 flex-col bg-(--camera-bg) text-(--camera-fg)' },
  template: `
    <div class="relative min-h-[380px] flex-1 overflow-hidden">
      <video #video playsinline muted aria-hidden="true" class="absolute inset-0 size-full object-cover" [class.opacity-0]="!live()"></video>
      <div class="absolute inset-0 grid place-items-center" aria-hidden="true">
        <span class="relative size-60 rounded-[20px] shadow-[0_0_0_9999px_var(--camera-mask)]">
          <i class="absolute -top-0.5 -left-0.5 size-9 rounded-tl-[20px] border-t-4 border-l-4 border-(--camera-fg)"></i>
          <i class="absolute -top-0.5 -right-0.5 size-9 rounded-tr-[20px] border-t-4 border-r-4 border-(--camera-fg)"></i>
          <i class="absolute -bottom-0.5 -left-0.5 size-9 rounded-bl-[20px] border-b-4 border-l-4 border-(--camera-fg)"></i>
          <i class="absolute -right-0.5 -bottom-0.5 size-9 rounded-br-[20px] border-r-4 border-b-4 border-(--camera-fg)"></i>
          <span class="absolute inset-x-3 top-3 h-0.5 animate-scanline bg-(--brand-accent) shadow-[0_0_12px_var(--brand-accent)] motion-reduce:animate-none"></span>
        </span>
      </div>
      <p class="absolute inset-x-4 bottom-6 text-center text-[15px] [text-shadow:0_1px_4px_var(--camera-mask)]" aria-live="polite">{{ hint() }}</p>
    </div>
    <div class="grid grid-cols-3 gap-2 p-3">
      <button type="button" [class]="btn" [attr.aria-pressed]="torch()" (click)="toggleTorch()"><zc-icon name="l:sparkles" />{{ t('mol.escaner.linterna') }}</button>
      <button type="button" [class]="btn" (click)="manual.emit()"><zc-icon name="s:pen" />{{ t('mol.escaner.ingresar') }}</button>
      <button type="button" [class]="btn" [attr.aria-label]="t('mol.escaner.cambiarCamara', { cam: t('mol.escaner.' + cam()) })" (click)="flip()"><zc-icon name="s:refresh" />{{ t('mol.escaner.camara') }}</button>
    </div>`,
})
export class ScannerComponent {
  readonly t = injectTranslate();
  private readonly toast = inject(ToastService);
  readonly scanned = output<string>();
  readonly manual = output<void>();
  readonly torch = signal(false);
  readonly cam = signal<'trasera' | 'frontal'>('trasera');
  readonly live = signal(false);
  readonly hint = signal('');
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;
  private timer?: ReturnType<typeof setInterval>;
  readonly btn = 'grid min-h-16 cursor-pointer justify-items-center gap-1 rounded-2xl bg-(--camera-btn) px-1 py-2 text-xs aria-pressed:bg-(--camera-fg) aria-pressed:text-(--camera-bg)';

  constructor() {
    this.hint.set(this.t('mol.escaner.apunta'));
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Abre la cámara (trasera por defecto) y busca códigos cada 350 ms. */
  async start() {
    if (!navigator.mediaDevices?.getUserMedia) { this.hint.set(this.t('mol.escaner.sinSoporte')); return; }
    try {
      this.stop();
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this.cam() === 'trasera' ? 'environment' : 'user' } });
      const v = this.video().nativeElement; v.srcObject = this.stream; await v.play();
      this.live.set(true); this.hint.set(this.t('mol.escaner.buscando'));
      const Ctor = (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
      if (!Ctor) { this.hint.set(this.t('mol.escaner.sinLector')); return; }
      const det = new Ctor({ formats: ['qr_code', 'code_128', 'ean_13'] });
      this.timer = setInterval(async () => {
        try {
          const r = await det.detect(v);
          if (r.length) { this.hint.set(this.t('mol.escaner.leido')); this.stop(); this.scanned.emit(r[0].rawValue); }
        } catch { /* cuadro sin código */ }
      }, 350);
    } catch { this.hint.set(this.t('mol.escaner.sinPermiso')); }
  }
  stop() {
    clearInterval(this.timer);
    this.stream?.getTracks().forEach(tr => tr.stop());
    this.stream = null; this.live.set(false);
  }
  toggleTorch() {
    this.torch.update(v => !v);
    const tr = this.stream?.getVideoTracks()[0] as (MediaStreamTrack & { applyConstraints(c: unknown): Promise<void> }) | undefined;
    tr?.applyConstraints({ advanced: [{ torch: this.torch() }] }).catch(() => undefined);
    this.toast.info(this.t(this.torch() ? 'mol.escaner.linternaOn' : 'mol.escaner.linternaOff'));
  }
  flip() {
    this.cam.update(c => (c === 'trasera' ? 'frontal' : 'trasera'));
    if (this.stream) void this.start(); else this.toast.info(this.t('mol.escaner.camaraN', { cam: this.t('mol.escaner.' + this.cam()) }));
  }
}
