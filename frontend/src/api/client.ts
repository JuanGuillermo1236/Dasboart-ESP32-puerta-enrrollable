import type { Accion, Evento, Lecturas, Rango, RespuestaComando } from './types.ts';

const TIMEOUT_MS = 6000;

// Nunca asume éxito: sin respuesta o con error HTTP devuelve ok: false.
export async function enviarComando(accion: Accion, fetchFn: typeof fetch = fetch): Promise<RespuestaComando> {
  try {
    const r = await fetchFn('/api/comando', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const datos = (await r.json().catch(() => null)) as RespuestaComando | null;
    if (r.ok && datos?.ok) return { ok: true };
    return datos && !datos.ok ? datos : { ok: false, error: `http_${r.status}` };
  } catch {
    return { ok: false, error: 'sin_backend' };
  }
}

async function obtener<T>(ruta: string): Promise<T> {
  const r = await fetch(ruta, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export const obtenerEventos = (limite = 300) => obtener<Evento[]>(`/api/eventos?limite=${limite}`);
export const obtenerLecturas = (rango: Rango) => obtener<Lecturas>(`/api/lecturas?rango=${rango}`);
