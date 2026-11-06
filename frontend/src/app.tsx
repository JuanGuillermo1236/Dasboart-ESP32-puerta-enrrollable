import { useEffect, useState } from 'preact/hooks';
import { TABS, type Tab } from './i18n/es.ts';
import { Bitacora } from './pages/Bitacora.tsx';
import { Control } from './pages/Control.tsx';
import { Historial } from './pages/Historial.tsx';
import { Resumen } from './pages/Resumen.tsx';
import { Sistema } from './pages/Sistema.tsx';
import { calcularAlertas } from './state/alertas.ts';
import { evaluarMandos } from './state/mandos.ts';
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

  const alertas = calcularAlertas(s.foto, s.socketAbierto, s.ahora);
  const mandos = evaluarMandos(s.foto, s.socketAbierto);
  const viejo = datosDesactualizados(s);
  const enLinea = s.socketAbierto && !!s.foto?.conectado && !viejo;
  const estadoConexion = !s.socketAbierto ? 'Backend caído' : !s.foto?.conectado ? 'ESP32 desconectado' : viejo ? 'Datos desactualizados' : `En vivo · ${s.foto.puerto}`;
  const criticas = alertas.filter((a) => a.severidad === 'critica').length;

  return (
    <>
      <div class="fondo" aria-hidden="true"><i /><i /><i /></div>
      <div class={`app${enLinea ? '' : ' desactualizado'}`}>
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
              <span class="punto" style={{ background: enLinea ? 'var(--ok)' : 'var(--crit)' }} />
              {estadoConexion}
            </span>
            {s.foto?.datos && <span class="pastilla pastilla-solida">{s.foto.datos.modo === 'auto' ? 'AUTO' : 'MANUAL'}</span>}
            <button class="pastilla" onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}>
              {tema === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            </button>
          </div>
        </header>
        <nav class="tabs" role="tablist">
          {TABS.map(([id, nombre]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {nombre}
              {id === 'resumen' && criticas > 0 && <span class="insignia">{criticas}</span>}
            </button>
          ))}
        </nav>
        {!enLinea && alertas[0] && (
          <div class={`banner ${alertas[0].severidad === 'critica' ? 'banner-crit' : 'banner-warn'}`} role="alert">
            {alertas[0].severidad === 'critica' ? '✕' : '▲'} {alertas[0].titulo}. {s.foto?.datos ? 'Los datos mostrados pueden estar desactualizados.' : ''}
          </div>
        )}
        {tab === 'historial' ? (
          <Historial tema={tema} />
        ) : tab === 'bitacora' ? (
          <Bitacora eventos={s.eventos} ahora={s.ahora} />
        ) : tab === 'sistema' ? (
          <Sistema foto={s.foto} socketAbierto={s.socketAbierto} ahora={s.ahora} />
        ) : !s.foto ? (
          <section class="tarjeta"><div class="vacio">Conectando con el backend…</div></section>
        ) : tab === 'control' ? (
          <Control foto={s.foto} mandos={mandos} />
        ) : (
          <Resumen foto={s.foto} alertas={alertas} eventos={s.eventos} ahora={s.ahora} puedeMandar={mandos.modo} irA={setTab} />
        )}
      </div>
      {s.toast && <div class={`toast${s.toast.error ? ' toast-error' : ''}`} role="status">{s.toast.texto}</div>}
    </>
  );
}
