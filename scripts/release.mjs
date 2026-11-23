// Lanzamiento del sistema de diseño con UN solo número de versión para @zonacards/tokens, @zonacards/ui, los módulos Maven de
// Android y la etiqueta del paquete de iOS. Este script NO publica nada: comprueba, fija la versión, arma los paquetes y
// muestra los comandos exactos de publicación para que una persona los corra.
//
//   node scripts/release.mjs check              ¿coinciden las versiones y los CHANGELOG?
//   node scripts/release.mjs set 2.1.0          fija la versión en todos los paquetes (después escribe la entrada del CHANGELOG)
//   node scripts/release.mjs verify [--android] compila y prueba todo (con --android también las pruebas de Android; solo Windows)
//   node scripts/release.mjs pack [--android]   verify + arma dist/release/*.tgz (y dist/release/maven con --android)
//   node scripts/release.mjs plan               imprime los comandos de publicación (npm, Maven, iOS); no ejecuta ninguno
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const P = {
  tokens: 'projects/zonacards-tokens/package.json',
  ui: 'projects/zonacards-ui/package.json',
  gradle: 'projects/zonacards-native/android/gradle.properties',
  tokensLog: 'projects/zonacards-tokens/CHANGELOG.md',
  uiLog: 'projects/zonacards-ui/CHANGELOG.md',
};
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const gradleVersion = () => /^zonacards\.version=(.+)$/m.exec(fs.readFileSync(P.gradle, 'utf8'))?.[1]?.trim() ?? '(falta)';
const topChangelog = f => /^## (\d+\.\d+\.\d+)/m.exec(fs.readFileSync(f, 'utf8'))?.[1] ?? '(falta)';
const SEMVER = /^\d+\.\d+\.\d+$/;
const range = v => { const [maj, min] = v.split('.'); return `^${maj}.${min}.0`; };

function versions() {
  const ui = readJson(P.ui);
  return {
    'npm @zonacards/tokens': readJson(P.tokens).version,
    'npm @zonacards/ui': ui.version,
    'Maven com.zonacards (gradle.properties)': gradleVersion(),
    'CHANGELOG de tokens (última entrada)': topChangelog(P.tokensLog),
    'CHANGELOG de ui (última entrada)': topChangelog(P.uiLog),
    'dependencia de ui en tokens': ui.dependencies?.['@zonacards/tokens'] ?? '(falta)',
  };
}

function check({ quiet = false } = {}) {
  const v = versions();
  const main = v['npm @zonacards/tokens'];
  const problems = [];
  for (const [k, val] of Object.entries(v)) {
    if (k === 'dependencia de ui en tokens') { if (val !== range(main)) problems.push(`${k}: ${val}; debería ser ${range(main)}`); continue; }
    if (val !== main) problems.push(`${k}: ${val}; debería ser ${main}`);
  }
  if (!quiet) {
    console.log(`Versión del sistema de diseño: ${main}\n`);
    for (const [k, val] of Object.entries(v)) console.log(`  ${val.padEnd(10)} ${k}`);
    console.log(problems.length ? `\nNo coinciden:\n${problems.map(p => '  - ' + p).join('\n')}` : '\nTodo coincide.');
  }
  return problems;
}

