#!/usr/bin/env node
// CLI de @zonacards/tokens. Hoy: marcas.
//   zc-tokens brand <marca.json> [--out marca.css]   valida una marca y genera su bloque CSS (sale con 1 si hay errores)
//   zc-tokens brand --check <marca.json>             solo valida
import { readFileSync, writeFileSync } from 'node:fs';
import { brandToCss, validateBrand } from '../dist/brand.js';

const [cmd, ...args] = process.argv.slice(2);
const usage = () => { console.error('Uso: zc-tokens brand <marca.json> [--out marca.css] | zc-tokens brand --check <marca.json>'); process.exit(2); };
if (cmd !== 'brand') usage();
const check = args.includes('--check');
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : null;
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
if (!file) usage();

let def;
try { def = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`No se pudo leer ${file}: ${e.message}`); process.exit(2); }
const result = validateBrand(def);
for (const i of result.issues) console.error(`${i.level === 'error' ? 'ERROR' : 'aviso'}: ${i.message}`);
if (!result.ok) { console.error(`La marca "${def.id}" tiene errores.`); process.exit(1); }
if (check) { console.error(`La marca "${def.id}" es válida${result.issues.length ? ` (${result.issues.length} avisos)` : ''}.`); process.exit(0); }
const css = brandToCss(def);
if (out) { writeFileSync(out, css); console.error(`CSS de "${def.id}" escrito en ${out}.`); } else process.stdout.write(css);
