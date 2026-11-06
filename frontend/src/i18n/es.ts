import type { Categoria, EstadoTecho } from '../api/types.ts';

export const TABS = [
  ['resumen', 'Resumen'],
  ['control', 'Control'],
  ['historial', 'Historial'],
  ['bitacora', 'Bitácora'],
  ['sistema', 'Sistema'],
] as const;
export type Tab = (typeof TABS)[number][0];

// Plegado = techo abierto (cacao al sol); desplegado = techo cerrado.
export const TECHO: Record<EstadoTecho, { palabra: string; sub: string }> = {
  PLEGADO: { palabra: 'Abierto', sub: 'Techo plegado' },
  DESPLEGADO: { palabra: 'Cerrado', sub: 'Techo desplegado' },
  PLEGANDO: { palabra: 'Abriendo', sub: 'Plegando' },
  DESPLEGANDO: { palabra: 'Cerrando', sub: 'Desplegando' },
  DETENIDO: { palabra: 'Detenido', sub: 'A medio camino' },
  ERROR: { palabra: 'Error', sub: 'Revisa las alertas' },
};

export const CATEGORIA: Record<Categoria, { nombre: string; icono: string }> = {
  motor: { nombre: 'Motor', icono: 'M' },
  lluvia: { nombre: 'Lluvia', icono: 'LL' },
  alerta: { nombre: 'Alerta', icono: '!' },
  info: { nombre: 'Info', icono: 'i' },
};

const ERRORES: Record<string, string> = {
  fallo_finales: 'Fallo de finales de carrera: el motor está bloqueado.',
  lluvia_activa: 'No se puede abrir mientras llueve.',
  ya_en_posicion: 'El techo ya está en esa posición.',
  motor_deshabilitado: 'El motor está deshabilitado en el firmware.',
  sin_conexion: 'El ESP32 no está conectado.',
  sin_respuesta: 'El ESP32 no respondió. El comando no se confirmó.',
  sin_backend: 'El backend no respondió. ¿Está corriendo npm start?',
};
export const mensajeError = (error: string) => ERRORES[error] ?? `No se pudo completar (${error}).`;
