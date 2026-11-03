import type { Tendencia } from '../api/types.ts';

export const SIN_LECTURA = 'Sin lectura';

export const numero = (v: number | null | undefined, decimales = 0) =>
  v === null || v === undefined ? '—' : v.toFixed(decimales);

export const flecha = (t: Tendencia | null) => (t === 'sube' ? '↑' : t === 'baja' ? '↓' : t === 'estable' ? '→' : '·');

export function duracion(seg: number): string {
  const d = Math.floor(seg / 86400);
  const h = Math.floor((seg % 86400) / 3600);
  const m = Math.floor((seg % 3600) / 60);
  return d > 0 ? `${d} d ${h} h ${m} min` : `${h} h ${m} min`;
}

export const hora = (ts: number | null) =>
  ts === null ? 'sin hora' : new Date(ts * 1000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

export const barrasWifi = (rssi: number | null) =>
  rssi === null ? 0 : rssi > -55 ? 4 : rssi > -65 ? 3 : rssi > -75 ? 2 : 1;
