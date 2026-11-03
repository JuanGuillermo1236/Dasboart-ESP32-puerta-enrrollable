# Contrato de API de CacaoCover

Fuente de verdad para `frontend/src/api/types.ts`, `frontend/src/mock/` y `firmware/src/red/`.
Si cambias algo aquí, cambia los tres en el mismo commit.

Convenciones: JSON en UTF-8, claves en español y `snake_case`. Un sensor sin lectura envía `null`, nunca un número inventado.

## Estado en vivo

`GET /api/estado` y cada mensaje del WebSocket `/ws`.

```jsonc
{
  "ts": 1793500000,              // epoch en segundos; null si NTP aún no sincronizó
  "uptime": 3600,                // segundos desde el arranque
  "modo": "auto",                // "auto" | "manual"
  "razon_ultima_accion": "Cerrado por lluvia", // "" si aún no hubo acciones

  "dht": {                       // DHT11
    "ok": true,
    "temp": 28.4, "hum": 62.0,   // null si ok = false
    "temp_min": 21.3, "temp_max": 31.2, // del día; null sin lecturas
    "hum_min": 54.0, "hum_max": 70.0,
    "tendencia_temp": "sube",    // "sube" | "baja" | "estable" | null
    "tendencia_hum": "estable"
  },
  "luz": { "hay_luz": true, "etiqueta": "Con luz" },  // "Con luz" | "Oscuro"; módulo LM393 con salida digital
  "lluvia": { "estado": "Seco" },                      // "Seco" | "Lluvia"; módulo FC-37 con salida digital
  "cubierta": {
    "estado": "Abierta",         // "Abierta" | "Cerrada" | "En movimiento" | "Error"
    "fc_abierto": true,          // final de plegado
    "fc_cerrado": false,         // final de desplegado
    "posicion_conocida": true    // false si ningún final de carrera está presionado y no se mueve
  },
  "motor": {
    "dir": "detenido",           // "abrir" | "cerrar" | "detenido"
    "pwm_pct": 100,
    "t_funcionamiento_s": 9.3,   // duración del movimiento actual o del último
    "ciclos": 4,                 // recorridos completos desde el arranque
    "atasco": false,
    "habilitado": true
  },
  "wifi": { "ssid": "MiRed", "rssi": -61, "ip": "192.168.1.47", "conectado": true }, // rssi e ip null sin conexión
  "sistema": { "mem_libre": 183420, "ultima_actualizacion": 1793500000 }, // bytes; epoch o null
  "alertas_activas": [
    { "id": "dht", "severidad": "aviso", "codigo": "DHT_SIN_LECTURA", "mensaje": "DHT11 sin lectura", "ts": 1793500000 }
  ],                             // severidad: "info" | "aviso" | "critica"; ts puede ser null
  "umbrales": {
    "hum_max": 75, "temp_max": 40, "motor_max_s": 12, "pwm_pct": 100,
    "hist_hum": 5, "hist_temp": 2, "espera_accion_s": 60, "manual_timeout_min": 30,
    "lluvia_manda": true
  }
}
```

Códigos de alerta: `FC_AMBOS`, `MOTOR_ATASCO` (críticas); `LLUVIA`, `DHT_SIN_LECTURA`, `WIFI_DESCONECTADO` (avisos); `MOTOR_DESHABILITADO`, `MANUAL_POR_VENCER` (info).

## Endpoints

Respuesta de escritura: `200 {"ok":true}` o un código de error con `{"ok":false,"error":"<codigo>","mensaje":"<texto para el usuario>"}`.

| Método y ruta | Cuerpo | Ronda | Notas |
|---|---|---|---|
| `GET /api/estado` | | A | Lectura sin sesión |
| `WS /ws` | | A | Solo servidor → cliente. Envía el estado cada 2,5 s y de inmediato si cambia cubierta, modo, lluvia, luz o DHT |
| `POST /api/comando` | `{"accion":"abrir"\|"cerrar"\|"detener"}` | A | `detener` se acepta siempre. Errores: `503 motor_deshabilitado`, `409 modo_automatico`, `409 fallo_finales`, `409 lluvia_activa`, `409 ya_en_posicion` |
| `POST /api/modo` | `{"modo":"auto"\|"manual"}` | A | |
| `GET /api/config` | | A | Devuelve `umbrales` |
| `POST /api/config` | `umbrales` parcial | C | |
| `POST /api/config/restaurar` | | C | |
| `POST /api/auth` | `{"pin":"1234"}` | C | Devuelve `{"token":"..."}`; escritura con `Authorization: Bearer <token>` |
| `GET /api/historial?rango=1h\|6h\|24h` | | B | |
| `GET /api/eventos?filtro=todos\|alertas\|motor\|lluvia` | | B | |
| `GET /api/eventos.csv` | | B | |

Una ruta de una ronda futura responde `501 {"ok":false,"error":"no_implementado"}`. Sin sensores analógicos ni de voltaje, no hay endpoint de calibración: los umbrales de luz y lluvia se ajustan con el tornillo de cada módulo.

## Frecuencias

- DHT11: cada 3 s.
- Entradas digitales: en cada vuelta del bucle, con filtro (finales 30 ms, lluvia 2 s para activar y 30 s para liberar, luz 30 s).
- WebSocket: cada 2,5 s y ante cambios importantes.
- El frontend marca los datos como desactualizados tras 10 s sin mensajes.
