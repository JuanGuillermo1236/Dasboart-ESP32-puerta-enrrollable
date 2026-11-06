import type { Foto } from '../api/types.ts';
import { Cubierta } from '../components/cubierta/Cubierta.tsx';
import { SelectorModo } from '../components/ui/SelectorModo.tsx';
import { comando } from '../state/comandos.ts';
import type { EstadoMandos } from '../state/mandos.ts';

const MOTOR_MAX_S = 12;

export function Control({ foto, mandos }: { foto: Foto; mandos: EstadoMandos }) {
  const d = foto.datos;
  const moviendo = d ? d.motor.dir !== 'detenido' : false;
  const fraccion = d ? Math.min(1, d.motor.t / MOTOR_MAX_S) : 0;
  return (
    <div class="pagina">
      <div class="fila">
        <section class="tarjeta principal">
          <div class="entre">
            <h2>Control del techo</h2>
            {d && <SelectorModo modo={d.modo} habilitado={mandos.modo} />}
          </div>
          <div class="mandos">
            <button class="mando mando-abrir" disabled={!mandos.abrir} onClick={() => comando('abrir')}>Abrir<small>plegar</small></button>
            <button class="mando mando-cerrar" disabled={!mandos.cerrar} onClick={() => comando('cerrar')}>Cerrar<small>desplegar</small></button>
            <button class="mando mando-detener" disabled={!mandos.detener} onClick={() => comando('detener')}>Detener</button>
          </div>
          <div class="aviso-mando" role="status">{mandos.motivo}</div>
          {d && <Cubierta datos={d} />}
        </section>
        <section class="tarjeta lateral tarjeta-datos">
          <div class="entre">
            <h2>Motorreductor</h2>
            <span class="medida-sub">TB6612FNG</span>
          </div>
          {d ? (
            <>
              <div class="medida">
                <div class={`motor-giro${moviendo ? ' activo' : ''}`} aria-hidden="true">
                  {d.motor.dir === 'plegar' ? '←' : d.motor.dir === 'desplegar' ? '→' : '■'}
                </div>
                <div>
                  <div class="medida-valor texto">{d.motor.dir === 'plegar' ? 'Plegando' : d.motor.dir === 'desplegar' ? 'Desplegando' : 'Detenido'}</div>
                  <div class="medida-sub">Máximo {MOTOR_MAX_S} s por recorrido</div>
                </div>
              </div>
              <div class="datos">
                <div class="dato"><div class="etiqueta">PWM</div><div class="dato-valor">{d.motor.pwm}/255</div></div>
                <div class="dato"><div class="etiqueta">Tiempo</div><div class="dato-valor">{d.motor.t.toFixed(1)} s</div></div>
                <div class="dato"><div class="etiqueta">Ciclos</div><div class="dato-valor">{d.motor.ciclos}</div></div>
              </div>
              <div class="barra" aria-label="Tiempo del motor frente al máximo">
                <div style={{ width: `${fraccion * 100}%`, background: d.motor.atasco ? 'var(--crit)' : fraccion > 0.8 ? 'var(--warn)' : 'var(--hi)' }} />
              </div>
              {d.motor.atasco && (
                <div class="alerta alerta-critica">
                  <span class="alerta-icono sev-critica">✕</span>
                  <div>
                    <div class="alerta-titulo">Posible atasco</div>
                    <div class="medida-sub">Revisa el hilo y las guías, y vuelve a pulsar Abrir o Cerrar.</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div class="vacio">Sin datos del motor.</div>
          )}
        </section>
      </div>
    </div>
  );
}
