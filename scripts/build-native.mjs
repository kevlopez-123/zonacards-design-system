// Fase 1 del plan nativo: genera la base compartida para SwiftUI (iOS) y Jetpack Compose (Android)
// desde las fuentes de @zonacards/ui. Uso: npm run native
//  - Tokens (tokens/*.json, DTCG)          → ZCTokens.swift · ZcTokens.kt · colors.xml (claro y noche)
//  - Íconos (icon/icons.json, Solar/Lucide) → Icons.xcassets (SVG plantilla) · drawable/zc_ic_*.xml (VectorDrawable)
//  - Textos (i18n/es.json, en.json)        → Localizable.xcstrings · values[-en]/strings.xml
//  - Marca (assets/brand/<marca>)          → AppIcon.appiconset (claro, oscuro, tintado) · ícono adaptativo de Android
// Todo lo generado vive en projects/zonacards-native y no se edita a mano.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const UI = 'projects/zonacards-ui';
const OUT = 'projects/zonacards-native';
const IOS = `${OUT}/ios/Sources/ZonacardsTokens`;
const AND = `${OUT}/android/zonacards-tokens/src/main`;
const PKG = 'com.zonacards.ui.tokens';
const KT = `${AND}/kotlin/${PKG.replace(/\./g, '/')}/generated`;
const HEADER = 'Archivo generado por scripts/build-native.mjs. No editar a mano.';
const write = (file, text) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); };
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
const version = readJson(`${UI}/package.json`).version;
for (const d of [`${IOS}/Generated`, `${IOS}/Resources`, KT, `${AND}/res`]) rmSync(d, { recursive: true, force: true });

// ---------- Nombres ----------
const camel = (path) => {
  const s = path.replace(/^(color|space|radius|size|duration|easing|shadow|font\.size|font\.lineHeight)\./, '')
    .replace(/^2xs$/, 'xxs').split(/[.\-_]/).filter(Boolean)
    .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('');
  return /^\d/.test(s) ? 'v' + s : s;
};
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9]+/g, '_').toLowerCase();

