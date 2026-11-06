import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { tokenize } from '@zonacards/ui/code-block';
import { TreeComponent, treeIds, ZcTreeNode } from '@zonacards/ui/tree';

class NoLoader implements TranslocoLoader { getTranslation() { return of({}); } }

describe('code-block · tokenize', () => {
  it('JSON: claves, cadenas, números y literales', () => {
    const [line] = tokenize('{"total": 12.5, "paid": true, "name": "Ana", "x": null}', 'json');
    const kinds = Object.fromEntries(line.filter(t => t.k !== 'plain' && t.k !== 'punct').map(t => [t.t, t.k]));
    expect(kinds['"total"']).toBe('key');
    expect(kinds['12.5']).toBe('num');
    expect(kinds['true']).toBe('lit');
    expect(kinds['"Ana"']).toBe('str');
    expect(kinds['null']).toBe('lit');
  });
  it('no pierde texto: unir los tokens devuelve la línea original', () => {
    const src = 'curl -X GET "https://api" # comentario';
    expect(tokenize(src, 'bash')[0].map(t => t.t).join('')).toBe(src);
    expect(tokenize('a\nb', 'text')).toHaveLength(2);
  });
});

describe('zc-tree', () => {
  const nodes: ZcTreeNode[] = [
    { id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }, { id: 'a2', label: 'A2' }] },
    { id: 'b', label: 'B' },
  ];
  const make = () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideTransloco({ config: { availableLangs: ['es'], defaultLang: 'es' }, loader: NoLoader })] });
    const f = TestBed.createComponent(TreeComponent);
    f.componentRef.setInput('nodes', nodes); f.componentRef.setInput('label', 'Árbol'); f.componentRef.setInput('selection', 'checkbox');
    return f;
  };
  it('treeIds recorre todos los nodos', () => expect(treeIds(nodes)).toEqual(['a', 'a1', 'a2', 'b']));
  it('estado mixto del padre según sus hojas', () => {
    const f = make(); const t = f.componentInstance;
    t.selected.set(['a1']); expect(t.checkState(nodes[0])).toBe('mixed');
    t.selected.set(['a1', 'a2']); expect(t.checkState(nodes[0])).toBe('on');
    t.selected.set([]); expect(t.checkState(nodes[0])).toBe('off');
  });
  it('solo muestra los hijos de los nodos abiertos, con su nivel', async () => {
    const f = make(); const t = f.componentInstance;
    expect(t.rows().map(r => r.node.id)).toEqual(['a', 'b']);
    t.expanded.set(['a']);
    expect(t.rows().map(r => [r.node.id, r.level])).toEqual([['a', 1], ['a1', 2], ['a2', 2], ['b', 1]]);
    f.detectChanges(); await f.whenStable();
    expect(f.nativeElement.querySelectorAll('[role=treeitem]').length).toBe(4);
  });
});
