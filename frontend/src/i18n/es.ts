export const TABS = [
  ['resumen', 'Resumen'],
  ['sensores', 'Sensores'],
  ['control', 'Control'],
  ['historial', 'Historial'],
  ['configuracion', 'Configuración'],
  ['conexiones', 'Conexiones'],
] as const;
export type Tab = (typeof TABS)[number][0];

export const ERRORES: Record<string, string> = {
  motor_deshabilitado: 'Motor deshabilitado en este firmware.',
  modo_automatico: 'Cambia a modo Manual para usar los controles.',
  fallo_finales: 'Fallo de finales de carrera: motor bloqueado.',
  lluvia_activa: 'No se puede abrir mientras llueve.',
  ya_en_posicion: 'La cubierta ya está en esa posición.',
  sin_respuesta: 'El ESP32 no respondió. El comando no se confirmó.',
};
export const mensajeError = (error: string, mensaje?: string) =>
  mensaje ?? ERRORES[error] ?? `No se pudo completar (${error}).`;

export const ETIQUETA_SEVERIDAD = { info: 'Info', aviso: 'Aviso', critica: 'Crítica' } as const;
export const ICONO_SEVERIDAD = { info: 'i', aviso: '▲', critica: '✕' } as const;
