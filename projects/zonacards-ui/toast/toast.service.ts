import { Injectable, computed, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'loading';

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
  /** Milisegundos antes de cerrarse solo. Por defecto 6 s; un error con acción y un aviso de "cargando" no se cierran solos. */
  duration?: number;
}

export interface Toast extends Required<Pick<ToastOptions, 'kind' | 'title'>> {
  id: number;
  text?: string;
  action?: ToastAction;
  /** null: no se cierra solo. */
  duration: number | null;
}

/** El contenido de un aviso sin su tipo (título, texto y acción). */
export type ToastBody = Omit<ToastOptions, 'kind'>;

/** Lo que `ToastService.promise` muestra mientras la operación corre y cuando termina. Cada texto es un título o un aviso completo, y puede calcularse con el resultado o el error. */
export interface ToastPromiseMessages<T> {
  loading: string | ToastBody;
  success: string | ToastBody | ((value: T) => string | ToastBody);
  error: string | ToastBody | ((error: unknown) => string | ToastBody);
}

/** Toasts visibles a la vez; el resto espera en cola. */
export const TOAST_MAX_VISIBLE = 3;
export const TOAST_DURATION = 6000;

/**
 * Cola de toasts (sección 15 de las reglas). Se muestran en <zc-toaster>, que vive en el shell.
 * - Se cierran solos a los 6 s, salvo errores con acción. El tiempo se pausa con el mouse encima o con foco dentro.
 * - Máximo 3 visibles; los demás esperan su turno.
 * - Éxito con enlace al registro: `toast.success('Lote creado', { action: { label: 'Ver lote', run } })`.
 * - Una operación que tarda: `await toast.promise(guardar(), { loading: 'Guardando…', success: 'Guardado', error: 'No se pudo guardar' })`: un solo aviso que pasa de
 *   "cargando" a éxito o error en su lugar (equivale a `toast.promise` de HeroUI). Devuelve la misma promesa, así que el llamador sigue pudiendo esperar y capturar el error.
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
    this.all.update(l => [...l, { id, kind, title: o.title, text: o.text, action: o.action, duration: this.durationOf(kind, o.action, o.duration) }]);
    return id;
  }

  /** Cuánto dura un aviso: "cargando" y un error con acción no se cierran solos. */
  private durationOf(kind: ToastKind, action: ToastAction | undefined, duration?: number): number | null {
    return duration ?? (kind === 'loading' || (kind === 'error' && action) ? null : TOAST_DURATION);
  }

  /** Cambia un aviso en su lugar (por ejemplo, de "cargando" a éxito). Devuelve false si ya no está (la persona lo cerró). */
  update(id: number, o: Partial<ToastOptions>): boolean {
    let found = false;
    this.all.update(l => l.map(t => {
      if (t.id !== id) return t;
      found = true;
      const kind = o.kind ?? t.kind;
      const action = 'action' in o ? o.action : t.action;
      return { ...t, kind, title: o.title ?? t.title, text: 'text' in o ? o.text : t.text, action, duration: this.durationOf(kind, action, o.duration) };
    }));
    return found;
  }

  /**
   * Muestra "cargando" mientras corre `p` y lo cambia en su lugar a éxito o error al terminar. Si la persona cerró el aviso antes, el resultado igual
   * se muestra en uno nuevo (un error nunca se pierde). Devuelve la misma promesa (con su valor o su error).
   */
  async promise<T>(p: Promise<T>, m: ToastPromiseMessages<T>): Promise<T> {
    const body = (v: string | ToastBody): ToastBody => (typeof v === 'string' ? { title: v } : v);
    const id = this.show({ ...body(m.loading), kind: 'loading' });
    const finish = (kind: ToastKind, b: ToastBody) => { if (!this.update(id, { ...b, kind })) this.show({ ...b, kind }); };
    try {
      const value = await p;
      finish('success', body(typeof m.success === 'function' ? m.success(value) : m.success));
      return value;
    } catch (e) {
      finish('error', body(typeof m.error === 'function' ? m.error(e) : m.error));
      throw e;
    }
  }

  loading(title: string, o: Omit<ToastOptions, 'kind' | 'title'> = {}) { return this.show({ ...o, title, kind: 'loading' }); }

  success(title: string, o: Omit<ToastOptions, 'kind' | 'title'> = {}) { return this.show({ ...o, title, kind: 'success' }); }
  error(title: string, o: Omit<ToastOptions, 'kind' | 'title'> = {}) { return this.show({ ...o, title, kind: 'error' }); }
  info(title: string, o: Omit<ToastOptions, 'kind' | 'title'> = {}) { return this.show({ ...o, title, kind: 'info' }); }

  dismiss(id: number) { this.all.update(l => l.filter(t => t.id !== id)); }
  clear() { this.all.set([]); }
}