// ---------- Tokens ----------
const TOK = `${UI}/tokens`;
const flatten = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && v.$value !== undefined) out[p] = { type: v.$type, value: v.$value }; else flatten(v, p, out);
  }
  return out;
};
const set = (name) => (existsSync(`${TOK}/${name}.json`) ? flatten(readJson(`${TOK}/${name}.json`)) : {});
const primitives = set('primitives');
const BRANDS = ['zonacards', 'giftealo', 'enjoy', 'motiva'];
// Mismo orden que la cascada CSS: :root → .dark → [data-brand] → .dark[data-brand].
const themeMap = (brand, dark) => ({
  ...primitives, ...set('semantic.light'), ...(dark ? set('semantic.dark') : {}),
  ...(brand !== 'zonacards' ? set(`brand.${brand}.light`) : {}),
  ...(brand !== 'zonacards' && dark ? set(`brand.${brand}.dark`) : {}),
});
const resolve = (map, v, depth = 0) => {
  const m = typeof v === 'string' && v.match(/^\{(.+)\}$/);
  if (!m) return v;
  if (!map[m[1]] || depth > 10) throw new Error(`Referencia sin resolver: ${v}`);
  return resolve(map, map[m[1]].value, depth + 1);
};
const parseColor = (v) => {
  let m = v.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  return null;
};
const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
const argb = (c) => `${hex2(c.a * 255)}${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
const dim = (v) => {
  const m = String(v).match(/^(-?[\d.]+)(px|rem)?$/);
  return m ? +m[1] * (m[2] === 'rem' ? 16 : 1) : null;
};
const ms = (v) => parseFloat(v);
const parseShadow = (v) => {
  if (v === 'none') return [];
  return v.split(/,(?![^(]*\))/).map((layer) => {
    const color = parseColor(layer.match(/(rgba?\([^)]*\)|#[0-9a-f]+)/i)?.[1] ?? '#000');
    const nums = layer.replace(/(rgba?\([^)]*\)|#[0-9a-f]+)/i, '').trim().split(/\s+/).map(dim);
    const [x = 0, y = 0, blur = 0, spread = 0] = nums;
    return { x, y, blur, spread, color };
  });
};

const themes = [];
for (const brand of BRANDS) for (const dark of [false, true]) {
  const map = themeMap(brand, dark);
  const colors = {}; const skipped = [];
  for (const [p, t] of Object.entries(map)) {
    if (t.type !== 'color') continue;
    const c = parseColor(String(resolve(map, t.value)));
    if (c) colors[camel(p)] = c; else skipped.push(p);
  }
  const shadows = {};
  for (const [p, t] of Object.entries(map)) if (t.type === 'shadow') shadows[camel(p)] = parseShadow(String(resolve(map, t.value)));
  const font = String(map['font.family.sans'].value).match(/"([^"]+)"/)?.[1] ?? 'System';
  themes.push({ id: camel(`${brand}-${dark ? 'dark' : 'light'}`), brand, dark, colors, shadows, font: font.replace(' Variable', ''), skipped });
}
// Todas las paletas deben tener las mismas claves (si no, Swift/Kotlin no compilan).
const colorKeys = [...new Set(themes.flatMap((t) => Object.keys(t.colors)))].sort();
for (const t of themes) for (const k of colorKeys) if (!t.colors[k]) throw new Error(`Falta el color ${k} en ${t.id}`);
const shadowKeys = Object.keys(themes[0].shadows).sort();

const scale = (prefix) => Object.entries(primitives).filter(([p]) => p.startsWith(prefix)).map(([p, t]) => [camel(p), dim(t.value)]).filter(([, v]) => v !== null);
const spaces = scale('space.'); const radii = scale('radius.'); const sizes = scale('size.');
const typeKeys = Object.keys(primitives).filter((p) => p.startsWith('font.size.')).map((p) => p.slice(10));
const type = typeKeys.map((k) => ({ name: camel(k), size: dim(primitives[`font.size.${k}`].value), line: dim(primitives[`font.lineHeight.${k}`]?.value ?? '0') }));
// Estilo de sistema más cercano para que la letra siga el tamaño elegido por la persona (Dynamic Type).
const IOS_STYLE = { xxs: 'caption2', tiny: 'caption2', caption: 'caption', bodySm: 'subheadline', body: 'body', titleSm: 'headline', title: 'title3', heading: 'title2', displaySm: 'title', display: 'largeTitle', displayLg: 'largeTitle' };
const durations = Object.entries(primitives).filter(([p]) => p.startsWith('duration.')).map(([p, t]) => [camel(p), ms(t.value)]);
const easings = Object.entries(primitives).filter(([p]) => p.startsWith('easing.')).map(([p, t]) => [camel(p), t.value]);
const SWIFT_RESERVED = new Set(['default', 'case', 'class', 'in', 'is', 'as', 'import', 'return', 'self', 'static', 'struct', 'switch', 'where', 'while', 'repeat', 'protocol', 'extension']);
const sid = (k) => (SWIFT_RESERVED.has(k) ? '`' + k + '`' : k);
const num = (n) => (Number.isInteger(n) ? `${n}` : `${+n.toFixed(4)}`);

// ---------- Swift ----------
const swiftColor = (c) => `Color(.sRGB, red: ${num(c.r / 255)}, green: ${num(c.g / 255)}, blue: ${num(c.b / 255)}, opacity: ${num(c.a)})`;
const swiftShadow = (l) => `ZCShadowLayer(color: ${swiftColor(l.color)}, x: ${num(l.x)}, y: ${num(l.y)}, blur: ${num(l.blur)}, spread: ${num(l.spread)})`;
let swift = `// ${HEADER}\n// @zonacards/ui ${version}\nimport SwiftUI\n\n`;
swift += `public struct ZCShadowLayer: Sendable { public let color: Color; public let x, y, blur, spread: CGFloat }\n\n`;
swift += `/// Paleta completa de un tema (marca × modo). Úsala desde el entorno: \`@Environment(\\.zcTheme)\`.\npublic struct ZCColors: Sendable {\n${colorKeys.map((k) => `    public let ${k}: Color`).join('\n')}\n}\n\n`;
swift += `public struct ZCShadows: Sendable {\n${shadowKeys.map((k) => `    public let ${k}: [ZCShadowLayer]`).join('\n')}\n}\n\n`;
swift += `public enum ZCBrand: String, CaseIterable, Sendable { ${BRANDS.map((b) => `case ${b}`).join('; ')} }\n\n`;
swift += `public struct ZCTheme: Sendable {\n    public let brand: ZCBrand\n    public let isDark: Bool\n    public let fontFamily: String\n    public let colors: ZCColors\n    public let shadows: ZCShadows\n\n`;
swift += `    public static func resolve(_ brand: ZCBrand, dark: Bool) -> ZCTheme {\n        switch (brand, dark) {\n${themes.map((t) => `        case (.${t.brand}, ${t.dark}): return .${t.id}`).join('\n')}\n        }\n    }\n\n`;
for (const t of themes) {
  swift += `    public static let ${t.id} = ZCTheme(brand: .${t.brand}, isDark: ${t.dark}, fontFamily: ${JSON.stringify(t.font)},\n        colors: ZCColors(\n${colorKeys.map((k) => `            ${k}: ${swiftColor(t.colors[k])}`).join(',\n')}\n        ),\n        shadows: ZCShadows(\n${shadowKeys.map((k) => `            ${k}: [${(t.shadows[k] ?? []).map(swiftShadow).join(', ')}]`).join(',\n')}\n        ))\n\n`;
}
swift += `}\n\nprivate struct ZCThemeKey: EnvironmentKey { static let defaultValue = ZCTheme.zonacardsLight }\npublic extension EnvironmentValues {\n    var zcTheme: ZCTheme { get { self[ZCThemeKey.self] } set { self[ZCThemeKey.self] = newValue } }\n}\n\n`;
const swiftEnum = (name, rows, doc) => `/// ${doc}\npublic enum ${name} {\n${rows.map(([k, v]) => `    public static let ${k}: CGFloat = ${num(v)}`).join('\n')}\n}\n\n`;
swift += swiftEnum('ZCSpace', spaces, 'Espaciado en puntos (1 px CSS = 1 pt).');
swift += swiftEnum('ZCRadius', radii, 'Radios de esquina en puntos.');
swift += swiftEnum('ZCSize', sizes, 'Medidas de componentes en puntos. Toque mínimo en iOS: 44 pt.');
swift += `public struct ZCTypeStyle: Sendable { public let size: CGFloat; public let lineHeight: CGFloat; public let relativeTo: Font.TextStyle }\n\n/// Escala tipográfica. \`Font.zc(.body, theme:)\` escala con Dynamic Type.\npublic enum ZCType {\n${type.map((s) => `    public static let ${s.name} = ZCTypeStyle(size: ${num(s.size)}, lineHeight: ${num(s.line)}, relativeTo: .${IOS_STYLE[s.name] ?? 'body'})`).join('\n')}\n}\n\n`;
swift += `public extension Font {\n    static func zc(_ style: ZCTypeStyle, theme: ZCTheme = .zonacardsLight) -> Font {\n        .custom(theme.fontFamily, size: style.size, relativeTo: style.relativeTo)\n    }\n}\n\n`;
swift += `/// Movimiento: duraciones en segundos y curvas. Con "Reducir movimiento" usa \`ZCMotion.animation(_:reduceMotion:)\`.\npublic enum ZCMotion {\n${durations.map(([k, v]) => `    public static let ${sid(k)}: Double = ${num(v / 1000)}`).join('\n')}\n${easings.map(([k, v]) => `    public static let ${k}Curve: (Double, Double, Double, Double) = (${v.map(num).join(', ')})`).join('\n')}\n\n    public static func animation(_ duration: Double, curve: (Double, Double, Double, Double) = standardCurve, reduceMotion: Bool) -> Animation? {\n        reduceMotion ? nil : .timingCurve(curve.0, curve.1, curve.2, curve.3, duration: duration)\n    }\n}\n`;
write(`${IOS}/Generated/ZCTokens.swift`, swift);

