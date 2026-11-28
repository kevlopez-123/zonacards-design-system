// Comprueba que los puntos de quiebre de la web sean los mismos en todas partes: los tokens --bp-* de tokens.css, los números de
// projects/zonacards-ui/core/breakpoints.ts (los que usa TypeScript) y los valores por defecto de Tailwind (sm, md, lg, xl: 640, 768, 1024 y
// 1280 px), que son los que resuelven los prefijos sm:, md:, lg: y xl: de las plantillas. Falla si alguien redefine --breakpoint-* en el
// tema o escribe un número de ancho suelto en un matchMedia. Uso: node scripts/check-breakpoints.mjs
import fs from 'node:fs';
import path from 'node:path';

const read = f => fs.readFileSync(f, 'utf8');
const errors = [];

const tokens = Object.fromEntries([...read('projects/zonacards-tokens/styles/tokens.css').matchAll(/--bp-(sm|md|lg|xl):\s*(\d+)px/g)].map(m => [m[1], Number(m[2])]));
const ts = Object.fromEntries([...read('projects/zonacards-ui/core/breakpoints.ts').matchAll(/\b(sm|md|lg|xl):\s*(\d+)/g)].map(m => [m[1], Number(m[2])]));
const tailwind = { sm: 640, md: 768, lg: 1024, xl: 1280 };

for (const k of Object.keys(tailwind)) {
  if (tokens[k] !== tailwind[k]) errors.push(`--bp-${k} vale ${tokens[k]} px en tokens.css y ${tailwind[k]} px en Tailwind`);
  if (ts[k] !== tailwind[k]) errors.push(`BREAKPOINT.${k} vale ${ts[k]} en core/breakpoints.ts y ${tailwind[k]} en Tailwind`);
}
if (/--breakpoint-/.test(read('projects/zonacards-ui/styles/zonacards.css'))) errors.push('zonacards.css redefine --breakpoint-*: los prefijos sm:, md:, lg: y xl: dejarían de coincidir con los tokens');

// Un ancho suelto en un matchMedia de TypeScript: debe salir de minWidth() o belowWidth().
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['node_modules', 'helm'].includes(e.name)) continue; const f = path.join(d, e.name); e.isDirectory() ? walk(f, out) : out.push(f); } return out; };
for (const f of [...walk('projects/zonacards-ui'), ...walk('src/app')]) {
  if (!f.endsWith('.ts') || f.endsWith('.spec.ts') || f.endsWith('breakpoints.ts')) continue;
  read(f).split('\n').forEach((l, i) => { if (/matchMedia\([^)]*\b(min|max)-width:\s*\d+/.test(l) || /'\((min|max)-width:\s*\d+px\)'/.test(l)) errors.push(`${f}:${i + 1} ancho suelto en un matchMedia; usa minWidth() o belowWidth() de @zonacards/ui/core`); });
}

if (errors.length) { console.error(errors.join('\n')); console.error('Corrige los puntos de quiebre (tokens.css, core/breakpoints.ts o el ancho suelto).'); process.exit(1); }
console.log('puntos de quiebre: tokens, TypeScript y Tailwind coinciden (sm 640, md 768, lg 1024, xl 1280)');
