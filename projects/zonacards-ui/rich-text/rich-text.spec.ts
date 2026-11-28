import { describe, expect, it } from 'vitest';
import { pasteToRichHtml, sanitizeRichText } from './rich-text-html';

describe('sanitizeRichText', () => {
  it('deja solo formato permitido y quita atributos', () => {
    expect(sanitizeRichText('<p style="color:red" onclick="x()">Hola <b>mundo</b><span>!</span></p>')).toBe('<p>Hola <b>mundo</b>!</p>');
  });
  it('descarta entero lo ejecutable o embebido, sin dejar su texto', () => {
    expect(sanitizeRichText('<p>a<script>alert(1)</script><style>p{color:red}</style><iframe src="https://x"></iframe>b</p>')).toBe('<p>ab</p>');
    expect(sanitizeRichText('<p>a</p><svg><script>1</script></svg><form><input value="x"></form>')).toBe('<p>a</p>');
  });
  it('enlaces: solo http(s) o mailto, en otra pestaña', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe('<a target="_blank" rel="noopener noreferrer">x</a>');
    expect(sanitizeRichText('<a href="https://giftealo.com" class="c">g</a>')).toBe('<a href="https://giftealo.com" target="_blank" rel="noopener noreferrer">g</a>');
    expect(sanitizeRichText('<a href="mailto:hola@giftealo.com">m</a>')).toContain('href="mailto:hola@giftealo.com"');
  });
  it('convierte div en p y vacía un br suelto', () => {
    expect(sanitizeRichText('<div>a</div>')).toBe('<p>a</p>');
    expect(sanitizeRichText('<br>')).toBe('');
  });
  it('permite subtítulo, sublistas y tablas con colspan y rowspan numéricos', () => {
    expect(sanitizeRichText('<h3 id="x">S</h3>')).toBe('<h3>S</h3>');
    expect(sanitizeRichText('<ul><li>a<ul><li>b</li></ul></li></ul>')).toBe('<ul><li>a<ul><li>b</li></ul></li></ul>');
    expect(sanitizeRichText('<table class="t"><tbody><tr><th colspan="2" style="x" onclick="y">P</th><td rowspan="x">1</td></tr></tbody></table>'))
      .toBe('<table><tbody><tr><th colspan="2">P</th><td>1</td></tr></tbody></table>');
  });
  it('quita los comentarios (incluidos los condicionales de Word)', () => {
    expect(sanitizeRichText('<p>a<!-- x --><!--[if gte mso 9]><xml>1</xml><![endif]-->b</p>')).toBe('<p>ab</p>');
  });
});

describe('sanitizeRichText · sublistas', () => {
  it('una sublista hermana del elemento (lo que deja la sangría del navegador) pasa a ir dentro de él', () => {
    expect(sanitizeRichText('<ul><li>Uno</li><ul><li>Dos</li></ul><li>Tres</li></ul>')).toBe('<ul><li>Uno<ul><li>Dos</li></ul></li><li>Tres</li></ul>');
    expect(sanitizeRichText('<ol><li>A</li><ol><li>B</li><ol><li>C</li></ol></ol></ol>')).toBe('<ol><li>A<ol><li>B<ol><li>C</li></ol></li></ol></li></ol>');
  });
  it('una sublista sin elemento anterior recibe uno', () => {
    expect(sanitizeRichText('<ul><ul><li>x</li></ul></ul>')).toBe('<ul><li><ul><li>x</li></ul></li></ul>');
  });
});

describe('pasteToRichHtml · Google Docs', () => {
  const docs = `<meta charset='utf-8'><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1f2e">` +
    `<h1 dir="ltr" style="line-height:1.38;margin-top:20pt;"><span style="font-size:20pt;font-family:Arial;color:#000;font-weight:700;">Términos y condiciones</span></h1>` +
    `<p dir="ltr" style="line-height:1.38;"><span style="font-size:11pt;font-weight:400;">Al usar el servicio </span><span style="font-weight:700;">aceptas</span><span style="font-style:italic;"> estas reglas</span><span>.</span></p>` +
    `<ul style="margin-top:0;"><li dir="ltr" style="list-style-type:disc;"><p dir="ltr"><span>Primero</span></p></li>` +
    `<ul style="margin-top:0;"><li dir="ltr" style="list-style-type:circle;"><p dir="ltr"><span>Sub</span></p></li></ul>` +
    `<li dir="ltr"><p dir="ltr"><span>Segundo</span></p></li></ul></b>`;

  it('el envoltorio con font-weight normal no vuelve todo negrita, y los estilos pasan a etiquetas', () => {
    const out = pasteToRichHtml(docs);
    expect(out).toContain('<h2>Términos y condiciones</h2>');
    expect(out).toContain('<p>Al usar el servicio <strong>aceptas</strong><em> estas reglas</em>.</p>');
    expect(out).not.toMatch(/<b>|style=|font-family|color/);
  });
  it('la sublista queda dentro de su elemento (li > ul), no como hermana', () => {
    const out = pasteToRichHtml(docs);
    expect(out).toContain('<ul><li>Primero<ul><li>Sub</li></ul></li><li>Segundo</li></ul>');
  });
});

