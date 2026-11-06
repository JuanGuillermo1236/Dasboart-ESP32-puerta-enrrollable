// API REST. Contrato en docs/api-contract.md.
import express from 'express';

const RANGOS = { '1h': 3600000, '6h': 21600000, '24h': 86400000 };
const PUNTOS_GRAFICO = 300;
const FILTROS = { todos: null, alertas: 'alerta', motor: 'motor', lluvia: 'lluvia' };
const CODIGO_ERROR = { sin_conexion: 503, sin_respuesta: 504, cmd_desconocido: 400 };

const csv = (v) => `"${String(v).replace(/"/g, '""')}"`;
const fecha = (ts) => new Date(ts).toLocaleString('es-PE', { hour12: false });

export function crearApi({ central, db, simulador }) {
  const api = express.Router();
  api.use(express.json());

  api.get('/estado', (_req, res) => res.json(central.foto()));

  api.get('/lecturas', (req, res) => {
    const rango = RANGOS[req.query.rango] ? req.query.rango : '1h';
    const desde = Date.now() - RANGOS[rango];
    res.json({ rango, puntos: db.lecturas(desde, PUNTOS_GRAFICO), marcadores: db.marcadores(desde) });
  });

  api.get('/eventos', (req, res) => {
    const filtro = req.query.filtro in FILTROS ? req.query.filtro : 'todos';
    const limite = Math.min(500, Math.max(1, Number(req.query.limite) || 100));
    res.json(db.eventos(FILTROS[filtro], limite));
  });

  api.get('/eventos.csv', (req, res) => {
    const filtro = req.query.filtro in FILTROS ? req.query.filtro : 'todos';
    const filas = db.eventos(FILTROS[filtro], 5000).map((e) => [fecha(e.ts), e.categoria, e.tipo, e.descripcion].map(csv).join(','));
    res.type('text/csv; charset=utf-8');
    res.attachment('cacaocover-eventos.csv');
    // BOM: Excel abre bien las tildes.
    res.send(`﻿${['fecha', 'categoria', 'tipo', 'descripcion'].join(',')}\n${filas.join('\n')}`);
  });

  api.post('/comando', async (req, res) => {
    const r = await central.comando(req.body?.accion);
    res.status(r.ok ? 200 : CODIGO_ERROR[r.error] ?? 409).json(r);
  });

  if (simulador) {
    api.post('/simulacion', (req, res) => {
      simulador.forzar(req.body ?? {});
      res.json({ ok: true });
    });
  }

  api.use((_req, res) => res.status(404).json({ ok: false, error: 'no_encontrado' }));
  return api;
}
