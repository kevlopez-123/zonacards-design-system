import { contrastRatio, isHex } from './domain/color';

/**
 * Definición de una marca en datos: lo único que hay que escribir para sumar una marca al sistema (o para que otro proyecto tenga la
 * suya) sin tocar `tokens.css`. `brandToCss` la convierte en el bloque CSS con la misma forma que las marcas del sistema y
 * `validateBrand` revisa contraste y formato antes de usarla. Las apps nativas y los demás generadores leen ese mismo CSS.
 */
export interface BrandShape {
  /** Radio de campos y selects (`--shape-control`), por ejemplo "24px". */
  control?: string;
  /** Radio de tarjetas y paneles (`--shape-card`). */
  card?: string;
  /** Radio de modal, drawer y hoja (`--shape-sheet`). */
  sheet?: string;
  /** Radio de botones (`--shape-button`); "9999px" = píldora. */
  button?: string;
  /** Alto de los campos (`--shape-field-h`), por ejemplo "56px". */
  fieldHeight?: string;
}

/** Variables sobrescritas: nombre sin `--` (`primary`, `on-primary`, `bg`…) y su valor CSS. */
export type BrandPalette = Readonly<Record<string, string>>;

export interface BrandDefinition {
  /** Identificador en minúsculas y guiones; es el valor de `data-brand`. */
  id: string;
  /** Pila de fuentes (`--zc-font-sans`): '"Outfit Variable", "Outfit", ui-sans-serif, system-ui, sans-serif'. */
  font?: string;
  /** Color de acento de marca (`--brand-accent`), en #rrggbb. */
  accent?: string;
  shape?: BrandShape;
  /** Relleno y borde de los campos en tema claro (`--field-bg`, `--field-bd`). */
  field?: { background?: string; border?: string };
  /** Colores y demás variables del tema claro. */
  light?: BrandPalette;
  /** Colores y demás variables del tema oscuro. */
  dark?: BrandPalette;
}

export interface BrandIssue { level: 'error' | 'warning'; message: string }
export interface BrandValidation { ok: boolean; issues: BrandIssue[] }

/** Variables de color que una marca suele sobrescribir y que se validan como #rrggbb. */
export const BRAND_COLOR_TOKENS = [
  'primary', 'on-primary', 'secondary', 'on-secondary', 'bg', 'surface', 'surface-2', 'surface-3', 'border', 'border-strong',
  'text', 'text-muted', 'text-subtle', 'focus', 'brand-accent', 'field-bg', 'field-bd',
] as const;

const ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const TOKEN = /^[a-z][a-z0-9-]*$/;
const RESERVED = new Set(['zonacards']);
const px = /^(\d+(\.\d+)?(px|rem)|0)$/;

/** Pares de colores que deben cumplir contraste: [primer plano, fondo, mínimo, descripción]. */
const PAIRS: readonly (readonly [string, string, number, string])[] = [
  ['on-primary', 'primary', 4.5, 'texto sobre el color primario'],
  ['on-secondary', 'secondary', 4.5, 'texto sobre el color secundario'],
  ['text', 'bg', 4.5, 'texto sobre el fondo'],
  ['text', 'surface', 4.5, 'texto sobre las superficies'],
  ['text-muted', 'bg', 4.5, 'texto atenuado sobre el fondo'],
  ['primary', 'bg', 3, 'color primario sobre el fondo (botones, bordes, foco)'],
  ['focus', 'bg', 3, 'anillo de foco sobre el fondo'],
  ['border-strong', 'bg', 3, 'borde de los campos sobre el fondo'],
];

