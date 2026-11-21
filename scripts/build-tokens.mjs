// Genera los tokens en JSON (formato W3C Design Tokens, DTCG) desde styles/tokens.css, la única fuente.
// Salida en projects/zonacards-tokens/tokens/: primitives, semantic.light, semantic.dark, brand.<marca> y $themes.json (Tokens Studio).
// Uso: node scripts/build-tokens.mjs. Las referencias var(--x) quedan como alias "{grupo.x}"; color-mix() se calcula (Figma no lo admite).
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('projects/zonacards-tokens/styles/tokens.css');
const OUT = path.resolve('projects/zonacards-tokens/tokens');
const css = fs.readFileSync(SRC, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Bloques por selector: { ':root': {...}, ':root.dark': {...}, ... } (los @media se ignoran: son ajustes de pantalla). */
function blocks() {
  const out = {}; const re = /([^{}@]+)\{([^{}]*)\}/g; let m;
  const noMedia = css.replace(/@media[^{]+\{([^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  while ((m = re.exec(noMedia))) {
    const sel = m[1].trim(); const decls = out[sel] ?? (out[sel] = {});
    for (const d of m[2].split(';')) { const i = d.indexOf(':'); if (i < 0) continue; const k = d.slice(0, i).trim(); if (k.startsWith('--')) decls[k.slice(2)] = d.slice(i + 1).trim(); }
  }
  return out;
}
const B = blocks();
const root = { ...B[':root'] };

// ── Tipos y rutas ──
const groupOf = (name, value) => {
  if (/^fs-/.test(name)) return ['font', 'size', name.slice(3)];
  if (/^lh-/.test(name)) return ['font', 'lineHeight', name.slice(3)];
  if (name === 'zc-font-sans') return ['font', 'family', 'sans'];
  if (/^z-/.test(name)) return ['z', name.slice(2)];
  if (/^dur/.test(name)) return ['duration', name.replace(/^dur-?/, '') || 'default'];
  if (/^(motion-ease-|ease$)/.test(name)) return ['easing', name.replace(/^motion-ease-/, '') || 'default'];
  if (/^r-/.test(name)) return ['radius', name.slice(2)];
  if (/^shape-/.test(name)) return ['shape', name.slice(6)];
  if (/^s\d+$/.test(name)) return ['space', name.slice(1)];
  if (/^(elev-|shadow-)/.test(name)) return ['shadow', name.replace(/^(elev|shadow)-/, '')];
  if (/^neutral-\d+$/.test(name)) return ['color', 'neutral', name.slice(8)];
  if (isColor(value)) return ['color', name];
  return ['size', name];
};
const typeOf = (g, value) => ({ font: g[1] === 'family' ? 'fontFamily' : 'dimension', z: 'number', duration: 'duration', easing: 'cubicBezier', radius: 'dimension', shape: 'dimension', space: 'dimension', shadow: 'shadow', color: 'color', size: 'dimension' })[g[0]];
function isColor(v) { return /^(#|rgb|hsl|color-mix|var\(--(neutral|brand|surface|text|primary|secondary|info|success|warning|danger|accent|bg|border))/.test(v); }

// ── Resolver valores (para color-mix y para saber el tipo de un alias) ──
function resolve(v, scope, depth = 0) {
  if (depth > 10) return v;
  return v.replace(/var\(--([\w-]+)\)/g, (_, n) => resolve(scope[n] ?? root[n] ?? `var(--${n})`, scope, depth + 1));
}
function toRgba(c) {
  c = c.trim();
  if (c.startsWith('#')) { const h = c.slice(1); const f = h.length === 3 ? h.split('').map(x => x + x).join('') : h; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)).concat(f.length === 8 ? parseInt(f.slice(6, 8), 16) / 255 : 1); }
  const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
  const p = m[1].replace(/[,/]/g, ' ').split(/\s+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1];
}
const hex = ([r, g, b, a]) => '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('') + (a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : '');
function mix(v, scope) {
  const r = resolve(v, scope);
  const m = r.match(/color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/);
  if (!m) return null;
  const a = toRgba(m[1]); const b = toRgba(m[3].trim()); const p = Number(m[2]) / 100;
  if (!a || !b) return null;
  return hex(a.map((x, i) => x * p + b[i] * (1 - p)));
}

// ── Token DTCG ──
const pathOf = n => groupOf(n, root[n] ?? '');
function token(name, value, scope, desc) {
  const g = groupOf(name, resolve(value, scope));
  let $value = value;
  const alias = value.match(/^var\(--([\w-]+)\)$/);
  if (alias) $value = '{' + pathOf(alias[1]).join('.') + '}';
  else if (value.startsWith('color-mix')) $value = mix(value, scope) ?? value;
  else if (g[0] === 'easing') $value = (value.match(/cubic-bezier\(([^)]+)\)/)?.[1] ?? '').split(',').map(Number);
  else if (g[0] === 'z') $value = Number(value);
  else if (g[0] === 'shadow') $value = value;
  return [g, { $type: typeOf(g, value), $value, ...(desc ? { $description: desc } : {}) }];
}
function build(entries, scope = root) {
  const out = {};
  for (const [name, value] of Object.entries(entries)) {
    const [g, t] = token(name, value, scope);
    let o = out; for (const k of g.slice(0, -1)) o = o[k] ??= {};
    o[g.at(-1)] = t;
  }
  return out;
}

// Semánticos: los del segundo :root (tema claro). Primitivos: el resto del primer :root.
const lightSel = Object.keys(B).filter(k => k === ':root');
const allRoot = B[':root'];
const SEMANTIC = new Set(['bg', 'surface', 'surface-2', 'surface-3', 'border', 'border-strong', 'text', 'text-muted', 'text-subtle', 'primary', 'on-primary', 'secondary', 'on-secondary', 'focus', 'overlay', 'thumb', 'row-selected-bg', 'field-bg', 'field-bd', 'shadow-1', 'shadow-2']);
const isSemantic = n => SEMANTIC.has(n) || /^(code|success|warning|danger|info|accent|neutral)-(bg|fg|bd|key|string|number|literal|muted)$|^code-/.test(n) || /^(chart|map|sidebar)-/.test(n);
const primitives = Object.fromEntries(Object.entries(allRoot).filter(([n]) => !isSemantic(n) && n !== 'color-scheme'));
const light = Object.fromEntries(Object.entries(allRoot).filter(([n]) => isSemantic(n)));
const darkScope = { ...allRoot, ...B[':root.dark'] };
const dark = Object.fromEntries(Object.entries(B[':root.dark'] ?? {}));

fs.mkdirSync(OUT, { recursive: true });
// Una marca que ya no está en tokens.css no debe quedar en la salida (los generadores nativos leen todos los brand.*.json).
for (const n of fs.readdirSync(OUT)) if (/^brand..+.json$/.test(n)) fs.rmSync(path.join(OUT, n));
const write = (f, o) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(o, null, 2) + '\n');
write('primitives.json', build(primitives));
write('semantic.light.json', build(light));
write('semantic.dark.json', build(dark, darkScope));
const brands = {};
for (const [sel, decls] of Object.entries(B)) {
  const m = sel.match(/data-brand="(\w+)"\](.*)/); if (!m) continue;
  // `:not(.dark)` contiene ".dark": se prueba primero, o los ajustes del tema claro (Motiva, Giftealo) caen en el oscuro.
  const mode = m[2].includes('not(.dark)') ? 'light' : m[2].includes('.dark') ? 'dark' : 'all';
  (brands[m[1]] ??= {})[mode] = decls;
}
const themes = [
  { id: 'zonacards-light', name: 'Zonacards · claro', selectedTokenSets: { primitives: 'source', 'semantic.light': 'enabled' } },
  { id: 'zonacards-dark', name: 'Zonacards · oscuro', selectedTokenSets: { primitives: 'source', 'semantic.dark': 'enabled' } },
];
for (const [brand, modes] of Object.entries(brands)) {
  for (const mode of ['light', 'dark']) {
    const decls = { ...(modes.all ?? {}), ...(modes[mode] ?? {}) };
    const scope = { ...(mode === 'dark' ? darkScope : allRoot), ...decls };
    write(`brand.${brand}.${mode}.json`, build(decls, scope));
    themes.push({ id: `${brand}-${mode}`, name: `${brand[0].toUpperCase() + brand.slice(1)} · ${mode === 'dark' ? 'oscuro' : 'claro'}`,
      selectedTokenSets: { primitives: 'source', [`semantic.${mode}`]: 'enabled', [`brand.${brand}.${mode}`]: 'enabled' } });
  }
}
write('$themes.json', themes);
write('$metadata.json', { tokenSetOrder: ['primitives', 'semantic.light', 'semantic.dark', ...Object.keys(brands).flatMap(b => [`brand.${b}.light`, `brand.${b}.dark`])] });
const count = o => Object.values(o).reduce((n, v) => n + (v && typeof v === 'object' && '$value' in v ? 1 : v && typeof v === 'object' ? count(v) : 0), 0);
console.log(`tokens: ${count(build(primitives))} primitivos, ${count(build(light))} semánticos (claro), ${count(build(dark, darkScope))} (oscuro), ${Object.keys(brands).length} marcas`);
