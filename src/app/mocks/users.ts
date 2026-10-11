import type { SessionUser } from '../core/session/session.service';

/**
 * Usuarios de prueba por rol (sección 11 de las reglas): sin credenciales reales. En producción la sesión la entrega
 * Keycloak. Permisos según la matriz de acceso de la especificación (V, E, A por módulo).
 * Operaciones tiene dos usuarios para demostrar maker-checker: uno solicita y el otro aprueba.
 */
export const DEMO_USERS: SessionUser[] = [
  { id: 'u-ana', name: 'Ana Torres', email: 'ana.torres@promotick.com', role: 'Operaciones', countries: ['pe', 'cl'],
    permissions: ['lotes.ver', 'lotes.crear', 'lotes.exportar', 'lotes.anular', 'clientes.ver', 'reportes.ver', 'aprobaciones.ver', 'aprobaciones.aprobar'] },
  { id: 'u-carlos', name: 'Carlos Ríos', email: 'carlos.rios@promotick.com', role: 'Operaciones', countries: ['pe', 'co', 'cl', 'mx', 'ec', 'bo'],
    permissions: ['lotes.ver', 'lotes.crear', 'lotes.exportar', 'lotes.anular', 'clientes.ver', 'reportes.ver', 'aprobaciones.ver', 'aprobaciones.aprobar'] },
  { id: 'u-lucia', name: 'Lucía Mendoza', email: 'lucia.mendoza@promotick.com', role: 'Supervisor de Finanzas', countries: ['pe', 'co', 'cl', 'mx', 'ec', 'bo'],
    permissions: ['clientes.ver', 'reportes.ver', 'aprobaciones.ver', 'aprobaciones.aprobar'] },
  { id: 'u-ivan', name: 'Iván Baca', email: 'ivan.baca@promotick.com', role: 'Finanzas', countries: ['pe', 'cl'],
    permissions: ['lotes.ver', 'clientes.ver', 'reportes.ver', 'aprobaciones.ver', 'aprobaciones.aprobar'] },
  { id: 'u-rosa', name: 'Rosa Paz', email: 'rosa.paz@promotick.com', role: 'ATC', countries: ['pe'],
    permissions: ['lotes.ver', 'clientes.ver', 'reportes.ver'] },
  { id: 'u-mario', name: 'Mario Salas', email: 'mario.salas@promotick.com', role: 'Administrador', countries: ['pe', 'co', 'cl', 'mx', 'ec', 'bo'],
    permissions: ['lotes.ver', 'clientes.ver', 'reportes.ver', 'aprobaciones.ver', 'aprobaciones.aprobar'] },
  { id: 'u-elena', name: 'Elena Vega', email: 'elena.vega@promotick.com', role: 'Comercial', countries: ['pe', 'co'],
    permissions: ['lotes.ver', 'clientes.ver', 'clientes.editar', 'reportes.ver', 'aprobaciones.ver', 'aprobaciones.aprobar'] },
];

export const demoUser = (id: string | null | undefined) => DEMO_USERS.find(u => u.id === id) ?? null;
