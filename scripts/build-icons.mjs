// Genera src/app/shared/ui/atoms/icon/icon-registry.generated.ts con solo los íconos usados.
// Sin llamadas a internet en ejecución: los SVG viajan dentro del bundle.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sets = { s: require('@iconify-json/solar/icons.json'), l: require('@iconify-json/lucide/icons.json') };
const list = JSON.parse(readFileSync('src/app/shared/ui/atoms/icon/icons.json', 'utf8')).icons;
const out = {}; const missing = [];
for (const key of list) {
  const [p, name] = key.split(':');
  const set = sets[p];
  const id = p === 's' ? (name.endsWith('-bold') ? name : name + '-linear') : name;
  const icon = set.icons[id] || (set.aliases && set.aliases[id] && set.icons[set.aliases[id].parent]);
  if (!icon) { missing.push(key); continue; }
  out[key] = { body: icon.body, w: icon.width ?? set.width ?? 24, h: icon.height ?? set.height ?? 24 };
}
if (missing.length) { console.error('Íconos no encontrados:', missing.join(', ')); process.exit(1); }
const ts = '// Archivo generado por scripts/build-icons.mjs. No editar a mano.\n' +
  'export interface IconData { body: string; w: number; h: number; }\n' +
  'export const ICONS: Record<string, IconData> = ' + JSON.stringify(out, null, 0) + ';\n' +
  'export type IconName = ' + list.map(k => JSON.stringify(k)).join(' | ') + ';\n';
writeFileSync('src/app/shared/ui/atoms/icon/icon-registry.generated.ts', ts);
console.log('Íconos generados:', Object.keys(out).length);
