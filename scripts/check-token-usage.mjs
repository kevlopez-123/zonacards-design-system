// Comprueba que el código use los tokens del sistema y no valores sueltos: tamaños de texto, pesos, opacidad de estados, sombras, halo de foco,
// forma de las tarjetas, íconos y umbrales de ancho. Las reglas salen de las "Reglas permanentes" de CLAUDE.md y de lo que cerraron A1 a A5 del
// diagnóstico: sin esta comprobación, el primer cambio apurado vuelve a escribir `text-[13px]` y la deriva regresa.
//
//   node scripts/check-token-usage.mjs                  revisa web y nativo; falla si hay una violación sin excepción
//   node scripts/check-token-usage.mjs --scope=web      solo web (Angular)
//   node scripts/check-token-usage.mjs --scope=native   solo Android e iOS
//   node scripts/check-token-usage.mjs --discover       cuenta las violaciones por regla, sin excepciones y sin fallar
//
// Una excepción legítima va en scripts/token-usage-allow.json con su motivo ({ rule, file, text?, reason }); `text` limita la excepción a las
// líneas que lo contienen. Una excepción que ya no hace falta también falla (para que la lista no crezca sin que nadie la lea).
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const scope = args.find(a => a.startsWith('--scope='))?.split('=')[1] ?? 'all';
const discover = args.includes('--discover');

const read = f => fs.readFileSync(f, 'utf8');
const walk = (d, out = []) => {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'build', '.angular', 'generated', 'Generated'].includes(e.name)) continue;
    const f = path.join(d, e.name).replace(/\\/g, '/');
    e.isDirectory() ? walk(f, out) : out.push(f);
  }
  return out;
};

const WEB = [...walk('projects/zonacards-ui'), ...walk('src/app')].filter(f => /\.(ts|html)$/.test(f) && !/\.spec\.ts$|icon-registry|\.generated\./.test(f));
const KOTLIN = ['projects/zonacards-native/android/zonacards-compose/src/main', 'projects/zonacards-native/android/catalog/src/main'].flatMap(d => walk(d)).filter(f => f.endsWith('.kt'));
const SWIFT = ['projects/zonacards-native/ios/Sources/ZonacardsUI', 'projects/zonacards-native/ios/Catalog'].flatMap(d => walk(d)).filter(f => f.endsWith('.swift'));
const notHelm = f => !f.includes('/helm/');

