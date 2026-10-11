import { Injectable, computed, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastAction {
  /** Verbo + objeto: "Ver lote", "Reintentar envío". */
  label: string;
  run: () => void;
}

export interface ToastOptions {
  kind?: ToastKind;
  title: string;
  text?: string;
  action?: ToastAction;
  /** Milisegundos antes de cerrarse solo. Por defecto 6 s; un error con acción no se cierra solo. */
  duration?: number;
}

export interface Toast extends Required<Pick<ToastOptions, 'kind' | 'title'>> {
  id: number;
  text?: string;
  action?: ToastAction;
  /** null: no se cierra solo. */
  duration: number | null;
}

/** Toasts visibles a la vez; el resto espera en cola. */
export const TOAST_MAX_VISIBLE = 3;
export const TOAST_DURATION = 6000;

/**
 * Cola de toasts (sección 15 de las reglas). Se muestran en <zc-toaster>, que vive en el shell.
 * - Se cierran solos a los 6 s, salvo errores con acción. El tiempo se pausa con el mouse encima o con foco dentro.
 * - Máximo 3 visibles; los demás esperan su turno.
 * - Éxito con enlace al registro: `toast.success('Lote creado', { action: { label: 'Ver lote', run } })`.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly all = signal<Toast[]>([]);
  readonly visible = computed(() => this.all().slice(0, TOAST_MAX_VISIBLE));
  readonly queued = computed(() => Math.max(0, this.all().length - TOAST_MAX_VISIBLE));

  show(o: ToastOptions): number {
    const kind = o.kind ?? 'info';
    const id = ++this.seq;
    const duration = o.duration ?? (kind === 'error' && o.action ? null : TOAST_DURATION);
    this.all.update(l => [...l, { id, kind, title: o.title, text: o.text, action: o.action, duration }]);
    return id;
  }

  success(title: string, o: Omit<ToastOptions, 'kind' | 'title'> = {}) { return this.show({ ...o, title, kind: 'success' }); }
  error(title: string, o: Omit<ToastOptions, 'kind' | 'title'> = {}) { return this.show({ ...o, title, kind: 'error' }); }
  info(title: string, o: Omit<ToastOptions, 'kind' | 'title'> = {}) { return this.show({ ...o, title, kind: 'info' }); }

  dismiss(id: number) { this.all.update(l => l.filter(t => t.id !== id)); }
  clear() { this.all.set([]); }
}
