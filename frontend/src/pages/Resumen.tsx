import type { Evento, Foto } from '../api/types.ts';
import { ListaAlertas } from '../components/alertas/ListaAlertas.tsx';
import { Cubierta } from '../components/cubierta/Cubierta.tsx';
import { ListaEventos } from '../components/eventos/ListaEventos.tsx';
import { Medida } from '../components/ui/Medida.tsx';
import { SelectorModo } from '../components/ui/SelectorModo.tsx';
import { TECHO } from '../i18n/es.ts';
import type { Alerta } from '../state/alertas.ts';
import { numero } from '../utils/formato.ts';

interface Props {
  foto: Foto;
  alertas: Alerta[];
  eventos: Evento[];
  ahora: number;
  puedeMandar: boolean;
  irA: (tab: 'bitacora') => void;
}

function chipTecho(estado: Foto['datos'] & object): { texto: string; clase: string } {
  if (estado.estado === 'ERROR') return { texto: '✕ Error', clase: 'sev-critica' };
  if (estado.lluvia && estado.estado === 'PLEGADO') return { texto: '✕ Abierto con lluvia', clase: 'sev-critica' };
  if (estado.estado === 'PLEGANDO' || estado.estado === 'DESPLEGANDO') return { texto: '↔ En movimiento', clase: 'sev-info' };
  if (estado.estado === 'DETENIDO') return { texto: '▲ A medio camino', clase: 'sev-aviso' };
  return { texto: '✓ En posición', clase: 'sev-ok' };
}

export function Resumen({ foto, alertas, eventos, ahora, puedeMandar, irA }: Props) {
  const d = foto.datos;
  return (
    <div class="pagina">
      <div class="fila">
        <section class="tarjeta principal tarjeta-datos">
          {d ? (
            <>
              <div class="entre">
                <div class="entre">
                  <span class="etiqueta">Techo</span>
                  <span class={`chip ${chipTecho(d).clase}`}>{chipTecho(d).texto}</span>
                </div>
                <SelectorModo modo={d.modo} habilitado={puedeMandar} />
              </div>
              <div class="palabra" aria-label={TECHO[d.estado].palabra}>
                <span>{TECHO[d.estado].palabra}</span>
                <span aria-hidden="true">{TECHO[d.estado].palabra}</span>
                <span aria-hidden="true">{TECHO[d.estado].palabra}</span>
              </div>
              <div class="entre">
                <div class="razon">{d.razon || 'Sin acciones todavía'}</div>
                <span class="medida-sub">{TECHO[d.estado].sub}</span>
              </div>
              <Cubierta datos={d} />
            </>
          ) : (
            <div class="vacio">Esperando la primera lectura del ESP32…</div>
          )}
        </section>
        <section class="tarjeta lateral">
          <div class="entre">
            <h2>Alertas</h2>
            <span class="medida-sub">{alertas.length ? `${alertas.length} activas` : 'sin alertas'}</span>
          </div>
          <ListaAlertas alertas={alertas} />
        </section>
      </div>
      {d && (
        <div class="rejilla">
          <Medida titulo="Temperatura" valor={d.dht_ok ? numero(d.temp, 1) : 'Sin lectura'} unidad={d.dht_ok ? '°C' : undefined}
            sub="DHT11 · aire" centro="°" fraccion={((d.temp ?? 0) - 10) / 35} />
          <Medida titulo="Humedad" valor={d.dht_ok ? numero(d.hum) : 'Sin lectura'} unidad={d.dht_ok ? '%' : undefined}
            sub="Humedad relativa del aire" centro="%" fraccion={(d.hum ?? 0) / 100} />
          <Medida titulo="Luz" valor={d.luz ? 'Con luz' : 'Oscuro'} sub={d.luz ? 'Puede abrir' : 'De noche se cierra'} centro={d.luz ? '☼' : '☾'} fraccion={d.luz ? 1 : 0} />
          <Medida titulo="Lluvia" valor={d.lluvia ? 'Lloviendo' : 'Seco'} sub={d.lluvia ? 'El techo se cierra' : 'Abre tras 15 min seco'}
            centro={d.lluvia ? '●' : '○'} fraccion={d.lluvia ? 1 : 0} chip={d.lluvia ? { texto: '▲ Detectada', clase: 'sev-aviso' } : undefined} />
        </div>
      )}
      <section class="tarjeta">
        <div class="entre">
          <h2>Últimos eventos</h2>
          <button class="enlace" onClick={() => irA('bitacora')}>Ver bitácora</button>
        </div>
        <ListaEventos eventos={eventos.slice(0, 5)} ahora={ahora} vacio="Aún no hay eventos." />
      </section>
    </div>
  );
}
