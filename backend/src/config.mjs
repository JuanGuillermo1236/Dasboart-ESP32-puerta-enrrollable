import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// Se pueden cambiar con variables de entorno, por ejemplo: $env:PUERTO_SERIE="COM4"; npm start
export const config = {
  puertoHttp: Number(process.env.PUERTO_HTTP ?? 3000),
  host: process.env.HOST ?? '127.0.0.1',
  puertoSerie: process.env.PUERTO_SERIE ?? null, // null = buscar el ESP32 automáticamente
  baudios: 115200,
  rutaBase: process.env.RUTA_BASE ?? join(raiz, 'datos', 'cacaocover.db'),
  carpetaDashboard: join(raiz, '..', 'frontend', 'dist'),
  diasRetencion: 30,
  timeoutComandoMs: 3000,
  reintentoSerieMs: 3000,
  simular: process.argv.includes('--simular'),
};
