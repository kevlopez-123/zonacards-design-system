import { CountryCode } from '../../shared/domain/countries';
import { GiftcardState } from '../../shared/domain/states';

export interface Lote { id: string; name: string; client: string; country: CountryCode; state: GiftcardState; unitAmount: number; quantity: number; activated: number; expiresAt: string; channel: 'email' | 'whatsapp' | 'zip'; }

/** Datos ficticios con semilla fija. Ampliar a 200 lotes según la sección 11 de las reglas. */
export const LOTES: Lote[] = [
  { id: '#02829', name: 'Navidad 2026', client: 'Interbank', country: 'pe', state: 'activated', unitAmount: 100, quantity: 500, activated: 332, expiresAt: '2026-12-31', channel: 'email' },
  { id: '#02830', name: 'Bienvenida clientes', client: 'Banco Pichincha', country: 'ec', state: 'activated', unitAmount: 25, quantity: 1200, activated: 410, expiresAt: '2027-06-30', channel: 'whatsapp' },
  { id: '#02831', name: 'Incentivo fuerza de ventas', client: 'Entel', country: 'cl', state: 'created', unitAmount: 20000, quantity: 300, activated: 0, expiresAt: '2027-03-15', channel: 'zip' },
  { id: '#02832', name: 'Día del Padre', client: 'Bancolombia', country: 'co', state: 'activated', unitAmount: 50000, quantity: 800, activated: 720, expiresAt: '2027-06-20', channel: 'email' },
  { id: '#02833', name: 'Campaña aniversario', client: 'Tigo', country: 'bo', state: 'expired', unitAmount: 100, quantity: 250, activated: 198, expiresAt: '2026-09-01', channel: 'email' },
  { id: '#02834', name: 'Reconocimiento anual', client: 'Bimbo', country: 'mx', state: 'voided', unitAmount: 500, quantity: 150, activated: 0, expiresAt: '2027-01-31', channel: 'whatsapp' },
];
