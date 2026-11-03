const ARCO = 188.5;

interface Props {
  titulo: string;
  valor: string;
  unidad?: string;
  sub: string;
  centro: string;
  fraccion: number;
  chip?: { texto: string; clase: string };
}

export function Medida({ titulo, valor, unidad, sub, centro, fraccion, chip }: Props) {
  const f = Math.max(0, Math.min(1, fraccion));
  return (
    <section class="tarjeta tarjeta-datos">
      <div class="entre">
        <span class="etiqueta">{titulo}</span>
        {chip && <span class={`chip ${chip.clase}`}>{chip.texto}</span>}
      </div>
      <div class="medida">
        <div class="gauge">
          <svg viewBox="0 0 100 100" width="76" height="76" aria-hidden="true">
            <circle cx="50" cy="50" r="40" transform="rotate(135 50 50)" style={{ stroke: 'var(--line)', strokeDasharray: `${ARCO} 999` }} />
            <circle cx="50" cy="50" r="40" transform="rotate(135 50 50)" style={{ stroke: 'var(--hi)', strokeDasharray: `${(f * ARCO).toFixed(1)} 999` }} />
          </svg>
          <span aria-hidden="true">{centro}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <span class={`medida-valor${unidad ? '' : ' texto'}`}>{valor}</span>
          {unidad && <span class="medida-unidad"> {unidad}</span>}
          <div class="medida-sub">{sub}</div>
        </div>
      </div>
    </section>
  );
}
