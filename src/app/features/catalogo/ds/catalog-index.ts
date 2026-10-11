/**
 * Índice del catálogo: mismos niveles, grupos, secciones e ids que docs/design-system/index.html,
 * para comparar cada sección 1:1 (http://localhost:4300/#a-button frente a /catalogo/atomos#a-button).
 * status: 'hecho' = portado con fidelidad · 'parcial' = portado, falta fidelidad o variantes · 'pendiente' = falta.
 * Mantener sincronizado con docs/design-system-port.md.
 */
export type PortStatus = 'hecho' | 'parcial' | 'pendiente';
export interface DsSection { id: string; title: string; status: PortStatus; }
export interface DsGroup { title: string; sections: DsSection[]; }
export interface DsLevel { id: string; route: string; title: string; subtitle: string; groups: DsGroup[]; }

const s = (id: string, title: string, status: PortStatus): DsSection => ({ id, title, status });

export const CATALOG: DsLevel[] = [
  { id: 'lv-fund', route: 'fundamentos', title: 'Fundamentos', subtitle: 'Tokens', groups: [
    { title: 'Marca y color', sections: [s('color', 'Color', 'hecho'), s('f-palette', 'Paleta extendida', 'hecho')] },
    { title: 'Tipografía y formatos', sections: [s('tipo', 'Tipografía', 'hecho'), s('f-dates', 'Fechas y horas', 'hecho')] },
    { title: 'Espacio e interacción', sections: [s('espacio', 'Espacio y targets', 'hecho'), s('scroll', 'Scroll', 'hecho')] },
    { title: 'Iconografía y logos', sections: [s('iconos', 'Iconografía y banderas', 'hecho'), s('f-logos', 'Logos de marcas', 'hecho')] },
  ] },
  { id: 'lv-atom', route: 'atomos', title: 'Átomos', subtitle: 'Sin dependencias de otros componentes', groups: [
    { title: 'Acciones', sections: [s('a-button', 'Button', 'hecho')] },
    { title: 'Entrada de datos', sections: [s('a-input', 'Input y Textarea', 'hecho'), s('a-choice', 'Checkbox, Radio, Switch', 'hecho')] },
    { title: 'Datos y estado', sections: [s('a-badge', 'Badge, Chip, Count', 'hecho'), s('a-money', 'Montos', 'hecho'), s('a-avatar', 'Avatar, Kbd, Separator', 'hecho'), s('a-progress', 'Progreso y carga', 'hecho')] },
  ] },
  { id: 'lv-mol', route: 'moleculas', title: 'Moléculas', subtitle: 'Combinan átomos', groups: [
    { title: 'Formularios', sections: [
      s('m-select', 'Select y Combobox', 'hecho'), s('m-auto', 'Autocomplete', 'hecho'), s('m-special', 'Campos especiales', 'hecho'), s('m-dates', 'Fecha, rango y hora', 'hecho'),
      s('m-slider', 'Slider, OTP, Color', 'hecho'), s('m-color', 'Color picker', 'hecho'), s('m-rte', 'Texto enriquecido', 'hecho'), s('m-recur', 'Recurrencia', 'hecho'),
      s('m-sign', 'Firma en pantalla', 'hecho'), s('m-commerce', 'Campos de compra', 'hecho'),
    ] },
    { title: 'Acceso', sections: [s('m-social', 'Acceso con Google, Apple y Microsoft', 'hecho')] },
    { title: 'Navegación', sections: [s('m-nav', 'Tabs y migas', 'hecho'), s('m-pager', 'Pagination', 'hecho')] },
    { title: 'Feedback y contenido', sections: [s('m-feedback', 'Alert, Toast, Menú, Popover', 'hecho'), s('m-accordion', 'Accordion', 'hecho'), s('m-upload', 'Upload y credenciales', 'hecho')] },
  ] },
  { id: 'lv-org', route: 'organismos', title: 'Organismos', subtitle: 'Bloques con lógica de interfaz', groups: [
    { title: 'Estructura y acceso', sections: [s('o-sidebar', 'Sidebar colapsable', 'parcial'), s('o-auth', 'Autenticación', 'hecho'), s('o-l10n', 'Idioma, país y moneda', 'hecho'), s('o-chat', 'Centro de ayuda y chat', 'hecho'), s('o-tour', 'Tour guiado', 'hecho')] },
    { title: 'Datos y análisis', sections: [s('o-cards', 'Cards', 'parcial'), s('o-charts', 'Gráficos', 'parcial'), s('o-charts2', 'Gráficos de operación', 'pendiente'), s('o-table', 'Tabla de datos', 'parcial'), s('o-grid', 'Tabla editable', 'pendiente'), s('o-dash', 'Dashboard configurable', 'pendiente')] },
    { title: 'Búsqueda y filtros', sections: [s('o-filter', 'Filtros y overlays', 'parcial'), s('o-facets', 'Filtros por facetas', 'pendiente')] },
    { title: 'Flujos', sections: [s('o-wizard', 'Stepper y formulario', 'parcial'), s('o-rules', 'Constructor de reglas', 'pendiente'), s('o-email', 'Editor de correo por bloques', 'pendiente'), s('o-checkout', 'Checkout', 'pendiente'), s('o-sortable', 'Reordenar (drag & drop)', 'pendiente'), s('o-images', 'Carga de imágenes', 'pendiente')] },
    { title: 'Dominio y comercio', sections: [s('o-domain', 'Dominio y notificaciones', 'pendiente'), s('o-commerce', 'Tarjetas de comercio', 'pendiente'), s('o-kanban', 'Kanban', 'pendiente'), s('o-wallet', 'Pase Wallet', 'pendiente')] },
    { title: 'Móvil y canje', sections: [s('o-scanner', 'Escáner QR para canjes', 'pendiente'), s('o-mobile', 'Patrones móviles', 'pendiente'), s('o-perm', 'Permisos y notificaciones', 'pendiente')] },
    { title: 'Estados y errores', sections: [s('o-errors', 'Gestión de errores', 'pendiente'), s('o-states', 'Estados vacíos y error', 'parcial')] },
    { title: 'Medios', sections: [s('o-media', 'Map, Gallery, Carousel', 'pendiente')] },
  ] },
  { id: 'lv-tpl', route: 'plantillas', title: 'Plantillas y páginas', subtitle: 'Solo componen organismos', groups: [
    { title: 'Plantillas', sections: [s('t-templates', 'Plantillas', 'pendiente'), s('t-layouts', 'Layouts', 'pendiente')] },
    { title: 'Páginas', sections: [s('p-lotes', 'Página: Lotes', 'parcial')] },
  ] },
];

