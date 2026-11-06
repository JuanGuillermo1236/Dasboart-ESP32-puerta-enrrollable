import type { Datos } from '../../api/types.ts';

// Sin sensor de posición: durante el movimiento se anima hacia el destino, no muestra un valor medido.
function destino(d: Datos): 'abierta' | 'cerrada' | 'desconocida' {
  if (d.motor.dir === 'desplegar' || (d.fc_desplegado && !d.fc_plegado)) return 'cerrada';
  if (d.motor.dir === 'plegar' || (d.fc_plegado && !d.fc_desplegado)) return 'abierta';
  return 'desconocida';
}

const led = (on: boolean, fallo: boolean) => (fallo ? 'var(--crit)' : on ? 'var(--ok)' : 'var(--line)');

export function Cubierta({ datos: d }: { datos: Datos }) {
  const fallo = d.fc_plegado && d.fc_desplegado;
  return (
    <div class="cubierta" role="img" aria-label={`Techo: ${d.estado}`}>
      {d.lluvia &&
        Array.from({ length: 22 }, (_, i) => (
          <span key={i} class="gota" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${((i * 0.29) % 1.1).toFixed(2)}s` }} />
        ))}
      <div class="cubierta-grano" />
      <div class="cubierta-riel" />
      <div class="cubierta-marco">
        <div class="cubierta-techo" data-pos={destino(d)} />
      </div>
      <span class="cubierta-txt" style={{ left: '18px' }}>Plegado {d.fc_plegado ? '●' : '○'}</span>
      <span class="cubierta-txt" style={{ right: '18px' }}>Desplegado {d.fc_desplegado ? '●' : '○'}</span>
      <span class="cubierta-led" style={{ left: '10px', background: led(d.fc_plegado, fallo) }} />
      <span class="cubierta-led" style={{ right: '10px', background: led(d.fc_desplegado, fallo) }} />
    </div>
  );
}
