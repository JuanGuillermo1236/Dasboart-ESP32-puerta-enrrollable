import { useEffect, useState } from 'preact/hooks';
import { obtenerLecturas } from '../api/client.ts';
import type { Lecturas, Rango } from '../api/types.ts';
import { Grafico } from '../components/charts/Grafico.tsx';

const RANGOS: Rango[] = ['1h', '6h', '24h'];
const REFRESCO_MS = 15000;

export function Historial({ tema }: { tema: string }) {
  const [rango, setRango] = useState<Rango>('1h');
  const [lecturas, setLecturas] = useState<Lecturas | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    const cargar = () =>
      obtenerLecturas(rango)
        .then((l) => {
          if (!vigente) return;
          setLecturas(l);
          setError(false);
        })
        .catch(() => vigente && setError(true));
    void cargar();
    const t = setInterval(cargar, REFRESCO_MS);
    return () => {
      vigente = false;
      clearInterval(t);
    };
  }, [rango]);

  const conDatos = lecturas && lecturas.puntos.length > 1;
  return (
    <div class="pagina">
      <section class="tarjeta">
        <div class="entre">
          <h2>Historial</h2>
          <div class="selector" role="group" aria-label="Rango">
            {RANGOS.map((r) => (
              <button key={r} aria-pressed={rango === r} onClick={() => setRango(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div class="leyenda">
          <span><i class="muestra-lluvia" /> lluvia</span>
          <span><i class="muestra-linea ok" /> A · techo abierto</span>
          <span><i class="muestra-linea" /> C · techo cerrado</span>
          <span>Pasa el cursor o el dedo sobre el gráfico para ver los valores</span>
        </div>
        {error && <div class="banner banner-warn">▲ No se pudo cargar el historial. Reintentando…</div>}
        {!lecturas ? (
          <div class="vacio">Cargando…</div>
        ) : !conDatos ? (
          <div class="vacio">Aún no hay suficientes lecturas en este rango. Se guarda una cada 2 s mientras el ESP32 está conectado.</div>
        ) : (
          <>
            <h3 class="subtitulo">Temperatura</h3>
            <Grafico lecturas={lecturas} campo="temp" unidad="°C" tema={tema} />
            <h3 class="subtitulo">Humedad</h3>
            <Grafico lecturas={lecturas} campo="hum" unidad="%" tema={tema} />
          </>
        )}
      </section>
    </div>
  );
}
