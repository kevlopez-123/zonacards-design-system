// Genera los archivos `llms.txt` (formato de llmstxt.org) de cada paquete, para que un asistente de código lea el sistema de diseño
// sin recorrer el repositorio: un índice corto con enlaces, una guía completa y la referencia exacta de la API.
//   @zonacards/ui      → llms.txt, llms-full.txt (guías), llms-api.txt (inputs, outputs y métodos de cada componente)
//   @zonacards/tokens  → llms.txt, llms-full.txt (principios comunes)
//   nativo (repo)      → llms.txt, llms-full.txt (guías), llms-api-android.txt, llms-api-ios.txt
// Todo sale de las skills y sus referencias (que ya se generan): no se escribe a mano. Uso: node scripts/build-llms.mjs [--check]
// Con --check no escribe: falla si algún archivo no está al día (para CI).
import fs from 'node:fs';
import path from 'node:path';

const CHECK = process.argv.includes('--check');
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const body = p => read(p).replace(/^---\n[\s\S]*?\n---\n+/, '').trim();
const version = JSON.parse(read('projects/zonacards-ui/package.json')).version;

const UI = 'projects/zonacards-ui', TOK = 'projects/zonacards-tokens', NAT = 'projects/zonacards-native';
const uiSkill = `${UI}/skills/zonacards-ui`, tokSkill = `${TOK}/skills/zonacards-principles`, natSkill = `${NAT}/skills/zonacards-native`;

/** Une varios documentos con un encabezado de archivo (el agente sabe de dónde viene cada bloque). */
const bundle = (title, intro, parts) => [
  `# ${title}`, '', `> ${intro}`, '',
  ...parts.flatMap(([name, file]) => [`<!-- ${name} -->`, '', body(file), '', '---', '']),
].join('\n').replace(/\n---\n\n$/, '\n');

const files = {};

// ── @zonacards/ui ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
files[`${UI}/llms.txt`] = `# Zonacards UI

> Sistema de diseño para Angular 21 y 22 (standalone, signals, zoneless, OnPush) con Tailwind v4, Transloco y primitivas de spartan/CDK. Cada componente es un punto de entrada propio (\`@zonacards/ui/<entrada>\`, nunca el barril principal). Versión ${version}. Hay una skill equivalente para Android (Compose) e iOS (SwiftUI) en \`zonacards-native\`.

Para armar pantallas y flujos: compón con los componentes \`zc-*\` existentes y los tokens del sistema; no inventes UI. Lee primero la guía y después la API del componente que vayas a usar.

## Empezar
- [Guía de uso (skill zonacards-ui)](skills/zonacards-ui/SKILL.md): flujo de trabajo, tabla de decisión "necesito X → usa Y" y reglas permanentes.
- [Instalación y configuración](skills/zonacards-ui/references/setup.md): paquetes, estilos, Transloco, marcas y tema.
- [Lista de verificación](skills/zonacards-ui/references/checklist.md): qué revisar antes de dar una pantalla por terminada.

## Componentes
- [Catálogo de componentes](skills/zonacards-ui/references/components.md): para qué sirve cada punto de entrada, sus selectores y cuándo no usarlo.
- [Referencia de la API](skills/zonacards-ui/references/api.md): inputs (tipo, valor por defecto, obligatorio), models, outputs y métodos de cada componente y directiva.

## Principios comunes (todas las plataformas)
- [Principios de Zonacards](../zonacards-tokens/skills/zonacards-principles/SKILL.md): fuente única, tokens, estados, textos, formato, accesibilidad y marcas. Si instalaste \`@zonacards/tokens\`, está en \`node_modules/@zonacards/tokens/skills/zonacards-principles/SKILL.md\`.

## Opcional
- [Todo en un solo archivo (guías)](llms-full.txt): la guía, los principios, el catálogo y la lista de verificación, sin la API.
- [Solo la API](llms-api.txt): la referencia de inputs, outputs y métodos; es larga, léela por entrada.
`;

files[`${UI}/llms-full.txt`] = bundle('Zonacards UI · guías completas',
  `Guía de uso, principios comunes, catálogo y lista de verificación de @zonacards/ui ${version}. La API exacta de cada componente está en llms-api.txt.`, [
    ['skills/zonacards-ui/SKILL.md', `${uiSkill}/SKILL.md`],
    ['@zonacards/tokens · skills/zonacards-principles/SKILL.md', `${tokSkill}/SKILL.md`],
    ['skills/zonacards-ui/references/setup.md', `${uiSkill}/references/setup.md`],
    ['skills/zonacards-ui/references/components.md', `${uiSkill}/references/components.md`],
    ['skills/zonacards-ui/references/checklist.md', `${uiSkill}/references/checklist.md`],
  ]);

files[`${UI}/llms-api.txt`] = bundle('Zonacards UI · referencia de la API',
  `Inputs, models, outputs y métodos públicos de cada componente y directiva de @zonacards/ui ${version}, por punto de entrada. Generado desde el código.`, [
    ['skills/zonacards-ui/references/api.md', `${uiSkill}/references/api.md`],
  ]);

