// ESP32 real por USB. Si se desconecta o el puerto está ocupado, reintenta solo.
import { EventEmitter } from 'node:events';
import { ReadlineParser, SerialPort } from 'serialport';

// Chips USB-serie habituales en las placas ESP32: CP210x (Silicon Labs) y CH340.
const FABRICANTES = ['10c4', '1a86'];

export class DispositivoSerie extends EventEmitter {
  #puertoFijo;
  #baudios;
  #reintentoMs;
  #puerto = null;
  #temporizador;
  #cerrado = false;
  #ultimoAviso = '';

  constructor({ puerto, baudios, reintentoMs }) {
    super();
    this.#puertoFijo = puerto;
    this.#baudios = baudios;
    this.#reintentoMs = reintentoMs;
  }

  iniciar() {
    void this.#abrir();
  }

  escribir(linea) {
    this.#puerto?.write(`${linea}\n`);
  }

  cerrar() {
    this.#cerrado = true;
    clearTimeout(this.#temporizador);
    this.#puerto?.close();
  }

  async #buscar() {
    if (this.#puertoFijo) return this.#puertoFijo;
    const lista = await SerialPort.list();
    return lista.find((p) => FABRICANTES.includes((p.vendorId ?? '').toLowerCase()))?.path ?? null;
  }

  #reintentar(motivo) {
    // Repetir el mismo aviso cada 3 s solo ensucia la consola.
    if (motivo !== this.#ultimoAviso) console.log(`[serie] ${motivo}. Reintentando…`);
    this.#ultimoAviso = motivo;
    this.emit('desconectado', motivo);
    if (!this.#cerrado) this.#temporizador = setTimeout(() => void this.#abrir(), this.#reintentoMs);
  }

  async #abrir() {
    const ruta = await this.#buscar().catch(() => null);
    if (!ruta) return this.#reintentar('No se encontró el ESP32: revisa el cable USB');
    const puerto = new SerialPort({ path: ruta, baudRate: this.#baudios, autoOpen: false });
    puerto.open((err) => {
      if (err) {
        const ocupado = /denied|denegado|busy/i.test(err.message);
        return this.#reintentar(ocupado ? `${ruta} está ocupado: cierra el monitor serie` : `No se pudo abrir ${ruta}`);
      }
      // DTR y RTS en bajo: así el ESP32 no se reinicia ni entra en modo de grabación.
      puerto.set({ dtr: false, rts: false }, () => {});
      this.#puerto = puerto;
      this.#ultimoAviso = '';
      console.log(`[serie] Conectado a ${ruta}`);
      this.emit('conectado', ruta);
    });
    puerto.pipe(new ReadlineParser({ delimiter: '\n' })).on('data', (l) => this.emit('linea', l.trim()));
    puerto.on('close', () => {
      this.#puerto = null;
      this.#reintentar('Se desconectó el ESP32');
    });
    puerto.on('error', () => {});
  }
}
