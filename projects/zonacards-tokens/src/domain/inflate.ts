/**
 * Descompresor DEFLATE «crudo» (RFC 1951) síncrono y sin dependencias, para leer los XLSX (ZIP con método 8) sin
 * `DecompressionStream`, que es asíncrono. Sigue el algoritmo de referencia `puff.c` de zlib. Tomado de Enjoy Beneficios.
 */

const BASE_LONGITUD = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131,
  163, 195, 227, 258,
];
const EXTRA_LONGITUD = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
];
const BASE_DISTANCIA = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049,
  3073, 4097, 6145, 8193, 12289, 16385, 24577,
];
const EXTRA_DISTANCIA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
];
/** Orden en que llegan las longitudes del código de longitudes (bloques dinámicos). */
const ORDEN_LONGITUDES = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

interface Huffman {
  /** Cantidad de códigos por longitud (1–15). */
  cuenta: Uint16Array;
  /** Símbolos ordenados por código canónico. */
  simbolos: Uint16Array;
}

function huffman(longitudes: ArrayLike<number>, n: number): Huffman {
  const cuenta = new Uint16Array(16);
  const simbolos = new Uint16Array(n);
  for (let i = 0; i < n; i++) cuenta[longitudes[i] ?? 0] += 1;
  cuenta[0] = 0;
  const desde = new Uint16Array(16);
  for (let l = 1; l < 15; l++) desde[l + 1] = desde[l] + cuenta[l];
  for (let i = 0; i < n; i++) {
    const l = longitudes[i] ?? 0;
    if (!l) continue;
    simbolos[desde[l]] = i;
    desde[l] += 1;
  }
  return { cuenta, simbolos };
}

class Inflador {
  private pos = 0;
  private buffer = 0;
  private cantidad = 0;
  private salida: Uint8Array;
  private largo = 0;

  constructor(private readonly entrada: Uint8Array) {
    this.salida = new Uint8Array(Math.max(1024, entrada.length * 4));
  }

  private bits(n: number): number {
    let v = this.buffer;
    while (this.cantidad < n) {
      if (this.pos >= this.entrada.length) throw new Error('deflate: datos incompletos');
      v |= this.entrada[this.pos++] << this.cantidad;
      this.cantidad += 8;
    }
    this.buffer = v >>> n;
    this.cantidad -= n;
    return v & ((1 << n) - 1);
  }

  private asegurar(extra: number): void {
    if (this.largo + extra <= this.salida.length) return;
    let tam = this.salida.length * 2;
    while (tam < this.largo + extra) tam *= 2;
    const nueva = new Uint8Array(tam);
    nueva.set(this.salida.subarray(0, this.largo));
    this.salida = nueva;
  }

  private simbolo(h: Huffman): number {
    let codigo = 0;
    let primero = 0;
    let indice = 0;
    for (let l = 1; l <= 15; l++) {
      codigo |= this.bits(1);
      const c = h.cuenta[l];
      if (codigo - c < primero) return h.simbolos[indice + (codigo - primero)];
      indice += c;
      primero = (primero + c) << 1;
      codigo <<= 1;
    }
    throw new Error('deflate: código no válido');
  }

  private almacenado(): void {
    this.buffer = 0;
    this.cantidad = 0;
    if (this.pos + 4 > this.entrada.length) throw new Error('deflate: datos incompletos');
    const len = this.entrada[this.pos] | (this.entrada[this.pos + 1] << 8);
    const nlen = this.entrada[this.pos + 2] | (this.entrada[this.pos + 3] << 8);
    this.pos += 4;
    if (len !== (~nlen & 0xffff)) throw new Error('deflate: bloque almacenado dañado');
    if (this.pos + len > this.entrada.length) throw new Error('deflate: datos incompletos');
    this.asegurar(len);
    this.salida.set(this.entrada.subarray(this.pos, this.pos + len), this.largo);
    this.largo += len;
    this.pos += len;
  }

  private codigos(lit: Huffman, dist: Huffman): void {
    for (;;) {
      const s = this.simbolo(lit);
      if (s < 256) {
        this.asegurar(1);
        this.salida[this.largo++] = s;
      } else if (s === 256) {
        return;
      } else {
        const i = s - 257;
        if (i >= 29) throw new Error('deflate: longitud no válida');
        const largo = BASE_LONGITUD[i] + this.bits(EXTRA_LONGITUD[i]);
        const d = this.simbolo(dist);
        if (d >= 30) throw new Error('deflate: distancia no válida');
        const distancia = BASE_DISTANCIA[d] + this.bits(EXTRA_DISTANCIA[d]);
        if (distancia > this.largo) throw new Error('deflate: distancia fuera de rango');
        this.asegurar(largo);
        for (let k = 0; k < largo; k++) {
          this.salida[this.largo] = this.salida[this.largo - distancia];
          this.largo++;
        }
      }
    }
  }

  private fijo(): void {
    const l = new Uint8Array(288);
    l.fill(8, 0, 144);
    l.fill(9, 144, 256);
    l.fill(7, 256, 280);
    l.fill(8, 280, 288);
    const d = new Uint8Array(30).fill(5);
    this.codigos(huffman(l, 288), huffman(d, 30));
  }

  private dinamico(): void {
    const nlit = this.bits(5) + 257;
    const ndist = this.bits(5) + 1;
    const ncod = this.bits(4) + 4;
    const longitudes = new Uint8Array(320);
    for (let i = 0; i < ncod; i++) longitudes[ORDEN_LONGITUDES[i]] = this.bits(3);
    const codLong = huffman(longitudes, 19);
    longitudes.fill(0);
    let i = 0;
    while (i < nlit + ndist) {
      const s = this.simbolo(codLong);
      if (s < 16) {
        longitudes[i++] = s;
        continue;
      }
      let valor = 0;
      let repetir: number;
      if (s === 16) {
        if (i === 0) throw new Error('deflate: repetición sin longitud previa');
        valor = longitudes[i - 1];
        repetir = 3 + this.bits(2);
      } else if (s === 17) repetir = 3 + this.bits(3);
      else repetir = 11 + this.bits(7);
      if (i + repetir > nlit + ndist) throw new Error('deflate: demasiadas longitudes');
      while (repetir--) longitudes[i++] = valor;
    }
    const lit = huffman(longitudes.subarray(0, nlit), nlit);
    const dist = huffman(longitudes.subarray(nlit, nlit + ndist), ndist);
    this.codigos(lit, dist);
  }

  inflar(): Uint8Array {
    let ultimo = 0;
    while (!ultimo) {
      ultimo = this.bits(1);
      const tipo = this.bits(2);
      if (tipo === 0) this.almacenado();
      else if (tipo === 1) this.fijo();
      else if (tipo === 2) this.dinamico();
      else throw new Error('deflate: tipo de bloque no válido');
    }
    return this.salida.slice(0, this.largo);
  }
}

/** Descomprime datos DEFLATE sin encabezado zlib (método 8 de los ZIP). Lanza `Error` si están dañados. */
export function inflateRaw(datos: Uint8Array): Uint8Array {
  return new Inflador(datos).inflar();
}
