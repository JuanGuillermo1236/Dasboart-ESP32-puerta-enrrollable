// Imita al ESP32 (HTTP + WebSocket) con el mismo motor de simulación del frontend.
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { MockEngine } from '../../frontend/src/mock/engine.ts';

const PUERTO = 8787;
const motor = new MockEngine();

const leerJson = (req) => new Promise((ok) => {
  let cuerpo = '';
  req.on('data', (d) => { cuerpo += d; });
  req.on('end', () => {
    try { ok(JSON.parse(cuerpo)); } catch { ok(null); }
  });
});

function responder(res, codigo, datos) {
  res.writeHead(codigo, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(datos));
}

const CODIGO_ERROR = { modo_automatico: 409, lluvia_activa: 409 };

const servidor = createServer(async (req, res) => {
  const ruta = req.url.split('?')[0];
  if (req.method === 'GET' && ruta === '/api/estado') return responder(res, 200, motor.estado());
  if (req.method === 'GET' && ruta === '/api/config') return responder(res, 200, motor.estado().umbrales);
  if (req.method === 'POST' && ruta === '/api/comando') {
    const b = await leerJson(req);
    if (!['abrir', 'cerrar', 'detener'].includes(b?.accion)) return responder(res, 400, { ok: false, error: 'accion_invalida' });
    const r = motor.comando(b.accion);
    return responder(res, r.ok ? 200 : CODIGO_ERROR[r.error] ?? 400, r);
  }
  if (req.method === 'POST' && ruta === '/api/modo') {
    const b = await leerJson(req);
    if (!['auto', 'manual'].includes(b?.modo)) return responder(res, 400, { ok: false, error: 'modo_invalido' });
    return responder(res, 200, motor.cambiarModo(b.modo));
  }
  if (ruta.startsWith('/api/')) return responder(res, 501, { ok: false, error: 'no_implementado' });
  return responder(res, 404, { ok: false, error: 'no_encontrado' });
});

const wss = new WebSocketServer({ server: servidor, path: '/ws' });
const enviar = (ws) => ws.send(JSON.stringify(motor.estado()));
wss.on('connection', enviar);

setInterval(() => motor.avanzar(0.2), 200);
setInterval(() => wss.clients.forEach(enviar), 2500);

servidor.listen(PUERTO, () => console.log(`mock-server en http://localhost:${PUERTO}`));
