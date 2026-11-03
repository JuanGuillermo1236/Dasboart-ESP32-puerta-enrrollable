// Tipos del contrato: deben coincidir con docs/api-contract.md.

export type Modo = 'auto' | 'manual';
export type Tendencia = 'sube' | 'baja' | 'estable';
export type EtiquetaLuz = 'Con luz' | 'Oscuro';
export type EstadoLluvia = 'Seco' | 'Lluvia';
export type EstadoCubierta = 'Abierta' | 'Cerrada' | 'En movimiento' | 'Error';
export type DireccionMotor = 'abrir' | 'cerrar' | 'detenido';
export type Severidad = 'info' | 'aviso' | 'critica';
export type Accion = 'abrir' | 'cerrar' | 'detener';

export interface Alerta {
  id: string;
  severidad: Severidad;
  codigo: string;
  mensaje: string;
  ts: number | null;
}

export interface Umbrales {
  hum_max: number;
  temp_max: number;
  motor_max_s: number;
  pwm_pct: number;
  hist_hum: number;
  hist_temp: number;
  espera_accion_s: number;
  manual_timeout_min: number;
  lluvia_manda: boolean;
}

export interface Estado {
  ts: number | null;
  uptime: number;
  modo: Modo;
  razon_ultima_accion: string;
  dht: {
    ok: boolean;
    temp: number | null;
    hum: number | null;
    temp_min: number | null;
    temp_max: number | null;
    hum_min: number | null;
    hum_max: number | null;
    tendencia_temp: Tendencia | null;
    tendencia_hum: Tendencia | null;
  };
  luz: { hay_luz: boolean; etiqueta: EtiquetaLuz };
  lluvia: { estado: EstadoLluvia };
  cubierta: {
    estado: EstadoCubierta;
    fc_abierto: boolean;
    fc_cerrado: boolean;
    posicion_conocida: boolean;
  };
  motor: {
    dir: DireccionMotor;
    pwm_pct: number;
    t_funcionamiento_s: number;
    ciclos: number;
    atasco: boolean;
    habilitado: boolean;
  };
  wifi: { ssid: string; rssi: number | null; ip: string | null; conectado: boolean };
  sistema: { mem_libre: number; ultima_actualizacion: number | null };
  alertas_activas: Alerta[];
  umbrales: Umbrales;
}

export type RespuestaEscritura =
  | { ok: true }
  | { ok: false; error: string; mensaje?: string };

// Lo que necesita la app de su origen de datos: el ESP32 real o el mock en el navegador.
export interface Transporte {
  conectar(onEstado: (e: Estado) => void, onConexion: (conectado: boolean) => void): () => void;
  comando(accion: Accion): Promise<RespuestaEscritura>;
  cambiarModo(modo: Modo): Promise<RespuestaEscritura>;
}
