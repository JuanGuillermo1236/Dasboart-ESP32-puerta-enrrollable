import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';

import { Central } from '../src/central.mjs';
import { abrirBase } from '../src/db.mjs';

class DispositivoFalso extends EventEmitter {
  escritos = [];
  escribir(l) {
    this.escritos.push(JSON.parse(l));
  }
}

const ESTADO = {
  tipo: 'estado', ts: 5000, temp: 28.4, hum: 71, dht_ok: true, lluvia: false, luz: true, estado: 'PLEGADO',
  fc_plegado: true, fc_desplegado: false, modo: 'auto', razon: '', motor: { dir: 'detenido', pwm: 170, t: 0, ciclos: 0, atasco: false },
  manual_restante_s: 0,
};

function preparar(opciones) {
  const db = abrirBase(':memory:');
  const disp = new DispositivoFalso();
  const central = new Central(db, disp, { timeoutComandoMs: 50, ...opciones });
  disp.emit('conectado', 'COM3');
  return { db, disp, central };
}

test('guarda la lectura con la hora de la laptop y la publica', () => {
  const { db, disp, central } = preparar({ ahora: () => 1_000_000 });
  let publicado = null;
  central.on('estado', (f) => (publicado = f));
  disp.emit('linea', JSON.stringify(ESTADO));
  assert.equal(publicado.conectado, true);
  assert.equal(publicado.datos.temp, 28.4);
  assert.equal(publicado.datos.ts_dispositivo, 5000);
  assert.equal(publicado.ultima_lectura, 1_000_000);
  const [fila] = db.lecturas(0, 10);
  assert.equal(fila.temp, 28.4);
});

test('guarda temp nula si el DHT11 falla', () => {
  const { db, disp } = preparar();
  disp.emit('linea', JSON.stringify({ ...ESTADO, temp: null, hum: null, dht_ok: false }));
  assert.equal(db.lecturas(0, 10)[0].temp, null);
});

test('ignora basura y mensajes de arranque', () => {
  const { db, disp } = preparar();
  disp.emit('linea', 'ets Jul 29 2019 12:21:46');
  disp.emit('linea', '{roto');
  assert.equal(db.lecturas(0, 10).length, 0);
});

test('clasifica los eventos del ESP32', () => {
  const { db, disp } = preparar();
  disp.emit('linea', JSON.stringify({ tipo: 'evento', ts: 1, evento: 'desplegando', descripcion: 'Cerrado por lluvia' }));
  disp.emit('linea', JSON.stringify({ tipo: 'evento', ts: 2, evento: 'atasco', descripcion: 'x' }));
  assert.equal(db.eventos('motor', 10)[0].descripcion, 'Cerrado por lluvia');
  assert.equal(db.eventos('alerta', 10)[0].tipo, 'atasco');
});

test('el comando espera la respuesta del ESP32', async () => {
  const { disp, central } = preparar();
  const promesa = central.comando('cerrar');
  assert.deepEqual(disp.escritos.at(-1), { cmd: 'cerrar' });
  disp.emit('linea', JSON.stringify({ tipo: 'respuesta', cmd: 'cerrar', ok: false, error: 'fallo_finales' }));
  assert.deepEqual(await promesa, { ok: false, error: 'fallo_finales' });
});

test('sin respuesta no asume éxito', async () => {
  const { central } = preparar();
  assert.deepEqual(await central.comando('abrir'), { ok: false, error: 'sin_respuesta' });
});

test('sin conexión rechaza y la desconexión libera los comandos pendientes', async () => {
  const { disp, central } = preparar();
  const promesa = central.comando('abrir');
  disp.emit('desconectado', 'Se desconectó el ESP32');
  assert.deepEqual(await promesa, { ok: false, error: 'sin_conexion' });
  assert.deepEqual(await central.comando('abrir'), { ok: false, error: 'sin_conexion' });
  assert.equal(central.foto().conectado, false);
});

test('rechaza comandos desconocidos sin enviarlos', async () => {
  const { disp, central } = preparar();
  assert.deepEqual(await central.comando('explotar'), { ok: false, error: 'cmd_desconocido' });
  assert.equal(disp.escritos.length, 0);
});
