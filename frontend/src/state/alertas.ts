import type { Foto } from '../api/types.ts';
import { LIMITE_DESACTUALIZADO_MS } from './store.ts';

export type Severidad = 'info' | 'aviso' | 'critica';
export interface Alerta {
  id: string;
  severidad: Severidad;
  titulo: string;
  detalle: string;
}

const ORDEN: Record<Severidad, number> = { critica: 0, aviso: 1, info: 2 };

export function calcularAlertas(f: Foto | null, socketAbierto: boolean, ahora: number): Alerta[] {
  const a: Alerta[] = [];
  if (!socketAbierto) {
    return [{ id: 'backend', severidad: 'critica', titulo: 'Sin conexión con el backend', detalle: 'Ejecuta npm start en la carpeta backend. Reintentando…' }];
  }
  if (!f?.conectado) {
    a.push({ id: 'esp32', severidad: 'critica', titulo: 'ESP32 desconectado', detalle: 'Revisa el cable USB y que ningún monitor serie use el puerto. El backend reintenta cada 3 s.' });
  } else if (f.ultima_lectura !== null && ahora - f.ultima_lectura > LIMITE_DESACTUALIZADO_MS) {
    a.push({ id: 'viejo', severidad: 'aviso', titulo: 'Sin datos nuevos', detalle: 'Hace más de 10 s que no llega una lectura del ESP32.' });
  }
  const d = f?.datos;
  if (d) {
    if (d.fc_plegado && d.fc_desplegado) {
      a.push({ id: 'fc', severidad: 'critica', titulo: 'Fallo de finales de carrera', detalle: 'Ambos activos o desconectados. El motor está bloqueado.' });
    }
    if (d.motor.atasco) a.push({ id: 'atasco', severidad: 'critica', titulo: 'Posible atasco del motor', detalle: 'No llegó al final de carrera a tiempo. Revisa el hilo y las guías.' });
    if (d.lluvia && d.estado === 'PLEGADO') a.push({ id: 'lluvia', severidad: 'critica', titulo: 'Lluvia con el techo abierto', detalle: 'El sistema está cerrando el techo.' });
    else if (d.lluvia) a.push({ id: 'lluvia', severidad: 'aviso', titulo: 'Lluvia detectada', detalle: 'El techo se mantiene cerrado.' });
    if (!d.dht_ok) a.push({ id: 'dht', severidad: 'aviso', titulo: 'DHT11 sin lectura', detalle: 'Revisa el cable del pin S (D19).' });
    if (d.modo === 'manual' && d.manual_restante_s > 0 && d.manual_restante_s <= 120) {
      a.push({ id: 'manual', severidad: 'info', titulo: 'Vuelve pronto a Automático', detalle: `En ${d.manual_restante_s} s el modo Manual termina.` });
    }
  }
  return a.sort((x, y) => ORDEN[x.severidad] - ORDEN[y.severidad]);
}
