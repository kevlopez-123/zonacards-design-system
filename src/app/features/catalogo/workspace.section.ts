import { ChangeDetectionStrategy, Component, inject, input, signal, viewChild } from '@angular/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { ChipComponent } from '@zonacards/ui/chip';
import { ToastService } from '@zonacards/ui/toast';
import { DASHBOARD_GRID, ZcWidget, ZcWidgetDef } from '@zonacards/ui/dashboard';
import { EmailEditorComponent, ZcEmailBlock } from '@zonacards/ui/email-editor';
import { ImageGalleryComponent, ZcGalleryImage } from '@zonacards/ui/image-gallery';
import { KANBAN, ZcKanbanBoard, ZcKanbanColumn } from '@zonacards/ui/kanban';
import { DsSectionComponent } from './ds/ds-layout';

interface Order { id: string; client: string; detail: string; priority: 'Alta' | 'Media' | 'Baja' }

/** Imagen de muestra (SVG en data URL): solo contenido de demostración, como las fotos que subiría el usuario. */
const sample = (label: string, a: string, b: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><text x="96" y="790" font-family="sans-serif" font-size="100" font-weight="600" fill="rgba(255,255,255,.9)">${label}</text></svg>`);

/** Catálogo · Espacio de trabajo (Tanda 6): kanban, dashboard configurable, editor de correo y galería con carga. */
@Component({
  selector: 'zc-catalogo-workspace',
  imports: [BadgeComponent, ButtonDirective, ChipComponent, DASHBOARD_GRID, EmailEditorComponent, ImageGalleryComponent, KANBAN, DsSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  template: `
    @if (show('o-dash')) {
      <zc-ds-section dsId="o-dash" title="Dashboard configurable"
        description="Modo edición para reordenar widgets arrastrándolos y cambiar su tamaño (1, 2 o 4 columnas) desde la esquina o con el menú. Agregar desde un catálogo, quitar y restablecer el dashboard del rol.">
        <zc-dashboard-grid [catalog]="widgets" [defaults]="defaults" [(layout)]="layout">
          <ng-template zcWidgetBody let-id let-width="width">
            @switch (id) {
              @case ('trend') {
                <div class="flex h-[84px] items-end gap-1.5" aria-hidden="true">
                  @for (v of bars.slice(0, width === 4 ? 12 : 8); track $index) { <i class="flex-1 rounded-t-[4px] bg-(--chart-1) opacity-85" [style.height.px]="v * 6"></i> }
                </div>
              }
              @case ('alerts') { <div class="flex flex-wrap gap-1.5"><zc-badge tone="danger" icon="s:danger-triangle">2 altas</zc-badge><zc-badge tone="warning" icon="s:info-circle">5 medias</zc-badge></div> }
              @case ('liq') { <div class="flex flex-wrap gap-1.5">@for (c of liq; track c) { <zc-chip [label]="c" /> }</div> }
              @case ('stock') { <span class="block text-[26px] font-semibold">3</span><span class="text-[13px] text-muted">Falabella, Ripley, Tottus</span> }
              @default { <span class="block text-[26px] font-semibold num">{{ kpi[id] }}</span> }
            }
          </ng-template>
        </zc-dashboard-grid>
      </zc-ds-section>
    }

    @if (show('o-email')) {
      <zc-ds-section dsId="o-email" title="Editor de correo por bloques"
        description="Catálogo de bloques (título, texto, imagen, botón, giftcard, separador), lienzo con reordenar arrastrando, panel para editar el bloque elegido y vista previa en escritorio y celular.">
        <zc-email-editor [(blocks)]="email" [(selected)]="emailSel" (test)="toast.success('Correo de prueba enviado', { text: 'A ana.torres@promotick.com' })" />
      </zc-ds-section>
    }

    @if (show('o-images')) {
      <zc-ds-section dsId="o-images" title="Galería con carga de imágenes"
        description="Varias imágenes a la vez (arrastrar o elegir), vista previa real, validación de tipo, peso y dimensiones, progreso, portada, texto alternativo obligatorio y reordenar arrastrando.">
        <zc-image-gallery #gal [(images)]="images" />
        <div class="flex flex-wrap items-center gap-3">
          <button zcButton (click)="saveGallery()">Guardar galería</button>
          @if (galleryMsg()) { <span class="text-sm" [class]="galleryOk() ? 'text-success' : 'text-danger'" role="status">{{ galleryMsg() }}</span> }
        </div>
      </zc-ds-section>
    }

    @if (show('o-kanban')) {
      <zc-ds-section dsId="o-kanban" title="Kanban de pedidos"
        description='Columnas por estado con conteo y límite de trabajo en curso. Mover tarjetas arrastrando entre columnas o con teclado (Espacio, flechas, Espacio) y con el menú "Mover a". En móvil, una columna a la vez con pestañas.'>
        <zc-kanban [columns]="cols" [(board)]="board" [cardId]="orderId" [cardLabel]="orderLabel">
          <ng-template zcKanbanCard let-p>
            <div class="flex items-center gap-2"><strong class="num">{{ p.id }}</strong>
              <zc-badge class="ml-auto" [tone]="p.priority === 'Alta' ? 'danger' : p.priority === 'Media' ? 'warning' : 'neutral'">{{ p.priority }}</zc-badge></div>
            <span>{{ p.client }}</span><small class="text-[12.5px] text-muted">{{ p.detail }}</small>
          </ng-template>
        </zc-kanban>
      </zc-ds-section>
    }`,
})
export class WorkspaceSection {
  readonly parts = input<string[]>([]);
  readonly show = (id: string) => this.parts().includes(id);
  readonly toast = inject(ToastService);

  // ---- Dashboard ----
  readonly widgets: ZcWidgetDef[] = [
    { id: 'emit', title: 'Gift cards emitidas', icon: 's:gift', width: 1 }, { id: 'val', title: 'Valor emitido', icon: 's:wallet-money', width: 1 },
    { id: 'red', title: 'Redención', icon: 's:check-circle', width: 1 }, { id: 'exp', title: 'Por vencer (30 d)', icon: 's:clock-circle', width: 1 },
    { id: 'trend', title: 'Tendencia de canjes', icon: 's:chart-2', width: 2 }, { id: 'alerts', title: 'Alertas activas', icon: 's:danger-triangle', width: 2 },
    { id: 'stock', title: 'Stock bajo mínimo', icon: 's:layers', width: 2 }, { id: 'liq', title: 'Liquidaciones por estado', icon: 's:bill-list', width: 4 },
  ];
  readonly defaults = ['emit', 'val', 'red', 'exp', 'trend', 'alerts', 'liq'];
  readonly layout = signal<ZcWidget[]>(this.defaults.map(id => ({ id, width: this.widgets.find(w => w.id === id)!.width })));
  readonly kpi: Record<string, string> = { emit: '12,480', val: 'S/ 1.24 M', red: '73.2 %', exp: '1,204' };
  readonly bars = [5, 7, 6, 9, 8, 11, 10, 12, 9, 13, 12, 14];
  readonly liq = ['Esperando factura 5', 'Por revisar 4', 'En pago 6', 'Pagadas 12'];

  // ---- Correo ----
  readonly email = signal<ZcEmailBlock[]>([
    { id: 'b1', type: 'image', category: 'Gastronomía' }, { id: 'b2', type: 'title', text: '¡Tienes una giftcard!' },
    { id: 'b3', type: 'text', text: 'Interbank te envía este regalo por tu buen trabajo. Úsala en más de 200 marcas.' }, { id: 'b4', type: 'gift' },
    { id: 'b5', type: 'button', text: 'Ver mi regalo', color: '#172948' }, { id: 'b6', type: 'divider' },
    { id: 'b7', type: 'text', text: 'Vence el 31 de diciembre de 2026.', small: true },
  ]);
  readonly emailSel = signal<string | null>('b2');

  // ---- Galería ----
  private readonly gal = viewChild(ImageGalleryComponent);
  readonly images = signal<ZcGalleryImage[]>([
    { id: 's1', name: 'gastronomia.jpg', size: '186 KB', alt: 'Plato principal en restaurante', state: 'ok', src: sample('Gastronomía', '#7c2d12', '#ea580c') },
    { id: 's2', name: 'experiencias.jpg', size: '186 KB', alt: 'Personas en un concierto al aire libre', state: 'ok', src: sample('Experiencias', '#1e3a8a', '#3b82f6') },
    { id: 's3', name: 'viajes.jpg', size: '186 KB', alt: '', state: 'ok', src: sample('Viajes', '#064e3b', '#10b981') },
  ]);
  readonly galleryMsg = signal('');
  readonly galleryOk = signal(false);
  saveGallery() {
    const r = this.gal()?.validate(); if (!r) return;
    if (r.missingAlt || r.errors) {
      this.galleryOk.set(false);
      this.galleryMsg.set([r.missingAlt && r.missingAlt + (r.missingAlt > 1 ? ' imágenes sin texto alternativo' : ' imagen sin texto alternativo'), r.errors && r.errors + ' con error'].filter(Boolean).join(' y ') + '.');
      return;
    }
    this.galleryOk.set(true); this.galleryMsg.set('Galería guardada.');
    this.toast.success('Galería guardada', { text: this.images().length + ' imágenes, portada: ' + this.images()[0].alt });
  }

  // ---- Kanban ----
  readonly cols: ZcKanbanColumn[] = [
    { id: 'pend', label: 'Pendiente', tone: 'neutral' }, { id: 'prep', label: 'Preparando', tone: 'info' },
    { id: 'route', label: 'En ruta', tone: 'warning', limit: 4 }, { id: 'done', label: 'Entregado', tone: 'success' },
  ];
  private readonly o = (id: string, client: string, detail: string, priority: Order['priority']): Order => ({ id, client, detail, priority });
  readonly board = signal<ZcKanbanBoard<Order>>({
    pend: [this.o('#PE-1042', 'Interbank', 'Kit de bienvenida × 120', 'Alta'), this.o('#PE-1043', 'BCP', 'Canastas navideñas × 40', 'Media')],
    prep: [this.o('#PE-1038', 'Entel', 'Tarjetas físicas × 300', 'Alta'), this.o('#PE-1039', 'Bimbo', 'Premios campaña × 25', 'Baja')],
    route: [this.o('#PE-1031', 'Tigo', 'Experiencias × 12', 'Media'), this.o('#PE-1032', 'Claro', 'Gift box × 60', 'Media'), this.o('#PE-1033', 'BBVA', 'Merch × 200', 'Baja'), this.o('#PE-1034', 'Falabella', 'Vales impresos × 500', 'Alta')],
    done: [this.o('#PE-1020', 'Movistar', 'Kits × 80', 'Media')],
  });
  readonly orderId = (p: Order) => p.id;
  readonly orderLabel = (p: Order) => p.id + ', ' + p.client + ', ' + p.detail;
}