/** Secciones del catálogo anterior (c-*) y la sección del DS donde se muestran; la primera de cada grupo lleva el id. */
export const LEGACY_IDS: Record<string, string> = {
  'c-select': 'm-select', 'c-auto': 'm-auto', 'c-special': 'm-special', 'c-dates': 'm-dates', 'c-nav': 'm-nav', 'c-pager': 'm-pager',
  'c-feedback': 'm-feedback', 'c-acc': 'm-accordion', 'c-upload': 'm-upload', 'c-sidebar': 'o-sidebar', 'c-overlays': 'o-filter',
  'c-stepper': 'o-wizard', 'c-kpi': 'o-cards', 'c-list': 'o-table', 'c-charts': 'o-charts', 'c-state': 'o-states',
};

/** Mezcla para las secciones heredadas: [parts] elige cuáles dibujar y cada una toma el id de su sección del DS. */
export abstract class LegacyParts {
  abstract parts: () => string[] | null;
  show(id: string) { const p = this.parts(); return !p || p.includes(id); }
  dsId(id: string) { return LEGACY_IDS[id] ?? null; }
}

export const sectionById =(id: string) => {
  for (const l of CATALOG) for (const g of l.groups) { const sec = g.sections.find(x => x.id === id); if (sec) return { level: l, group: g, section: sec }; }
  return null;
};