// ── @zonacards/tokens ──────────────────────────────────────────────────────────────────────────────────────────────────────────
files[`${TOK}/llms.txt`] = `# Zonacards Tokens

> Fuente única del sistema de diseño Zonacards, sin framework: tokens de color, tipografía, espacio y forma por marca (claro y oscuro), textos en español e inglés, datos geográficos y dominio compartido (montos, fechas, teléfonos, importación y exportación). De aquí salen la web (Angular), Android y iOS.

## Empezar
- [Principios de Zonacards](skills/zonacards-principles/SKILL.md): lo que vale en todas las plataformas (tokens, estados, textos, formato, accesibilidad, marcas).

## Opcional
- [Principios en un solo archivo](llms-full.txt)
- Componentes de Angular: [@zonacards/ui](../zonacards-ui/llms.txt). Android e iOS: [zonacards-native](../zonacards-native/llms.txt).
`;
files[`${TOK}/llms-full.txt`] = bundle('Zonacards Tokens · principios',
  'Principios comunes a web, Android e iOS.', [['skills/zonacards-principles/SKILL.md', `${tokSkill}/SKILL.md`]]);

// ── Nativo ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
files[`${NAT}/llms.txt`] = `# Zonacards nativo (Android Compose · iOS SwiftUI)

> Implementaciones nativas del sistema de diseño Zonacards: \`zonacards-tokens\` y \`zonacards-compose\` (Android, Jetpack Compose) y \`ZonacardsTokens\` y \`ZonacardsUI\` (iOS, SwiftUI). Mismos tokens, textos y dominio que la web; los componentes tienen el mismo nombre con prefijo \`Zc\` (Android) o \`ZC\` (iOS).

Para armar pantallas y flujos: compón con los componentes existentes; no escribas colores, tamaños ni textos a mano.

## Empezar
- [Guía de uso (skill zonacards-native)](skills/zonacards-native/SKILL.md): tabla de decisión "necesito X → usa Y", reglas y patrones.
- [Detalles de iOS](skills/zonacards-native/references/ios.md)
- [Trampas conocidas](skills/zonacards-native/references/gotchas.md)
- [Pruebas](skills/zonacards-native/references/testing.md)
- [Principios comunes](../zonacards-tokens/skills/zonacards-principles/SKILL.md)

## Referencia de la API
- [Android (Compose)](skills/zonacards-native/references/compose-api.md): cada componente con sus parámetros.
- [iOS (SwiftUI)](skills/zonacards-native/references/swift-api.md): cada tipo con sus inicializadores.

## Opcional
- [Guías en un solo archivo](llms-full.txt)
- [API de Android](llms-api-android.txt) · [API de iOS](llms-api-ios.txt)
`;
files[`${NAT}/llms-full.txt`] = bundle('Zonacards nativo · guías completas',
  'Guía de uso, principios comunes, detalles de iOS, trampas y pruebas. La API de cada componente está en llms-api-android.txt y llms-api-ios.txt.', [
    ['skills/zonacards-native/SKILL.md', `${natSkill}/SKILL.md`],
    ['@zonacards/tokens · skills/zonacards-principles/SKILL.md', `${tokSkill}/SKILL.md`],
    ['skills/zonacards-native/references/ios.md', `${natSkill}/references/ios.md`],
    ['skills/zonacards-native/references/gotchas.md', `${natSkill}/references/gotchas.md`],
    ['skills/zonacards-native/references/testing.md', `${natSkill}/references/testing.md`],
  ]);
files[`${NAT}/llms-api-android.txt`] = bundle('Zonacards nativo · API de Android (Compose)',
  'Componentes de zonacards-compose con sus parámetros. Generado desde el código.', [['skills/zonacards-native/references/compose-api.md', `${natSkill}/references/compose-api.md`]]);
files[`${NAT}/llms-api-ios.txt`] = bundle('Zonacards nativo · API de iOS (SwiftUI)',
  'Tipos de ZonacardsUI con sus inicializadores. Generado desde el código.', [['skills/zonacards-native/references/swift-api.md', `${natSkill}/references/swift-api.md`]]);

// ── Escribir o comprobar ─────────────────────────────────────────────────────────────────────────────────────────────────────────
let stale = 0;
for (const [file, text] of Object.entries(files)) {
  const out = text.endsWith('\n') ? text : text + '\n';
  const current = fs.existsSync(file) ? read(file) : null;
  if (CHECK) { if (current !== out) { stale++; console.error(`Desactualizado: ${file}`); } continue; }
  if (current !== out) fs.writeFileSync(file, out);
}
if (CHECK) {
  if (stale) { console.error('Corre `node scripts/build-llms.mjs` y sube los archivos generados.'); process.exit(1); }
  console.log(`llms: ${Object.keys(files).length} archivos al día`);
} else {
  const kb = f => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
  console.log(Object.keys(files).map(f => `${path.relative('projects', f)} (${kb(f)})`).join('\n'));
}
