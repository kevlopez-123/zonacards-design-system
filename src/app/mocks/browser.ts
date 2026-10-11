import { setupWorker } from 'msw/browser';
import { aprobacionesHandlers } from './handlers/aprobaciones.handlers';
import { lotesHandlers } from './handlers/lotes.handlers';
import { notificacionesHandlers } from './handlers/notificaciones.handlers';

/** Agregar aquí los handlers de cada dominio (src/app/mocks/handlers/<dominio>.handlers.ts). */
export const worker = setupWorker(...lotesHandlers, ...aprobacionesHandlers, ...notificacionesHandlers);
