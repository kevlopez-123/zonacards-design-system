import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, model, signal, viewChild } from '@angular/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { ProgressComponent } from '@zonacards/ui/progress';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';
import { InputDirective } from '@zonacards/ui/field';
import { SORTABLE } from '@zonacards/ui/sortable';

export interface ZcGalleryImage {
  id: string; name: string; size: string; alt: string;
  state: 'ok' | 'up' | 'err'; src?: string; progress?: number;
  /** Causa del rechazo, traducida al dibujar. */ error?: { key: 'formato' | 'peso' | 'medidas' | 'danado'; mb?: string; w?: number; h?: number };
}
/** Sube el archivo y devuelve su URL; informa el avance de 0 a 100. Por defecto, lectura local con avance simulado. */
export type ZcUploader = (file: File, src: string, progress: (p: number) => void) => Promise<string>;

const TYPES = /^image\/(jpeg|png|webp)$/;
const fakeUpload: ZcUploader = (_f, src, progress) => new Promise(res => {
  let p = 0; const t = setInterval(() => { p += 25; progress(p); if (p >= 100) { clearInterval(t); res(src); } }, 180);
});

/**
 * <zc-image-gallery [(images)]="fotos" [max]="8" /> · galería con carga de imágenes (o-images de index.html).
 * Varias a la vez (arrastrar o elegir), vista previa real, validación de tipo, peso y medidas, progreso, portada (la primera),
 * texto alternativo obligatorio y reordenar arrastrando (zcSortable). validate() marca los faltantes y enfoca el primero.
 */
@Component({
  selector: 'zc-image-gallery',
  imports: [BadgeComponent, ButtonDirective, IconComponent, ProgressComponent, TooltipDirective, InputDirective, SORTABLE],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-caption text-muted">{{ t('mol.galeria.reglas', { max: max(), mb: maxMb() }) }}</span>
      <span class="flex-1"></span>
      <zc-badge class="num">{{ t('mol.galeria.conteo', { n: okCount(), max: max() }) }}</zc-badge>
    </div>
    <ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-3 p-0" [attr.aria-label]="t('mol.galeria.titulo')"
      [(zcSortable)]="images" [zcSortableGrid]="true" [zcSortableLabel]="labelOf" (dragover)="over($event)" (dragleave)="drag.set(false)" (drop)="drop($event)">
      @for (im of images(); track im.id; let i = $index) {
        <li [zcSortableItem]="im" class="group relative grid min-w-0 overflow-hidden rounded-md border bg-surface transition-[border-color,box-shadow] duration-(--dur) hover:shadow-1"
          [class]="im.state === 'err' ? 'border-danger-bd' : 'border-border hover:border-border-strong'">
          @if (im.state === 'err') {
            <div class="grid aspect-[4/3] place-items-center gap-1 bg-danger-bg p-2 text-center text-caption text-danger" role="alert">
              <zc-icon name="s:danger-circle" [size]="24" /><span>{{ errorText(im) }}</span>
            </div>
            <div class="grid min-w-0 gap-1.5 px-2.5 py-2">
              <span class="break-all text-xs text-muted">{{ im.name }}</span>
              <button zcButton variant="outline" size="sm" (click)="remove(im)">{{ t('mol.galeria.quitar') }}</button>
            </div>
          } @else {
            @if (i === 0 && im.state === 'ok') { <zc-badge class="absolute top-2 left-12 z-(--z-sticky)" tone="info" icon="s:star">{{ t('mol.galeria.portada') }}</zc-badge> }
            <div class="absolute top-1.5 right-1.5 z-(--z-sticky) flex gap-1">
              @if (i > 0 && im.state === 'ok') {
                <button type="button" class="grid size-8 cursor-pointer place-items-center rounded-full bg-(--media-overlay-bg) text-(--media-overlay-fg)" [attr.aria-label]="t('mol.galeria.usarPortada')" [zcTooltip]="t('mol.galeria.usarPortada')" (click)="cover(im)"><zc-icon name="s:star" [size]="16" /></button>
              }
              <button type="button" class="grid size-8 cursor-pointer place-items-center rounded-full bg-(--media-overlay-bg) text-(--media-overlay-fg)" [attr.aria-label]="t('mol.galeria.quitarN', { name: im.name })" [zcTooltip]="t('mol.galeria.quitar')" (click)="remove(im)"><zc-icon name="s:trash-bin-trash" [size]="16" /></button>
            </div>
            <button type="button" zcSortableHandle [item]="im" [label]="t('mol.orden.reordenar', { label: im.alt || im.name })"
              class="absolute top-1.5 left-1.5 z-(--z-sticky) grid size-8 place-items-center rounded-sm bg-surface text-fg opacity-0 shadow-1 group-hover:opacity-100 group-focus-within:opacity-100 aria-pressed:opacity-100 max-md:opacity-100"><zc-icon name="l:grip-vertical" [size]="16" /></button>
            <div class="relative grid aspect-[4/3] place-items-center overflow-hidden bg-surface-2">
              @if (im.src) { <img class="block size-full object-cover" [class.opacity-50]="im.state === 'up'" [src]="im.src" [alt]="im.alt" /> }
              @if (im.state === 'up') { <zc-progress class="absolute inset-x-2.5 bottom-2.5" [label]="t('mol.galeria.subiendo', { name: im.name })" [showLabel]="false" [value]="im.progress ?? 0" /> }
            </div>
            <div class="grid min-w-0 gap-1.5 px-2.5 py-2">
              <span class="break-all text-xs text-muted">{{ im.name }} · {{ im.size }}</span>
              <input zcInput [class]="altClass(im.id)" [attr.data-alt]="im.id" [value]="im.alt" [placeholder]="t('mol.galeria.alt') + ' *'"
                [attr.aria-label]="t('mol.galeria.altDe', { name: im.name })" [attr.aria-invalid]="altErr().includes(im.id) || null"
                (input)="setAlt(im, $any($event.target).value)" />
            </div>
          }
        </li>
      }
      @if (images().length < max()) {
        <li class="min-w-0">
          <button type="button" [class]="'grid size-full min-h-[180px] cursor-pointer place-items-center rounded-md border-[1.5px] border-dashed text-muted hover:border-fg hover:bg-surface-2 hover:text-fg ' + (drag() ? 'border-fg bg-surface-2' : 'border-border-strong')" [attr.aria-label]="t('mol.galeria.agregar')" (click)="file()?.nativeElement?.click()">
            <span class="grid justify-items-center gap-1.5"><zc-icon name="l:image-plus" [size]="32" /><span class="text-sm">{{ t('mol.galeria.arrastra') }}</span></span>
          </button>
        </li>
      }
    </ul>
    <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" multiple hidden (change)="pick($event)" />`,
})
export class ImageGalleryComponent {
  readonly t = injectTranslate();
  private readonly live = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  readonly images = model.required<ZcGalleryImage[]>();
  readonly max = input(8);
  readonly maxBytes = input(3 * 1024 * 1024);
  readonly minWidth = input(800);
  readonly minHeight = input(600);
  readonly uploader = input<ZcUploader>(fakeUpload);
  readonly file = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly drag = signal(false);
  readonly altErr = signal<string[]>([]);
  readonly okCount = computed(() => this.images().filter(x => x.state !== 'err').length);
  readonly maxMb = computed(() => Math.round(this.maxBytes() / 1048576));
  readonly labelOf = (im: ZcGalleryImage) => im.alt || im.name;
  private seq = 0;

