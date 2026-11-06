// npm start: backend con el ESP32 real por USB. npm run simular: con un ESP32 simulado.
import { crearServidor } from './aplicacion.mjs';
import { Central } from './central.mjs';
import { config } from './config.mjs';
import { abrirBase } from './db.mjs';
import { DispositivoSerie } from './dispositivo/serie.mjs';
import { DispositivoSimulado } from './dispositivo/simulador.mjs';

const db = abrirBase(config.rutaBase);
db.purgar(Date.now() - config.diasRetencion * 86400000);

const dispositivo = config.simular
  ? new DispositivoSimulado()
  : new DispositivoSerie({ puerto: config.puertoSerie, baudios: config.baudios, reintentoMs: config.reintentoSerieMs });
const central = new Central(db, dispositivo, { timeoutComandoMs: config.timeoutComandoMs });
const servidor = crearServidor({
  central,
  db,
  simulador: config.simular ? dispositivo : null,
  carpetaDashboard: config.carpetaDashboard,
});

servidor.listen(config.puertoHttp, config.host, () => {
  console.log(`CacaoCover en http://localhost:${config.puertoHttp}${config.simular ? '  (ESP32 SIMULADO)' : ''}`);
  console.log(`Base de datos: ${config.rutaBase}`);
  dispositivo.iniciar();
});

servidor.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `El puerto ${config.puertoHttp} ya está en uso: ¿hay otro backend abierto?` : err);
  process.exit(1);
});

function apagar() {
  dispositivo.cerrar();
  servidor.close();
  db.cerrar();
  process.exit(0);
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
