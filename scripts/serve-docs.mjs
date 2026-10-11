// Sirve docs/design-system en http://localhost:4300 para comparar el design system de referencia con /catalogo.
// Sin dependencias: solo node:http y node:fs.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

// Relativo al script: funciona sin importar desde qué carpeta se lance.
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'design-system');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const port = Number(process.env.PORT ?? 4300);

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^([\\/])+/, '');
  const file = join(root, path || 'index.html');
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('No encontrado');
  }
}).listen(port, () => console.log(`Design system de referencia en http://localhost:${port}`));
