// Genera la referencia de la API de Compose (projects/zonacards-native/skills/zonacards-native/references/compose-api.md) leyendo los
// archivos Kotlin de zonacards-compose: cada @Composable público con su KDoc (primer párrafo) y sus parámetros, agrupados por archivo.
// Uso: node scripts/build-native-docs.mjs
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'projects/zonacards-native/android/zonacards-compose/src/main/kotlin/com/zonacards/ui/compose';
const OUT = 'projects/zonacards-native/skills/zonacards-native/references/compose-api.md';

/** Parámetros de nivel superior de la lista entre paréntesis que empieza en `open`. */
function paramsFrom(text, open) {
  let depth = 0, i = open, start = open + 1;
  const parts = [];
  for (; i < text.length; i++) {
    const ch = text[i];
    if ('([{<'.includes(ch) && !(ch === '<' && text[i - 1] === '-')) depth++;
    else if (')]}>'.includes(ch) && !(ch === '>' && text[i - 1] === '-')) { depth--; if (depth === 0) { parts.push(text.slice(start, i)); break; } }
    else if (ch === ',' && depth === 1) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  return parts.map(p => p.replace(/\s+/g, ' ').replace(/@[A-Za-z]+\s*/g, '').trim()).filter(Boolean);
}

const clean = kdoc => kdoc
  .replace(/^\/\*\*|\*\/$/g, '').split('\n').map(l => l.replace(/^\s*\* ?/, '').trim()).join('\n')
  .split(/\n\s*\n/)[0].replace(/\s+/g, ' ').replace(/\[([^\]]+)\]/g, '`$1`').trim();

const files = fs.readdirSync(SRC).filter(f => f.endsWith('.kt')).sort();
const re = /(\/\*\*(?:(?!\*\/)[\s\S])*\*\/\s*)?((?:@[A-Za-z]+(?:\([^)]*\))?\s*)*)@Composable\s*((?:@[A-Za-z]+(?:\([^)]*\))?\s*)*)(public\s+|internal\s+|private\s+)?fun\s+(?:<[^>]*>\s*)?(?:[A-Za-z.<>]+\.)?([A-Za-z0-9_]+)\s*\(/g;
let total = 0;
let md = `# Referencia de la API de Compose (zonacards-compose)\n\nGenerada desde el código (\`node scripts/build-native-docs.mjs\`). Cada @Composable público con su descripción y sus parámetros;\nlos que tienen valor por defecto llevan \`= …\`. Se importan con \`import com.zonacards.ui.compose.*\`. Los tokens (\`ZcTheme\`, \`ZcIcons\`, \`ZcType\`, \`R.string.zc_*\`) están en \`com.zonacards.ui.tokens\`.\n`;
for (const f of files) {
  const text = fs.readFileSync(path.join(SRC, f), 'utf8');
  const items = [];
  for (const m of text.matchAll(re)) {
    const vis = (m[4] ?? '').trim();
    const name = m[5];
    if (vis === 'private' || vis === 'internal' || !/^Zc[A-Z]/.test(name)) continue;
    const params = paramsFrom(text, m.index + m[0].length - 1);
    items.push({ name, doc: m[1] ? clean(m[1]) : '', params });
  }
  if (!items.length) continue;
  md += `\n## ${f}\n`;
  for (const it of items) {
    total++;
    md += `\n### ${it.name}\n\n${it.doc ? it.doc + '\n\n' : ''}\`${it.name}(${it.params.map(p => p.replace(/ = .*$/, ' = …')).join(', ')})\`\n`;
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
console.log(`compose-api.md: ${total} componentes en ${files.length} archivos, ${(md.length / 1024).toFixed(0)} KB`);
