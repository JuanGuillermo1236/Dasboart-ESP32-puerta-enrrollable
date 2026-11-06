import type { Foto } from '../api/types.ts';
import { duracion, haceCuanto } from '../utils/formato.ts';

const PINES: [string, string][] = [
  ['D19', 'DHT11 (S)'],
  ['D21 / D22', 'OLED SDA / SCK'],
  ['D25', 'Final de plegado'],
  ['D26', 'Final de desplegado'],
  ['D27', 'PWMA del TB6612FNG'],
  ['D33 / D32', 'AIN1 / AIN2'],
  ['D34', 'LDR (DO)'],
  ['D35', 'Lluvia FC-37 (DO)'],
];

function Led({ on, fallo, texto }: { on: boolean; fallo?: boolean; texto: string }) {
  return (
    <div class="led-fila">
      <span class="led" style={{ background: fallo ? 'var(--crit)' : on ? 'var(--ok)' : 'var(--line)' }} />
      <span>{texto}</span>
      <strong>{fallo ? '✕ Fallo' : on ? '● Activo' : '○ Libre'}</strong>
    </div>
  );
}

export function Sistema({ foto, socketAbierto, ahora }: { foto: Foto | null; socketAbierto: boolean; ahora: number }) {
  const d = foto?.datos;
  const fallo = !!d && d.fc_plegado && d.fc_desplegado;
  return (
    <div class="pagina">
      <div class="fila">
        <section class="tarjeta lateral tarjeta-datos">
          <h2>Conexión</h2>
          <div class="datos">
            <div class="dato"><div class="etiqueta">Backend</div><div class="dato-valor">{socketAbierto ? '✓ En línea' : '✕ Caído'}</div></div>
            <div class="dato"><div class="etiqueta">ESP32</div><div class="dato-valor">{foto?.conectado ? `✓ ${foto.puerto}` : '✕ Desconectado'}</div></div>
            <div class="dato"><div class="etiqueta">Última lectura</div><div class="dato-valor">{haceCuanto(foto?.ultima_lectura ?? null, ahora)}</div></div>
            <div class="dato"><div class="etiqueta">ESP32 encendido</div><div class="dato-valor">{d ? duracion(d.ts_dispositivo / 1000) : '—'}</div></div>
          </div>
        </section>
        <section class="tarjeta lateral">
          <h2>Finales de carrera</h2>
          {d ? (
            <>
              <Led on={d.fc_plegado} fallo={fallo} texto="Plegado (techo abierto) · D25" />
              <Led on={d.fc_desplegado} fallo={fallo} texto="Desplegado (techo cerrado) · D26" />
              {fallo && <div class="medida-sub">Ambos activos: con contactos NC esto suele ser un cable suelto. Revisa COM a GND y NC a D25 y D26.</div>}
            </>
          ) : (
            <div class="vacio">Sin datos.</div>
          )}
        </section>
      </div>
      <section class="tarjeta">
        <h2>Pines del ESP32</h2>
        <table class="tabla">
          <tbody>
            {PINES.map(([pin, uso]) => (
              <tr key={pin}><th>{pin}</th><td>{uso}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
