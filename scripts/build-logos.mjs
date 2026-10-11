// Genera src/app/shared/ui/atoms/logo/logo-registry.generated.ts con los logos de marcas del design system
// (Simple Icons, licencia CC0), tomados de docs/design-system/index.html. Sin llamadas a internet en ejecución.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('docs/design-system/index.html', 'utf8');
const start = html.indexOf('window.__BRANDS=');
if (start < 0) { console.error('No se encontró window.__BRANDS en index.html'); process.exit(1); }
// El objeto termina donde se cierra su primera llave (después puede venir otro código en el mismo <script>).
const from = start + 'window.__BRANDS='.length;
let depth = 0, end = from, inStr = false;
for (let i = from; i < html.length; i++) {
  const c = html[i];
  if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
  if (c === '"') inStr = true;
  else if (c === '{') depth++;
  else if (c === '}' && --depth === 0) { end = i + 1; break; }
}
const json = html.slice(from, end);
const brands = JSON.parse(json);
mkdirSync('src/app/shared/ui/atoms/logo', { recursive: true });
const ts = '// Archivo generado por scripts/build-logos.mjs desde docs/design-system/index.html. No editar a mano.\n' +
  '// Logos de Simple Icons (CC0). Las marcas pertenecen a sus dueños: solo para identificar medios de pago, redes y comercios.\n' +
  'export interface LogoData { t: string; h: string; d: string; }\n' +
  'export const LOGOS: Record<string, LogoData> = ' + JSON.stringify(brands) + ';\n' +
  'export type LogoName = ' + Object.keys(brands).map(k => JSON.stringify(k)).join(' | ') + ';\n';
writeFileSync('src/app/shared/ui/atoms/logo/logo-registry.generated.ts', ts);
console.log('Logos generados:', Object.keys(brands).length);
