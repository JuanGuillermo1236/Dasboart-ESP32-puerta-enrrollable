// Recibe las líneas del ESP32, guarda en la base y avisa a quien escuche (WebSocket).
import { EventEmitter } from 'node:events';

const CATEGORIA = {
  plegando: 'motor', desplegando: 'motor', plegado: 'motor', desplegado: 'motor', detenido: 'motor',
  lluvia: 'lluvia', lluvia_fin: 'lluvia',
  atasco: 'alerta', fallo_finales: 'alerta', dht_falla: 'alerta', desconectado: 'alerta', sin_respuesta: 'alerta',
};

export const COMANDOS = ['abrir', 'cerrar', 'detener', 'auto', 'manual'];

export class Central extends EventEmitter {
  #db;
  #dispositivo;
  #timeoutMs;
  #ahora;
  #pendientes = [];
  #ultimo = null;
  #recibidoEn = null;
  #conectado = false;
  #puerto = null;

  constructor(db, dispositivo, { timeoutComandoMs = 3000, ahora = () => Date.now() } = {}) {
    super();
    this.#db = db;
    this.#dispositivo = dispositivo;
    this.#timeoutMs = timeoutComandoMs;
    this.#ahora = ahora;
    dispositivo.on('linea', (l) => this.#procesar(l));
    dispositivo.on('conectado', (puerto) => {
      this.#conectado = true;
      this.#puerto = puerto;
      this.registrarEvento('conectado', `ESP32 conectado en ${puerto}`);
      this.#emitirEstado();
    });
    dispositivo.on('desconectado', (motivo) => {
      if (!this.#conectado) return;
      this.#conectado = false;
      this.registrarEvento('desconectado', motivo);
      for (const p of this.#pendientes.splice(0)) p.terminar({ ok: false, error: 'sin_conexion' });
      this.#emitirEstado();
    });
  }

  foto() {
    return {
      conectado: this.#conectado,
      puerto: this.#puerto,
      ultima_lectura: this.#recibidoEn,
      datos: this.#ultimo,
    };
  }

  registrarEvento(tipo, descripcion) {
    const ev = this.#db.guardarEvento({ ts: this.#ahora(), tipo, categoria: CATEGORIA[tipo] ?? 'info', descripcion });
    this.emit('evento', ev);
    return ev;
  }

  // Nunca asume éxito: espera la respuesta del ESP32 o devuelve un error.
  comando(cmd) {
    if (!COMANDOS.includes(cmd)) return Promise.resolve({ ok: false, error: 'cmd_desconocido' });
    if (!this.#conectado) return Promise.resolve({ ok: false, error: 'sin_conexion' });
    return new Promise((resolve) => {
      const pendiente = {
        cmd,
        terminar: (r) => {
          clearTimeout(pendiente.timer);
          resolve(r);
        },
      };
      pendiente.timer = setTimeout(() => {
        this.#pendientes = this.#pendientes.filter((p) => p !== pendiente);
        this.registrarEvento('sin_respuesta', `El ESP32 no respondió al comando "${cmd}"`);
        resolve({ ok: false, error: 'sin_respuesta' });
      }, this.#timeoutMs);
      this.#pendientes.push(pendiente);
      this.#dispositivo.escribir(JSON.stringify({ cmd }));
    });
  }

  #procesar(linea) {
    if (!linea.startsWith('{')) return; // mensajes de arranque del ESP32
    let m;
    try {
      m = JSON.parse(linea);
    } catch {
      return;
    }
    if (m.tipo === 'estado') {
      const ts = this.#ahora();
      const { tipo: _tipo, ts: tsDispositivo, ...datos } = m;
      this.#ultimo = { ...datos, ts_dispositivo: tsDispositivo };
      this.#recibidoEn = ts;
      this.#db.guardarLectura(ts, datos);
      this.#emitirEstado();
    } else if (m.tipo === 'evento' && typeof m.evento === 'string') {
      this.registrarEvento(m.evento, String(m.descripcion ?? ''));
    } else if (m.tipo === 'respuesta') {
      const i = this.#pendientes.findIndex((p) => p.cmd === m.cmd);
      if (i === -1) return;
      const [p] = this.#pendientes.splice(i, 1);
      if (m.ok) this.registrarEvento('comando', `Comando desde el dashboard: ${m.cmd}`);
      p.terminar(m.ok ? { ok: true } : { ok: false, error: m.error ?? 'error' });
    }
  }

  #emitirEstado() {
    this.emit('estado', this.foto());
  }
}
