# Protocolo serie (ESP32 ↔ backend)

USB a 115200 baudios. Una línea JSON por mensaje, terminada en `\n`. Las líneas que no empiezan con `{` (por ejemplo, los mensajes de arranque del ESP32) se ignoran.

## Del ESP32 al backend

### Estado: cada 2 s y apenas cambia algo importante

```json
{"tipo":"estado","ts":123456,"temp":28.4,"hum":71,"dht_ok":true,"lluvia":false,"luz":true,
 "estado":"PLEGADO","fc_plegado":true,"fc_desplegado":false,"modo":"auto",
 "razon":"Abierto: sin lluvia y con luz",
 "motor":{"dir":"detenido","pwm":170,"t":8.2,"ciclos":3,"atasco":false},
 "manual_restante_s":0}
```

| Campo | Valores |
|---|---|
| `ts` | Milisegundos desde que arrancó el ESP32; la hora real la pone el backend |
| `temp`, `hum` | `null` si el DHT11 no responde (`dht_ok: false`) |
| `estado` | `PLEGADO` (abierto), `DESPLEGADO` (cerrado), `PLEGANDO`, `DESPLEGANDO`, `DETENIDO` (a medio camino), `ERROR` |
| `motor.dir` | `plegar`, `desplegar`, `detenido` |
| `motor.t` | Segundos del movimiento actual o del último |
| `motor.ciclos` | Recorridos completos desde el arranque |
| `manual_restante_s` | Segundos para volver a Automático; 0 en Automático |

### Evento: al ocurrir

```json
{"tipo":"evento","ts":123456,"evento":"desplegando","descripcion":"Cerrado por lluvia"}
```

`evento`: `inicio`, `plegando`, `desplegando`, `plegado`, `desplegado`, `detenido`, `atasco`, `fallo_finales`, `lluvia`, `lluvia_fin`, `luz`, `oscuro`, `dht_ok`, `dht_falla`, `modo`.

### Respuesta: a cada comando

```json
{"tipo":"respuesta","cmd":"abrir","ok":false,"error":"lluvia_activa"}
```

`error`: `fallo_finales`, `lluvia_activa`, `ya_en_posicion`, `motor_deshabilitado`, `cmd_desconocido`, `json_invalido`.

## Del backend al ESP32

```json
{"cmd":"abrir"}
```

| `cmd` | Efecto |
|---|---|
| `abrir` | Pliega el techo y pasa a Manual |
| `cerrar` | Despliega el techo y pasa a Manual |
| `detener` | Detiene el motor; se acepta siempre |
| `auto` / `manual` | Cambia el modo |
| `estado` | Pide un estado inmediato |
