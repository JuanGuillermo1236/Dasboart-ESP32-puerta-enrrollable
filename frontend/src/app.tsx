import { useEffect, useState } from 'preact/hooks';
import { TABS, type Tab } from './i18n/es.ts';
import { Control } from './pages/Control.tsx';
import { Resumen } from './pages/Resumen.tsx';
import { datosDesactualizados, useStore } from './state/store.ts';

type Tema = 'light' | 'dark';

function temaInicial(): Tema {
  try {
    const guardado = localStorage.getItem('tema');
    if (guardado === 'light' || guardado === 'dark') return guardado;
  } catch {
    // Sin almacenamiento se usa la preferencia del sistema.
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function App() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>('resumen');
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try {
      localStorage.setItem('tema', tema);
    } catch {
      // No es crítico: el tema se recalcula al recargar.
    }
  }, [tema]);

  const viejo = datosDesactualizados(s);
  const sinDatos = !s.conectado && s.estado !== null;
  return (
    <>
      <div class="fondo" aria-hidden="true"><i /><i /><i /></div>
      <div class={`app${viejo || sinDatos ? ' desactualizado' : ''}`}>
        <header class="cabecera">
          <div class="marca">
            <div class="marca-logo" aria-hidden="true"><i /><i /><i /></div>
            <div>
              <div class="marca-nombre">CacaoCover</div>
              <div class="etiqueta">Secado de cacao · ESP32</div>
            </div>
          </div>
          <div class="acciones-cabecera">
            <span class="pastilla">
              <span class="punto" style={{ background: s.conectado && !viejo ? 'var(--ok)' : 'var(--crit)' }} />
              {s.conectado ? (viejo ? 'Datos desactualizados' : 'En línea') : 'Sin conexión'}
            </span>
            {s.estado && <span class="pastilla pastilla-solida">{s.estado.modo === 'auto' ? 'AUTO' : 'MANUAL'}</span>}
            <button class="pastilla" onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}>
              {tema === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            </button>
          </div>
        </header>
        <nav class="tabs" role="tablist">
          {TABS.map(([id, nombre]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{nombre}</button>
          ))}
        </nav>
        {!s.conectado && (
          <div class="banner banner-crit" role="alert">
            ✕ Sin conexión con el ESP32. Reintentando… {s.estado ? 'Los datos mostrados están desactualizados.' : ''}
          </div>
        )}
        {s.conectado && viejo && (
          <div class="banner banner-warn" role="status">▲ Más de 10 s sin datos nuevos. Los valores pueden estar desactualizados.</div>
        )}
        {!s.estado ? (
          <div class="vacio">Esperando datos del ESP32…</div>
        ) : tab === 'resumen' ? (
          <Resumen estado={s.estado} conectado={s.conectado} />
        ) : tab === 'control' ? (
          <Control estado={s.estado} conectado={s.conectado} />
        ) : (
          <section class="tarjeta"><div class="vacio">Esta pestaña llega en una próxima ronda.</div></section>
        )}
      </div>
      {s.toast && <div class={`toast${s.toast.error ? ' toast-error' : ''}`} role="status">{s.toast.texto}</div>}
    </>
  );
}
