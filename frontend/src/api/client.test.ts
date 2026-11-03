import { describe, expect, it } from 'vitest';
import { post } from './client.ts';
import { esperaReintentoMs } from './socket.ts';
import { evaluarMandos } from '../state/mandos.ts';
import { MockEngine } from '../mock/engine.ts';

describe('post', () => {
  it('sin respuesta nunca asume éxito', async () => {
    const r = await post('/x', {}, (async () => { throw new Error('red'); }) as typeof fetch);
    expect(r).toMatchObject({ ok: false, error: 'sin_respuesta' });
  });

  it('propaga el error del ESP32', async () => {
    const f = (async () => new Response(JSON.stringify({ ok: false, error: 'motor_deshabilitado' }), { status: 503 })) as typeof fetch;
    expect(await post('/x', {}, f)).toMatchObject({ ok: false, error: 'motor_deshabilitado' });
  });

  it('un 200 sin cuerpo válido no cuenta como éxito', async () => {
    const f = (async () => new Response('nope')) as typeof fetch;
    expect((await post('/x', {}, f)).ok).toBe(false);
  });
});

describe('esperaReintentoMs', () => {
  it('crece y se limita a 30 s', () => {
    expect([0, 1, 2, 10].map(esperaReintentoMs)).toEqual([1000, 2000, 4000, 30000]);
  });
});

describe('evaluarMandos', () => {
  const base = () => new MockEngine().estado();

  it('en automático bloquea y explica', () => {
    const m = evaluarMandos(base(), true);
    expect(m.abrir || m.cerrar).toBe(false);
    expect(m.motivo).toMatch(/Automático/);
  });

  it('sin conexión bloquea todo', () => {
    const e = base();
    e.modo = 'manual';
    expect(evaluarMandos(e, false)).toMatchObject({ abrir: false, cerrar: false, detener: false });
  });

  it('con el motor deshabilitado bloquea todo', () => {
    const e = base();
    e.modo = 'manual';
    e.motor.habilitado = false;
    expect(evaluarMandos(e, true).cerrar).toBe(false);
  });

  it('con lluvia permite cerrar pero no abrir', () => {
    const e = base();
    e.modo = 'manual';
    e.cubierta.fc_abierto = false;
    e.lluvia.estado = 'Lluvia';
    expect(evaluarMandos(e, true)).toMatchObject({ abrir: false, cerrar: true });
  });
});
