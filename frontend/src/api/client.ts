import { abrirSocket } from './socket.ts';
import type { Accion, Modo, RespuestaEscritura, Transporte } from './types.ts';

const TIMEOUT_MS = 5000;

// Nunca asume éxito: sin respuesta o con error HTTP devuelve ok: false.
export async function post(ruta: string, cuerpo: unknown, fetchFn: typeof fetch = fetch): Promise<RespuestaEscritura> {
  try {
    const r = await fetchFn(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const datos = (await r.json().catch(() => null)) as RespuestaEscritura | null;
    if (r.ok && datos?.ok) return { ok: true };
    return datos && !datos.ok ? datos : { ok: false, error: `http_${r.status}` };
  } catch {
    return { ok: false, error: 'sin_respuesta', mensaje: 'El ESP32 no respondió. El comando no se confirmó.' };
  }
}

export const transporteEsp32: Transporte = {
  conectar(onEstado, onConexion) {
    const esquema = location.protocol === 'https:' ? 'wss' : 'ws';
    return abrirSocket(`${esquema}://${location.host}/ws`, onEstado, onConexion);
  },
  comando: (accion: Accion) => post('/api/comando', { accion }),
  cambiarModo: (modo: Modo) => post('/api/modo', { modo }),
};
