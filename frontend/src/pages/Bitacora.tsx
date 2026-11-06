import { useState } from 'preact/hooks';
import type { Categoria, Evento } from '../api/types.ts';
import { ListaEventos } from '../components/eventos/ListaEventos.tsx';

const FILTROS: [string, string, Categoria | null][] = [
  ['todos', 'Todos', null],
  ['alertas', 'Alertas', 'alerta'],
  ['motor', 'Motor', 'motor'],
  ['lluvia', 'Lluvia', 'lluvia'],
];

export function Bitacora({ eventos, ahora }: { eventos: Evento[]; ahora: number }) {
  const [filtro, setFiltro] = useState('todos');
  const categoria = FILTROS.find(([id]) => id === filtro)?.[2] ?? null;
  const visibles = categoria ? eventos.filter((e) => e.categoria === categoria) : eventos;
  return (
    <div class="pagina">
      <section class="tarjeta">
        <div class="entre">
          <h2>Bitácora de eventos</h2>
          <a class="boton-lima" href={`/api/eventos.csv?filtro=${filtro}`} download>Exportar CSV</a>
        </div>
        <div class="selector" role="group" aria-label="Filtro">
          {FILTROS.map(([id, nombre]) => (
            <button key={id} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nombre}</button>
          ))}
        </div>
        <ListaEventos eventos={visibles} ahora={ahora} vacio="No hay eventos con este filtro." />
        <div class="medida-sub">{visibles.length} eventos · guardados en SQLite</div>
      </section>
    </div>
  );
}