// ---------- Kotlin ----------
const ktColor = (c) => `Color(0x${argb(c)})`;
let kt = `// ${HEADER}\n// @zonacards/ui ${version}\npackage ${PKG}\n\nimport androidx.compose.animation.core.CubicBezierEasing\nimport androidx.compose.runtime.Immutable\nimport androidx.compose.runtime.staticCompositionLocalOf\nimport androidx.compose.ui.graphics.Color\nimport androidx.compose.ui.text.TextStyle\nimport androidx.compose.ui.unit.dp\nimport androidx.compose.ui.unit.sp\n\n`;
kt += `@Immutable\ndata class ZcShadowLayer(val color: Color, val x: Float, val y: Float, val blur: Float, val spread: Float)\n\n`;
kt += `/** Paleta completa de un tema (marca × modo). Úsala con LocalZcTheme.current.colors. */\n@Immutable\ndata class ZcColors(\n${colorKeys.map((k) => `    val ${k}: Color,`).join('\n')}\n)\n\n`;
kt += `@Immutable\ndata class ZcShadows(\n${shadowKeys.map((k) => `    val ${k}: List<ZcShadowLayer>,`).join('\n')}\n)\n\n`;
kt += `enum class ZcBrand { ${BRANDS.map((b) => b.toUpperCase()).join(', ')} }\n\n`;
kt += `@Immutable\ndata class ZcTheme(val brand: ZcBrand, val isDark: Boolean, val fontFamily: String, val colors: ZcColors, val shadows: ZcShadows) {\n    companion object {\n        fun resolve(brand: ZcBrand, dark: Boolean): ZcTheme = when (brand) {\n${BRANDS.map((b) => `            ZcBrand.${b.toUpperCase()} -> if (dark) ${camel(b + '-dark')} else ${camel(b + '-light')}`).join('\n')}\n        }\n\n`;
for (const t of themes) {
  kt += `        val ${t.id} = ZcTheme(ZcBrand.${t.brand.toUpperCase()}, ${t.dark}, ${JSON.stringify(t.font)},\n            ZcColors(\n${colorKeys.map((k) => `                ${k} = ${ktColor(t.colors[k])},`).join('\n')}\n            ),\n            ZcShadows(\n${shadowKeys.map((k) => `                ${k} = listOf(${(t.shadows[k] ?? []).map((l) => `ZcShadowLayer(${ktColor(l.color)}, ${num(l.x)}f, ${num(l.y)}f, ${num(l.blur)}f, ${num(l.spread)}f)`).join(', ')}),`).join('\n')}\n            ))\n\n`;
}
kt += `    }\n}\n\nval LocalZcTheme = staticCompositionLocalOf { ZcTheme.zonacardsLight }\n\n`;
const ktObj = (name, rows, doc) => `/** ${doc} */\nobject ${name} {\n${rows.map(([k, v]) => `    val ${k} = ${num(v)}.dp`).join('\n')}\n}\n\n`;
kt += ktObj('ZcSpace', spaces, 'Espaciado en dp (1 px CSS = 1 dp).');
kt += ktObj('ZcRadius', radii, 'Radios de esquina en dp.');
kt += ktObj('ZcSize', sizes, 'Medidas de componentes en dp. Toque mínimo en Android: 48 dp.');
kt += `/** Escala tipográfica en sp: sigue la escala de fuente del sistema. */\nobject ZcType {\n${type.map((s) => `    val ${s.name} = TextStyle(fontSize = ${num(s.size)}.sp, lineHeight = ${num(s.line)}.sp)`).join('\n')}\n}\n\n`;
kt += `/** Movimiento: duraciones en ms y curvas. Respeta "Quitar animaciones" (ANIMATOR_DURATION_SCALE = 0). */\nobject ZcMotion {\n${durations.map(([k, v]) => `    const val ${k} = ${Math.round(v)}`).join('\n')}\n${easings.map(([k, v]) => `    val ${k}Easing = CubicBezierEasing(${v.map((n) => num(n) + 'f').join(', ')})`).join('\n')}\n}\n`;
write(`${KT}/ZcTokens.kt`, kt);