/** Reglas: id, dónde, patrón (por línea) y qué usar en su lugar. */
const RULES = [
  // ── Web ──
  { id: 'texto-px', files: WEB, re: /(?<![\w-])text-\[\d+(?:\.\d+)?px\]/g, use: 'un tamaño de la escala: text-2xs, text-tiny, text-caption, text-body-sm, text-body, text-title-sm, text-title, text-heading, text-display-*' },
  { id: 'texto-tailwind', files: WEB.filter(notHelm), re: /(?<![\w-])text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl)(?![\w-])/g, use: 'un tamaño de la escala (text-caption en vez de text-xs, text-body-sm en vez de text-sm…): las clases por defecto de Tailwind son otra escala' },
  { id: 'interlineado-px', files: WEB.filter(notHelm), re: /(?<![\w-])leading-\[\d+px\]/g, use: 'el interlineado que ya trae el tamaño (text-caption…) o leading-5/6/7' },
  { id: 'interletraje', files: WEB.filter(notHelm), re: /(?<![\w-])tracking-\[[^\]]+\]/g, use: 'tracking-tight, tracking-wide, tracking-wider o tracking-widest (--ls-*)' },
  { id: 'opacidad-deshabilitado', files: WEB, re: /(?:disabled|aria-disabled|data-disabled)[\w\-[\]=/%.]*:opacity-\d+(?![\w-])|\[class\.opacity-\d+\]="[^"]*[dD]isabled/g, use: 'disabled:opacity-(--opacity-disabled) o [style.opacity] con var(--opacity-disabled)' },
  { id: 'hover-estado', files: WEB, re: /(?<![\w-])(?:hover:|focus-visible:)(?:enabled:)?bg-surface-2(?![\w/-])/g, use: 'hover:bg-(--state-hover-bg) o bg-(--state-active-bg)' },
  { id: 'escala-pulsado', files: WEB, re: /scale-\[0\.9\d\]/g, use: 'active:enabled:scale-(--scale-pressed)' },
  { id: 'halo-foco', files: WEB, re: /shadow-\[0_0_0_3px_color-mix/g, use: 'shadow-(--focus-halo) o shadow-(--focus-halo-danger)' },
  { id: 'sombra-tailwind', files: WEB, re: /(?<![\w-])shadow-(?:sm|md|lg|xl|2xl)(?![\w-])/g, use: 'shadow-1 (en el flujo) o shadow-2 (flotante)' },
  { id: 'forma-tarjeta', files: WEB, line: l => /(?<![\w-])rounded-md(?![\w-])/.test(l) && /border-border/.test(l) && /(?<![\w-])bg-surface(?![\w-])/.test(l), re: /(?<![\w-])rounded-md(?![\w-])/g, use: '<zc-card>, o rounded-card (la forma de una tarjeta cambia con la marca); con p-(--space-card-inset) y gap-(--space-card)' },
  { id: 'forma-hoja', files: WEB, line: l => /(?<![\w-])rounded-(?:lg|xl|2xl)(?![\w-])/.test(l) && /(?<![\w-])shadow-2(?![\w-])/.test(l) && /(?<![\w-])bg-surface(?![\w-])/.test(l), re: /(?<![\w-])rounded-(?:lg|xl|2xl)(?![\w-])/g, use: 'rounded-sheet (la forma de una hoja flotante cambia con la marca)' },
  { id: 'color-paleta', files: WEB, re: /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|to|via|outline|divide|decoration|accent)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}(?![\w-])/g, use: 'un token (bg-surface, text-muted, text-danger…)' },
  { id: 'color-hex', files: WEB, re: /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|accent)-\[#[0-9a-fA-F]{3,8}\]/g, use: 'un token de tokens.css (nunca un hexadecimal en el componente)' },
  // ── Android ──
  { id: 'kt-peso', files: KOTLIN, re: /FontWeight\.(?:Light|Normal|Medium|SemiBold|Bold|ExtraBold)/g, use: 'ZcWeight.medium, ZcWeight.semibold o ZcWeight.bold' },
  { id: 'kt-deshabilitado', files: KOTLIN, re: /\.alpha\(if \([^)]*(?:enabled|Enabled)[^)]*\) 1f else 0\.\d+f\)/g, use: 'ZcOpacity.disabled' },
  { id: 'kt-icono', files: KOTLIN, line: l => /ZcIcon\(/.test(l), re: /\bsize = (?:16|20|24|32)\.dp/g, use: 'ZcSize.iconSm, iconMd, iconLg o iconXl' },
  { id: 'kt-ancho', files: KOTLIN, re: /zcScreenWidth\(\)\s*[<>]=?\s*\d+\.dp/g, use: 'ZcBreakpoint.sm, md, lg, xl, phone o wide' },
  { id: 'kt-color', files: KOTLIN, re: /\bColor\(0x[0-9A-Fa-f]{6,8}\)/g, use: 'un color del tema (ZonacardsTheme.colors.*)' },
  // ── iOS ──
  { id: 'swift-peso', files: SWIFT, re: /\.(?:fontWeight|weight)\(\.(?:light|regular|medium|semibold|bold|heavy|black)\)/g, use: 'ZCWeight.medium, ZCWeight.semibold o ZCWeight.bold' },
  { id: 'swift-deshabilitado', files: SWIFT, re: /\.opacity\([^)]*nabled[^)]*\? 1 : 0\.\d+\)/g, use: 'ZCOpacity.disabled' },
  { id: 'swift-icono', files: SWIFT, line: l => /ZCIcon\(/.test(l), re: /\bsize: (?:16|20|24|32)\b(?!\.)/g, use: 'ZCSize.iconSm, iconMd, iconLg o iconXl' },
  { id: 'swift-ancho', files: SWIFT, re: /UIScreen\.main\.bounds\.width\s*[<>]=?\s*\d+/g, use: 'ZCBreakpoint.sm, md, lg, xl, phone o wide' },
  { id: 'swift-color', files: SWIFT, re: /\b(?:Color|UIColor)\((?:hex:|red:)/g, use: 'un color del tema (theme.colors.*)' },
];
/**
 * Ejemplos de cada regla: lo que debe detectar (bad) y lo que no (good). `--self-test` los comprueba, para que una regla que pierda un escape
 * (una barra invertida que se come una herramienta, una clase que cambia de nombre) falle en la CI en vez de dejar de detectar en silencio.
 */
const SAMPLES = {
  'texto-px': { bad: ['class="text-[13px] font-medium"', 'sm:text-[12.5px]'], good: ['text-caption', 'text-[length:--spacing(4)]', 'context-[13px]'] },
  'texto-tailwind': { bad: ['text-sm text-muted', 'md:text-xl', "'text-xs'"], good: ['text-body-sm', 'text-subtle', 'text-sm-foo', 'ctext-sm'] },
  'interlineado-px': { bad: ['leading-[18px]'], good: ['leading-[1.6]', 'leading-5'] },
  'interletraje': { bad: ['tracking-[.04em]', 'tracking-[.25px]'], good: ['tracking-wide', 'tracking-snug'] },
  'opacidad-deshabilitado': { bad: ['disabled:opacity-45', 'aria-disabled:opacity-50', 'data-[disabled=true]:opacity-50', '[class.opacity-45]="disabled()"'], good: ['disabled:opacity-(--opacity-disabled)', 'opacity-50', 'hover:opacity-50', '[style.opacity]="disabled() ? 1 : null"'] },
  'hover-estado': { bad: ['hover:bg-surface-2', 'hover:enabled:bg-surface-2', 'focus-visible:bg-surface-2'], good: ['hover:bg-(--state-hover-bg)', 'hover:bg-surface-2/60', 'bg-surface-2'] },
  'escala-pulsado': { bad: ['active:scale-[0.98]'], good: ['active:scale-(--scale-pressed)'] },
  'halo-foco': { bad: ['focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]'], good: ['shadow-(--focus-halo)', 'shadow-[1px_0_0_var(--border)]'] },
  'sombra-tailwind': { bad: ['shadow-md', 'shadow-lg', 'hover:shadow-sm'], good: ['shadow-1', 'shadow-2', 'shadow-xs', 'shadow-[1px_0_0_var(--border)]'] },
  'forma-tarjeta': { bad: ['class="rounded-md border border-border bg-surface p-4"'], good: ['class="rounded-card border border-border bg-surface"', 'class="rounded-md bg-surface-2"', 'class="rounded-md border border-border"'] },
  'forma-hoja': { bad: ['class="rounded-lg border border-border bg-surface shadow-2"'], good: ['class="rounded-sheet border border-border bg-surface shadow-2"', 'class="rounded-lg bg-secondary"'] },
  'color-paleta': { bad: ['bg-red-500', 'text-gray-700', 'border-blue-200'], good: ['bg-danger', 'text-muted', 'bg-redundant'] },
  'color-hex': { bad: ['bg-[#fff]', 'text-[#0f766e]'], good: ['bg-(--primary)', 'bg-[color-mix(in_srgb,var(--primary)_20%,transparent)]'] },
  'kt-peso': { bad: ['FontWeight.SemiBold', 'fontWeight = FontWeight.Medium'], good: ['ZcWeight.semibold', 'FontWeight(600)'] },
  'kt-deshabilitado': { bad: ['.alpha(if (enabled) 1f else 0.45f)', '.alpha(if (item.enabled) 1f else 0.5f)'], good: ['.alpha(if (enabled) 1f else ZcOpacity.disabled)', '.alpha(if (i == current) 1f else 0.4f)'] },
  'kt-icono': { bad: ['ZcIcon(ZcIcons.sStar, contentDescription = null, size = 16.dp)'], good: ['ZcIcon(ZcIcons.sStar, contentDescription = null, size = ZcSize.iconSm)', 'Box(Modifier.size(size = 16.dp))'] },
  'kt-ancho': { bad: ['zcScreenWidth() >= 768.dp', 'zcScreenWidth() < 1024.dp'], good: ['zcScreenWidth() >= ZcBreakpoint.md'] },
  'kt-color': { bad: ['Color(0xFF111827)', 'Color(0x24808080)'], good: ['ZonacardsTheme.colors.text', 'Color.Transparent'] },
  'swift-peso': { bad: ['.weight(.semibold)', '.fontWeight(.medium)'], good: ['.weight(ZCWeight.semibold)', '.fontWeight(ZCWeight.medium)'] },
  'swift-deshabilitado': { bad: ['.opacity(isEnabled ? 1 : 0.45)', '.opacity(item.enabled ? 1 : 0.55)'], good: ['.opacity(isEnabled ? 1 : ZCOpacity.disabled)', '.opacity(i == current ? 1 : 0.4)'] },
  'swift-icono': { bad: ['ZCIcon(.sStar, size: 16)'], good: ['ZCIcon(.sStar, size: ZCSize.iconSm)', 'ZCText("x", size: 16)'] },
  'swift-ancho': { bad: ['UIScreen.main.bounds.width >= 640', 'UIScreen.main.bounds.width < 900'], good: ['UIScreen.main.bounds.width >= ZCBreakpoint.sm'] },
  'swift-color': { bad: ['Color(red: 0.1, green: 0.2, blue: 0.3)', 'Color(hex: "#fff")'], good: ['theme.colors.text', 'Color.clear'] },
};
if (args.includes('--self-test')) {
  const hits = (r, l) => (!r.line || r.line(l)) && [...l.matchAll(r.re)].length > 0;
  const errors = [];
  for (const r of RULES) {
    const s = SAMPLES[r.id];
    if (!s) { errors.push(`[${r.id}] no tiene ejemplos`); continue; }
    s.bad.forEach(l => { if (!hits(r, l)) errors.push(`[${r.id}] debía detectar: ${l}`); });
    s.good.forEach(l => { if (hits(r, l)) errors.push(`[${r.id}] no debía detectar: ${l}`); });
  }
  for (const id of Object.keys(SAMPLES)) if (!RULES.some(r => r.id === id)) errors.push(`[${id}] hay ejemplos de una regla que no existe`);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log(`tokens (prueba de las reglas): ${RULES.length} reglas, ${Object.values(SAMPLES).reduce((n, s) => n + s.bad.length + s.good.length, 0)} ejemplos correctos`);
  process.exit(0);
}
const inScope = id => scope === 'all' || (scope === 'web' && !/^(kt|swift)-/.test(id)) || (scope === 'native' && /^(kt|swift)-/.test(id));

const allow = fs.existsSync('scripts/token-usage-allow.json') ? JSON.parse(read('scripts/token-usage-allow.json')).filter(a => inScope(a.rule)) : [];
const used = new Set();
const isAllowed = (rule, file, line) => allow.some((a, i) => { const ok = a.rule === rule && a.file === file && (!a.text || line.includes(a.text)); if (ok) used.add(i); return ok; });

const found = [];
for (const rule of RULES.filter(r => inScope(r.id))) {
  for (const file of rule.files) {
    read(file).split('\n').forEach((line, i) => {
      if (rule.line && !rule.line(line)) return;
      for (const m of line.matchAll(rule.re)) {
        found.push({ rule: rule.id, file, line: i + 1, text: m[0], use: rule.use, allowed: !discover && isAllowed(rule.id, file, line) });
      }
    });
  }
}

if (discover) {
  const by = {};
  for (const v of found) (by[v.rule] ??= []).push(v);
  for (const r of RULES.filter(r => inScope(r.id))) {
    const list = by[r.id] ?? [];
    console.log(`${String(list.length).padStart(4)}  ${r.id}${list.length ? '  · ' + [...new Set(list.map(v => v.file.split('/').slice(-1)[0]))].slice(0, 4).join(', ') : ''}`);
  }
  console.log(`\n${found.length} coincidencias en total`);
  process.exit(0);
}

const violations = found.filter(v => !v.allowed);
const stale = allow.map((a, i) => ({ a, i })).filter(({ i }) => !used.has(i));
if (violations.length || stale.length) {
  for (const v of violations) console.error(`${v.file}:${v.line}  [${v.rule}] ${v.text}\n    → usa ${v.use}`);
  for (const { a } of stale) console.error(`scripts/token-usage-allow.json: la excepción [${a.rule}] ${a.file}${a.text ? ' "' + a.text + '"' : ''} ya no se usa: bórrala`);
  console.error(`\n${violations.length} valor(es) fuera de token y ${stale.length} excepción(es) sobrante(s). Si es un caso legítimo, agrégalo a scripts/token-usage-allow.json con su motivo.`);
  process.exit(1);
}
console.log(`tokens: sin valores sueltos (${RULES.filter(r => inScope(r.id)).length} reglas, ${allow.length} excepciones documentadas, ${new Set(RULES.filter(r => inScope(r.id)).flatMap(r => r.files)).size} archivos)`);