describe('pasteToRichHtml · Word', () => {
  const word = `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><style>p.MsoNormal{margin:0cm}</style></head><body><!--StartFragment-->` +
    `<p class=MsoNormal><b>Política de privacidad</b><o:p></o:p></p>` +
    `<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><![endif]>Datos que recopilamos<o:p></o:p></p>` +
    `<p class=MsoListParagraphCxSpMiddle style='margin-left:54.0pt;text-indent:-18.0pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>a.<span style='font:7.0pt "Times New Roman"'>&nbsp;</span></span><![endif]>Nombre y correo<o:p></o:p></p>` +
    `<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>2.<span style='font:7.0pt "Times New Roman"'>&nbsp;</span></span><![endif]>Uso de los datos<o:p></o:p></p>` +
    `<p class=MsoNormal><o:p>&nbsp;</o:p></p><!--EndFragment--></body></html>`;

  it('reconstruye las listas numeradas con sus niveles a partir de los párrafos con mso-list', () => {
    expect(pasteToRichHtml(word)).toBe('<p><b>Política de privacidad</b></p><ol><li>Datos que recopilamos<ol><li>Nombre y correo</li></ol></li><li>Uso de los datos</li></ol>');
  });
  it('una lista con viñetas se reconoce por su marcador', () => {
    const bullets = `<p style='mso-list:l1 level1 lfo2'><span style='mso-list:Ignore'>·<span>&nbsp;&nbsp;</span></span>Uno</p><p style='mso-list:l1 level1 lfo2'><span style='mso-list:Ignore'>·<span>&nbsp;&nbsp;</span></span>Dos</p>`;
    expect(pasteToRichHtml(bullets)).toBe('<ul><li>Uno</li><li>Dos</li></ul>');
  });
});

describe('pasteToRichHtml · una página web y otros casos', () => {
  it('conserva títulos y enlaces, quita clases, colores, scripts y estilos, y no deja bloques dentro de un párrafo', () => {
    const web = `<div class="article" style="color:red"><h2 class="t">Título</h2><p>Texto <a href="https://giftealo.com" style="color:blue">enlace</a> <a href="javascript:alert(1)">malo</a></p><script>alert(1)</script><style>p{color:red}</style></div>`;
    expect(pasteToRichHtml(web)).toBe('<h2>Título</h2><p>Texto <a href="https://giftealo.com" target="_blank" rel="noopener noreferrer">enlace</a> <a target="_blank" rel="noopener noreferrer">malo</a></p>');
  });
  it('los niveles de título del editor son dos: h1 pasa a h2 y h4 a h6 pasan a h3', () => {
    expect(pasteToRichHtml('<h1>a</h1><h2>b</h2><h3>c</h3><h4>d</h4><h6>e</h6>')).toBe('<h2>a</h2><h2>b</h2><h3>c</h3><h3>d</h3><h3>e</h3>');
  });
  it('conserva una tabla (con colspan) y quita sus estilos, columnas y párrafos internos', () => {
    const table = `<table style="border:1px solid"><colgroup><col></colgroup><tbody><tr><th colspan="2" style="x">Plan</th></tr><tr><td><p>Gratis</p></td><td>S/ 0</td></tr></tbody></table>`;
    expect(pasteToRichHtml(table)).toBe('<table><tbody><tr><th colspan="2">Plan</th></tr><tr><td>Gratis</td><td>S/ 0</td></tr></tbody></table>');
  });
  it('subrayado y tachado de estilo pasan a <u> y <s>', () => {
    expect(pasteToRichHtml('<p><span style="text-decoration:underline">u</span><span style="text-decoration: line-through">s</span></p>')).toBe('<p><u>u</u><s>s</s></p>');
  });
  it('quita los párrafos vacíos', () => {
    expect(pasteToRichHtml('<p>a</p><p>&nbsp;</p><p><br></p><p>b</p>')).toBe('<p>a</p><p>b</p>');
  });
  it('un texto sin formato queda igual', () => {
    expect(pasteToRichHtml('Hola mundo')).toBe('Hola mundo');
  });
  it('no deja pasar nada ejecutable', () => {
    const out = pasteToRichHtml('<p onclick="x()">a<img src=x onerror="alert(1)"><iframe src="https://x"></iframe><svg onload="alert(1)"></svg></p>');
    expect(out).toBe('<p>a</p>');
  });
});
