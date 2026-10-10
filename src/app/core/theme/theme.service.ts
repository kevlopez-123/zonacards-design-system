import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Brand = 'zonacards' | 'giftealo' | 'enjoy' | 'motiva';

const read = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* almacenamiento no disponible */ } };

/** Tema claro/oscuro/sistema y tema de producto. La preferencia se guarda por usuario. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly media = this.doc.defaultView?.matchMedia('(prefers-color-scheme: dark)');
  readonly mode = signal<ThemeMode>((read('zc-theme') as ThemeMode) ?? 'system');
  readonly brand = signal<Brand>((read('zc-brand') as Brand) ?? 'zonacards');
  private readonly systemDark = signal(this.media?.matches ?? false);

  constructor() {
    this.media?.addEventListener('change', e => this.systemDark.set(e.matches));
    effect(() => {
      const root = this.doc.documentElement; const m = this.mode();
      root.classList.toggle('dark', m === 'dark' || (m === 'system' && this.systemDark()));
      write('zc-theme', m);
    });
    effect(() => {
      const b = this.brand(); const root = this.doc.documentElement;
      if (b === 'zonacards') root.removeAttribute('data-brand'); else root.setAttribute('data-brand', b);
      write('zc-brand', b);
    });
  }
}
