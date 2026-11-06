import type { Alerta } from '../../state/alertas.ts';

const ETIQUETA = { info: 'Info', aviso: 'Aviso', critica: 'Crítica' } as const;
const ICONO = { info: 'i', aviso: '▲', critica: '✕' } as const;

export function ListaAlertas({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) {
    return (
      <div class="alerta">
        <span class="alerta-icono sev-ok">✓</span>
        <div>
          <div class="alerta-titulo">Todo en orden</div>
          <div class="medida-sub">Sensores, motor y conexión funcionando.</div>
        </div>
      </div>
    );
  }
  return (
    <>
      {alertas.map((a) => (
        <div key={a.id} class={`alerta alerta-${a.severidad}`}>
          <span class={`alerta-icono sev-${a.severidad}`}>{ICONO[a.severidad]}</span>
          <div>
            <div class="alerta-titulo">{a.titulo} <span class="etiqueta">{ETIQUETA[a.severidad]}</span></div>
            <div class="medida-sub">{a.detalle}</div>
          </div>
        </div>
      ))}
    </>
  );
}
