import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import WebSocket from 'ws';

import { crearServidor } from '../src/aplicacion.mjs';
import { Central } from '../src/central.mjs';
import { abrirBase } from '../src/db.mjs';
import { DispositivoSimulado } from '../src/dispositivo/simulador.mjs';

let servidor, base, sim;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (ruta, cuerpo) =>
  fetch(base + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });

before(async () => {
  const db = abrirBase(':memory:');
  sim = new DispositivoSimulado();
  const central = new Central(db, sim, { timeoutComandoMs: 1000 });
  servidor = crearServidor({ central, db, simulador: sim, carpetaDashboard: null });
  servidor.listen(0);
  await once(servidor, 'listening');
  base = `http://localhost:${servidor.address().port}`;
  sim.iniciar();
  await esperar(400);
});

after(() => {
  sim.cerrar();
  servidor.closeAllConnections();
  servidor.close();
});

test('GET /api/estado devuelve el último estado', async () => {
  const e = await (await fetch(`${base}/api/estado`)).json();
  assert.equal(e.conectado, true);
  assert.equal(e.datos.estado, 'PLEGADO');
});

test('POST /api/comando cierra el techo y lo registra', async () => {
  const r = await post('/api/comando', { accion: 'cerrar' });
  assert.equal(r.status, 200);
  await esperar(7600);
  const e = await (await fetch(`${base}/api/estado`)).json();
  assert.equal(e.datos.estado, 'DESPLEGADO');
  assert.equal(e.datos.modo, 'manual');
  const motor = await (await fetch(`${base}/api/eventos?filtro=motor`)).json();
  assert.ok(motor.some((ev) => ev.tipo === 'desplegado'));
});

test('el ESP32 rechaza abrir con lluvia y la API lo devuelve como error', async () => {
  await post('/api/simulacion', { lluvia: true });
  const r = await post('/api/comando', { accion: 'abrir' });
  assert.equal(r.status, 409);
  assert.equal((await r.json()).error, 'lluvia_activa');
  await post('/api/simulacion', { lluvia: false });
});

test('acción inválida devuelve 400', async () => {
  assert.equal((await post('/api/comando', { accion: 'volar' })).status, 400);
});

test('GET /api/lecturas agrupa por rango y GET /api/eventos.csv exporta', async () => {
  const l = await (await fetch(`${base}/api/lecturas?rango=6h`)).json();
  assert.equal(l.rango, '6h');
  assert.ok(l.puntos.length > 0);
  // .text() quita el BOM al decodificar; se revisan los bytes.
  const bytes = Buffer.from(await (await fetch(`${base}/api/eventos.csv`)).arrayBuffer());
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.match(bytes.toString('utf8', 3), /^fecha,categoria,tipo,descripcion\n/);
});

test('el WebSocket entrega el estado al conectarse', async () => {
  const ws = new WebSocket(`${base.replace('http', 'ws')}/ws`);
  const [msg] = await once(ws, 'message');
  ws.close();
  assert.equal(JSON.parse(msg).tipo, 'estado');
});
