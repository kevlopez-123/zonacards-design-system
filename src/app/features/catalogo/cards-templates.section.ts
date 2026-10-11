import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { AvatarComponent } from '@zonacards/ui/avatar';
import { BadgeComponent } from '@zonacards/ui/badge';
import { BulletComponent } from '@zonacards/ui/bullet';
import { ButtonDirective } from '@zonacards/ui/button';
import { ChipComponent } from '@zonacards/ui/chip';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { MoneyComponent } from '@zonacards/ui/money';
import { ProgressComponent } from '@zonacards/ui/progress';
import { RadioComponent } from '@zonacards/ui/radio';
import { RadioGroupComponent } from '@zonacards/ui/radio';
import { DescriptionListComponent, ZcDescription } from '@zonacards/ui/description-list';
import { MenuComponent, ZcMenuItem } from '@zonacards/ui/menu';
import { ToastService } from '@zonacards/ui/toast';
import { CARD } from '@zonacards/ui/card';
import { KpiComponent } from '@zonacards/ui/kpi';
import { DsSectionComponent } from './ds/ds-layout';

interface Cell { s?: string; t?: 'd' | 'a'; sub?: { s: string; cells: Cell[] } }
interface Layout { name: string; desc: string; box: string; cells: Cell[] }
const W = (s = '', t?: 'd' | 'a'): Cell => ({ s, t });
const SUB = (s: string, cells: Cell[]): Cell => ({ sub: { s, cells } });

/** Bloques de los esquemas de plantilla: ancho, alto y si es la acción principal (oscuro). */
interface Block { w?: string; h?: string; dark?: boolean; end?: boolean }
interface Tpl { name: string; desc: string; component: string; rows: Block[][] }