  errorText(im: ZcGalleryImage) { const e = im.error!; return this.t('mol.galeria.err.' + e.key, { mb: e.mb, w: e.w, h: e.h, max: this.maxMb(), minW: this.minWidth(), minH: this.minHeight() }); }
  altClass(id: string) { return 'h-9! px-2! text-caption! ' + (this.altErr().includes(id) ? 'border-danger!' : ''); }
  private patch(id: string, p: Partial<ZcGalleryImage>) { this.images.update(a => a.map(x => (x.id === id ? { ...x, ...p } : x))); }
  setAlt(im: ZcGalleryImage, alt: string) { this.patch(im.id, { alt }); if (alt.trim()) this.altErr.update(a => a.filter(x => x !== im.id)); }
  remove(im: ZcGalleryImage) { this.images.update(a => a.filter(x => x.id !== im.id)); this.live.announce(this.t('mol.galeria.quitada', { name: im.name })); }
  cover(im: ZcGalleryImage) { this.images.update(a => [im, ...a.filter(x => x.id !== im.id)]); this.live.announce(this.t('mol.galeria.nuevaPortada', { name: im.alt || im.name })); }

  over(e: DragEvent) { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); this.drag.set(true); } }
  drop(e: DragEvent) { this.drag.set(false); if (e.dataTransfer?.files.length) { e.preventDefault(); this.add(e.dataTransfer.files); } }
  pick(e: Event) { const i = e.target as HTMLInputElement; if (i.files) this.add(i.files); i.value = ''; }

  /** Valida tipo y peso al instante, medidas al leer la imagen, y sube las válidas mostrando el avance. */
  add(files: FileList | File[]) {
    for (const f of [...files].slice(0, this.max() - this.images().length)) {
      const im: ZcGalleryImage = { id: 'g' + ++this.seq + Date.now().toString(36), name: f.name, size: Math.round(f.size / 1024) + ' KB', alt: '', state: 'up', progress: 0 };
      if (!TYPES.test(f.type)) { this.images.update(a => [...a, { ...im, state: 'err', error: { key: 'formato' } }]); continue; }
      if (f.size > this.maxBytes()) { this.images.update(a => [...a, { ...im, state: 'err', error: { key: 'peso', mb: (f.size / 1048576).toFixed(1) } }]); continue; }
      this.images.update(a => [...a, im]);
      const rd = new FileReader();
      rd.onload = () => {
        const src = rd.result as string; const tmp = new Image();
        tmp.onload = () => {
          if (tmp.width < this.minWidth() || tmp.height < this.minHeight()) { this.patch(im.id, { state: 'err', error: { key: 'medidas', w: tmp.width, h: tmp.height } }); return; }
          this.patch(im.id, { src });
          this.uploader()(f, src, p => this.patch(im.id, { progress: p })).then(url => {
            this.patch(im.id, { state: 'ok', src: url });
            this.live.announce(this.t('mol.galeria.subida', { name: im.name }));
          });
        };
        tmp.onerror = () => this.patch(im.id, { state: 'err', error: { key: 'danado' } });
        tmp.src = src;
      };
      rd.readAsDataURL(f);
    }
  }

  /** Antes de guardar: imágenes sin texto alternativo o con error. Enfoca el primer campo vacío. */
  validate(): { missingAlt: number; errors: number } {
    const missing = this.images().filter(x => x.state === 'ok' && !x.alt.trim()).map(x => x.id);
    this.altErr.set(missing);
    afterNextRender(() => this.host.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), { injector: this.injector });
    return { missingAlt: missing.length, errors: this.images().filter(x => x.state === 'err').length };
  }
}
