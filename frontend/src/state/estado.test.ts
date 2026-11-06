import { describe, expect, it } from 'vitest';
import { enviarComando } from '../api/client.ts';
import { esperaReintentoMs } from '../api/socket.ts';
import type { Datos, Foto } from '../api/types.ts';
import { calcularAlertas } from './alertas.ts';
import { evaluarMandos } from './mandos.ts';

const AHORA = 1_000_000;
const datos = (parche: Partial<Datos> = {}): Datos => ({
  temp: 28, hum: 60, dht_ok: true, lluvia: false, luz: true, estado: 'PLEGADO', fc_plegado: true, fc_desplegado: false,
  modo: 'auto', razon: '', motor: { dir: 'detenido', pwm: 170, t: 0, ciclos: 0, atasco: false }, manual_restante_s: 0,
  ts_dispositivo: 5000, ...parche,
});
const foto = (parche: Partial<Datos> = {}, extra: Partial<Foto> = {}): Foto => ({
  conectado: true, puerto: 'COM3', ultima_lectura: AHORA, datos: datos(parche), ...extra,
});

describe('enviarComando', () => {
  it('sin backend nunca asume éxito', async () => {
    const r = await enviarComando('abrir', (async () => { throw new Error('red'); }) as typeof fetch);
    expect(r).toEqual({ ok: false, error: 'sin_backend' });
  });

  it('propaga el error del ESP32', async () => {
    const f = (async () => new Response(JSON.stringify({ ok: false, error: 'fallo_finales' }), { status: 409 })) as typeof fetch;
    expect(await enviarComando('cerrar', f)).toEqual({ ok: false, error: 'fallo_finales' });
  });

  it('un 200 sin cuerpo válido no cuenta como éxito', async () => {
    expect((await enviarComando('abrir', (async () => new Response('nope')) as typeof fetch)).ok).toBe(false);
  });
});

describe('esperaReintentoMs', () => {
  it('crece y se limita a 30 s', () => {
    expect([0, 1, 2, 10].map(esperaReintentoMs)).toEqual([1000, 2000, 4000, 30000]);
  });
});

describe('calcularAlertas', () => {
  it('sin backend solo muestra eso', () => {
    expect(calcularAlertas(foto(), false, AHORA).map((a) => a.id)).toEqual(['backend']);
  });

  it('ESP32 desconectado es crítico', () => {
    expect(calcularAlertas(foto({}, { conectado: false }), true, AHORA)[0].id).toBe('esp32');
  });

  it('avisa si los datos tienen más de 10 s', () => {
    expect(calcularAlertas(foto({}, { ultima_lectura: AHORA - 11000 }), true, AHORA).map((a) => a.id)).toContain('viejo');
  });

  it('ordena: finales y lluvia con techo abierto primero', () => {
    const a = calcularAlertas(foto({ fc_desplegado: true, lluvia: true, dht_ok: false }), true, AHORA);
    expect(a.map((x) => x.severidad)).toEqual(['critica', 'critica', 'aviso']);
  });

  it('todo bien: sin alertas', () => {
    expect(calcularAlertas(foto(), true, AHORA)).toEqual([]);
  });
});

describe('evaluarMandos', () => {
  it('sin ESP32 bloquea todo', () => {
    expect(evaluarMandos(foto({}, { conectado: false }), true)).toMatchObject({ abrir: false, cerrar: false, detener: false, modo: false });
  });

  it('fallo de finales bloquea abrir y cerrar, pero deja cambiar el modo', () => {
    const m = evaluarMandos(foto({ fc_desplegado: true }), true);
    expect(m).toMatchObject({ abrir: false, cerrar: false, modo: true });
  });

  it('plegado: puede cerrar; con lluvia no puede abrir', () => {
    expect(evaluarMandos(foto(), true)).toMatchObject({ abrir: false, cerrar: true });
    expect(evaluarMandos(foto({ fc_plegado: false, estado: 'DETENIDO', lluvia: true }), true)).toMatchObject({ abrir: false, cerrar: true });
  });

  it('detener solo con el motor en marcha', () => {
    const m = evaluarMandos(foto({ fc_plegado: false, estado: 'DESPLEGANDO', motor: { dir: 'desplegar', pwm: 170, t: 1, ciclos: 0, atasco: false } }), true);
    expect(m).toMatchObject({ detener: true, cerrar: false, abrir: true });
  });
});