// colors.xml para vistas que no son Compose (splash, widgets, notificaciones): marca Zonacards.
const colorsXml = (t) => `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${HEADER} -->\n<resources>\n${colorKeys.map((k) => `    <color name="zc_${snake(k)}">#${argb(t.colors[k])}</color>`).join('\n')}\n</resources>\n`;
write(`${AND}/res/values/zc_colors.xml`, colorsXml(themes.find((t) => t.id === 'zonacardsLight')));
write(`${AND}/res/values-night/zc_colors.xml`, colorsXml(themes.find((t) => t.id === 'zonacardsDark')));

// ---------- Íconos ----------
const iconSets = { s: require('@iconify-json/solar/icons.json'), l: require('@iconify-json/lucide/icons.json') };
const iconList = readJson(`${UI}/icon/icons.json`).icons;
const iconData = (key) => {
  const [p, name] = key.split(':'); const s = iconSets[p];
  const id = p === 's' ? (name.endsWith('-bold') ? name : name + '-linear') : name;
  const icon = s.icons[id] || (s.aliases?.[id] && s.icons[s.aliases[id].parent]);
  return icon && { body: icon.body, w: icon.width ?? s.width ?? 24, h: icon.height ?? s.height ?? 24 };
};
const iconName = (key) => `zc_ic_${snake(key.replace(':', '_'))}`;

