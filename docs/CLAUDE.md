# CacaoCover

Techo plegable automático para secado de cacao (maqueta académica). ESP32 → JSON por USB → backend en la laptop → SQLite → dashboard en localhost. El ESP32 no usa WiFi.

## Estructura

- `docs/protocolo-serie.md`: mensajes entre ESP32 y backend. Cámbialo junto con `firmware/src/serie/` y el backend.
- `docs/api-contract.md`: API del backend para el dashboard.
- `backend/src/`: `main.mjs` (arranque), `central.mjs` (procesa los mensajes y comandos), `db.mjs` (SQLite), `api.mjs`, `tiempo-real.mjs` (WebSocket), `dispositivo/` (serie real y simulador).
- `docs/pines.md` y `docs/seguridad.md`: cableado y reglas de control.
- `firmware/src/`: `control/` (reglas puras, sin Arduino, salvo `sistema.cpp`), `sensores/`, `actuadores/`, `serie/`, `pantalla/`, `prueba/` (firmware de la etapa 1). `main.cpp` solo arranca y corre el bucle.
- `frontend/src/`: `api/` (cliente y WebSocket), `state/` (store, alertas, mandos, comandos), `pages/` (Resumen, Control, Historial, Bitacora, Sistema), `components/`, `styles/`, `i18n/`, `utils/`.
- `tools/`: `flash.mjs` (grabar el ESP32), `arduino.mjs` (sketch para Arduino IDE) y `dev-simulado.mjs`.
- `design-reference/`: export de Claude Design. **Solo lectura.**

## Comandos

Desde `frontend/`:

- `npm run flash`: graba el firmware completo en COM3 y abre la consola. `npm run prueba`: firmware de prueba. Con `-- --solo-compilar` no toca la placa. **La placa necesita BOOT pulsado durante toda la grabación.**
- `npm run arduino`: genera `firmware/arduino/CacaoCover/` (copia del firmware para Arduino IDE, placa DOIT ESP32 DEVKIT V1). No se edita ahí: se edita `firmware/src/` y se vuelve a generar.
- `npm run build`: compila el dashboard en `frontend/dist`, que sirve el backend en http://localhost:3000.
- `npm run dev:sim`: backend simulado + Vite con recarga en caliente (http://localhost:5173).

Desde `backend/`: `npm start` (ESP32 real), `npm run simular` (sin placa), `npm test`.
- `npm run lint`, `npm test`.

Desde `firmware/` (PlatformIO: `python -m platformio` con el Python 3.12 del usuario):

- `pio run -e esp32dev`: compilar.
- `pio test -e native`: pruebas de `src/control/` (necesita g++ de WinLibs en el PATH).

Solo un programa puede usar COM3 a la vez: monitor serie, grabación o backend.

## Convenciones

- Código, archivos y textos en español (es-PE); API de frameworks tal como es.
- Un archivo, una responsabilidad.
- Un sensor sin lectura es `null`, nunca un número inventado.
- La interfaz nunca asume que un comando funcionó: espera la respuesta del ESP32.
- Colores semáforo solo para estados, siempre con ícono o texto. Texto sobre lima en `#00545f`.
- Todo cambio en `firmware/src/control/logica.cpp` lleva su prueba en `firmware/test/test_control/`.

## Hardware

Circuito del equipo (ver `docs/pines.md`): TB6612FNG, DHT11, luz y lluvia solo digitales, OLED SH1106 de 1,3". Finales de carrera soldados en COM y NO (`FC_CONTACTO_NC = false`), comprobado con la maqueta. No cambies el mapa de pines sin avisar al usuario.
