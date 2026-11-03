import type { Modo } from '../../api/types.ts';
import { enviarModo } from '../../state/acciones.ts';

export function SelectorModo({ modo, conectado }: { modo: Modo; conectado: boolean }) {
  return (
    <div class="selector" role="group" aria-label="Modo de operación">
      <button aria-pressed={modo === 'auto'} disabled={!conectado} onClick={() => modo !== 'auto' && enviarModo('auto')}>Automático</button>
      <button aria-pressed={modo === 'manual'} disabled={!conectado} onClick={() => modo !== 'manual' && enviarModo('manual')}>Manual</button>
    </div>
  );
}
