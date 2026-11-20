import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  /** Consecuencia en una frase. */
  text?: string;
  /** Verbo + objeto: "Salir sin guardar". */
  confirmLabel: string;
  cancelLabel: string;
  /** danger (por defecto) cuando se pierde algo; primary si no destruye. */
  confirmVariant?: 'danger' | 'primary';
}

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

/**
 * Confirmación por promesa: `if (await confirm.ask({ ... })) salir()`. Se dibuja en <zc-confirm-host>, que vive en el shell.
 * Una sola a la vez: si llega otra mientras hay una abierta, la primera se cancela (devuelve false).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly current = signal<ConfirmRequest | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    this.current()?.resolve(false);
    return new Promise<boolean>(resolve => this.current.set({ ...options, resolve }));
  }

  /** Lo llama el host al elegir: cierra y entrega la respuesta. */
  answer(ok: boolean) {
    const req = this.current();
    if (!req) return;
    this.current.set(null);
    req.resolve(ok);
  }
}
