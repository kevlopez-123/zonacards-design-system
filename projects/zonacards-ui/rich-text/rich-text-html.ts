/**
 * HTML del editor de texto enriquecido: qué etiquetas se permiten y cómo se convierte lo que se pega (Word, Google Docs, una web).
 * Sin dependencias de Angular: funciones puras sobre el DOM, para probarlas con ejemplos reales.
 *
 * El contenido de un editor así suele publicarse en una web pública (términos, políticas): **vuelve a sanearlo en el servidor** con la
 * misma lista de etiquetas. Este saneado protege al editor y a la vista previa, no sustituye al del servidor.
 */

/** Etiquetas de formato que se conservan; el resto se desenvuelve (queda su texto) o, si es ejecutable o de contenido embebido, se descarta entero. */
export const RICH_TEXT_ALLOWED = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'A', 'H2', 'H3', 'BLOCKQUOTE',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
]);
const DROP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED', 'HEAD', 'TITLE', 'META', 'LINK', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'CANVAS', 'AUDIO', 'VIDEO', 'XML']);

/**
 * Una sublista debe ir dentro de un elemento (<li><ul/></li>). Google Docs y el propio navegador al anidar con la sangría la dejan como
 * hermana (<ul><li/><ul/></ul>), que es HTML inválido: se mueve dentro del elemento anterior.
 */
function nestLists(root: ParentNode) {
  root.querySelectorAll('ul > ul, ul > ol, ol > ul, ol > ol').forEach(sub => {
    const prev = sub.previousElementSibling;
    const li = prev && prev.tagName === 'LI' ? prev : (() => { const n = document.createElement('li'); sub.before(n); return n; })();
    li.appendChild(sub);
  });
}

/** Deja solo las etiquetas de formato permitidas; los enlaces, solo http(s) o mailto y en otra pestaña; las celdas, solo colspan y rowspan. */
export function sanitizeRichText(html: string): string {
  const t = document.createElement('template'); t.innerHTML = html;
  const clean = (root: ParentNode) => {
    for (const n of Array.from(root.childNodes)) {
      if (n.nodeType === Node.COMMENT_NODE) { n.remove(); continue; }
      if (n.nodeType !== Node.ELEMENT_NODE) continue;
      const el = n as Element;
      if (DROP.has(el.tagName.toUpperCase())) { el.remove(); continue; }
      clean(el);
      if (!RICH_TEXT_ALLOWED.has(el.tagName)) { el.replaceWith(...Array.from(el.childNodes)); continue; }
      [...el.attributes].forEach(a => {
        const span = (el.tagName === 'TD' || el.tagName === 'TH') && (a.name === 'colspan' || a.name === 'rowspan') && /^\d{1,2}$/.test(a.value);
        if (!(el.tagName === 'A' && a.name === 'href') && !span) el.removeAttribute(a.name);
      });
      if (el.tagName === 'A') {
        if (!/^(https?:|mailto:)/i.test(el.getAttribute('href') ?? '')) el.removeAttribute('href');
        el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer');
      }
    }
  };
  clean(t.content);
  nestLists(t.content);
  return t.innerHTML.replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>').replace(/^<br>$/, '');
}

const styleOf = (el: Element) => (el.getAttribute('style') ?? '').toLowerCase();
const unwrap = (el: Element) => el.replaceWith(...Array.from(el.childNodes));
const retag = (el: Element, tag: string) => { const n = document.createElement(tag); n.append(...Array.from(el.childNodes)); el.replaceWith(n); };

/** Word y Google Docs dicen "negrita" con un estilo (font-weight) en vez de con <b>: se lleva a etiquetas. */
function semanticSpans(root: ParentNode) {
  root.querySelectorAll('span, font').forEach(el => {
    const s = styleOf(el);
    const tags: string[] = [];
    if (/font-weight:\s*(bold|[6-9]00)/.test(s)) tags.push('strong');
    if (/font-style:\s*italic/.test(s)) tags.push('em');
    if (/text-decoration[^;]*underline/.test(s)) tags.push('u');
    if (/text-decoration[^;]*line-through/.test(s)) tags.push('s');
    if (!tags.length) { unwrap(el); return; }
    let inner: Node[] = Array.from(el.childNodes);
    for (const tag of tags) { const w = document.createElement(tag); w.append(...inner); inner = [w]; }
    el.replaceWith(...inner);
  });
}

/**
 * Word no usa <ul> ni <ol>: cada elemento es un <p style="mso-list:l0 level2 lfo1"> con su viñeta o su número en un <span>. Se reconstruyen
 * las listas (con sus niveles) a partir de esos párrafos.
 */
