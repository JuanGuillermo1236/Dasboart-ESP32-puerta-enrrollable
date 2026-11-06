// ESP32 simulado: habla el mismo protocolo serie (docs/protocolo-serie.md). Sirve sin placa y como plan B.
// Imita las reglas principales del firmware; la fuente de verdad es firmware/src/control/logica.cpp.
import { EventEmitter } from 'node:events';

const RECORRIDO_MS = 7000;
const MOTOR_MAX_MS = 12000;
const SECO_PARA_ABRIR_MS = 20000; // 15 min en el firmware; acortado para poder probar

const RAZON = {
  lluvia: 'Cerrado por lluvia',
  noche: 'Cerrado por la noche',
  favorable: 'Abierto: sin lluvia y con luz',
  abrir: 'Abierto manualmente',
  cerrar: 'Cerrado manualmente',
  detener: 'Detenido manualmente',
  atasco: 'Detenido: tiempo máximo sin llegar al final',
};

export class DispositivoSimulado extends EventEmitter {
  #pos = 0; // 0 = plegado (abierto), 1 = desplegado (cerrado)
  #dir = 'detenido';
  #modo = 'auto';
  #razon = RAZON.favorable;
  #lluvia = false;
  #luz = true;
  #temp = 29;
  #hum = 58;
  #ciclos = 0;
  #inicioMov = 0;
  #tMov = 0;
  #ultimaLluvia = -Infinity;
  #atascar = false;
  #atasco = false;
  #t0 = Date.now();
  #intervalos = [];

  iniciar() {
    setTimeout(() => {
      this.emit('conectado', 'SIMULADO');
      this.#evento('inicio', 'ESP32 simulado iniciado');
      this.#estado();
    }, 100);
    this.#intervalos.push(setInterval(() => this.#paso(), 200), setInterval(() => this.#estado(), 2000));
  }

  cerrar() {
    this.#intervalos.forEach(clearInterval);
  }

  // Controles de la simulación (POST /api/simulacion).
  forzar({ lluvia, luz, atasco }) {
    if (typeof lluvia === 'boolean' && lluvia !== this.#lluvia) {
      this.#lluvia = lluvia;
      this.#evento(lluvia ? 'lluvia' : 'lluvia_fin', lluvia ? 'Lluvia detectada' : 'Dejó de llover');
    }
    if (typeof luz === 'boolean' && luz !== this.#luz) {
      this.#luz = luz;
      this.#evento(luz ? 'luz' : 'oscuro', luz ? 'Hay luz' : 'Oscureció');
    }
    if (typeof atasco === 'boolean') this.#atascar = atasco;
    this.#estado();
  }

  escribir(linea) {
    let cmd;
    try {
      cmd = JSON.parse(linea).cmd;
    } catch {
      return this.#linea({ tipo: 'respuesta', ok: false, error: 'json_invalido' });
    }
    let error = null;
    if (cmd === 'detener') {
      if (this.#dir !== 'detenido') this.#parar(RAZON.detener, 'detenido');
    } else if (cmd === 'abrir' || cmd === 'cerrar') {
      const destino = cmd === 'abrir' ? 0 : 1;
      if (cmd === 'abrir' && this.#lluvia) error = 'lluvia_activa';
      else if (this.#pos === destino && this.#dir === 'detenido') error = 'ya_en_posicion';
      else {
        this.#cambiarModo('manual');
        this.#atasco = false;
        this.#mover(cmd === 'abrir' ? 'plegar' : 'desplegar', RAZON[cmd]);
      }
    } else if (cmd === 'auto' || cmd === 'manual') this.#cambiarModo(cmd);
    else if (cmd !== 'estado') error = 'cmd_desconocido';
    this.#linea({ tipo: 'respuesta', cmd, ok: !error, ...(error && { error }) });
    this.#estado();
  }

  #paso() {
    const ahora = Date.now();
    this.#temp = Math.round((this.#temp + (Math.random() - 0.5) * 0.2) * 10) / 10;
    this.#hum = Math.max(30, Math.min(95, this.#hum + (Math.random() - 0.5) * 0.6 + (this.#lluvia ? 0.4 : 0)));
    if (this.#lluvia) this.#ultimaLluvia = ahora;

    if (this.#dir !== 'detenido') {
      this.#tMov = ahora - this.#inicioMov;
      const atorado = this.#atascar && Math.abs(this.#pos - 0.5) < 0.05;
      if (!atorado) this.#pos = Math.min(1, Math.max(0, this.#pos + (this.#dir === 'desplegar' ? 200 : -200) / RECORRIDO_MS));
      if ((this.#dir === 'plegar' && this.#pos === 0) || (this.#dir === 'desplegar' && this.#pos === 1)) {
        this.#ciclos++;
        this.#parar(this.#razon, this.#pos === 0 ? 'plegado' : 'desplegado');
      } else if (this.#tMov > MOTOR_MAX_MS) {
        this.#atasco = true;
        this.#parar(RAZON.atasco, 'atasco');
      }
      return;
    }
    if (this.#atasco) return;
    if (this.#lluvia) {
      if (this.#pos < 1) this.#mover('desplegar', RAZON.lluvia);
      return;
    }
    if (this.#modo !== 'auto') return;
    if (!this.#luz) {
      if (this.#pos < 1) this.#mover('desplegar', RAZON.noche);
    } else if (this.#pos > 0 && ahora - this.#ultimaLluvia >= SECO_PARA_ABRIR_MS) {
      this.#mover('plegar', RAZON.favorable);
    }
  }

  #mover(dir, razon) {
    this.#dir = dir;
    this.#razon = razon;
    this.#inicioMov = Date.now();
    this.#tMov = 0;
    this.#evento(dir === 'plegar' ? 'plegando' : 'desplegando', razon);
    this.#estado();
  }

  #parar(razon, evento) {
    this.#dir = 'detenido';
    this.#razon = razon;
    const textos = { plegado: 'Techo abierto: llegó al final de plegado', desplegado: 'Techo cerrado: llegó al final de desplegado' };
    this.#evento(evento, textos[evento] ?? razon);
    this.#estado();
  }

  #cambiarModo(modo) {
    if (modo === this.#modo) return;
    this.#modo = modo;
    this.#evento('modo', modo === 'auto' ? 'Modo Automático' : 'Modo Manual');
  }

  #nombreEstado() {
    if (this.#atasco) return 'ERROR';
    if (this.#dir === 'plegar') return 'PLEGANDO';
    if (this.#dir === 'desplegar') return 'DESPLEGANDO';
    return this.#pos === 0 ? 'PLEGADO' : this.#pos === 1 ? 'DESPLEGADO' : 'DETENIDO';
  }

  #estado() {
    this.#linea({
      tipo: 'estado',
      ts: Date.now() - this.#t0,
      temp: this.#temp,
      hum: Math.round(this.#hum),
      dht_ok: true,
      lluvia: this.#lluvia,
      luz: this.#luz,
      estado: this.#nombreEstado(),
      fc_plegado: this.#pos === 0 && this.#dir === 'detenido',
      fc_desplegado: this.#pos === 1 && this.#dir === 'detenido',
      modo: this.#modo,
      razon: this.#razon,
      motor: { dir: this.#dir, pwm: 170, t: Math.round(this.#tMov / 100) / 10, ciclos: this.#ciclos, atasco: this.#atasco },
      manual_restante_s: 0,
    });
  }

  #evento(evento, descripcion) {
    this.#linea({ tipo: 'evento', ts: Date.now() - this.#t0, evento, descripcion });
  }

  #linea(obj) {
    this.emit('linea', JSON.stringify(obj));
  }
}
