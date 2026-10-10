import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Permission, SessionService } from './session.service';

/** Protege una ruta por permiso. Sin permiso lleva a "Sin acceso", nunca a una pantalla en blanco. */
export const canActivatePermission = (p: Permission): CanActivateFn => () => {
  const s = inject(SessionService); const router = inject(Router);
  if (!s.isAuthenticated()) return router.parseUrl('/ingresar');
  return s.can(p) ? true : router.parseUrl('/sin-acceso');
};
