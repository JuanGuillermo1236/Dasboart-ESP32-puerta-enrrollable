# Reglas de control y seguridad

Se implementan en el firmware (`firmware/src/control/logica.cpp`), nunca en el dashboard, y se prueban con `pio test -e native`. Plegado = techo abierto; desplegado = techo cerrado.

| # | Regla |
|---|---|
| 1 | La lógica vive en el ESP32: funciona aunque se desconecte el backend o se cierre el dashboard |
| 2 | **Lluvia:** despliega de inmediato, también en Manual, e invierte un plegado en curso. Plegar con lluvia se rechaza |
| 3 | **Plegar:** solo de día y tras **15 min sin lluvia**. Cada nueva llovizna reinicia la cuenta |
| 4 | **Noche:** despliega para proteger del rocío. La oscuridad debe durar 60 s para contar (una sombra no cierra el techo) |
| 5 | **Espera de 60 s** entre acciones automáticas, salvo la lluvia |
| 6 | **Tiempo máximo del motor (12 s):** detiene y marca atasco. No se reintenta solo hasta un comando manual. La detección es solo por tiempo, porque el TB6612FNG no mide corriente |
| 7 | **Ambos finales activos = fallo:** detiene y rechaza comandos. Los finales van en COM y NO: un cable suelto se lee como no pulsado y solo lo cubre el tiempo máximo del motor |
| 8 | **Detener** se acepta siempre; durante los 60 s siguientes ni la lluvia reanuda el motor |
| 9 | **Manual** vuelve a Automático tras 30 min. Abrir o cerrar desde el dashboard pasa a Manual |
| 10 | **Arranque seguro:** motor apagado al iniciar; sin ningún final presionado, solo se mueve para cerrar si llueve |
| 11 | **Motor:** PWM máximo 170 de 255 y arranque en rampa de 600 ms, para no reiniciar el ESP32 |

El DHT11 solo informa temperatura y humedad: no decide.

## Límites

- Sin energía, el techo no se puede cerrar aunque llueva.
- Mide el recorrido real y ajusta `motorMaxS` en `firmware/src/control/estado.h`; si es menor que el recorrido, cada movimiento terminará en atasco.
