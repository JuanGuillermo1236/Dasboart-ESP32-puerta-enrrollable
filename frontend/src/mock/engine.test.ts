import { describe, expect, it } from 'vitest';
import { MockEngine } from './engine.ts';

const avanzar = (m: MockEngine, s: number) => {
  for (let i = 0; i < s * 5; i++) m.avanzar(0.2);
};

describe('MockEngine', () => {
  it('cierra por lluvia en automático', () => {
    const m = new MockEngine();
    m.forzado.lluvia = true;
    avanzar(m, 15);
    const e = m.estado();
    expect(e.cubierta.estado).toBe('Cerrada');
    expect(e.razon_ultima_accion).toBe('Cerrado por lluvia');
    expect(e.alertas_activas.some((a) => a.codigo === 'LLUVIA')).toBe(true);
  });

  it('la lluvia manda también en Manual', () => {
    const m = new MockEngine();
    m.cambiarModo('manual');
    m.forzado.lluvia = true;
    avanzar(m, 15);
    expect(m.estado().cubierta.estado).toBe('Cerrada');
  });

  it('rechaza abrir y cerrar en automático', () => {
    const r = new MockEngine().comando('cerrar');
    expect(r).toMatchObject({ ok: false, error: 'modo_automatico' });
  });

  it('marca atasco al superar el tiempo máximo', () => {
    const m = new MockEngine();
    m.cambiarModo('manual');
    m.forzado.atasco = true;
    m.comando('cerrar');
    avanzar(m, 14);
    const e = m.estado();
    expect(e.motor.atasco).toBe(true);
    expect(e.motor.dir).toBe('detenido');
    expect(e.cubierta.estado).toBe('Error');
  });

  it('envía null, no un número, si falla el DHT22', () => {
    const m = new MockEngine();
    m.forzado.dht_falla = true;
    const { dht } = m.estado();
    expect(dht.temp).toBeNull();
    expect(dht.hum).toBeNull();
  });

  it('detener deja la posición desconocida', () => {
    const m = new MockEngine();
    m.cambiarModo('manual');
    m.comando('cerrar');
    avanzar(m, 2);
    m.comando('detener');
    expect(m.estado().cubierta.posicion_conocida).toBe(false);
  });
});
