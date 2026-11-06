// WebSocket /ws: manda el estado y los eventos al dashboard apenas llegan del ESP32.
import { WebSocketServer } from 'ws';

export function conectarTiempoReal(servidor, central) {
  const wss = new WebSocketServer({ server: servidor, path: '/ws' });
  const enviarATodos = (msg) => {
    const texto = JSON.stringify(msg);
    for (const c of wss.clients) if (c.readyState === c.OPEN) c.send(texto);
  };
  wss.on('connection', (ws) => ws.send(JSON.stringify({ tipo: 'estado', ...central.foto() })));
  central.on('estado', (foto) => enviarATodos({ tipo: 'estado', ...foto }));
  central.on('evento', (evento) => enviarATodos({ tipo: 'evento', evento }));
  return wss;
}
