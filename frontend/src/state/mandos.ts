import type { Estado } from '../api/types.ts';

export interface EstadoMandos {
  abrir: boolean;
  cerrar: boolean;
  detener: boolean;
  motivo: string;
}

// Decide qué botones se pueden usar y explica por qué los demás no. El ESP32 vuelve a validar cada comando.
export function evaluarMandos(e: Estado, conectado: boolean): EstadoMandos {
  const bloqueado = (motivo: string, detener = false): EstadoMandos => ({ abrir: false, cerrar: false, detener, motivo });
  const moviendo = e.motor.dir !== 'detenido';
  if (!conectado) return bloqueado('Sin conexión con el ESP32.');
  if (!e.motor.habilitado) return bloqueado('Motor deshabilitado en este firmware.');
  if (e.cubierta.fc_abierto && e.cubierta.fc_cerrado) return bloqueado('Fallo de finales de carrera: motor bloqueado.', moviendo);
  if (e.modo === 'auto') return bloqueado('El ESP32 decide en modo Automático. Cambia a Manual para abrir o cerrar.', moviendo);
  const llueve = e.lluvia.estado !== 'Seco' && e.umbrales.lluvia_manda;
  const abrir = !e.cubierta.fc_abierto && !llueve;
  const cerrar = !e.cubierta.fc_cerrado;
  let motivo = 'Controles activos.';
  if (llueve) motivo = 'Está lloviendo: no se puede abrir.';
  else if (e.cubierta.fc_abierto) motivo = 'La cubierta ya está abierta.';
  else if (e.cubierta.fc_cerrado) motivo = 'La cubierta ya está cerrada.';
  return { abrir, cerrar, detener: moviendo, motivo };
}
