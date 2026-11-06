import type { Foto } from '../api/types.ts';

export interface EstadoMandos {
  abrir: boolean;
  cerrar: boolean;
  detener: boolean;
  modo: boolean;
  motivo: string;
}

// Decide qué botones se pueden usar y explica por qué los demás no. El ESP32 vuelve a validar cada comando.
export function evaluarMandos(f: Foto | null, socketAbierto: boolean): EstadoMandos {
  const bloqueado = (motivo: string, detener = false): EstadoMandos => ({ abrir: false, cerrar: false, detener, modo: false, motivo });
  if (!socketAbierto) return bloqueado('Sin conexión con el backend.');
  if (!f?.conectado || !f.datos) return bloqueado('El ESP32 no está conectado.');
  const d = f.datos;
  const moviendo = d.motor.dir !== 'detenido';
  if (d.fc_plegado && d.fc_desplegado) {
    return { ...bloqueado('Fallo de finales de carrera: el motor está bloqueado hasta revisar su conexión.', moviendo), modo: true };
  }
  const abrir = !d.lluvia && !d.fc_plegado && d.motor.dir !== 'plegar';
  const cerrar = !d.fc_desplegado && d.motor.dir !== 'desplegar';
  let motivo = d.modo === 'auto' ? 'Abrir o cerrar pasa el sistema a modo Manual.' : 'Modo Manual: el sistema no actúa solo (salvo con lluvia).';
  if (d.lluvia) motivo = 'Está lloviendo: no se puede abrir.';
  else if (d.fc_plegado) motivo = 'El techo ya está abierto.';
  else if (d.fc_desplegado) motivo = 'El techo ya está cerrado.';
  return { abrir, cerrar, detener: moviendo, modo: true, motivo };
}