function setVersion(version) {
  if (!SEMVER.test(version ?? '')) { console.error('Uso: node scripts/release.mjs set <mayor.menor.parche>, por ejemplo 2.1.0'); process.exit(2); }
  const write = (f, fn) => { const s = fs.readFileSync(f, 'utf8'); const eol = s.includes('\r\n') ? '\r\n' : '\n'; fs.writeFileSync(f, fn(s.replace(/\r\n/g, '\n')).replace(/\n/g, eol)); };
  write(P.tokens, s => s.replace(/"version": "[^"]+"/, `"version": "${version}"`));
  write(P.ui, s => s.replace(/"version": "[^"]+"/, `"version": "${version}"`).replace(/"@zonacards\/tokens": "[^"]+"/, `"@zonacards/tokens": "${range(version)}"`));
  write(P.gradle, s => s.replace(/^zonacards\.version=.*$/m, `zonacards.version=${version}`));
  console.log(`Versión ${version} fijada en tokens, ui y Maven. Falta: una entrada "## ${version}" al inicio de ${P.tokensLog} y ${P.uiLog}, y correr \`npm install\` si cambió el rango de la dependencia.`);
}

const run = (cmd, label) => {
  console.log(`\n▶ ${label ?? cmd}`);
  const r = spawnSync(cmd, { shell: true, stdio: 'inherit' });
  if (r.status !== 0) { console.error(`\n✖ Falló: ${cmd}`); process.exit(r.status ?? 1); }
};

function verify(android) {
  if (check({ quiet: true }).length) { check(); process.exit(1); }
  run('npm run build:tokens-pkg', 'Compilar el paquete de tokens');
  run('npm test', 'Pruebas: tokens, librería y app');
  run('npm run build', 'Compilar la app y la librería (el paquete queda en dist/zonacards-ui)');
  if (android) {
    if (process.platform !== 'win32') { console.error('--android usa build-local.ps1 (Windows). En otro sistema corre ./gradlew testDebugUnitTest en projects/zonacards-native/android.'); process.exit(1); }
    run('powershell -ExecutionPolicy Bypass -File projects/zonacards-native/android/build-local.ps1 assembleDebug testDebugUnitTest', 'Pruebas de Android');
    const log = fs.readFileSync('projects/zonacards-native/android/build-local.log', 'utf16le');
    if (!/EXIT 0\s*$/.test(log)) { console.error('✖ Android: el log no termina en EXIT 0.'); process.exit(1); }
  }
}

function pack(android) {
  verify(android);
  const out = path.resolve('dist/release');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  // npm pack empaqueta la carpeta actual: se corre dentro de cada paquete.
  const tk = spawnSync('npm', ['pack', '--pack-destination', out], { cwd: 'projects/zonacards-tokens', shell: true, stdio: 'inherit' });
  const ui = spawnSync('npm', ['pack', '--pack-destination', out], { cwd: 'dist/zonacards-ui', shell: true, stdio: 'inherit' });
  if (tk.status !== 0 || ui.status !== 0) process.exit(1);
  if (android) {
    const mvn = path.join(out, 'maven').replace(/\\/g, '/');
    run(`powershell -Command "$env:ZC_MAVEN_URL='file:///${mvn}'; & projects/zonacards-native/android/build-local.ps1 :zonacards-tokens:publishReleasePublicationToMavenRepository :zonacards-compose:publishReleasePublicationToMavenRepository"`, 'Armar los módulos Maven en dist/release/maven');
  }
  console.log(`\nListo en ${out}:`);
  for (const f of fs.readdirSync(out)) console.log('  ' + f);
}

function plan() {
  const problems = check({ quiet: true });
  const v = versions()['npm @zonacards/tokens'];
  console.log(`Plan de publicación de la versión ${v} (este script no ejecuta nada de lo siguiente).\n`);
  if (problems.length) console.log(`⚠ Primero arregla las versiones: node scripts/release.mjs check\n`);
  console.log(`0. Antes: node scripts/release.mjs pack --android   (verify + paquetes)  ·  git tag v${v}  ·  revisar los CHANGELOG\n`);
  console.log(`1. npm (en este orden: ui depende de tokens)
     npm publish dist/release/zonacards-tokens-${v}.tgz --access public
     npm publish dist/release/zonacards-ui-${v}.tgz --access public\n`);
  console.log(`2. Android (Maven privado; define ZC_MAVEN_URL, ZC_MAVEN_USER y ZC_MAVEN_PASSWORD)
     cd projects/zonacards-native/android
     .\\gradlew :zonacards-tokens:publishReleasePublicationToMavenRepository :zonacards-compose:publishReleasePublicationToMavenRepository
     En la app: implementation("com.zonacards:zonacards-compose:${v}")\n`);
  console.log(`3. iOS (Swift Package Manager necesita el paquete en la raíz de un repositorio): publica la subcarpeta en un espejo
     git subtree split --prefix=projects/zonacards-native/ios -b ios-release-${v}
     git push <repositorio-espejo-ios> ios-release-${v}:main
     git tag ${v} <commit-del-split> && git push <repositorio-espejo-ios> ${v}
     En la app: .package(url: "<repositorio-espejo-ios>", from: "${v}")   y en el destino .product(name: "ZonacardsUI", package: "<nombre-del-repositorio>")   (ZonacardsUI trae los componentes SwiftUI; ZonacardsTokens, solo tokens y dominio)\n`);
  console.log('Nada de esto debe correrse sin la confirmación de quien responde por el sistema de diseño.');
}

const [cmd, arg] = process.argv.slice(2);
const flag = process.argv.includes('--android');
switch (cmd) {
  case 'check': process.exit(check().length ? 1 : 0); break;
  case 'set': setVersion(arg); break;
  case 'verify': verify(flag); break;
  case 'pack': pack(flag); break;
  case 'plan': plan(); break;
  default:
    console.error('Uso: node scripts/release.mjs check | set <versión> | verify [--android] | pack [--android] | plan');
    process.exit(2);
}
