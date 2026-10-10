import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Agrega un ID de correlación a cada solicitud; es la "referencia" que se muestra en los errores. */
export const correlationInterceptor: HttpInterceptorFn = (req, next) => {
  const id = 'ZC-' + crypto.randomUUID().slice(0, 9).toUpperCase();
  return next(req.clone({ setHeaders: { 'X-Correlation-Id': id } }));
};

export interface AppError { status: number; code: string; message: string; reference: string; fieldErrors?: Record<string, string>; }

/** Normaliza errores: la interfaz siempre recibe qué pasó, la referencia y los errores por campo. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => next(req).pipe(
  catchError((e: HttpErrorResponse) => {
    const err: AppError = {
      status: e.status,
      code: e.error?.code ?? (e.status === 0 ? 'OFFLINE' : 'UNKNOWN'),
      message: e.error?.message ?? (e.status === 0 ? 'Sin conexión' : 'Algo falló de nuestro lado'),
      reference: req.headers.get('X-Correlation-Id') ?? '',
      fieldErrors: e.error?.fieldErrors,
    };
    return throwError(() => err);
  }),
);
