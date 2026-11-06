// Arma el servidor HTTP: API, WebSocket y el dashboard compilado.
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import express from 'express';

import { crearApi } from './api.mjs';
import { conectarTiempoReal } from './tiempo-real.mjs';

export function crearServidor({ central, db, simulador, carpetaDashboard }) {
  const app = express();
  app.use('/api', crearApi({ central, db, simulador }));
  if (carpetaDashboard && existsSync(join(carpetaDashboard, 'index.html'))) {
    app.use(express.static(carpetaDashboard));
    app.get('/{*ruta}', (_req, res) => res.sendFile(join(carpetaDashboard, 'index.html')));
  } else {
    app.get('/', (_req, res) => res.type('text').send('Backend de CacaoCover funcionando. Compila el dashboard con: cd frontend; npm run build'));
  }
  const servidor = createServer(app);
  conectarTiempoReal(servidor, central);
  return servidor;
}
