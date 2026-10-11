// Enlaza dist/zonacards-ui en node_modules/@zonacards/ui: el build de producción de la app usa el paquete compilado
// tal como lo usaría cualquier otro proyecto (exports, puntos de entrada secundarios y assets).
import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve('dist/zonacards-ui');
const link = resolve('node_modules/@zonacards/ui');
if (!existsSync(target)) { console.error('Falta dist/zonacards-ui: corre primero "ng build zonacards-ui".'); process.exit(1); }
mkdirSync(resolve('node_modules/@zonacards'), { recursive: true });
try { if (lstatSync(link)) rmSync(link, { recursive: true, force: true }); } catch { /* no existía */ }
symlinkSync(target, link, 'junction');
console.log('node_modules/@zonacards/ui → dist/zonacards-ui');
