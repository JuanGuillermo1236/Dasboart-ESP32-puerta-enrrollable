import { render } from 'preact';
import { App } from './app.tsx';
import { transporteEsp32 } from './api/client.ts';
import type { Transporte } from './api/types.ts';
import { usarTransporte } from './state/acciones.ts';
import { actualizar } from './state/store.ts';
import './styles/tokens.css';
import './styles/base.css';

declare const __MOCK__: boolean;

async function elegirTransporte(): Promise<Transporte> {
  // __MOCK__ es false en el build del ESP32: el simulador queda fuera del paquete.
  if (__MOCK__ && new URLSearchParams(location.search).has('mock')) {
    const { crearTransporteMock } = await import('./mock/transporte.ts');
    return crearTransporteMock();
  }
  return transporteEsp32;
}

async function iniciar() {
  const transporte = await elegirTransporte();
  usarTransporte(transporte);
  render(<App />, document.getElementById('app')!);
  transporte.conectar(
    (estado) => actualizar({ estado, recibidoEn: Date.now() }),
    (conectado) => actualizar({ conectado }),
  );
  setInterval(() => actualizar({ ahora: Date.now() }), 1000);
}

void iniciar();