function wordLists(root: ParentNode) {
  const isItem = (n: Node | null): n is HTMLElement =>
    !!n && n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'P' && /mso-list:\s*(?!none)[^;"]*level\d+/i.test(styleOf(n as Element));
  const parents = new Set<ParentNode>();
  root.querySelectorAll('p').forEach(p => { if (isItem(p) && p.parentNode) parents.add(p.parentNode); });
  parents.forEach(parent => {
    let n: ChildNode | null = parent.firstChild;
    while (n) {
      if (!isItem(n)) { n = n.nextSibling; continue; }
      const run: HTMLElement[] = [];
      let m: ChildNode | null = n;
      while (m && (isItem(m) || (m.nodeType === Node.TEXT_NODE && !m.textContent?.trim()))) { if (isItem(m)) run.push(m); m = m.nextSibling; }
      const after: ChildNode | null = m;
      const first = run[0];
      const host = document.createDocumentFragment();
      const stack: { list: Element; level: number }[] = [];
      for (const p of run) {
        const level = Number(/level(\d+)/i.exec(styleOf(p))?.[1] ?? 1);
        const markerEl = p.querySelector('[style*="mso-list:ignore" i], [style*="mso-list: ignore" i]');
        let marker = (markerEl?.textContent ?? '').trim();
        markerEl?.remove();
        if (!marker) {
          const lead = /^\s*((?:[·•o§▪–-])|(?:\(?\d+[.)])|(?:\(?[a-zA-Z][.)])|(?:[ivxlcdm]+[.)]))\s+/.exec(p.textContent ?? '');
          if (lead) { marker = lead[1]; const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); const tn = w.nextNode(); if (tn) tn.textContent = (tn.textContent ?? '').replace(lead[0], ''); }
        }
        const ordered = /[0-9a-z]/i.test(marker.replace(/[.)()]/g, '')) && !/^[·•o§▪–-]$/.test(marker);
        const tag = ordered ? 'ol' : 'ul';
        while (stack.length > level) stack.pop();
        if (stack.length === level && stack[stack.length - 1].list.tagName.toLowerCase() !== tag) stack.pop();
        while (stack.length < level) {
          const list = document.createElement(tag);
          const parentList = stack[stack.length - 1]?.list;
          if (parentList) (parentList.lastElementChild ?? parentList.appendChild(document.createElement('li'))).appendChild(list); else host.appendChild(list);
          stack.push({ list, level: stack.length + 1 });
        }
        const li = document.createElement('li');
        li.append(...Array.from(p.childNodes));
        stack[stack.length - 1].list.appendChild(li);
      }
      first.replaceWith(host);
      run.slice(1).forEach(p => p.remove());
      n = after;
    }
  });
}

/**
 * Convierte lo que se pega (HTML de Word, Google Docs, una web…) en el HTML del editor conservando su estructura (títulos, listas con
 * niveles, tablas, enlaces, negrita, cursiva, subrayado y tachado) y quitando colores, fuentes, tamaños y clases de origen.
 */
export function pasteToRichHtml(html: string): string {
  const t = document.createElement('template'); t.innerHTML = html;
  const root = t.content;
  // Comentarios (incluidos los condicionales de Word) y etiquetas que no son contenido.
  const comments: Node[] = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  while (w.nextNode()) comments.push(w.currentNode);
  comments.forEach(c => c.parentNode?.removeChild(c));
  root.querySelectorAll('*').forEach(el => { if (DROP.has(el.tagName.toUpperCase()) || /^o:|^w:|^v:|^st1:/i.test(el.tagName)) el.remove(); });
  // Google Docs envuelve todo en <b style="font-weight:normal">: no es negrita.
  root.querySelectorAll('b, strong').forEach(b => { if (/font-weight:\s*(normal|400)/.test(styleOf(b))) unwrap(b); });
  wordLists(root);
  semanticSpans(root);
  // Niveles de título del editor: H2 y H3.
  root.querySelectorAll('h1').forEach(h => retag(h, 'h2'));
  root.querySelectorAll('h4, h5, h6').forEach(h => retag(h, 'h3'));
  // Una negrita dentro de un título no aporta (el título ya es negrita).
  root.querySelectorAll('h2 b, h2 strong, h3 b, h3 strong').forEach(unwrap);
  root.querySelectorAll('colgroup, col, caption, tfoot').forEach(unwrap);
  nestLists(root);
  // Un <div> que envuelve títulos, párrafos o listas (lo habitual en una página web) no aporta: sin él no quedan bloques dentro de un párrafo.
  Array.from(root.querySelectorAll('div')).reverse().forEach(d => { if (d.querySelector(':scope > :is(p, h2, h3, ul, ol, table, blockquote, div)')) unwrap(d); });
  // Google Docs y Word ponen un <p> dentro de cada elemento de lista y de cada celda: con un solo párrafo (y, a lo sumo, sublistas) se quita.
  root.querySelectorAll('li, td, th').forEach(cell => {
    const kids = Array.from(cell.children);
    const paragraphs = kids.filter(k => k.tagName === 'P');
    if (paragraphs.length === 1 && kids.every(k => k === paragraphs[0] || k.tagName === 'UL' || k.tagName === 'OL')) unwrap(paragraphs[0]);
  });
  const box = document.createElement('div'); box.append(root);
  return sanitizeRichText(box.innerHTML).replace(/<p>(?:\s|&nbsp;|<br>)*<\/p>/g, '').trim();
}
