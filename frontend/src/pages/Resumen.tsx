import type { Estado } from '../api/types.ts';
import { ListaAlertas } from '../components/alertas/ListaAlertas.tsx';
import { Cubierta } from '../components/cubierta/Cubierta.tsx';
import { Medida } from '../components/ui/Medida.tsx';
import { SelectorModo } from '../components/ui/SelectorModo.tsx';
import { barrasWifi, duracion, flecha, numero, SIN_LECTURA } from '../utils/formato.ts';

function palabraCubierta(e: Estado): string {
  if (e.cubierta.estado === 'En movimiento') return e.motor.dir === 'abrir' ? 'Abriendo' : 'Cerrando';
  if (e.cubierta.estado !== 'Error' && !e.cubierta.posicion_conocida) return 'Detenida';
  return e.cubierta.estado;
}

function chipCubierta(e: Estado): { icono: string; texto: string; clase: string } {
  if (e.cubierta.estado === 'Error') return { icono: '✕', texto: 'Error', clase: 'sev-critica' };
  if (e.cubierta.estado === 'En movimiento') return { icono: '↔', texto: 'En movimiento', clase: 'sev-info' };
  if (!e.cubierta.posicion_conocida) return { icono: '▲', texto: 'Posición desconocida', clase: 'sev-aviso' };
  if (e.cubierta.estado === 'Abierta' && e.lluvia.estado !== 'Seco') return { icono: '✕', texto: 'Abierta con lluvia', clase: 'sev-critica' };
  return { icono: '✓', texto: e.cubierta.estado, clase: 'sev-ok' };
}

export function Resumen({ estado: e, conectado }: { estado: Estado; conectado: boolean }) {
  const palabra = palabraCubierta(e);
  const chip = chipCubierta(e);
  const { dht, luz, lluvia, motor, wifi } = e;
  const humedadAlta = dht.hum !== null && dht.hum > e.umbrales.hum_max;
  const barras = barrasWifi(wifi.rssi);
  return (
    <div class="pagina">
      <div class="fila">
        <section class="tarjeta principal tarjeta-datos">
          <div class="entre">
            <div class="entre">
              <span class="etiqueta">Cubierta</span>
              <span class={`chip ${chip.clase}`}>{chip.icono} {chip.texto}</span>
            </div>
            <SelectorModo modo={e.modo} conectado={conectado} />
          </div>
          <div class="palabra" aria-label={palabra}>
            <span>{palabra}</span>
            <span aria-hidden="true">{palabra}</span>
            <span aria-hidden="true">{palabra}</span>
          </div>
          <div class="razon">{e.razon_ultima_accion || 'Sin acciones todavía'}</div>
          <Cubierta estado={e} />
          <div class="datos">
            <div class="dato"><div class="etiqueta">Motor</div><div class="dato-valor">{motor.dir === 'detenido' ? 'Detenido' : motor.dir === 'abrir' ? 'Abriendo' : 'Cerrando'}</div></div>
            <div class="dato"><div class="etiqueta">Ciclos desde el arranque</div><div class="dato-valor">{motor.ciclos}</div></div>
            <div class="dato"><div class="etiqueta">Modo</div><div class="dato-valor">{e.modo === 'auto' ? 'Automático' : 'Manual'}</div></div>
          </div>
        </section>
        <section class="tarjeta lateral">
          <div class="entre">
            <h2>Centro de alertas</h2>
            <span class="medida-sub">{e.alertas_activas.length ? `${e.alertas_activas.length} activas` : 'sin alertas'}</span>
          </div>
          <ListaAlertas alertas={e.alertas_activas} />
        </section>
      </div>
      <div class="rejilla">
        <Medida titulo="Temperatura" valor={dht.ok ? numero(dht.temp, 1) : SIN_LECTURA} unidad={dht.ok ? '°C' : undefined}
          sub={`mín ${numero(dht.temp_min, 1)} · máx ${numero(dht.temp_max, 1)}`} centro={flecha(dht.tendencia_temp)}
          fraccion={((dht.temp ?? 10) - 10) / 40} chip={dht.ok ? undefined : { texto: '▲ Falla', clase: 'sev-aviso' }} />
        <Medida titulo="Humedad" valor={dht.ok ? numero(dht.hum) : SIN_LECTURA} unidad={dht.ok ? '%' : undefined}
          sub={`mín ${numero(dht.hum_min)} · máx ${numero(dht.hum_max)}`} centro={flecha(dht.tendencia_hum)}
          fraccion={(dht.hum ?? 0) / 100}
          chip={!dht.ok ? { texto: '▲ Falla', clase: 'sev-aviso' } : humedadAlta ? { texto: `▲ > ${e.umbrales.hum_max}%`, clase: 'sev-aviso' } : undefined} />
        <Medida titulo="Luz" valor={luz.etiqueta} sub="Umbral: tornillo del módulo" centro={luz.hay_luz ? '☼' : '☾'} fraccion={luz.hay_luz ? 1 : 0} />
        <Medida titulo="Lluvia" valor={lluvia.estado} sub="Umbral: tornillo del módulo"
          centro={lluvia.estado === 'Seco' ? '○' : '●'} fraccion={lluvia.estado === 'Seco' ? 0 : 1}
          chip={lluvia.estado === 'Seco' ? undefined : { texto: '▲ Detectada', clase: 'sev-aviso' }} />
      </div>
      <section class="tarjeta tarjeta-datos">
        <h2>Sistema</h2>
        <div class="datos">
          <div class="dato"><div class="etiqueta">IP</div><div class="dato-valor">{wifi.ip ?? '—'}</div></div>
          <div class="dato"><div class="etiqueta">Memoria libre</div><div class="dato-valor">{(e.sistema.mem_libre / 1024).toFixed(0)} kB</div></div>
          <div class="dato">
            <div class="etiqueta">WiFi</div>
            <div class="dato-valor" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <span class="barras" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => <i key={n} style={{ height: `${n * 25}%`, opacity: n <= barras ? 1 : 0.2 }} />)}
              </span>
              {wifi.conectado ? `${wifi.rssi} dBm` : 'Sin señal'}
            </div>
          </div>
          <div class="dato"><div class="etiqueta">Uptime</div><div class="dato-valor">{duracion(e.uptime)}</div></div>
        </div>
      </section>
    </div>
  );
}
