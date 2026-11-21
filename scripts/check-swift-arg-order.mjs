// Swift exige que los argumentos con nombre vayan en el orden del inicializador. Esta comprobación revisa las llamadas a los componentes con muchos
// parámetros (ZCTextField, ZCField, selects…) en el Swift escrito a mano, para no gastar una corrida de CI en un error de orden.
// Uso: node scripts/check-swift-arg-order.mjs   (sale con 1 si hay alguno fuera de orden)
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['projects/zonacards-native/ios/Sources/ZonacardsUI', 'projects/zonacards-native/ios/Catalog/App', 'projects/zonacards-native/ios/Tests'];
const orders = {
  ZCTextField: ['text', 'placeholder', 'hint', 'error', 'success', 'info', 'required', 'optional', 'password', 'keyboard', 'capitalization', 'submitLabel', 'allowed', 'rejectMessage', 'maxLength', 'showCounter', 'multiline', 'prefix', 'suffix', 'trailingIcon', 'trailingLabel', 'onTrailingTap', 'hideLabel', 'flash', 'leading', 'below', 'reserve', 'onSubmit', 'onBlur', 'onFocusChange'],
  ZCField: ['required', 'optional', 'hint', 'error', 'counter', 'success', 'info', 'flash', 'reserve'],
  ZCSelect: ['options', 'selection', 'placeholder', 'hint', 'error', 'required', 'optional', 'info'],
  ZCMultiSelect: ['options', 'selection', 'placeholder', 'hint', 'error', 'required', 'optional'],
  ZCDateField: ['iso', 'min', 'max', 'hint', 'error', 'required', 'optional'],
  ZCMoneyField: ['amount', 'country', 'hint', 'error', 'required'],
  ZCPhoneField: ['digits', 'country', 'hint', 'error', 'required'],
  ZCTaxIdField: ['value', 'country', 'label', 'hint', 'error', 'required'],
  ZCOtpField: ['value', 'length', 'error', 'hint', 'valid', 'onComplete'],
  ZCPasswordField: ['text', 'hint', 'error', 'required', 'submitLabel', 'onSubmit'],
  ZCTagsField: ['value', 'kind', 'max', 'placeholder', 'hint', 'error', 'required', 'optional'],
  ZCTimeField: ['value', 'hint', 'error', 'info', 'required', 'optional'],
  ZCChip: ['selected', 'onRemove', 'invalid', 'icon'],
  ZCButton: ['variant', 'size', 'leadingIcon', 'trailingIcon', 'loading', 'block'],
  ZCAlert: ['tone', 'text'],
  ZCState: ['kind', 'icon', 'text', 'reference', 'details', 'onCopied'],
};

function* swiftFiles(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* swiftFiles(p); else if (p.endsWith('.swift')) yield p;
  }
}

/** Divide una lista de argumentos en el nivel superior (respeta paréntesis, corchetes, llaves y cadenas). */
function splitArgs(s) {
  const out = [];
  let depth = 0, cur = '', inStr = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      cur += ch;
      if (ch === String.fromCharCode(92)) { cur += s[++i] ?? ''; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; cur += ch; continue; }
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

let bad = 0, calls = 0;
for (const root of ROOTS) {
  for (const f of swiftFiles(root)) {
    const t = fs.readFileSync(f, 'utf8');
    for (const [name, order] of Object.entries(orders)) {
      const re = new RegExp('\\b' + name + '\\(', 'g');
      let m;
      while ((m = re.exec(t))) {
        if (/(struct|enum|class|func|init|extension)\s+$/.test(t.slice(Math.max(0, m.index - 12), m.index))) continue;
        let i = m.index + m[0].length, depth = 1;
        const start = i;
        while (i < t.length && depth > 0) {
          const ch = t[i];
          if (ch === '"') { i++; while (i < t.length && t[i] !== '"') { if (t[i] === String.fromCharCode(92)) i++; i++; } }
          else if (ch === '(' || ch === '[') depth++;
          else if (ch === ')' || ch === ']') depth--;
          i++;
        }
        calls++;
        const labels = splitArgs(t.slice(start, i - 1)).map(a => /^\s*([A-Za-z_]+)\s*:/.exec(a)?.[1]).filter(Boolean);
        let last = -1;
        for (const l of labels) {
          const idx = order.indexOf(l);
          if (idx < 0) continue;
          if (idx < last) { bad++; console.log(`${f}:${t.slice(0, m.index).split('\n').length}  ${name}: '${l}' va antes en el inicializador`); break; }
          last = idx;
        }
      }
    }
  }
}
console.log(`${calls} llamadas revisadas, ${bad} fuera de orden`);
process.exit(bad ? 1 : 0);