// SVG → VectorDrawable: path, circle, ellipse, rect, line, polyline, polygon y g (con opacidad y translate/rotate/scale).
const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const shapeToPath = (tag, a) => {
  const n = (k, d = 0) => (a[k] === undefined ? d : parseFloat(a[k]));
  switch (tag) {
    case 'path': return a.d;
    case 'circle': case 'ellipse': {
      const cx = n('cx'), cy = n('cy'), rx = tag === 'circle' ? n('r') : n('rx'), ry = tag === 'circle' ? n('r') : n('ry');
      return `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${2 * rx},0a${rx},${ry} 0 1,0 ${-2 * rx},0Z`;
    }
    case 'rect': {
      const x = n('x'), y = n('y'), w = n('width'), h = n('height');
      let rx = a.rx !== undefined ? n('rx') : n('ry'), ry = a.ry !== undefined ? n('ry') : rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx) return `M${x},${y}h${w}v${h}h${-w}Z`;
      return `M${x + rx},${y}h${w - 2 * rx}a${rx},${ry} 0 0 1 ${rx},${ry}v${h - 2 * ry}a${rx},${ry} 0 0 1 ${-rx},${ry}h${-(w - 2 * rx)}a${rx},${ry} 0 0 1 ${-rx},${-ry}v${-(h - 2 * ry)}a${rx},${ry} 0 0 1 ${rx},${-ry}Z`;
    }
    case 'line': return `M${n('x1')},${n('y1')}L${n('x2')},${n('y2')}`;
    case 'polyline': case 'polygon': {
      const pts = a.points.trim().split(/[\s,]+/);
      let d = '';
      for (let i = 0; i < pts.length; i += 2) d += `${i ? 'L' : 'M'}${pts[i]},${pts[i + 1]}`;
      return d + (tag === 'polygon' ? 'Z' : '');
    }
  }
  return null;
};
const PAINT = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'opacity', 'fill-opacity', 'stroke-opacity'];
const groupTransform = (t) => {
  if (!t) return '';
  let out = '';
  for (const m of t.matchAll(/(translate|rotate|scale)\(([^)]*)\)/g)) {
    const v = m[2].trim().split(/[\s,]+/).map(Number);
    if (m[1] === 'translate') out += ` android:translateX="${v[0]}" android:translateY="${v[1] ?? 0}"`;
    if (m[1] === 'rotate') out += ` android:rotation="${v[0]}"${v.length > 2 ? ` android:pivotX="${v[1]}" android:pivotY="${v[2]}"` : ''}`;
    if (m[1] === 'scale') out += ` android:scaleX="${v[0]}" android:scaleY="${v[1] ?? v[0]}"`;
  }
  if (/matrix|skew/.test(t)) throw new Error(`Transformación no soportada: ${t}`);
  return out;
};
const vectorDrawable = (icon, colorHex = '#FF000000') => {
  const lines = []; const stack = [{}];
  const paint = (style) => {
    const color = (v) => (v === 'none' ? null : v === 'currentColor' || !v ? colorHex : v.startsWith('#') ? v : colorHex);
    const op = (style.opacity ?? 1);
    const out = [];
    const fill = style.fill === undefined ? 'currentColor' : style.fill;
    if (color(fill)) { out.push(`android:fillColor="${color(fill)}"`); const a = op * (style['fill-opacity'] ?? 1); if (a < 1) out.push(`android:fillAlpha="${+a.toFixed(3)}"`); }
    if (style.stroke && color(style.stroke)) {
      out.push(`android:strokeColor="${color(style.stroke)}"`, `android:strokeWidth="${style['stroke-width'] ?? 1}"`);
      if (style['stroke-linecap']) out.push(`android:strokeLineCap="${style['stroke-linecap']}"`);
      if (style['stroke-linejoin']) out.push(`android:strokeLineJoin="${style['stroke-linejoin']}"`);
      const a = op * (style['stroke-opacity'] ?? 1); if (a < 1) out.push(`android:strokeAlpha="${+a.toFixed(3)}"`);
    }
    if (style['fill-rule'] === 'evenodd') out.push('android:fillType="evenOdd"');
    return out.join(' ');
  };
  // Solar dibuja algunos trazos interiores con <mask> (trazo de 3 recortado por su forma): se aproxima con la mitad del grosor.
  const body = icon.body.replace(/<mask[\s\S]*?<\/mask>/g, '');
  for (const m of body.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)) {
    const [, close, tag, rawAttrs, selfClose] = m;
    if (close) { if (tag === 'g') { stack.pop(); lines.push('</group>'); } continue; }
    const a = attrs(rawAttrs);
    const parent = stack[stack.length - 1];
    const style = { ...parent };
    for (const k of PAINT) if (a[k] !== undefined) style[k] = k.includes('opacity') ? (parent[k] ?? 1) * parseFloat(a[k]) : a[k];
    if (tag === 'g') { stack.push(style); lines.push(`<group${groupTransform(a.transform)}>`); if (selfClose) { stack.pop(); lines.push('</group>'); } continue; }
    const d = shapeToPath(tag, a);
    if (!d) throw new Error(`Elemento SVG no soportado: <${tag}>`);
    if (a.mask && style['stroke-width']) style['stroke-width'] = String(parseFloat(style['stroke-width']) / 2);
    const tr = groupTransform(a.transform);
    const path = `<path android:pathData="${d.replace(/\s+/g, ' ').trim()}" ${paint(style)}/>`;
    lines.push(tr ? `<group${tr}>${path}</group>` : path);
  }
  return `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${HEADER} -->\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="24dp" android:height="24dp"\n    android:viewportWidth="${icon.w}" android:viewportHeight="${icon.h}">\n    ${lines.join('\n    ')}\n</vector>\n`;
};
const iosIconSet = (name, svg) => {
  const dir = `${IOS}/Resources/Icons.xcassets/${name}.imageset`;
  write(`${dir}/${name}.svg`, svg);
  write(`${dir}/Contents.json`, JSON.stringify({ images: [{ filename: `${name}.svg`, idiom: 'universal' }], info: { author: 'xcode', version: 1 }, properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'template' } }, null, 2));
};
write(`${IOS}/Resources/Icons.xcassets/Contents.json`, JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2));
const iconNames = [];
for (const key of iconList) {
  const icon = iconData(key);
  if (!icon) throw new Error(`Ícono no encontrado: ${key}`);
  const name = iconName(key); iconNames.push([key, name]);
  iosIconSet(name, `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 ${icon.w} ${icon.h}">${icon.body.replace(/currentColor/g, '#000000')}</svg>\n`);
  write(`${AND}/res/drawable/${name}.xml`, vectorDrawable(icon));
}
// Banderas: se siguen sirviendo desde flag-icons; aquí solo los íconos de interfaz.
write(`${IOS}/Generated/ZCIconName.swift`, `// ${HEADER}\n/// Íconos disponibles (Solar Linear por defecto, \`-bold\` para activos). Úsalos con \`ZCIcon(.name)\`.\npublic enum ZCIconName: String, CaseIterable, Sendable {\n${iconNames.map(([k, n]) => `    case ${camel(n.replace(/^zc_ic_/, ''))} = "${n}" // ${k}`).join('\n')}\n}\n`);
write(`${KT}/ZcIcons.kt`, `// ${HEADER}\npackage ${PKG}\n\nimport androidx.annotation.DrawableRes\n\n/** Íconos disponibles (Solar Linear por defecto, Bold para activos). */\nobject ZcIcons {\n${iconNames.map(([k, n]) => `    @DrawableRes val ${camel(n.replace(/^zc_ic_/, ''))} = R.drawable.${n} // ${k}`).join('\n')}\n}\n`);

// ---------- Textos ----------
const flatStrings = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[p] = v; else if (v && typeof v === 'object' && !Array.isArray(v)) flatStrings(v, p, out);
  }
  return out;
};
const langs = { es: flatStrings(readJson(`${UI}/i18n/es.json`)), en: flatStrings(readJson(`${UI}/i18n/en.json`)) };
// {{param}} de Transloco → argumentos posicionales en el orden en que aparecen en español.
const params = (s) => [...new Set([...s.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]))];
const placeholders = (s, order, fmt) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, p) => fmt(order.indexOf(p) + 1));
const keys = Object.keys(langs.es).sort();
const xc = { sourceLanguage: 'es', version: '1.0', strings: {} };
for (const k of keys) {
  const order = params(langs.es[k]);
  const entry = { extractionState: 'manual', localizations: {} };
  if (order.length) entry.comment = `Argumentos: ${order.join(', ')}`;
  for (const [lang, table] of Object.entries(langs)) {
    if (table[k] === undefined) continue;
    entry.localizations[lang] = { stringUnit: { state: 'translated', value: placeholders(table[k].replace(/%/g, '%%'), order, (i) => `%${i}$@`) } };
  }
  xc.strings[k] = entry;
}
write(`${IOS}/Resources/Localizable.xcstrings`, JSON.stringify(xc, null, 2) + '\n');
const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/^([@?])/, '\\$1').replace(/\n/g, '\\n');
const androidKey = (k) => 'zc_' + snake(k);
const seen = new Map();
for (const k of keys) { const a = androidKey(k); if (seen.has(a)) throw new Error(`Clave de Android repetida: ${k} y ${seen.get(a)}`); seen.set(a, k); }
for (const [lang, table] of Object.entries(langs)) {
  const rows = keys.filter((k) => table[k] !== undefined).map((k) => {
    const order = params(langs.es[k]);
    const v = placeholders(xmlEscape(table[k].replace(/%/g, '%%')), order, (i) => `%${i}$s`);
    return `    <string name="${androidKey(k)}"${order.length ? '' : ' formatted="false"'}>${v}</string>${order.length ? ` <!-- ${order.join(', ')} -->` : ''}`;
  });
  write(`${AND}/res/${lang === 'es' ? 'values' : 'values-' + lang}/zc_strings.xml`, `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${HEADER} -->\n<resources>\n${rows.join('\n')}\n</resources>\n`);
}

