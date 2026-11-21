// Genera projects/zonacards-ui/skills/zonacards-ui/references/api.md: por punto de entrada, cada componente o directiva con su
// selector, inputs (tipo, valor por defecto, obligatorio, comentario), models, outputs y métodos públicos documentados.
// Lo leen los asistentes de código para usar la API exacta sin abrir los .d.ts. Uso: node scripts/build-api-docs.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('projects/zonacards-ui');
const OUT = path.join(ROOT, 'skills/zonacards-ui/references/api.md');
const SKIP = new Set(['helm', 'src', 'styles', 'i18n', 'assets', 'skills', 'node_modules']);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

/** Comentario JSDoc inmediatamente anterior a la línea i (una o varias líneas), en una sola línea. */
function docBefore(lines, i) {
  let j = i - 1;
  while (j >= 0 && lines[j].trim() === '') j--;
  if (j < 0 || !lines[j].trim().endsWith('*/')) return '';
  const end = j;
  while (j >= 0 && !lines[j].includes('/**')) j--;
  return lines.slice(j, end + 1).join(' ').replace(/\/\*\*|\*\/|^\s*\*|\s\*\s/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Argumentos de input(...)/model(...) con paréntesis balanceados. */
function callArgs(src, start) {
  let depth = 0, k = start;
  for (; k < src.length; k++) {
    const c = src[k];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { if (depth === 0) break; depth--; }
  }
  return src.slice(start, k).trim();
}

function parseClass(src, cls) {
  const lines = src.split('\n');
  const members = [];
  const re = /^\s+readonly (\w+) = (input|model|output)(\.required)?(<([^]*?)>)?\(/;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (!m) continue;
    const [, name, kind, req, , type] = m;
    const idx = src.indexOf(lines[i]) + lines[i].indexOf('(', lines[i].indexOf(kind)) + 1;
    const args = kind === 'output' ? '' : callArgs(src, idx);
    const def = req ? '' : args.split(/,\s*\{\s*(alias|transform)/)[0].trim();
    members.push({ kind, name, type: (type ?? '').replace(/\s+/g, ' ').trim(), required: !!req, def, doc: docBefore(lines, i) });
  }
  // Métodos públicos con comentario (la API imperativa: open(), reset(), validate()...).
  const methods = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s{2}(?!private|protected|readonly|constructor|ng[A-Z]|on[A-Z]|static)(async\s+)?(\w+)\(([^)]*)\)(:\s*[^{]+)?\s*\{/);
    if (!m) continue;
    const doc = docBefore(lines, i);
    if (doc) methods.push({ name: m[2], params: m[3].trim(), doc });
  }
  return { cls, members, methods };
}

const entries = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(e => e.isDirectory() && !SKIP.has(e.name) && fs.existsSync(path.join(ROOT, e.name, 'index.ts')))
  .map(e => e.name).sort();

// Ejemplos reales: el primer uso de cada selector en las demostraciones del catálogo (código que compila y se prueba en e2e).
const CATALOG = path.resolve('src/app/features/catalogo');
const catalogSrc = fs.existsSync(CATALOG)
  ? walk(CATALOG).filter(f => /\.(html|ts)$/.test(f) && !f.endsWith('.spec.ts')).map(f => fs.readFileSync(f, 'utf8')).join('\n')
  : '';
function exampleFor(selector) {
  const tag = selector.split(',')[0].trim();
  // Elemento (zc-x) o atributo en un elemento (button[zcButton] → <button zcButton …>).
  const m = tag.match(/^([a-z][\w-]*)(?:\[(\w+)\])?$/i);
  if (!m || !catalogSrc) return '';
  const re = m[2] ? new RegExp(`<${m[1]}\\b[^>]*\\b${m[2]}\\b`, 'i') : new RegExp(`<${m[1]}[\\s>/]`);
  const at = catalogSrc.search(re);
  if (at < 0) return '';
  // Hasta el cierre del elemento (si es corto) o de la etiqueta de apertura.
  const close = m[2] ? -1 : catalogSrc.indexOf(`</${m[1]}>`, at);
  const openEnd = catalogSrc.indexOf('>', at);
  let end = close > 0 && close - at < 500 ? close + m[1].length + 3 : openEnd + 1;
  const snippet = catalogSrc.slice(at, end).replace(/\n\s*/g, '\n  ').trim();
  return snippet.length > 600 ? '' : snippet;
}

let md = `# Referencia de API de @zonacards/ui

Generada desde el código (\`node scripts/build-api-docs.mjs\`). Para cada punto de entrada: componentes y directivas con su selector,
inputs (\`[x]\`), models (\`[(x)]\`, entrada y salida), outputs (\`(x)\`) y métodos públicos. "obligatorio" = input.required.
Importa siempre desde la subruta: \`import { X } from '@zonacards/ui/<entrada>'\`. Helpers sin UI (formatMoney, zcValidators…): sección \`core\`.

`;
let count = 0;
for (const entry of entries) {
  let files = walk(path.join(ROOT, entry)).filter(f => f.endsWith('.ts') && !/\.spec\.ts$|index\.ts$|generated/.test(f));
  // El dominio vive en @zonacards/tokens y se reexporta desde core: sus funciones se documentan aquí.
  if (entry === 'core') files = [...files, ...walk(path.resolve('projects/zonacards-tokens/src/domain')).filter(f => f.endsWith('.ts') && !/\.spec\.ts$|index\.ts$/.test(f))];
  const blocks = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const re = /@(Component|Directive)\(\{([^]*?)\n\}\)\s*export class (\w+)/g;
    let m;
    while ((m = re.exec(src))) {
      const sel = m[2].match(/selector:\s*'([^']+)'/)?.[1];
      if (!sel) continue;
      const start = m.index + m[0].length;
      const next = src.indexOf('\n}\n', start);
      const body = src.slice(start, next < 0 ? undefined : next);
      const classDoc = docBefore(src.slice(0, m.index).split('\n'), src.slice(0, m.index).split('\n').length);
      const { members, methods } = parseClass(body, m[3]);
      blocks.push({ kind: m[1], sel, cls: m[3], doc: classDoc.split(/ - | · /).slice(0, 2).join(' · ').slice(0, 400), members, methods });
      count++;
    }
  }
  // core y entradas sin componentes: funciones y tipos exportados.
  const fns = [];
  if (!blocks.length || entry === 'core') {
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8'); const lines = src.split('\n');
      lines.forEach((l, i) => {
        const fm = l.match(/^export (?:async )?function (\w+)\(([^)]*)\)(?::\s*([^{]+))?/) ?? l.match(/^export const (\w+) = (?:\(([^)]*)\)(?::\s*([^=]+))? =>)/);
        if (fm) fns.push({ name: fm[1], sig: `(${(fm[2] ?? '').trim()})${fm[3] ? ': ' + fm[3].trim() : ''}`, doc: docBefore(lines, i).slice(0, 220) });
      });
    }
  }
  if (!blocks.length && !fns.length) continue;
  md += `## \`@zonacards/ui/${entry}\`\n\n` + (entry === 'core' ? 'Incluye las reglas de dominio de `@zonacards/tokens/domain` (reexportadas): montos, fechas, teléfonos, claves, estados, color, exportación e importación.\n\n' : '');
  for (const b of blocks) {
    md += `### \`${b.sel}\` · ${b.cls}\n\n`;
    if (b.doc) md += `${b.doc}\n\n`;
    if (b.members.length) {
      md += `| Nombre | Tipo | Defecto | Descripción |\n| --- | --- | --- | --- |\n`;
      for (const x of b.members) {
        const label = x.kind === 'output' ? `(${x.name})` : x.kind === 'model' ? `[(${x.name})]` : `[${x.name}]`;
        const def = x.required ? '**obligatorio**' : (x.def ? '`' + x.def.replace(/\|/g, '\\|').slice(0, 60) + '`' : '');
        md += `| \`${label}\` | ${x.type ? '`' + x.type.replace(/\|/g, '\\|').slice(0, 90) + '`' : ''} | ${def} | ${x.doc.replace(/\|/g, '\\|').slice(0, 200)} |\n`;
      }
      md += '\n';
    }
    const ex = exampleFor(b.sel);
    if (ex) md += '```html\n' + ex + '\n```\n\n';
    if (b.methods.length) md += 'Métodos: ' + b.methods.map(x => `\`${x.name}(${x.params})\` ${x.doc.slice(0, 140)}`).join(' · ') + '\n\n';
  }
  if (fns.length) {
    md += `Funciones: \n\n` + fns.map(x => `- \`${x.name}${x.sig.replace(/\s+/g, ' ')}\`${x.doc ? ' · ' + x.doc : ''}`).join('\n') + '\n\n';
  }
}
fs.writeFileSync(OUT, md);
console.log(`api.md: ${entries.length} entradas, ${count} componentes y directivas, ${(md.length / 1024).toFixed(0)} KB`);
