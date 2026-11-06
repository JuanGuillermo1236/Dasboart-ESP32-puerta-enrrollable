import { render } from 'preact';
import { App } from './app.tsx';
import { obtenerEventos } from './api/client.ts';
import { abrirSocket } from './api/socket.ts';
import { actualizar, agregarEvento } from './state/store.ts';
import './styles/tokens.css';
import './styles/base.css';

render(<App />, document.getElementById('app')!);

const cargarEventos = () =>
  obtenerEventos()
    .then((eventos) => actualizar({ eventos }))
    .catch(() => {
      // Se reintenta al reconectar el WebSocket.
    });

const esquema = location.protocol === 'https:' ? 'wss' : 'ws';
abrirSocket(
  `${esquema}://${location.host}/ws`,
  (m) => {
    if (m.tipo === 'estado') {
      actualizar({ foto: { conectado: m.conectado, puerto: m.puerto, ultima_lectura: m.ultima_lectura, datos: m.datos } });
    } else {
      agregarEvento(m.evento);
    }
  },
  (abierto) => {
    actualizar({ socketAbierto: abierto });
    if (abierto) void cargarEventos(); // recupera lo ocurrido mientras estaba desconectado
  },
);
setInterval(() => actualizar({ ahora: Date.now() }), 1000);
