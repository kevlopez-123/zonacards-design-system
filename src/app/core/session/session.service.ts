import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CountryCode } from '@zonacards/ui/core';
import { DEMO_USERS, demoUser } from '../../mocks/users';

/** Permisos por módulo y acción, como en la matriz de roles (sección 5). */
export type Permission = `${string}.${'ver' | 'crear' | 'editar' | 'exportar' | 'anular' | 'aprobar'}`;
export interface SessionUser { id: string; name: string; email: string; role: string; countries: CountryCode[]; permissions: Permission[]; }

const KEY = 'zc-demo-user';
const read = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };

/**
 * Sesión simulada. En producción la entrega Keycloak (OIDC + PKCE) y no se guarda nada sensible en el navegador.
 * Aquí el usuario de prueba vive en memoria; en sessionStorage solo queda el id del usuario de prueba elegido
 * (sección 11: nunca datos personales ni códigos).
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly router = inject(Router);
  readonly users = DEMO_USERS;
  readonly user = signal<SessionUser | null>(demoUser(read()) ?? DEMO_USERS[0]);
  readonly country = signal<'pe' | 'ec' | 'bo' | 'co' | 'cl' | 'mx'>('pe');
  readonly isAuthenticated = computed(() => this.user() !== null);
  can(p: Permission): boolean { return this.user()?.permissions.includes(p) ?? false; }
  logout(): void { this.user.set(null); }

  /**
   * Solo con datos simulados: cambia de usuario de prueba sin recargar (los datos simulados viven en memoria y se
   * perderían). Lleva al inicio para que cada pantalla vuelva a pedir sus datos con el usuario nuevo.
   */
  switchUser(id: string) {
    const u = demoUser(id);
    if (!u) return;
    try { sessionStorage.setItem(KEY, id); } catch { /* almacenamiento no disponible */ }
    this.user.set(u);
    void this.router.navigateByUrl('/inicio');
  }
}