// ---------- Tipografías (Google Fonts, licencia OFL; fuente en shared/fonts) ----------
// Variables (un archivo, todos los pesos) salvo Lato, que solo existe en archivos por peso.
const FONT_SRC = `${OUT}/shared/fonts`;
const FONTS = {
  zonacards: { family: 'Figtree', files: [['Figtree[wght].ttf', 'figtree', null]] },
  giftealo: { family: 'Lato', files: [['Lato-Light.ttf', 'lato_light', 300], ['Lato-Regular.ttf', 'lato_regular', 400], ['Lato-Bold.ttf', 'lato_bold', 700], ['Lato-Black.ttf', 'lato_black', 900]] },
  enjoy: { family: 'Outfit', files: [['Outfit[wght].ttf', 'outfit', null]] },
  motiva: { family: 'Geist', files: [['Geist[wght].ttf', 'geist', null]] },
};
const fontFiles = Object.values(FONTS).flatMap((f) => f.files);
for (const [file, res] of fontFiles) {
  write(`${IOS}/Resources/Fonts/${file}`, readFileSync(`${FONT_SRC}/${file}`));
  write(`${AND}/res/font/${res}.ttf`, readFileSync(`${FONT_SRC}/${file}`));
}
write(`${IOS}/Generated/ZCFonts.swift`, `// ${HEADER}\nimport CoreText\nimport Foundation\n\n/// Registra las tipografías de las cuatro marcas. Llama \`ZCFonts.register()\` una vez al iniciar la app.\npublic enum ZCFonts {\n    public static let files = [${fontFiles.map(([f]) => JSON.stringify(f)).join(', ')}]\n    private static var done = false\n\n    public static func register() {\n        guard !done else { return }\n        done = true\n        for file in files {\n            let name = (file as NSString).deletingPathExtension\n            if let url = Bundle.module.url(forResource: name, withExtension: "ttf", subdirectory: "Fonts") ?? Bundle.module.url(forResource: name, withExtension: "ttf") {\n                CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)\n            }\n        }\n    }\n}\n`);
const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
const ktFamily = (f) => f.files[0][2] === null
  ? `FontFamily(\n${WEIGHTS.map((w) => `        Font(R.font.${f.files[0][1]}, FontWeight.W${w}, variationSettings = FontVariation.Settings(FontVariation.weight(${w}))),`).join('\n')}\n    )`
  : `FontFamily(\n${f.files.map(([, res, w]) => `        Font(R.font.${res}, FontWeight.W${w}),`).join('\n')}\n    )`;
