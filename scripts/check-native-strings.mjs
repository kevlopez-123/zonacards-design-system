// Comprueba que cada clave de texto usada en el Swift escrito a mano (ZCString.text("espacio.clave") y las claves literales de las tablas)
// exista en projects/zonacards-tokens/i18n/es.json y en.json. Una clave que falta se vería como la clave en pantalla.
// Uso: node scripts/check-native-strings.mjs   (sale con 1 si falta alguna)
import fs from 'node:fs';
import path from 'node:path';

const I18N = 'projects/zonacards-tokens/i18n';
const SRC = ['projects/zonacards-native/ios/Sources/ZonacardsUI', 'projects/zonacards-native/ios/Catalog/App'];

const flatten = (o, p = '', out = new Set()) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out); else out.add(key);
  }
  return out;
};
const keys = { es: flatten(JSON.parse(fs.readFileSync(`${I18N}/es.json`, 'utf8'))), en: flatten(JSON.parse(fs.readFileSync(`${I18N}/en.json`, 'utf8'))) };

const files = SRC.flatMap(d => fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.swift')).map(f => path.join(d, f)) : []);
// Claves literales: ZCString.text("a.b.c" y cadenas con forma "espacio.clave" dentro de las llamadas a ZCString.
const textCall = /ZCString\.text\(\s*"([^"\\]+)"/g;
const tupleKey = /\("((?:ui|mol|org|top|auth|comun|validacion|estado)\.[A-Za-z0-9_.]+)"/g;
const missing = [];
let total = 0;
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const re of [textCall, tupleKey]) {
    for (const m of text.matchAll(re)) {
      if (m[1].includes('\\(')) continue;
      total++;
      for (const lang of ['es', 'en']) if (!keys[lang].has(m[1])) missing.push(`${f}: ${m[1]} (falta en ${lang})`);
    }
  }
}
console.log(`${total} claves revisadas en ${files.length} archivos`);
if (missing.length) { console.error('\nClaves que no existen:\n' + [...new Set(missing)].map(m => '  - ' + m).join('\n')); process.exit(1); }
console.log('Todas existen.');