export function validateBrand(def: BrandDefinition): BrandValidation {
  const issues: BrandIssue[] = [];
  const err = (message: string) => issues.push({ level: 'error', message });
  const warn = (message: string) => issues.push({ level: 'warning', message });

  if (!ID.test(def.id)) err(`id "${def.id}": usa minúsculas, números y guiones (por ejemplo "mi-marca").`);
  if (RESERVED.has(def.id)) err(`id "${def.id}": está reservado (es la marca por defecto, sin data-brand).`);
  if (def.accent && !isHex(def.accent)) err(`accent "${def.accent}" debe ser #rrggbb.`);
  for (const [k, v] of Object.entries(def.shape ?? {})) {
    if (!['control', 'card', 'sheet', 'button', 'fieldHeight'].includes(k)) warn(`shape.${k}: nombre desconocido (válidos: control, card, sheet, button, fieldHeight).`);
    else if (typeof v !== 'string' || !px.test(v)) err(`shape.${k} "${v}" debe ser una medida en px o rem (por ejemplo "24px").`);
  }
  if (def.shape?.fieldHeight && px.test(def.shape.fieldHeight) && parseFloat(def.shape.fieldHeight) < 44 && def.shape.fieldHeight.endsWith('px')) warn(`shape.fieldHeight ${def.shape.fieldHeight}: los campos táctiles deberían medir al menos 44px.`);
  for (const k of Object.keys(def.field ?? {})) if (!['background', 'border'].includes(k)) warn(`field.${k}: nombre desconocido (válidos: background, border).`);

  for (const mode of ['light', 'dark'] as const) {
    const palette = def[mode] ?? {};
    for (const [name, value] of Object.entries(palette)) {
      if (!TOKEN.test(name)) { err(`${mode}.${name}: el nombre de una variable va en minúsculas y guiones, sin "--".`); continue; }
      if ((BRAND_COLOR_TOKENS as readonly string[]).includes(name) && !isHex(value)) err(`${mode}.${name} "${value}" debe ser #rrggbb.`);
    }
    for (const [fg, bg, min, what] of PAIRS) {
      const a = palette[fg], b = palette[bg];
      if (a && b && isHex(a) && isHex(b)) {
        const r = contrastRatio(a, b);
        if (r < min) err(`${mode}: ${what} tiene contraste ${r.toFixed(2)}:1 (${fg} ${a} sobre ${bg} ${b}); el mínimo es ${min}:1.`);
      }
    }
    if (palette['primary'] && !palette['on-primary']) warn(`${mode}: defines "primary" sin "on-primary"; el texto sobre el primario usará el del sistema y podría no tener contraste.`);
  }
  if (def.field?.background && def.field?.border && isHex(def.field.background) && isHex(def.field.border)) {
    const bg = def.light?.['bg'] ?? '#fafafa';
    if (isHex(bg) && contrastRatio(def.field.border, bg) < 3) warn(`field.border sobre el fondo tiene contraste ${contrastRatio(def.field.border, bg).toFixed(2)}:1; los bordes de campo deberían llegar a 3:1 (WCAG 1.4.11). Si usas el fondo del sistema, compruébalo.`);
  }
  return { ok: !issues.some(i => i.level === 'error'), issues };
}

const decl = (name: string, value: string) => `--${name}: ${value};`;

/** Bloque CSS de la marca con la forma de las marcas del sistema (`:root[data-brand]`, `:not(.dark)` y `.dark`). */
export function brandToCss(def: BrandDefinition): string {
  const sel = `:root[data-brand="${def.id}"]`;
  const all: string[] = [];
  if (def.font) all.push(decl('zc-font-sans', def.font));
  if (def.accent) all.push(decl('brand-accent', def.accent));
  const s = def.shape ?? {};
  if (s.control) all.push(decl('shape-control', s.control));
  if (s.card) all.push(decl('shape-card', s.card));
  if (s.sheet) all.push(decl('shape-sheet', s.sheet));
  if (s.button) all.push(decl('shape-button', s.button));
  if (s.fieldHeight) all.push(decl('shape-field-h', s.fieldHeight));
  const light = Object.entries(def.light ?? {}).map(([k, v]) => decl(k, v));
  if (def.field?.background) light.push(decl('field-bg', def.field.background));
  if (def.field?.border) light.push(decl('field-bd', def.field.border));
  const dark = Object.entries(def.dark ?? {}).map(([k, v]) => decl(k, v));
  const out: string[] = [];
  if (all.length) out.push(`${sel} { ${all.join(' ')} }`);
  if (light.length) out.push(`${sel}:not(.dark) { ${light.join(' ')} }`);
  if (dark.length) out.push(`${sel}.dark { ${dark.join(' ')} }`);
  return out.join('\n') + '\n';
}

/** Lee una definición desde JSON (texto u objeto) y la valida: lanza con todos los errores si no sirve. */
export function parseBrand(input: string | unknown): BrandDefinition {
  const def = (typeof input === 'string' ? JSON.parse(input) : input) as BrandDefinition;
  if (!def || typeof def !== 'object' || typeof def.id !== 'string') throw new Error('La marca necesita un "id".');
  const v = validateBrand(def);
  if (!v.ok) throw new Error(v.issues.filter(i => i.level === 'error').map(i => i.message).join('\n'));
  return def;
}