write(`${KT}/ZcFonts.kt`, `// ${HEADER}\n@file:OptIn(ExperimentalTextApi::class)\npackage ${PKG}\n\nimport androidx.compose.ui.text.ExperimentalTextApi\nimport androidx.compose.ui.text.font.Font\nimport androidx.compose.ui.text.font.FontFamily\nimport androidx.compose.ui.text.font.FontVariation\nimport androidx.compose.ui.text.font.FontWeight\n\n/** Tipografía de cada marca (Google Fonts, OFL). */\nobject ZcFonts {\n${BRANDS.map((b) => `    val ${b} = ${ktFamily(FONTS[b])}`).join('\n')}\n\n    fun forBrand(brand: ZcBrand): FontFamily = when (brand) {\n${BRANDS.map((b) => `        ZcBrand.${b.toUpperCase()} -> ${b}`).join('\n')}\n    }\n}\n`);

// ---------- Banderas (flag-icons 4x3): países del alcance y prefijos frecuentes ----------
const countriesSrc = readFileSync(`${UI}/core/domain/countries.ts`, 'utf8');
const FLAGS = [...new Set([...countriesSrc.matchAll(/code: '([a-z]{2})'/g)].map((m) => m[1]))];
const flagJobs = [];
for (const cc of FLAGS) {
  const svg = readFileSync(`node_modules/flag-icons/flags/4x3/${cc}.svg`, 'utf8');
  const name = `zc_flag_${cc}`;
  const dir = `${IOS}/Resources/Flags.xcassets/${name}.imageset`;
  write(`${dir}/${name}.svg`, svg);
  write(`${dir}/Contents.json`, JSON.stringify({ images: [{ filename: `${name}.svg`, idiom: 'universal' }], info: { author: 'xcode', version: 1 }, properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'original' } }, null, 2));
  // Android: PNG de 96 × 72 (24 × 18 dp en xxxhdpi); los escudos de varias banderas no caben en un VectorDrawable.
  flagJobs.push({ svg, file: `${AND}/res/drawable-xxxhdpi/${name}.png`, w: 96, h: 72 });
}
write(`${IOS}/Resources/Flags.xcassets/Contents.json`, JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2));
write(`${IOS}/Generated/ZCFlag.swift`, `// ${HEADER}\nimport SwiftUI\n\n/// Bandera 4:3 de un país (código ISO en minúsculas). Decorativa: acompáñala siempre del nombre o el código.\npublic struct ZCFlag: View {\n    public static let available = [${FLAGS.map((c) => JSON.stringify(c)).join(', ')}]\n    private let code: String\n    private let height: CGFloat\n    public init(_ code: String, height: CGFloat = 15) { self.code = code.lowercased(); self.height = height }\n    public var body: some View {\n        Image("zc_flag_\\(code)", bundle: .module).resizable().aspectRatio(4.0 / 3.0, contentMode: .fit)\n            .frame(height: height).clipShape(RoundedRectangle(cornerRadius: 2)).accessibilityHidden(true)\n    }\n}\n`);
write(`${KT}/ZcFlags.kt`, `// ${HEADER}\npackage ${PKG}\n\nimport androidx.annotation.DrawableRes\n\n/** Banderas 4:3 por código ISO en minúsculas. */\nobject ZcFlags {\n    @DrawableRes\n    fun of(code: String): Int? = when (code.lowercase()) {\n${FLAGS.map((c) => `        "${c}" -> R.drawable.zc_flag_${c}`).join('\n')}\n        else -> null\n    }\n}\n`);

