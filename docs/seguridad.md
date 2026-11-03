# Reglas de seguridad

Se implementan en el firmware (`firmware/src/control/logica.cpp`), nunca en el dashboard, y se prueban con `pio test -e native`.

| # | Regla | Estado |
|---|---|---|
| 1 | La lógica automática vive en el ESP32 y sigue funcionando sin WiFi ni página abierta | Activa |
| 2 | Histéresis en humedad (5 %) y temperatura (2 °C). La luz y la lluvia, que son digitales, se filtran por tiempo | Activa |
| 3 | 60 s entre acciones automáticas, salvo cierre por lluvia. No aplica a comandos manuales | Activa |
| 4 | La lluvia cierra también en Manual (`lluvia_manda`), incluso invirtiendo una apertura. Abrir con lluvia se rechaza | Activa; la opción para desactivarla llega con Configuración (ronda C) |
| 5 | Manual vuelve a Automático tras 30 min, con alerta informativa 2 min antes | Activa |
| 6 | Tiempo máximo del motor (12 s): detiene y marca posible atasco. No se reintenta solo, ni con lluvia, hasta un comando manual. La detección es solo por tiempo, porque el TB6612FNG no mide corriente | Activa |
| 7 | Ambos finales de carrera presionados = fallo: detiene, rechaza comandos y genera alerta crítica | Activa |
| 8 | Sin DHT11 decide solo con lluvia y luz, y genera alerta | Activa |
| 9 | Arranque seguro: el motor arranca apagado y, sin ningún final presionado, solo se mueve para cerrar si llueve | Activa; el watchdog llega en la ronda C |
| 10 | PIN con sesión por token. Sobre HTTP es protección contra uso accidental, no contra un atacante | Ronda C |

Además, **Detener** siempre se acepta, y durante la espera posterior ni la lluvia reanuda el motor: si alguien lo detiene, es porque está interviniendo.

## Límites que el firmware no puede resolver

- Sin energía, la cubierta no se puede cerrar aunque llueva.
- Un final de carrera desconectado parece "no presionado": solo lo detecta el tiempo máximo.
- Mide el recorrido real y ajusta `motorMaxS` en `firmware/src/control/estado.h`; si es menor que el recorrido, cada movimiento terminará en atasco.
- El proyecto supone una red de confianza con internet (para NTP y Google Fonts).
