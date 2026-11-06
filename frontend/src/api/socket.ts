import type { MensajeWs } from './types.ts';

// Espera creciente: 1, 2, 4... hasta 30 s.
export const esperaReintentoMs = (intento: number) => Math.min(30000, 1000 * 2 ** intento);

export function abrirSocket(url: string, onMensaje: (m: MensajeWs) => void, onConexion: (abierto: boolean) => void): () => void {
  let ws: WebSocket | null = null;
  let intento = 0;
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let cerrado = false;

  const abrir = () => {
    ws = new WebSocket(url);
    ws.onopen = () => {
      intento = 0;
      onConexion(true);
    };
    ws.onmessage = (m) => {
      try {
        onMensaje(JSON.parse(m.data as string) as MensajeWs);
      } catch {
        // Un mensaje dañado no debe tumbar la conexión; el siguiente lo reemplaza.
      }
    };
    ws.onclose = () => {
      if (cerrado) return;
      onConexion(false);
      temporizador = setTimeout(abrir, esperaReintentoMs(intento++));
    };
  };
  abrir();

  return () => {
    cerrado = true;
    clearTimeout(temporizador);
    ws?.close();
  };
}