// ---------- Íconos de app (marcas con carpeta en assets/brand) ----------
const BRAND_DIR = `${UI}/assets/brand`;
const brandsWithAssets = existsSync(BRAND_DIR) ? readdirSync(BRAND_DIR).filter((b) => existsSync(`${BRAND_DIR}/${b}/${b}-isotype.svg`)) : [];
const pngJobs = [];
for (const b of brandsWithAssets) {
  const iso = readFileSync(`${BRAND_DIR}/${b}/${b}-isotype.svg`, 'utf8');
  const isoBody = iso.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const isoColor = isoBody.match(/fill="(#[0-9a-fA-F]{6})"/)?.[1] ?? '#000000';
  const recolor = (c) => isoBody.replace(/fill="#[0-9a-fA-F]{6}"/g, `fill="${c}"`);
  // iOS 18: claro (fondo blanco), oscuro (fondo transparente, el sistema pone el oscuro) y tintado (escala de grises).
  const s = (body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 48 48">${bg ? `<rect width="48" height="48" fill="${bg}"/>` : ''}<g transform="translate(9 9) scale(0.625)">${body}</g></svg>`;
  const appset = `${OUT}/ios/BrandAssets/${b}/AppIcon.appiconset`;
  pngJobs.push({ svg: s(recolor(isoColor), '#FFFFFF'), file: `${appset}/AppIcon.png`, opaque: true });
  pngJobs.push({ svg: s(recolor(isoColor)), file: `${appset}/AppIcon-dark.png` });
  pngJobs.push({ svg: s(recolor('#FFFFFF')), file: `${appset}/AppIcon-tinted.png` });
  write(`${appset}/Contents.json`, JSON.stringify({ images: [
    { filename: 'AppIcon.png', idiom: 'universal', platform: 'ios', size: '1024x1024' },
    { appearances: [{ appearance: 'luminosity', value: 'dark' }], filename: 'AppIcon-dark.png', idiom: 'universal', platform: 'ios', size: '1024x1024' },
    { appearances: [{ appearance: 'luminosity', value: 'tinted' }], filename: 'AppIcon-tinted.png', idiom: 'universal', platform: 'ios', size: '1024x1024' },
  ], info: { author: 'xcode', version: 1 } }, null, 2));
  // Android: ícono adaptativo de 108 dp; el isotipo ocupa 56 dp dentro de la zona segura de 66 dp.
  const res = `${OUT}/android/BrandAssets/${b}/res`;
  const fg = (c) => vectorDrawable({ body: `<g transform="translate(26 26) scale(1.1667)">${recolor(c)}</g>`, w: 108, h: 108 }).replace(/24dp/g, '108dp');
  write(`${res}/drawable/ic_launcher_foreground.xml`, fg(isoColor));
  write(`${res}/drawable/ic_launcher_monochrome.xml`, fg('#000000'));
  write(`${res}/values/ic_launcher_background.xml`, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n`);
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${HEADER} -->\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>\n</adaptive-icon>\n`;
  write(`${res}/mipmap-anydpi-v26/ic_launcher.xml`, adaptive);
  write(`${res}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptive);
}
pngJobs.push(...flagJobs);
if (pngJobs.length) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  for (const j of pngJobs) {
    const svg = j.w ? j.svg.replace(/<svg([^>]*)>/, (m, a) => `<svg${a.replace(/\s(width|height)="[^"]*"/g, '')} width="${j.w}" height="${j.h}" preserveAspectRatio="none">`) : j.svg;
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    mkdirSync(dirname(j.file), { recursive: true });
    await page.locator('svg').screenshot({ path: j.file, omitBackground: !j.opaque });
  }
  await browser.close();
}

// ---------- Resumen para la matriz de paridad ----------
write(`${OUT}/shared/manifest.json`, JSON.stringify({
  generatedFrom: `@zonacards/ui ${version}`,
  themes: themes.map((t) => ({ id: t.id, font: t.font, colors: Object.keys(t.colors).length, skipped: t.skipped })),
  colors: colorKeys.length, icons: iconNames.length, strings: keys.length, appIcons: brandsWithAssets,
  fonts: Object.fromEntries(BRANDS.map((b) => [b, FONTS[b].family])), flags: FLAGS,
}, null, 2) + '\n');
console.log(`Nativo: ${themes.length} temas × ${colorKeys.length} colores, ${iconNames.length} íconos, ${keys.length} textos, íconos de app: ${brandsWithAssets.join(', ') || 'ninguno'}`);
await import('./build-native-domain.mjs');
