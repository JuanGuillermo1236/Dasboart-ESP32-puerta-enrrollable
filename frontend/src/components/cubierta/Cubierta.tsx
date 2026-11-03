import type { Estado } from '../../api/types.ts';

// Sin sensor de posición: durante el movimiento se anima hacia el destino, no muestra un valor medido.
function destino(e: Estado): 'abierta' | 'cerrada' | 'desconocida' {
  if (e.motor.dir === 'cerrar' || e.cubierta.fc_cerrado) return 'cerrada';
  if (e.motor.dir === 'abrir' || e.cubierta.fc_abierto) return 'abierta';
  return 'desconocida';
}

const led = (on: boolean, fallo: boolean) => (fallo ? 'var(--crit)' : on ? 'var(--ok)' : 'var(--line)');

export function Cubierta({ estado: e }: { estado: Estado }) {
  const fallo = e.cubierta.fc_abierto && e.cubierta.fc_cerrado;
  const gotas = e.lluvia.estado === 'Lluvia' ? 22 : 0;
  return (
    <div class="cubierta" role="img" aria-label={`Cubierta: ${e.cubierta.estado}`}>
      {Array.from({ length: gotas }, (_, i) => (
        <span key={i} class="gota" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${((i * 0.29) % 1.1).toFixed(2)}s` }} />
      ))}
      <div class="cubierta-grano" />
      <div class="cubierta-riel" />
      <div class="cubierta-marco">
        <div class="cubierta-techo" data-pos={destino(e)} />
      </div>
      <span class="cubierta-txt" style={{ left: '18px' }}>FC abierto {e.cubierta.fc_abierto ? '✓' : '–'}</span>
      <span class="cubierta-txt" style={{ right: '18px' }}>FC cerrado {e.cubierta.fc_cerrado ? '✓' : '–'}</span>
      <span class="cubierta-led" style={{ left: '10px', background: led(e.cubierta.fc_abierto, fallo) }} />
      <span class="cubierta-led" style={{ right: '10px', background: led(e.cubierta.fc_cerrado, fallo) }} />
    </div>
  );
}
