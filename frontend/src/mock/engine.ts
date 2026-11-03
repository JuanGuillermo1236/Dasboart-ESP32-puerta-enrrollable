// Simulador del ESP32. Sin dependencias de navegador: lo usan ?mock=1 y tools/mock-server.
// Imita las reglas principales del firmware; la fuente de verdad es firmware/src/control/logica.cpp.
import type { Accion, Alerta, Estado, Modo, RespuestaEscritura, Tendencia, Umbrales } from '../api/types.ts';

const UMBRALES: Umbrales = {
  hum_max: 75, temp_max: 40, motor_max_s: 12, pwm_pct: 100,
  hist_hum: 5, hist_temp: 2, espera_accion_s: 60, manual_timeout_min: 30, lluvia_manda: true,
};
const RECORRIDO_S = 7; // al 100 % de PWM

export interface Forzado {
  lluvia?: boolean;
  luz?: boolean;
  temp?: number;
  hum?: number;
  dht_falla?: boolean;
  atasco?: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const r1 = (v: number) => Math.round(v * 10) / 10;
const tendencia = (d: number, margen: number): Tendencia => (d > margen ? 'sube' : d < -margen ? 'baja' : 'estable');

export class MockEngine {
  forzado: Forzado = {};
  private temp = 28;
  private hum = 55;
  private prevTemp = 28;
  private prevHum = 55;
  private tempMin = 28;
  private tempMax = 28;
  private humMin = 55;
  private humMax = 55;
  private uptime = 0;
  private modo: Modo = 'auto';
  private razon = 'Abierto por luz y aire favorable';
  private dir: 'abrir' | 'cerrar' | 'detenido' = 'detenido';
  private avance = 0; // 0 = abierta, 1 = cerrada; interno, el ESP32 real no lo mide
  private tMotor = 0;
  private ciclos = 0;
  private atasco = false;
  private rssi = -61;
  private umbrales = UMBRALES;

  avanzar(dtS: number): void {
    this.uptime += dtS;
    const f = this.forzado;
    const k = clamp(dtS / 6, 0, 1);
    this.prevTemp = this.temp;
    this.prevHum = this.hum;
    this.temp = r1(this.temp + ((f.temp ?? 28) - this.temp) * k + (Math.random() - 0.5) * 0.1);
    this.hum = r1(clamp(this.hum + ((f.hum ?? 55) - this.hum) * k + (Math.random() - 0.5) * 0.3, 0, 100));
    this.tempMin = Math.min(this.tempMin, this.temp);
    this.tempMax = Math.max(this.tempMax, this.temp);
    this.humMin = Math.min(this.humMin, this.hum);
    this.humMax = Math.max(this.humMax, this.hum);
    this.rssi = Math.round(clamp(this.rssi + (Math.random() - 0.5) * 3, -80, -48));
    this.automatico();
    this.moverMotor(dtS);
  }

  private get mojado() { return this.forzado.lluvia ?? false; }
  private get hayLuz() { return this.forzado.luz ?? true; }

  private automatico(): void {
    const u = this.umbrales;
    if (this.atasco || this.dir !== 'detenido') return;
    if (this.mojado && (u.lluvia_manda || this.modo === 'auto')) {
      if (this.avance < 1) this.iniciar('cerrar', 'Cerrado por lluvia');
      return;
    }
    if (this.modo !== 'auto') return;
    if (this.avance < 1 && this.hum > u.hum_max) this.iniciar('cerrar', `Cerrado por humedad > ${u.hum_max}%`);
    else if (this.avance < 1 && !this.hayLuz) this.iniciar('cerrar', 'Cerrado por poca luz');
    else if (this.avance > 0 && this.hayLuz && this.hum < u.hum_max - u.hist_hum) this.iniciar('abrir', 'Abierto por luz y aire favorable');
  }

  private iniciar(dir: 'abrir' | 'cerrar', razon: string): void {
    this.dir = dir;
    this.tMotor = 0;
    this.razon = razon;
  }

