import type { Estado } from '../api/types.ts';
import { Cubierta } from '../components/cubierta/Cubierta.tsx';
import { SelectorModo } from '../components/ui/SelectorModo.tsx';
import { enviarComando } from '../state/acciones.ts';
import { evaluarMandos } from '../state/mandos.ts';

export function Control({ estado: e, conectado }: { estado: Estado; conectado: boolean }) {
  const m = evaluarMandos(e, conectado);
  const moviendo = e.motor.dir !== 'detenido';
  const fraccion = Math.min(1, e.motor.t_funcionamiento_s / e.umbrales.motor_max_s);
  return (
    <div class="pagina">
      <div class="fila">
        <section class="tarjeta principal">
          <div class="entre">
            <h2>Control de la cubierta</h2>
            <SelectorModo modo={e.modo} conectado={conectado} />
          </div>
          <div class="mandos">
            <button class="mando mando-abrir" disabled={!m.abrir} onClick={() => enviarComando('abrir')}>Abrir</button>
            <button class="mando mando-cerrar" disabled={!m.cerrar} onClick={() => enviarComando('cerrar')}>Cerrar</button>
            <button class="mando mando-detener" disabled={!m.detener} onClick={() => enviarComando('detener')}>Detener</button>
          </div>
          <div class="aviso-mando" role="status">{m.motivo}</div>
          <Cubierta estado={e} />
        </section>
        <section class="tarjeta lateral tarjeta-datos">
          <div class="entre">
            <h2>Motorreductor N20</h2>
            <span class="medida-sub">TB6612FNG</span>
          </div>
          <div class="medida">
            <div class={`motor-giro${moviendo ? ' activo' : ''}`} aria-hidden="true">{moviendo ? (e.motor.dir === 'abrir' ? '←' : '→') : '■'}</div>
            <div>
              <div class="medida-valor texto">{moviendo ? (e.motor.dir === 'abrir' ? 'Abriendo' : 'Cerrando') : 'Detenido'}</div>
              <div class="medida-sub">Máximo permitido: {e.umbrales.motor_max_s} s</div>
            </div>
          </div>
          <div class="datos">
            <div class="dato"><div class="etiqueta">PWM</div><div class="dato-valor">{e.motor.pwm_pct} %</div></div>
            <div class="dato"><div class="etiqueta">Tiempo</div><div class="dato-valor">{e.motor.t_funcionamiento_s.toFixed(1)} s</div></div>
            <div class="dato"><div class="etiqueta">Ciclos</div><div class="dato-valor">{e.motor.ciclos}</div></div>
          </div>
          <div style={{ height: '8px', borderRadius: '999px', background: 'var(--chip)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${fraccion * 100}%`, background: e.motor.atasco ? 'var(--crit)' : fraccion > 0.8 ? 'var(--warn)' : 'var(--hi)' }} />
          </div>
          {e.motor.atasco && (
            <div class="alerta alerta-critica">
              <span class="alerta-icono sev-critica">✕</span>
              <div>
                <div class="alerta-titulo">Posible atasco</div>
                <div class="medida-sub">Revisa el riel y reintenta en modo Manual.</div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
