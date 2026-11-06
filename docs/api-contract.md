# API del backend (dashboard ↔ backend)

Fuente de verdad para `backend/src/api.mjs` y `frontend/src/api/`. Lo que llega del ESP32 está en `docs/protocolo-serie.md`.

Servidor: `http://localhost:3000`. Horas en epoch de milisegundos, con la hora de la laptop.

## Estado

`GET /api/estado` y cada mensaje `{"tipo":"estado", ...}` del WebSocket `/ws`:

```jsonc
{
  "conectado": true,              // false si el ESP32 no está conectado por USB
  "puerto": "COM3",               // "SIMULADO" con npm run simular
  "ultima_lectura": 1793680090756, // null si aún no llegó nada
  "datos": {                      // null si aún no llegó nada; es el estado del protocolo serie
    "temp": 32.3, "hum": 43, "dht_ok": true, "lluvia": false, "luz": false,
    "estado": "PLEGADO", "fc_plegado": true, "fc_desplegado": false, "modo": "auto",
    "razon": "Abierto: sin lluvia y con luz",
    "motor": { "dir": "detenido", "pwm": 170, "t": 8.2, "ciclos": 3, "atasco": false },
    "manual_restante_s": 0,
    "ts_dispositivo": 303891       // ms desde que arrancó el ESP32
  }
}
```

El dashboard marca los datos como desactualizados si `ultima_lectura` tiene más de 10 s.

## WebSocket `/ws`

Solo del backend al dashboard:
- `{"tipo":"estado", ...}` al conectarse, cada 2 s y ante cualquier cambio.
- `{"tipo":"evento","evento":{...}}` al ocurrir, con el formato de `GET /api/eventos`.

## Endpoints

| Método y ruta | Respuesta |
|---|---|
| `GET /api/lecturas?rango=1h\|6h\|24h` | `{"rango","puntos":[{"ts","temp","hum","lluvia","luz"}],"marcadores":[{"ts","tipo"}]}`. Unos 300 puntos promediados; `luz` es la fracción del grupo con luz; `marcadores` son las aperturas (`plegado`) y cierres (`desplegado`) |
| `GET /api/eventos?filtro=todos\|alertas\|motor\|lluvia&limite=100` | `[{"id","ts","tipo","categoria","descripcion"}]`, del más reciente al más antiguo |
| `GET /api/eventos.csv?filtro=...` | Archivo CSV con BOM para Excel |
| `POST /api/comando` con `{"accion":"abrir"\|"cerrar"\|"detener"\|"auto"\|"manual"}` | `200 {"ok":true}` o error |
| `POST /api/simulacion` con `{"lluvia"?,"luz"?,"atasco"?}` | Solo con `npm run simular` |

`categoria`: `motor`, `lluvia`, `alerta`, `info`.

Errores de `/api/comando`: `503 sin_conexion`, `504 sin_respuesta`, `400 cmd_desconocido`, `409` con el error del ESP32 (`fallo_finales`, `lluvia_activa`, `ya_en_posicion`, `motor_deshabilitado`). El dashboard nunca asume que un comando funcionó.