  private moverMotor(dtS: number): void {
    if (this.dir === 'detenido') return;
    this.tMotor = r1(this.tMotor + dtS);
    const atorado = this.forzado.atasco && Math.abs(this.avance - 0.5) < 0.05;
    if (!atorado) {
      const paso = ((this.umbrales.pwm_pct / 100) / RECORRIDO_S) * dtS;
      this.avance = clamp(this.avance + (this.dir === 'cerrar' ? paso : -paso), 0, 1);
    }
    if ((this.dir === 'cerrar' && this.avance >= 1) || (this.dir === 'abrir' && this.avance <= 0)) {
      this.dir = 'detenido';
      this.ciclos += 1;
    } else if (this.tMotor > this.umbrales.motor_max_s) {
      this.dir = 'detenido';
      this.atasco = true;
      this.razon = `Detenido: superó ${this.umbrales.motor_max_s} s sin final de carrera`;
    }
  }

  comando(accion: Accion): RespuestaEscritura {
    if (accion === 'detener') {
      if (this.dir !== 'detenido') {
        this.dir = 'detenido';
        this.razon = 'Detenido manualmente';
      }
      return { ok: true };
    }
    if (this.modo !== 'manual') return { ok: false, error: 'modo_automatico', mensaje: 'Cambia a modo Manual para usar los controles.' };
    if (accion === 'abrir' && this.mojado && this.umbrales.lluvia_manda) {
      return { ok: false, error: 'lluvia_activa', mensaje: 'No se puede abrir mientras llueve.' };
    }
    if ((accion === 'abrir' && this.avance <= 0) || (accion === 'cerrar' && this.avance >= 1)) {
      return { ok: false, error: 'ya_en_posicion' };
    }
    this.atasco = false;
    this.iniciar(accion, accion === 'abrir' ? 'Apertura manual' : 'Cierre manual');
    return { ok: true };
  }

  cambiarModo(modo: Modo): RespuestaEscritura {
    this.modo = modo;
    return { ok: true };
  }

  estado(ahora = Date.now()): Estado {
    const ts = Math.floor(ahora / 1000);
    const dhtOk = !this.forzado.dht_falla;
    const fcAbierto = this.avance <= 0 && this.dir === 'detenido';
    const fcCerrado = this.avance >= 1 && this.dir === 'detenido';
    const alertas: Alerta[] = [];
    if (this.atasco) alertas.push({ id: 'atasco', severidad: 'critica', codigo: 'MOTOR_ATASCO', mensaje: 'Posible atasco del motor', ts });
    if (this.mojado) alertas.push({ id: 'lluvia', severidad: 'aviso', codigo: 'LLUVIA', mensaje: 'Lluvia detectada', ts });
    if (!dhtOk) alertas.push({ id: 'dht', severidad: 'aviso', codigo: 'DHT_SIN_LECTURA', mensaje: 'DHT11 sin lectura', ts });
    const estadoCubierta = this.atasco ? 'Error' : this.dir !== 'detenido' ? 'En movimiento' : fcCerrado ? 'Cerrada' : 'Abierta';
    return {
      ts,
      uptime: Math.round(this.uptime),
      modo: this.modo,
      razon_ultima_accion: this.razon,
      dht: {
        ok: dhtOk,
        temp: dhtOk ? this.temp : null,
        hum: dhtOk ? this.hum : null,
        temp_min: this.tempMin,
        temp_max: this.tempMax,
        hum_min: this.humMin,
        hum_max: this.humMax,
        tendencia_temp: dhtOk ? tendencia(this.temp - this.prevTemp, 0.2) : null,
        tendencia_hum: dhtOk ? tendencia(this.hum - this.prevHum, 0.5) : null,
      },
      luz: { hay_luz: this.hayLuz, etiqueta: this.hayLuz ? 'Con luz' : 'Oscuro' },
      lluvia: { estado: this.mojado ? 'Lluvia' : 'Seco' },
      cubierta: {
        estado: estadoCubierta,
        fc_abierto: fcAbierto,
        fc_cerrado: fcCerrado,
        posicion_conocida: fcAbierto || fcCerrado || this.dir !== 'detenido',
      },
      motor: { dir: this.dir, pwm_pct: this.umbrales.pwm_pct, t_funcionamiento_s: this.tMotor, ciclos: this.ciclos, atasco: this.atasco, habilitado: true },
      wifi: { ssid: 'Mock-CacaoCover', rssi: this.rssi, ip: '192.168.1.47', conectado: true },
      sistema: { mem_libre: 183420, ultima_actualizacion: ts },
      alertas_activas: alertas,
      umbrales: this.umbrales,
    };
  }
}
