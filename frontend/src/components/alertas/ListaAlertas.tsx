import type { Alerta } from '../../api/types.ts';
import { ETIQUETA_SEVERIDAD, ICONO_SEVERIDAD } from '../../i18n/es.ts';

export function ListaAlertas({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) {
    return (
      <div class="alerta">
        <span class="alerta-icono sev-ok">✓</span>
        <div>
          <div class="alerta-titulo">Todo en orden</div>
          <div class="medida-sub">Sin alertas activas.</div>
        </div>
      </div>
    );
  }
  return (
    <>
      {alertas.map((a) => (
        <div key={a.id} class={`alerta alerta-${a.severidad}`}>
          <span class={`alerta-icono sev-${a.severidad}`}>{ICONO_SEVERIDAD[a.severidad]}</span>
          <div>
            <div class="alerta-titulo">{a.mensaje}</div>
            <div class="medida-sub">{ETIQUETA_SEVERIDAD[a.severidad]} · {a.codigo}</div>
          </div>
        </div>
      ))}
    </>
  );
}
