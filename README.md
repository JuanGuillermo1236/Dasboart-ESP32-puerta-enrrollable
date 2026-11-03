# CacaoCover

Sistema de cierre automático para el secado de cacao con ESP32 DevKit V1 y un dashboard web servido desde el propio ESP32.

| Carpeta | Qué hace |
|---|---|
| `docs/` | Contrato de API, pines y seguridad |
| `design-reference/` | Diseño de referencia (solo lectura) |
| `frontend/` | Dashboard en Preact, Vite y TypeScript |
| `firmware/` | Código del ESP32 con PlatformIO |
| `tools/` | Simulador del ESP32 y sincronización del frontend |

## Probar sin hardware

```
cd frontend
npm install
npm run dev:mock
```

Abre la dirección que muestra Vite.

## Flashear el ESP32

Copia `firmware/include/secrets.example.h` como `secrets.h`, pon tu WiFi y conecta la placa en COM3 (se cambia en `firmware/platformio.ini`). Luego:

```
cd frontend
npm run flash
```

Compila, graba todo y abre la consola serie, que muestra las lecturas cada 3 s. Para comprobar sin placa: `npm run flash -- --solo-compilar`.

La consola muestra `Dashboard en http://<ip>`. Abre esa dirección desde un dispositivo en la misma red.
