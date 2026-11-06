import { enviarComando } from '../api/client.ts';
import type { Accion } from '../api/types.ts';
import { mensajeError } from '../i18n/es.ts';
import { mostrarToast } from './store.ts';

const EXITO: Record<Accion, string> = {
  abrir: 'Abriendo el techo…',
  cerrar: 'Cerrando el techo…',
  detener: 'Motor detenido',
  auto: 'Modo Automático activado',
  manual: 'Modo Manual activado',
};

export async function comando(accion: Accion): Promise<void> {
  const r = await enviarComando(accion);
  if (r.ok) mostrarToast(EXITO[accion]);
  else mostrarToast(mensajeError(r.error), true);
}
