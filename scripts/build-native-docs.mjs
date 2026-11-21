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

// ---------- SwiftUI (ZonacardsUI) ----------
// Genera references/swift-api.md: cada tipo público (struct, enum, class) de Sources/ZonacardsUI con su comentario `///` (primer párrafo),
// su inicializador público y sus casos si es un enum. Mismo formato que compose-api.md.
const SWIFT_SRC = 'projects/zonacards-native/ios/Sources/ZonacardsUI';
const SWIFT_OUT = 'projects/zonacards-native/skills/zonacards-native/references/swift-api.md';

const swiftDoc = lines => lines.map(l => l.replace(/^\s*\/\/\/ ?/, '').trim()).join(' ').replace(/\s+/g, ' ').replace(/`/g, '`').trim();
/** Lista entre paréntesis balanceados que empieza en `open`. */
const swiftParams = (text, open) => {
  let depth = 0, start = open + 1;
  const parts = [];
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if ('([{<'.includes(ch) && !(ch === '<' && false)) depth++;
    else if (')]}>'.includes(ch) && !(ch === '>' && text[i - 1] === '-')) { depth--; if (depth === 0) { parts.push(text.slice(start, i)); break; } }
    else if (ch === ',' && depth === 1) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  return parts.map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
};

if (fs.existsSync(SWIFT_SRC)) {
  const sfiles = fs.readdirSync(SWIFT_SRC).filter(f => f.endsWith('.swift')).sort();
  let sTotal = 0;
  let smd = `# Referencia de la API de SwiftUI (ZonacardsUI)\n\nGenerada desde el código (\`node scripts/build-native-docs.mjs\`). Cada tipo público con su descripción, su inicializador y, en los enums, sus casos.\nSe importan con \`import ZonacardsUI\`; los tokens (\`ZCTheme\`, \`ZCType\`, \`ZCSpace\`, \`ZCIcon\`…) están en \`import ZonacardsTokens\`.\nEstado: ver \`references/ios.md\` (qué está compilado y probado y qué no).\n`;
  const tre = /((?:[ \t]*\/\/\/.*\n)*)[ \t]*(?:@[A-Za-z]+(?:\([^)]*\))?\s+)*public\s+(struct|enum|class|final class)\s+([A-Z][A-Za-z0-9_]*)/g;
  for (const f of sfiles) {
    const text = fs.readFileSync(path.join(SWIFT_SRC, f), 'utf8');
    const items = [];
    for (const m of text.matchAll(tre)) {
      const doc = swiftDoc(m[1].split('\n').filter(l => l.trim()));
      const body = text.slice(m.index + m[0].length);
      const open = body.indexOf('{');
      let d = 0, endIdx = body.length;
      for (let i = open; i >= 0 && i < body.length; i++) { if (body[i] === '{') d++; else if (body[i] === '}' && --d === 0) { endIdx = i; break; } }
      const scope = body.slice(Math.max(open, 0), endIdx);
      // Solo el nivel directo del tipo: se descartan los bloques anidados (cuerpos de funciones y tipos internos).
      let flat = '', depth = 0;
      for (const ch of scope) {
        if (ch === '{') { depth++; if (depth === 1) flat += ch; continue; }
        if (ch === '}') { depth--; continue; }
        if (depth <= 1) flat += ch;
      }
      const init = /public init\s*\(/.exec(flat);
      const params = init ? swiftParams(flat, init.index + init[0].length - 1) : [];
      const cases = m[2] === 'enum' ? [...flat.matchAll(/(?:^|[{;])[ \t]*case\s+([a-z][A-Za-z0-9_, ]*)/gm)].flatMap(c => c[1].split(',').map(s => s.trim())) : [];
      items.push({ name: m[3], kind: m[2], doc, params, hasInit: !!init, cases });
    }
    if (!items.length) continue;
    smd += `\n## ${f}\n`;
    for (const it of items) {
      sTotal++;
      smd += `\n### ${it.name}\n\n${it.doc ? it.doc + '\n\n' : ''}`;
      if (it.hasInit) smd += `\`${it.name}(${it.params.map(p => p.replace(/ = .*$/, ' = …')).join(', ')})\`\n`;
      if (it.cases.length) smd += `Casos: ${it.cases.map(c => '`' + c + '`').join(', ')}\n`;
    }
  }
  fs.writeFileSync(SWIFT_OUT, smd);
  console.log(`swift-api.md: ${sTotal} tipos en ${sfiles.length} archivos, ${(smd.length / 1024).toFixed(1)} KB`);
}
