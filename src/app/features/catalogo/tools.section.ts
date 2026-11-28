import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { CodeBlockComponent } from '@zonacards/ui/code-block';
import { CopyButtonComponent } from '@zonacards/ui/copy-button';
import { formatMoney } from '@zonacards/ui/core';
import { ContextMenuDirective, MenuComponent, ZcMenuItem } from '@zonacards/ui/menu';
import { SplitComponent } from '@zonacards/ui/split';
import { DataTableComponent, ZcColumn } from '@zonacards/ui/table';
import { ToastService } from '@zonacards/ui/toast';
import { TreeComponent, treeIds, ZcTreeNode } from '@zonacards/ui/tree';
import { DsSectionComponent } from './ds/ds-layout';

interface Tx { id: string; code: string; client: string; amount: number; date: string }

/** Catálogo · Herramientas de trabajo (1.6): árbol, paneles redimensionables, menú contextual, código y JSON, copiar y tabla virtual. */
@Component({
  selector: 'zc-catalogo-tools',
  imports: [BadgeComponent, ButtonDirective, CodeBlockComponent, CopyButtonComponent, ContextMenuDirective, MenuComponent, SplitComponent, DataTableComponent, TreeComponent, DsSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  template: `
    @if (show('o-tree')) {
      <zc-ds-section dsId="o-tree" title="Árbol" description="Jerarquías (categorías, clientes y locales, permisos). Flechas recorren, → abre, ← cierra, * abre los hermanos, escribir salta. Con casillas, elegir un padre elige sus hojas y el padre queda mixto si faltan algunas.">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-6 @container md:grid-cols-2">
          <div class="grid gap-2">
            <div class="flex items-center justify-between gap-2"><strong class="text-body-sm">Navegación</strong>
              <button zcButton variant="ghost" size="sm" (click)="openNav.set(openNav().length ? [] : allNav)">{{ openNav().length ? 'Contraer todo' : 'Expandir todo' }}</button></div>
            <zc-tree label="Clientes y locales" [nodes]="clientes" selection="single" [(expanded)]="openNav" [(selected)]="selNav" />
            <p class="m-0 text-caption text-muted">Elegido: {{ selNav()[0] || '—' }}</p>
          </div>
          <div class="grid gap-2">
            <strong class="text-body-sm">Permisos (casillas)</strong>
            <zc-tree label="Permisos del rol" [nodes]="permisos" selection="checkbox" [(expanded)]="openPerm" [(selected)]="selPerm" />
            <p class="m-0 text-caption text-muted">{{ selPerm().length }} permisos elegidos</p>
          </div>
        </div>
      </zc-ds-section>
    }
    @if (show('o-split')) {
      <zc-ds-section dsId="o-split" title="Paneles redimensionables" description="Lista y detalle con un separador que se arrastra o se mueve con flechas (Mayús: de a 10 %). Se recuerda el ancho. En contenedores de menos de 768 px los paneles se apilan.">
        <zc-split class="h-72 rounded-md border border-border" storageKey="catalogo-split" label="Ancho de la lista" [initial]="38">
          <div zcSplitStart class="grid content-start gap-1 p-2">
            @for (t of txs.slice(0, 8); track t.id) {
              <button type="button" class="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-3 text-left text-body-sm hover:bg-surface-2" [class.bg-surface-2]="sel() === t.id" (click)="sel.set(t.id)">
                <span class="truncate">{{ t.client }}</span><span class="text-caption text-muted num">{{ t.code }}</span>
              </button>
            }
          </div>
          <div zcSplitEnd class="grid content-start gap-3 bg-surface p-4">
            @let t = selected();
            <strong class="text-title-sm">{{ t.client }}</strong>
            <span class="text-body num">{{ money(t.amount) }}</span>
            <span class="text-caption text-muted">Transacción {{ t.code }} · {{ t.date }}</span>
          </div>
        </zc-split>
      </zc-ds-section>
    }
    @if (show('o-context')) {
      <zc-ds-section dsId="o-context" title="Menú contextual" description="Clic derecho, tecla Menú o Mayús+F10 sobre la tarjeta (presión larga en táctil). Es un atajo: las mismas acciones están en el ⋮ de la tarjeta.">
        <zc-menu #ctx trigger="none" label="Acciones del lote #02829" [items]="acciones" (select)="toast.info($event.label + ' · lote #02829')" />
        <article [zcContextMenu]="ctx" tabindex="0" class="grid max-w-[420px] gap-2 rounded-md border border-border bg-surface p-4 outline-none focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus">
          <div class="flex items-center justify-between gap-2">
            <strong class="text-body">Lote #02829 · Falabella</strong>
            <zc-menu label="Acciones del lote #02829" [items]="acciones" [dense]="true" (select)="toast.info($event.label + ' · lote #02829')" />
          </div>
          <zc-badge tone="success" icon="s:check-circle">Activo</zc-badge>
          <span class="text-caption text-muted">Haz clic derecho en la tarjeta o enfócala y presiona Mayús+F10.</span>
        </article>
      </zc-ds-section>
    }
    @if (show('o-code')) {
      <zc-ds-section dsId="o-code" title="Código, JSON y copiar" description="Respuestas de API, webhooks y registros de auditoría en solo lectura, con resaltado, copiar y alto máximo. Botón de copiar para IDs, códigos y URLs.">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          <zc-code-block title="Respuesta del webhook · pedido.creado" language="json" [code]="webhook" [lineNumbers]="true" maxHeight="280px" />
          <div class="grid content-start gap-4">
            <zc-code-block title="Probar la API" language="bash" [code]="curl" [wrap]="true" />
            <div class="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
              <span class="text-caption text-muted">ID de transacción</span><code class="font-mono text-body-sm">TX-8F3A-21C9</code>
              <zc-copy-button value="TX-8F3A-21C9" label="Copiar el ID de transacción" />
              <zc-copy-button value="https://admin.zonacards.com/lotes/02829" [showText]="true" variant="outline" />
            </div>
          </div>
        </div>
      </zc-ds-section>
    }
    @if (show('o-vtable')) {
      <zc-ds-section dsId="o-vtable" title="Tabla virtual y columnas ajustables" description="2.000 filas: solo se dibujan las visibles. Las columnas se ensanchan arrastrando el borde del encabezado o con flechas (Enter restablece).">
        <zc-data-table caption="Transacciones" [data]="txs" [columns]="cols" [virtual]="true" maxHeight="420px" [resizable]="true" [(widths)]="widths" density="compact" />
      </zc-ds-section>
    }`,
})
export class ToolsSection {
  readonly parts = input<string[]>([]);
  readonly show = (id: string) => this.parts().includes(id);
  readonly toast = inject(ToastService);
  readonly money = (n: number) => formatMoney(n, 'pe');

  readonly clientes: ZcTreeNode[] = [
    { id: 'falabella', label: 'Falabella', icon: 's:shop-2', meta: '3', children: [
      { id: 'fal-lima', label: 'Lima', children: [{ id: 'fal-sanisidro', label: 'San Isidro', meta: 'L-021' }, { id: 'fal-miraflores', label: 'Miraflores', meta: 'L-034' }] },
      { id: 'fal-arequipa', label: 'Arequipa', meta: 'L-102' },
    ] },
    { id: 'ripley', label: 'Ripley', icon: 's:shop-2', meta: '2', children: [{ id: 'rip-jockey', label: 'Jockey Plaza', meta: 'L-201' }, { id: 'rip-trujillo', label: 'Trujillo', meta: 'L-245' }] },
    { id: 'tottus', label: 'Tottus', icon: 's:shop-2', meta: '0', disabled: true },
  ];
  readonly allNav = treeIds(this.clientes);
  readonly openNav = signal<string[]>(['falabella']);
  readonly selNav = signal<string[]>(['fal-sanisidro']);
  readonly permisos: ZcTreeNode[] = [
    { id: 'lotes', label: 'Lotes', icon: 's:box', children: [{ id: 'lotes.ver', label: 'Ver' }, { id: 'lotes.crear', label: 'Crear' }, { id: 'lotes.anular', label: 'Anular' }] },
    { id: 'liq', label: 'Liquidaciones', icon: 's:bill-list', children: [{ id: 'liq.ver', label: 'Ver' }, { id: 'liq.aprobar', label: 'Aprobar' }] },
  ];
  readonly openPerm = signal<string[]>(['lotes', 'liq']);
  readonly selPerm = signal<string[]>(['lotes.ver', 'lotes.crear', 'liq.ver']);

  readonly txs: Tx[] = Array.from({ length: 2000 }, (_, i) => ({
    id: String(i + 1), code: 'TX-' + (10000 + i), client: ['Falabella', 'Ripley', 'Tottus', 'Oechsle', 'Plaza Vea'][i % 5] + ' ' + ((i % 37) + 1),
    amount: ((i * 7919) % 50000) / 10 + 50, date: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  }));
  readonly sel = signal('1');
  readonly selected = () => this.txs.find(t => t.id === this.sel())!;
  readonly cols: ZcColumn<Tx>[] = [
    { id: 'code', header: 'Código', value: t => t.code, sortable: true },
    { id: 'client', header: 'Cliente', value: t => t.client, sortable: true, grow: true },
    { id: 'date', header: 'Fecha', value: t => t.date, sortable: true },
    { id: 'amount', header: 'Monto', value: t => this.money(t.amount), align: 'end' },
  ];
  readonly widths = signal<Record<string, number>>({});
  readonly acciones: ZcMenuItem[] = [
    { id: 'ver', label: 'Ver detalle', icon: 's:eye' },
    { id: 'descargar', label: 'Descargar códigos', icon: 's:download-minimalistic' },
    { id: 'anular', label: 'Anular lote', icon: 's:close-circle', danger: true, separatorBefore: true },
  ];
  readonly webhook = {
    event: 'pedido.creado', id: 'evt_01J9ZK3T', created: '2026-11-06T14:03:22Z',
    data: { order: 'PED-4512', client: 'Falabella', items: 3, total: 1250.5, currency: 'PEN', paid: true, coupon: null },
  };
  readonly curl = `# Consultar un lote\ncurl -X GET "https://api.zonacards.com/v1/lotes/02829" \\\n  -H "Authorization: Bearer $ZC_TOKEN" \\\n  -H "Accept: application/json"`;
}
