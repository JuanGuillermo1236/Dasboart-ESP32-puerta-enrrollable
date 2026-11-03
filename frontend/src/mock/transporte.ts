import type { Transporte } from '../api/types.ts';
import { MockEngine } from './engine.ts';

// ?mock=1: el simulador corre dentro de la página, sin servidor.
export function crearTransporteMock(): Transporte {
  const motor = new MockEngine();
  return {
    conectar(onEstado, onConexion) {
      onConexion(true);
      onEstado(motor.estado());
      const fisica = setInterval(() => motor.avanzar(0.2), 200);
      const envio = setInterval(() => onEstado(motor.estado()), 1000);
      return () => {
        clearInterval(fisica);
        clearInterval(envio);
      };
    },
    comando: async (accion) => motor.comando(accion),
    cambiarModo: async (modo) => motor.cambiarModo(modo),
  };
}
