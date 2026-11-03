# CacaoCover

Cubierta corrediza automática para secado de cacao: ESP32 DevKit V1 con dashboard Preact servido desde LittleFS. Proyecto académico; el ESP32 usa WiFi con internet (NTP, Google Fonts).

## Estructura

- `docs/api-contract.md`: contrato JSON, fuente de verdad. Cámbialo junto con `frontend/src/api/types.ts`, `frontend/src/mock/` y `firmware/src/red/`.
- `frontend/src/`: `api/` (cliente y tipos), `mock/` (simulador), `state/` (store y acciones), `pages/`, `components/`, `styles/`, `i18n/`, `utils/`.
- `firmware/src/`: `control/` (reglas; `clasificacion.h` y `estado.h` sin Arduino), `sensores/`, `actuadores/`, `red/`. `main.cpp` solo arranca y corre el bucle.
- `tools/`: `mock-server/` y `sync-frontend.mjs`.
- `design-reference/`: export de Claude Design. **Solo lectura.**
- `firmware/data/`: generado. No editar.

## Comandos

Desde `frontend/`:

- `npm run dev:mock`: frontend + mock-server, sin hardware. También `npm run dev` y abrir `/?mock=1`.
- `npm run build`: typecheck, build y sincronización a `firmware/data` con reporte de peso (límite 300 KB gzip).
- `npm run flash`: compila, graba en COM3 y abre la consola serie. `npm run flash -- --solo-compilar` no toca la placa.
- `npm run lint`, `npm test`.

Desde `firmware/` (primero copia `include/secrets.example.h` a `include/secrets.h`):

- `pio run -e esp32dev`: compilar.
- `pio test -e native`: pruebas de `src/control/` en la PC (necesita g++ de WinLibs en el PATH).
- `pio run -t upload`: flashear firmware.
- `pio run -t uploadfs`: flashear el frontend.
- `pio device monitor`: consola serie.

## Convenciones

- Código, archivos y textos en español (es-PE); API de frameworks tal como es.
- Un archivo, una responsabilidad.
- Un sensor sin lectura es `null`, nunca un número inventado.
- La interfaz nunca asume que un comando funcionó: espera la respuesta del ESP32.
- Colores semáforo solo para estados, siempre con ícono o texto. Texto sobre lima en `#00545f`.
- Los manejadores HTTP corren en otra tarea: solo dejan pedidos, quien actúa es el bucle.

## Reglas de seguridad

Ver `docs/seguridad.md`. Viven en `firmware/src/control/logica.cpp`, nunca en el dashboard. Todo cambio ahí lleva su prueba en `firmware/test/test_control/`.

## Hardware

Circuito del equipo (ver `docs/pines.md`): driver TB6612FNG, DHT11, módulos de luz y lluvia solo digitales, sin medición de voltaje. Plegado = abierta, desplegado = cerrada.
