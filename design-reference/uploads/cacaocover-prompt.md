# CacaoCover: Prompt para Claude Design

Proyecto: cierre automático para secado de cacao con ESP32 DevKit V1.

## Prompt

```
Diseña un dashboard web interactivo llamado "CacaoCover" para monitorear y controlar un sistema de cierre automático (techo/cubierta corrediza) de secado de cacao, basado en un ESP32 DevKit V1. Idioma de la interfaz: español (Perú). Úsalo principalmente en celular y tablet (productor en campo), pero que también se vea bien en laptop. Soporte tema claro y oscuro.

DATOS QUE DEBE MOSTRAR (todo lo que maneja el microcontrolador):
1. Temperatura (°C) y humedad relativa (%) del DHT22, con valor actual, mínimo/máximo del día y tendencia (↑ ↓ →).
2. Luz ambiental (LDR): valor crudo (0-4095), porcentaje y etiqueta (Noche / Nublado / Soleado).
3. Sensor de lluvia: estado (Seco / Llovizna / Lluvia), nivel analógico y salida digital del comparador.
4. Cubierta: estado (Abierta / Cerrada / En movimiento / Error), con una ilustración animada de la cubierta moviéndose.
5. Finales de carrera (2 microswitch): estado de "Abierto completo" y "Cerrado completo", cada uno con indicador LED en pantalla.
6. Motorreductor N20 (vía DRV8833): dirección (abrir/cerrar/detenido), PWM (%), tiempo de funcionamiento, contador de ciclos y alerta si supera el tiempo máximo sin llegar al final de carrera (posible atasco).
7. Alimentación: voltaje de entrada 5 V (adaptador), salida elevada 6 V (para el motor) y estado de la fuente. Alerta si hay caída de tensión.
8. Conectividad ESP32: WiFi (SSID, RSSI en dBm con barras de señal), IP, uptime, memoria libre, última actualización.
9. Espejo de la pantalla OLED 0.96" SSD1306 (128x64) renderizada fielmente con estilo monocromo, mostrando lo mismo que ve el usuario en el dispositivo físico.
10. Modo de operación: Automático / Manual, y la razón de la última acción (ej. "Cerrado por lluvia", "Cerrado por humedad > 80%", "Abierto por sol y humedad baja").

INTERACTIVIDAD:
- Botones grandes Abrir / Cerrar / Detener (solo activos en modo Manual) con confirmación visual.
- Interruptor Automático / Manual.
- Panel de umbrales con sliders editables: humedad máxima para cerrar, temperatura máxima, luz mínima para abrir, sensibilidad de lluvia, tiempo máximo del motor y velocidad PWM. Botón "Guardar en ESP32" y "Restaurar valores por defecto".
- Gráficos de historial en tiempo real (temperatura, humedad, luz, lluvia) con selector de rango (1 h, 6 h, 24 h), tooltip al pasar el dedo/cursor y marcadores de eventos (apertura/cierre).
- Registro de eventos filtrable (todos / alertas / acciones del motor / lluvia) con hora y causa, y botón para exportar CSV.
- Centro de alertas con severidad (info, aviso, crítica): lluvia detectada, atasco del motor, ambos finales de carrera presionados a la vez (fallo), sensor DHT22 sin lectura, WiFi desconectado, voltaje bajo.
- Modo "Simulación" con controles para forzar lluvia, cambiar humedad/temperatura/luz y probar cómo reacciona el sistema sin hardware.
- Diagrama de conexión interactivo: ESP32 con sus sensores y el DRV8833; al tocar un componente muestra su pin GPIO y su estado en vivo.

DISEÑO:
- Estética agrícola moderna: paleta de marrones cacao, verde hoja y crema, con acentos de color semáforo (verde/ámbar/rojo) solo para estados. Evita el look genérico de plantilla.
- Tarjetas claras con jerarquía visual: primero estado de la cubierta + alertas, luego sensores, luego gráficos, luego configuración y registros.
- Tipografía legible a la intemperie (alto contraste, números grandes), tipografía monoespaciada para valores técnicos.
- Navegación por pestañas: Resumen · Sensores · Control · Historial · Configuración · Conexiones.
- Animaciones sutiles (cubierta deslizándose, pulso en el motor activo, gauges), sin recargar la interfaz.
- Datos simulados realistas que se actualicen cada 2 segundos, estructurados como un JSON único (temp, hum, luz, lluvia, cubierta, fc_abierto, fc_cerrado, motor{dir,pwm}, v5, v6, wifi{rssi,ip}, uptime, modo) para que después se pueda conectar al ESP32 por WebSocket o endpoint /api/estado con cambios mínimos.
```

## Skills recomendadas

| Skill | Para qué |
|---|---|
| **frontend-design** | La principal. Evita el aspecto genérico y guía tipografía, paleta y composición. |
| **artifact-design** | Publicar el dashboard como página web con tema claro/oscuro y buen comportamiento en celular. |
| **artifact-capabilities** | Solo si quieres guardar umbrales o historial entre visitas. No sirve para leer el ESP32 real: tu ESP32 está en tu red local y una página publicada no puede llegar a él. |
| **docx** | Informe o manual del proyecto (diagrama de conexiones, tabla de pines, calibración). |
| **xlsx** | Hoja con los datos exportados (CSV) y gráficos de temperatura/humedad por jornada de secado. |

## Aspectos técnicos a considerar

- **El DHT22 mide el aire, no la humedad del grano.** Para decidir el cierre por humedad, usa umbrales de humedad ambiental y ajústalos con tu experiencia de secado.
- **Pines del ESP32:** el sensor de lluvia, el LDR y la lectura de voltajes deben ir en pines ADC1 (GPIO32-39). Los ADC2 no funcionan con el WiFi activo.
- **Divisores de tensión:** los necesitas para leer 5 V y 6 V con el ADC, porque el ESP32 solo tolera 3,3 V.
- **Finales de carrera:** puedes usar las resistencias de 10 kΩ como pull-up/pull-down, o `INPUT_PULLUP` interno.

## Siguiente paso

Con el diseño listo, se puede armar el firmware del ESP32 (Arduino) que sirva ese JSON y reciba los comandos, junto con el esquema de conexiones y la tabla de pines.
