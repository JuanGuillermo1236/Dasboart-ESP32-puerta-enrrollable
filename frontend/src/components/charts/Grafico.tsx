import { useEffect, useRef } from 'preact/hooks';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { Lecturas } from '../../api/types.ts';

interface Props {
  lecturas: Lecturas;
  campo: 'temp' | 'hum';
  unidad: string;
  tema: string; // recrea el gráfico al cambiar de tema
}

const color = (nombre: string) => getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
const horaCorta = (seg: number) => new Date(seg * 1000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

// Franjas con lluvia y líneas de apertura (A) y cierre (C) sobre el gráfico.
function dibujarContexto(lecturas: Lecturas) {
  return (u: uPlot) => {
    const { ctx } = u;
    const { top, height, left, width } = u.bbox;
    const pts = lecturas.puntos;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();
    ctx.fillStyle = color('--ink');
    ctx.globalAlpha = 0.1;
    pts.forEach((p, i) => {
      if (!p.lluvia) return;
      const x0 = u.valToPos(p.ts / 1000, 'x', true);
      const x1 = u.valToPos((pts[i + 1]?.ts ?? p.ts + 60000) / 1000, 'x', true);
      ctx.fillRect(x0, top, Math.max(2, x1 - x0), height);
    });
    ctx.globalAlpha = 0.9;
    ctx.font = `bold ${11 * devicePixelRatio}px JetBrains Mono, monospace`;
    for (const m of lecturas.marcadores) {
      const x = u.valToPos(m.ts / 1000, 'x', true);
      const abierto = m.tipo === 'plegado';
      ctx.strokeStyle = abierto ? color('--ok') : color('--ink');
      ctx.fillStyle = ctx.strokeStyle;
      ctx.setLineDash([4 * devicePixelRatio, 4 * devicePixelRatio]);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + height);
      ctx.stroke();
      ctx.fillText(abierto ? 'A' : 'C', x + 3 * devicePixelRatio, top + 12 * devicePixelRatio);
    }
    ctx.restore();
  };
}

export function Grafico({ lecturas, campo, unidad, tema }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const grafico = useRef<uPlot | null>(null);

  useEffect(() => {
    const el = caja.current!;
    const tinta = color('--ink2');
    const opciones: uPlot.Options = {
      width: el.clientWidth,
      height: 200,
      cursor: { drag: { x: false, y: false } },
      legend: { live: true },
      scales: { x: { time: true } },
      axes: [
        { stroke: tinta, grid: { stroke: color('--line') }, ticks: { stroke: color('--line') }, values: (_u, vals) => vals.map((v) => horaCorta(v)) },
        { stroke: tinta, grid: { stroke: color('--line') }, ticks: { stroke: color('--line') }, values: (_u, vals) => vals.map((v) => `${v}${unidad}`) },
      ],
      series: [
        { label: 'Hora', value: (_u, v) => (v == null ? '—' : horaCorta(v)) },
        {
          label: campo === 'temp' ? 'Temperatura' : 'Humedad',
          stroke: color('--hi'),
          width: 2,
          fill: `${color('--hi')}22`,
          spanGaps: false,
          value: (_u, v) => (v == null ? '—' : `${v.toFixed(campo === 'temp' ? 1 : 0)} ${unidad}`),
        },
      ],
      hooks: { draw: [] },
    };
    const datos: uPlot.AlignedData = [lecturas.puntos.map((p) => p.ts / 1000), lecturas.puntos.map((p) => p[campo])];
    const u = new uPlot(opciones, datos, el);
    grafico.current = u;
    const ajustar = new ResizeObserver(() => u.setSize({ width: el.clientWidth, height: 200 }));
    ajustar.observe(el);
    return () => {
      ajustar.disconnect();
      u.destroy();
      grafico.current = null;
    };
    // Solo se recrea al cambiar de tema o de campo; los datos se actualizan en el efecto de abajo.
  }, [tema, campo]);

  useEffect(() => {
    const u = grafico.current;
    if (!u) return;
    u.hooks.draw = [dibujarContexto(lecturas)];
    u.setData([lecturas.puntos.map((p) => p.ts / 1000), lecturas.puntos.map((p) => p[campo])]);
  }, [lecturas, campo]);

  return <div class="grafico" ref={caja} />;
}
