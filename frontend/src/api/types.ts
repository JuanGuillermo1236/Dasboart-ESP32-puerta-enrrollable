// Tipos del contrato: deben coincidir con docs/api-contract.md y docs/protocolo-serie.md.

export type EstadoTecho = 'PLEGADO' | 'DESPLEGADO' | 'PLEGANDO' | 'DESPLEGANDO' | 'DETENIDO' | 'ERROR';
export type Modo = 'auto' | 'manual';
export type Accion = 'abrir' | 'cerrar' | 'detener' | 'auto' | 'manual';
export type Rango = '1h' | '6h' | '24h';
export type Categoria = 'motor' | 'lluvia' | 'alerta' | 'info';

export interface Datos {
  temp: number | null;
  hum: number | null;
  dht_ok: boolean;
  lluvia: boolean;
  luz: boolean;
  estado: EstadoTecho;
  fc_plegado: boolean;
  fc_desplegado: boolean;
  modo: Modo;
  razon: string;
  motor: { dir: 'plegar' | 'desplegar' | 'detenido'; pwm: number; t: number; ciclos: number; atasco: boolean };
  manual_restante_s: number;
  ts_dispositivo: number;
}

export interface Foto {
  conectado: boolean;
  puerto: string | null;
  ultima_lectura: number | null;
  datos: Datos | null;
}

export interface Evento {
  id: number;
  ts: number;
  tipo: string;
  categoria: Categoria;
  descripcion: string;
}

export interface Punto {
  ts: number;
  temp: number | null;
  hum: number | null;
  lluvia: number;
  luz: number;
}

export interface Lecturas {
  rango: Rango;
  puntos: Punto[];
  marcadores: { ts: number; tipo: string }[];
}

export type RespuestaComando = { ok: true } | { ok: false; error: string };

export type MensajeWs = ({ tipo: 'estado' } & Foto) | { tipo: 'evento'; evento: Evento };
