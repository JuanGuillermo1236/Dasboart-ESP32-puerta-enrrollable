export const numero = (v: number | null | undefined, decimales = 0) =>
  v === null || v === undefined ? '—' : v.toFixed(decimales);

export function duracion(seg: number): string {
  const d = Math.floor(seg / 86400);
  const h = Math.floor((seg % 86400) / 3600);
  const m = Math.floor((seg % 3600) / 60);
  if (d > 0) return `${d} d ${h} h ${m} min`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min ${Math.floor(seg % 60)} s`;
}

export const hora = (ts: number) =>
  new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

export const horaSeg = (ts: number) =>
  new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

export function diaRelativo(ts: number, ahora: number): string {
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);
  if (ts >= hoy.getTime()) return 'Hoy';
  if (ts >= hoy.getTime() - 86400000) return 'Ayer';
  return new Date(ts).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export function haceCuanto(ts: number | null, ahora: number): string {
  if (ts === null) return 'nunca';
  const s = Math.max(0, Math.round((ahora - ts) / 1000));
  return s < 60 ? `hace ${s} s` : `hace ${Math.floor(s / 60)} min`;
}
