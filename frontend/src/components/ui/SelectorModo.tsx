import type { Modo } from '../../api/types.ts';
import { comando } from '../../state/comandos.ts';

export function SelectorModo({ modo, habilitado }: { modo: Modo; habilitado: boolean }) {
  return (
    <div class="selector" role="group" aria-label="Modo de operación">
      <button aria-pressed={modo === 'auto'} disabled={!habilitado} onClick={() => modo !== 'auto' && comando('auto')}>Automático</button>
      <button aria-pressed={modo === 'manual'} disabled={!habilitado} onClick={() => modo !== 'manual' && comando('manual')}>Manual</button>
    </div>
  );
}
