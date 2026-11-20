// Genera los index.ts y ng-package.json de cada punto de entrada de @zonacards/ui y la API principal (src/public-api.ts).
// Un punto de entrada = una carpeta de projects/zonacards-ui (button, select, charts…). Correr después de agregar o
// renombrar archivos: npm run public-api
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const PKG = 'projects/zonacards-ui';
const NOT_ENTRIES = ['src', 'styles', 'i18n', 'assets', 'skills', 'node_modules', 'tokens'];
// Se cargan con import() desde su propio punto de entrada: no van en el index (si no, ECharts entraría al bundle inicial).
const LAZY = ['echarts-setup.ts', 'chart-options-ops.ts'];

const entries = readdirSync(PKG, { withFileTypes: true }).filter(e => e.isDirectory() && !NOT_ENTRIES.includes(e.name)).map(e => e.name).sort();
const files = dir => {
  const out = [];
  const walk = d => { for (const x of readdirSync(d, { withFileTypes: true })) { const p = join(d, x.name); if (x.isDirectory()) walk(p); else if (p.endsWith('.ts') && !p.endsWith('.spec.ts') && !LAZY.includes(x.name) && p !== join(dir, 'index.ts')) out.push(p); } };
  walk(dir); return out.sort();
};

for (const e of entries) {
  const dir = join(PKG, e);
  const list = e === 'helm'
    ? readdirSync(dir).map(h => join(dir, h, 'src', 'index.ts')).filter(existsSync)
    : files(dir);
  const head = e === 'helm'
    ? '/** @zonacards/ui/helm · primitivas spartan/ui con estilos propios. Internas: las usan los componentes zc-*; las pantallas no las importan. Generado por scripts/build-public-api.mjs. */\n'
    : `/** @zonacards/ui/${e} · generado por scripts/build-public-api.mjs (no editar a mano). */\n`;
  writeFileSync(join(dir, 'index.ts'), head + list.map(f => `export * from './${relative(dir, f).split(sep).join('/').replace(/\.ts$/, '')}';`).join('\n') + '\n');
  writeFileSync(join(dir, 'ng-package.json'), JSON.stringify({ $schema: '../../../node_modules/ng-packagr/ng-package.schema.json', lib: { entryFile: 'index.ts' } }, null, 2) + '\n');
}

writeFileSync(join(PKG, 'src', 'public-api.ts'),
  '/*\n * @zonacards/ui · sistema de diseño Zonacards (Angular 21).\n'
  + " * Re-exporta todos los puntos de entrada; también se puede importar cada uno: '@zonacards/ui/select', '@zonacards/ui/charts'…\n"
  + ' * Cada componente es un módulo aparte: el proyecto solo empaqueta lo que usa y en el chunk donde lo usa.\n'
  + ' * Generado por scripts/build-public-api.mjs: no editar a mano.\n */\n'
  + entries.filter(e => e !== 'helm').map(e => `export * from '@zonacards/ui/${e}';`).join('\n') + '\n');
console.log(`Puntos de entrada: ${entries.length}`);
