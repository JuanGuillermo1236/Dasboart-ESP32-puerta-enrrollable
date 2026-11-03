import type { Accion, Modo, RespuestaEscritura, Transporte } from '../api/types.ts';
import { mensajeError } from '../i18n/es.ts';
import { mostrarToast } from './store.ts';

let transporte: Transporte;
export const usarTransporte = (t: Transporte) => {
  transporte = t;
};

function informar(r: RespuestaEscritura, exito: string): void {
  if (r.ok) mostrarToast(exito);
  else mostrarToast(mensajeError(r.error, r.mensaje), true);
}

const TEXTO_ACCION: Record<Accion, string> = {
  abrir: 'Abriendo cubierta…',
  cerrar: 'Cerrando cubierta…',
  detener: 'Motor detenido',
};

export const enviarComando = async (accion: Accion) => informar(await transporte.comando(accion), TEXTO_ACCION[accion]);
export const enviarModo = async (modo: Modo) =>
  informar(await transporte.cambiarModo(modo), modo === 'auto' ? 'Modo Automático activado' : 'Modo Manual activado');
