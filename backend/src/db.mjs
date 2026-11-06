// Base de datos SQLite (incluida en Node, sin instalar nada). Un solo archivo en backend/datos/.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ESQUEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS lecturas (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,          -- epoch en ms, hora de la laptop
    temp REAL, hum REAL,          -- NULL si el DHT11 no respondió
    lluvia INTEGER NOT NULL, luz INTEGER NOT NULL,
    estado TEXT NOT NULL,
    fc_plegado INTEGER NOT NULL, fc_desplegado INTEGER NOT NULL,
    modo TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS lecturas_ts ON lecturas (ts);
  CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,      -- motor | lluvia | alerta | info
    descripcion TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS eventos_ts ON eventos (ts);
`;

const bool = (v) => (v ? 1 : 0);

export function abrirBase(ruta) {
  if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec(ESQUEMA);

  const insLectura = db.prepare(
    'INSERT INTO lecturas (ts, temp, hum, lluvia, luz, estado, fc_plegado, fc_desplegado, modo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insEvento = db.prepare('INSERT INTO eventos (ts, tipo, categoria, descripcion) VALUES (?, ?, ?, ?)');
  // Promedia en grupos para no mandar miles de puntos al gráfico.
  const selLecturas = db.prepare(`
    SELECT CAST(ts / ? AS INTEGER) * ? AS ts,
           ROUND(AVG(temp), 1) AS temp, ROUND(AVG(hum), 0) AS hum,
           MAX(lluvia) AS lluvia, ROUND(AVG(luz), 2) AS luz
    FROM lecturas WHERE ts >= ? GROUP BY CAST(ts / ? AS INTEGER) ORDER BY ts`);
  const selEventos = db.prepare('SELECT id, ts, tipo, categoria, descripcion FROM eventos ORDER BY ts DESC, id DESC LIMIT ?');
  const selEventosCat = db.prepare('SELECT id, ts, tipo, categoria, descripcion FROM eventos WHERE categoria = ? ORDER BY ts DESC, id DESC LIMIT ?');
  const selEventosDesde = db.prepare("SELECT ts, tipo FROM eventos WHERE ts >= ? AND categoria = 'motor' AND tipo IN ('plegado', 'desplegado') ORDER BY ts");

  return {
    guardarLectura(ts, d) {
      insLectura.run(ts, d.temp, d.hum, bool(d.lluvia), bool(d.luz), d.estado, bool(d.fc_plegado), bool(d.fc_desplegado), d.modo);
    },
    guardarEvento(ev) {
      const r = insEvento.run(ev.ts, ev.tipo, ev.categoria, ev.descripcion);
      return { id: Number(r.lastInsertRowid), ...ev };
    },
    lecturas(desde, puntos) {
      const grupo = Math.max(1, Math.ceil((Date.now() - desde) / puntos));
      return selLecturas.all(grupo, grupo, desde, grupo);
    },
    // Aperturas y cierres completos en el rango, para marcarlos en el gráfico.
    marcadores(desde) {
      return selEventosDesde.all(desde);
    },
    eventos(categoria, limite) {
      return categoria ? selEventosCat.all(categoria, limite) : selEventos.all(limite);
    },
    purgar(antesDe) {
      db.prepare('DELETE FROM lecturas WHERE ts < ?').run(antesDe);
      db.prepare('DELETE FROM eventos WHERE ts < ?').run(antesDe);
    },
    cerrar() {
      db.close();
    },
  };
}
