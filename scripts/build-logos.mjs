// Genera los registros de logos del design system desde docs/design-system/index.html (sin llamadas a internet):
// - src/app/shared/ui/atoms/logo/logo-registry.generated.ts: marcas de Simple Icons (CC0), window.__BRANDS.
// - src/app/shared/ui/atoms/logo/sso-registry.generated.ts: Google, Apple y Microsoft de gilbarbara/logos (CC0), window.__SSO.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('docs/design-system/index.html', 'utf8');

/** Lee el objeto literal asignado a window.<name>: termina donde se cierra su primera llave. */
function extract(name) {
  const start = html.indexOf(`window.${name}=`);
  if (start < 0) { console.error(`No se encontró window.${name} en index.html`); process.exit(1); }
  const from = start + `window.${name}=`.length;
  let depth = 0, end = from, inStr = false;
  for (let i = from; i < html.length; i++) {
    const c = html[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { end = i + 1; break; }
  }
  return JSON.parse(html.slice(from, end));
}

mkdirSync('src/app/shared/ui/atoms/logo', { recursive: true });
const head = '// Archivo generado por scripts/build-logos.mjs desde docs/design-system/index.html. No editar a mano.\n';

const brands = extract('__BRANDS');
writeFileSync('src/app/shared/ui/atoms/logo/logo-registry.generated.ts', head +
  '// Logos de Simple Icons (CC0). Las marcas pertenecen a sus dueños: solo para identificar medios de pago, redes y comercios.\n' +
  'export interface LogoData { t: string; h: string; d: string; }\n' +
  'export const LOGOS: Record<string, LogoData> = ' + JSON.stringify(brands) + ';\n' +
  'export type LogoName = ' + Object.keys(brands).map(k => JSON.stringify(k)).join(' | ') + ';\n');

// Cada logo pasa de SVG en texto a una lista de trazados ({ fill, d }) para dibujarlo sin innerHTML.
const raw = extract('__SSO');
const sso = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, {
  w: v.w, h: v.h,
  paths: [...v.b.matchAll(/<path([^>]*)\/?>/g)].map(m => ({ fill: (m[1].match(/fill="([^"]*)"/) || [])[1] ?? null, d: m[1].match(/\sd="([^"]*)"/)[1] })),
}]));
writeFileSync('src/app/shared/ui/atoms/logo/sso-registry.generated.ts', head +
  '// Logos de acceso (gilbarbara/logos, CC0) tal como los publica cada empresa: no se recolorean ni se modifican.\n' +
  'export interface SsoLogoData { w: number; h: number; paths: { fill: string | null; d: string }[]; }\n' +
  'export const SSO_LOGOS: Record<' + Object.keys(sso).map(k => JSON.stringify(k)).join(' | ') + ', SsoLogoData> = ' + JSON.stringify(sso) + ';\n');

console.log('Logos generados:', Object.keys(brands).length, '· acceso:', Object.keys(sso).join(', '));
