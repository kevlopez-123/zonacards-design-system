import { Injectable, computed, signal } from '@angular/core';
import { CountryCode } from '../../shared/domain/countries';

/** Permisos por módulo y acción, como en la matriz de roles (sección 5). */
export type Permission = `${string}.${'ver' | 'crear' | 'editar' | 'exportar' | 'anular' | 'aprobar'}`;
export interface SessionUser { id: string; name: string; email: string; role: string; countries: CountryCode[]; permissions: Permission[]; }

/**
 * Sesión simulada. En producción la entrega Keycloak (OIDC + PKCE) y no se guarda nada sensible
 * en el navegador; aquí el usuario de demostración vive en memoria.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly user = signal<SessionUser | null>({
    id: 'u-ana', name: 'Ana Torres', email: 'ana.torres@promotick.com', role: 'Operaciones', countries: ['pe', 'cl'],
    permissions: ['lotes.ver', 'lotes.crear', 'lotes.exportar', 'clientes.ver', 'reportes.ver'],
  });
  readonly country = signal<'pe' | 'ec' | 'bo' | 'co' | 'cl' | 'mx'>('pe');
  readonly isAuthenticated = computed(() => this.user() !== null);
  can(p: Permission): boolean { return this.user()?.permissions.includes(p) ?? false; }
  logout(): void { this.user.set(null); }
}
