import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from '../session/session.service';

/**
 * Solo con datos simulados: identifica al usuario de prueba ante MSW (quién solicita, quién aprueba).
 * En producción el backend lo toma del token de Keycloak y esta cabecera no se envía.
 */
export const demoUserInterceptor: HttpInterceptorFn = (req, next) => {
  const id = environment.useMocks ? inject(SessionService).user()?.id : null;
  return next(id ? req.clone({ setHeaders: { 'X-Demo-User': id } }) : req);
};

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
