import type { Evento } from '../../api/types.ts';
import { CATEGORIA } from '../../i18n/es.ts';
import { diaRelativo, horaSeg } from '../../utils/formato.ts';

const CLASE = { motor: 'sev-info', lluvia: 'sev-aviso', alerta: 'sev-critica', info: 'ev-info' } as const;

export function ListaEventos({ eventos, ahora, vacio }: { eventos: Evento[]; ahora: number; vacio: string }) {
  if (eventos.length === 0) return <div class="vacio">{vacio}</div>;
  return (
    <ol class="eventos">
      {eventos.map((ev) => (
        <li key={ev.id} class="evento">
          <div class="evento-hora">
            <strong>{horaSeg(ev.ts)}</strong>
            <span>{diaRelativo(ev.ts, ahora)}</span>
          </div>
          <span class={`evento-icono ${CLASE[ev.categoria]}`} title={CATEGORIA[ev.categoria].nombre}>{CATEGORIA[ev.categoria].icono}</span>
          <div class="evento-texto">{ev.descripcion || ev.tipo}</div>
        </li>
      ))}
    </ol>
  );
}