/** Catálogo · Cards (o-cards), Plantillas (t-templates) y Layouts (t-layouts) de index.html. */
@Component({
  selector: 'zc-catalogo-cards-templates',
  imports: [NgTemplateOutlet, AvatarComponent, BadgeComponent, BulletComponent, ButtonDirective, ChipComponent, FlagComponent, IconComponent, MoneyComponent,
    ProgressComponent, RadioComponent, RadioGroupComponent, DescriptionListComponent, MenuComponent, CARD, KpiComponent, DsSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  template: `
    @if (show('o-cards')) {
      <zc-ds-section dsId="o-cards" title="Cards" description="Vista por defecto de los listados. Toda la tarjeta abre el detalle; el menú ⋮ agrupa acciones.">
        <h4 class="text-xs font-semibold uppercase tracking-[.04em] text-muted">KPI con sparkline y variación</h4>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-3">
          @for (k of kpis; track k.label; let i = $index) {
            <zc-kpi [label]="k.label" [value]="k.value" [icon]="k.icon" [delta]="k.delta" deltaLabel="vs. mes ant." [trend]="k.trend" [invert]="!!k.invert"
              [filter]="true" [pressed]="kpiOn() === i" (pressedChange)="kpiOn.set($event ? i : null)" />
          }
        </div>
        <h4 class="text-xs font-semibold uppercase tracking-[.04em] text-muted">Entidad, medio, stock, usuario y selección</h4>
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          <zc-card title="Navidad 2026" subtitle="#02829 · Interbank" icon="s:box" link="/lotes">
            <zc-menu zcCardAside label="Acciones del lote #02829" [items]="lotMenu" [dense]="true" (select)="toast.info($event.label, { text: 'Acción simulada.' })" />
            <div><zc-badge tone="success" icon="s:check-circle">Activado</zc-badge></div>
            <zc-description-list [items]="lotData" />
            <zc-progress label="66 % activado" [showLabel]="false" [value]="332" [max]="500" />
            <div zcCardFooter>
              <zc-flag code="pe" /><span>Perú · PEN</span><span class="flex-1"></span>
              <span class="inline-flex items-center gap-1"><zc-icon name="s:letter" [size]="16" />Correo</span>
            </div>
          </zc-card>

          <zc-card title="Experiencia Spa Relax" subtitle="Giftcard de experiencia · Marca propia">
            <div zcCardMedia class="grid place-items-center bg-linear-135 from-(--chart-1) to-(--chart-3) text-(--on-secondary)" aria-hidden="true"><zc-icon name="s:flag" [size]="32" /></div>
            <zc-badge zcCardAside tone="success" icon="s:check-circle">Activa</zc-badge>
            <div class="flex flex-wrap gap-1.5"><zc-chip label="Salud y belleza" /><zc-chip label="Multimarca" /><zc-chip label="QR" /></div>
            <div zcCardFooter>
              <zc-money class="text-lg font-semibold text-fg" [amount]="250" country="pe" /><span class="flex-1"></span>
              <button zcButton variant="outline" size="sm" (click)="toast.info('Editar', { text: 'Acción simulada.' })">Editar</button>
            </div>
          </zc-card>

          <zc-card title="Falabella S/ 50" subtitle="Almacén Lima · Terceros" icon="s:layers">
            <div><zc-badge tone="danger" icon="s:danger-triangle">Bajo mínimo</zc-badge></div>
            <zc-bullet [value]="38" [min]="50" [reorder]="66" [max]="160" [scale]="200" label="Stock 38, mínimo 50, máximo 160, punto de pedido 66">
              <div zcBulletHead class="flex items-center justify-between gap-2 text-sm"><span class="num"><strong>38</strong> códigos</span><span class="text-xs text-muted num">Pedido en 50</span></div>
              <div class="flex flex-wrap gap-x-3 text-xs text-muted num"><span>Mín. 50</span><span>Punto de pedido 66</span><span>Máx. 160</span></div>
            </zc-bullet>
            <div zcCardFooter>
              <span>Últimos 30 días: 112 vendidos</span><span class="flex-1"></span>
              <button zcButton size="sm" (click)="toast.success('Lote en carga', { text: 'Acción simulada.' })">Cargar lote</button>
            </div>
          </zc-card>

          <zc-card title="Ana Torres" subtitle="ana.torres@promotick.com">
            <zc-avatar zcCardLead name="Ana Torres" size="lg" [presence]="true" />
            <div class="flex flex-wrap gap-1.5">
              <zc-badge tone="info" icon="s:shield-check">Operaciones</zc-badge>
              <zc-badge><zc-flag code="pe" [size]="16" />Perú, Chile</zc-badge>
            </div>
            <zc-description-list [items]="userData" />
            <div zcCardFooter>
              <button zcButton variant="ghost" size="sm">Ver actividad</button><span class="flex-1"></span>
              <button zcButton variant="outline" size="sm">Editar rol</button>
            </div>
          </zc-card>

          <zc-radio-group class="md:col-span-2 xl:col-span-2" label="Tipo de códigos" variant="card" orientation="horizontal" [(value)]="codeType">
            <zc-radio value="own" icon="s:qr-code" subtitle="16 dígitos con verificación Luhn" description="El sistema genera los códigos y el PDF de cada vale.">Códigos propios</zc-radio>
            <zc-radio value="third" icon="s:import" subtitle="Plantilla XLSX del proveedor" description="Si el proveedor entrega vales, se adjunta el ZIP.">Códigos de terceros</zc-radio>
          </zc-radio-group>
        </div>
      </zc-ds-section>
    }

    @if (show('t-templates')) {
      <zc-ds-section dsId="t-templates" title="Plantillas" description="Las 4 estructuras que cubren casi todas las pantallas. Cada una es un componente de shared/ui/templates con slots; solo distribuye organismos.">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (t of templates; track t.name) {
            <article class="grid min-w-0 content-start gap-4 rounded-md border border-border bg-surface p-5 max-md:p-4">
              <div class="grid gap-1.5 rounded-md border border-border bg-bg p-3" aria-hidden="true">
                @for (row of t.rows; track $index) {
                  <div class="grid gap-1.5" [style.grid-template-columns]="'repeat(' + row.length + ', minmax(0,1fr))'">
                    @for (b of row; track $index) {
                      <div class="min-h-4 rounded-[6px]" [class]="b.dark ? 'bg-fg' : 'bg-surface-3'" [style.width]="b.w" [style.height]="b.h" [style.justify-self]="b.end ? 'end' : null"></div>
                    }
                  </div>
                }
              </div>
              <div class="grid gap-0.5">
                <span class="font-semibold">{{ t.name }}</span>
                <span class="text-[13px] text-muted">{{ t.desc }}</span>
                <code class="mt-1 justify-self-start rounded-xs bg-surface-2 px-1.5 text-xs">&lt;{{ t.component }}&gt;</code>
              </div>
            </article>
          }
        </div>
      </zc-ds-section>
    }

    @if (show('t-layouts')) {
      <zc-ds-section dsId="t-layouts" title="Layouts" description="Ocho estructuras de página con su comportamiento en móvil. Cada producto usa las que necesita: el administrador de Zonacards y Enjoy el 1, 2, 4, 5 y 7; el portal de empresas de Giftealo el 3 y el 6; el e-commerce el 6 y el 8.">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (l of layouts; track l.name) {
            <figure class="m-0 grid min-w-0 content-start gap-2">
              <div class="grid aspect-[4/3] min-w-0 gap-[5px] overflow-hidden rounded-md border border-border bg-bg p-2" [style]="l.box" aria-hidden="true">
                <ng-container *ngTemplateOutlet="cellsTpl; context: { $implicit: l.cells }" />
              </div>
              <figcaption class="grid gap-0.5"><strong class="text-[15px]">{{ l.name }}</strong><span class="text-[13px] text-muted">{{ l.desc }}</span></figcaption>
            </figure>
          }
        </div>
      </zc-ds-section>
    }

    <ng-template #cellsTpl let-cells>
      @for (c of cells; track $index) {
        @if (c.sub) {
          <div class="grid min-h-0 gap-1" [style]="c.sub.s"><ng-container *ngTemplateOutlet="cellsTpl; context: { $implicit: c.sub.cells }" /></div>
        } @else {
          <div class="min-h-0 rounded-xs" [class]="c.t === 'd' ? 'bg-fg opacity-85' : c.t === 'a' ? 'bg-[color-mix(in_srgb,var(--primary)_30%,var(--surface))]' : 'bg-surface-3'" [style]="c.s"></div>
        }
      }
    </ng-template>`,
})
export class CardsTemplatesSection {
  readonly parts = input<string[]>([]);
  readonly toast = inject(ToastService);
  readonly show = (id: string) => this.parts().includes(id);

  readonly kpiOn = signal<number | null>(null);
  readonly kpis = [
    { label: 'Emitidas', value: '12,480', delta: 8.2, icon: 's:gift' as const, trend: [8, 9, 9, 11, 10, 12, 13, 12, 14, 15] },
    { label: 'Valor emitido', value: 'S/ 1.24 M', delta: 5.1, icon: 's:wallet-money' as const, trend: [10, 11, 10, 12, 12, 13, 12, 14, 14, 15] },
    { label: 'Redención', value: '73.2 %', delta: 2.4, icon: 's:check-circle' as const, trend: [64, 66, 65, 68, 69, 70, 71, 70, 72, 73] },
    { label: 'Por vencer (30 d)', value: '1,204', delta: -12.5, icon: 's:clock-circle' as const, trend: [20, 18, 19, 17, 16, 15, 15, 14, 13, 12], invert: true },
  ];
  readonly lotMenu: ZcMenuItem[] = [{ id: 'ver', label: 'Ver ficha', icon: 's:eye' }, { id: 'enviar', label: 'Reenviar códigos', icon: 's:letter' }, { id: 'exportar', label: 'Exportar', icon: 's:download-minimalistic' }];
  readonly lotData: ZcDescription[] = [{ term: 'Valor del lote', value: 'S/ 50,000.00' }, { term: 'Unitario', value: 'S/ 100.00' }, { term: 'Activados', value: '332 de 500' }, { term: 'Vence', value: '31/12/2026' }];
  readonly userData: ZcDescription[] = [{ term: 'Último acceso', value: 'Hoy 09:14' }, { term: '2FA', value: 'App' }];
  readonly codeType = signal<unknown>('own');

  readonly templates: Tpl[] = [
    { name: 'Listado', desc: 'Migas · encabezado · KPI · filtros · tarjetas/tabla · paginación', component: 'zc-list-page',
      rows: [[{ w: '40%' }], [{}, {}, {}], [{}], [{ h: '36px' }, { h: '36px' }, { h: '36px' }], [{ w: '50%', end: true }]] },
    { name: 'Ficha', desc: 'Encabezado de entidad · pestañas · 2 columnas (datos + actividad)', component: 'zc-detail-page',
      rows: [[{ h: '28px' }], [{ w: '60%' }], [{ h: '70px' }, { h: '70px' }]] },
    { name: 'Formulario', desc: 'Stepper · secciones · pie fijo con acción principal', component: 'zc-form-page',
      rows: [[{ w: '70%' }], [{}, {}], [{}, {}], [{ w: '30%', dark: true, end: true }]] },
    { name: 'Dashboard', desc: 'Periodo · KPI · gráficos · alertas', component: 'zc-dashboard-page',
      rows: [[{ w: '35%' }], [{}, {}, {}], [{ h: '56px' }, { h: '56px' }]] },
  ];

  readonly layouts: Layout[] = [
    { name: '1. App shell', desc: 'Sidebar + barra superior + contenido. Móvil: sidebar en drawer.', box: 'grid-template-columns:22% 1fr;grid-template-rows:12% 1fr',
      cells: [W('grid-row:1/3', 'd'), W(), SUB('grid-template-columns:repeat(3,1fr);grid-template-rows:auto 1fr', [W('height:14px;grid-column:1/4'), W('', 'a'), W('', 'a'), W('', 'a')])] },
    { name: '2. Lista y detalle', desc: 'Lista a la izquierda y detalle al lado. Móvil: detalle en página o bottom sheet.', box: 'grid-template-columns:18% 34% 1fr',
      cells: [W('', 'd'), SUB('', [W(), W(), W(), W()]), W('', 'a')] },
    { name: '3. Riel + menú secundario', desc: 'Riel de íconos y menú de configuración. Móvil: menú secundario como pestañas.', box: 'grid-template-columns:9% 24% 1fr',
      cells: [W('', 'd'), SUB('align-content:start', [W('height:10px'), W('height:10px'), W('height:10px', 'a'), W('height:10px')]), W()] },
    { name: '4. Ficha', desc: 'Encabezado de entidad, pestañas y dos columnas. Móvil: una columna.', box: 'grid-template-columns:2fr 1fr;grid-template-rows:20% 10% 1fr',
      cells: [W('grid-column:1/3', 'a'), W('grid-column:1/3;width:60%'), W(), W()] },
    { name: '5. Dashboard', desc: 'Periodo, KPI y grilla de gráficos. Móvil: KPI 2 por fila, gráficos apilados.', box: 'grid-template-columns:repeat(4,1fr);grid-template-rows:12% 18% 1fr 1fr',
      cells: [W('grid-column:1/3;width:70%'), W('grid-column:3/5'), W('', 'a'), W('', 'a'), W('', 'a'), W('', 'a'), W('grid-column:1/3'), W('grid-column:3/5'), W('grid-column:1/5')] },
    { name: '6. Sitio con navegación superior', desc: 'Anuncio, cabecera con buscador, contenido centrado y pie. E-commerce y home del portal.', box: 'grid-template-rows:6% 12% 1fr 14%',
      cells: [W('', 'a'), W('', 'd'), SUB('grid-template-columns:repeat(4,1fr);padding:0 8%', [W(), W(), W(), W()]), W('', 'd')] },
    { name: '7. Flujo enfocado', desc: 'Sin menú; pasos arriba y acción fija al pie. Wizards, login y registro.', box: 'grid-template-rows:10% 1fr 12%;padding:8px 18%',
      cells: [W('width:70%;justify-self:center'), W(), W('width:40%;justify-self:end', 'd')] },
    { name: '8. Checkout', desc: 'Formulario por pasos y resumen fijo al lado. Móvil: resumen plegable arriba.', box: 'grid-template-columns:1.3fr 1fr',
      cells: [SUB('', [W('', 'a'), W('height:16px'), W('height:16px'), W('height:16px')]), SUB('align-content:start', [W('height:60%'), W('height:14px', 'd')])] },
  ];
}
