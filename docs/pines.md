# Pines y cableado

Circuito armado por el equipo. La fuente para el firmware es `firmware/include/config.h`.

## ESP32

| Pin | Conecta a | Función |
|---|---|---|
| D19 | S del DHT11 | Temperatura y humedad |
| D21 | SDA de la OLED | I²C, dirección 0x3C |
| D22 | SCK/SCL de la OLED | I²C |
| D25 | NO del final de plegado | Cubierta abierta (`INPUT_PULLUP`; COM a GND) |
| D26 | NO del final de desplegado | Cubierta cerrada (`INPUT_PULLUP`; COM a GND) |
| D27 | PWMA del TB6612FNG | Velocidad (PWM por LEDC) |
| D32 | AIN2 del TB6612FNG | Dirección |
| D33 | AIN1 del TB6612FNG | Dirección |
| D34 | DO del módulo de luz LM393 | Hay luz (solo entrada; pull-up del módulo) |
| D35 | DO del módulo de lluvia FC-37 | Mojado (solo entrada; pull-up del módulo) |
| VIN | VM del TB6612FNG | ~5 V para el motor |
| 3V3 | Riel (+) | Sensores, OLED, VCC y STBY del driver |
| GND | Riel (−) | Tierra común |

## Driver TB6612FNG

- VM a VIN, VCC y STBY a 3V3, GND al riel.
- AO1 y AO2 a los cables del motor, en cualquier orden. Si gira al revés, cambia `MOTOR_INVERTIDO` en `config.h`.
- Canal B sin usar.
- Condensador de 100 µF entre VM (+) y GND (−), de al menos 10 V.

## Energía

Todo sale de un cargador de 5 V por el USB del ESP32. Usa uno de al menos 2 A: si el ESP32 se reinicia cuando arranca el motor, la fuente se queda corta.

## Ajustes del firmware según los módulos

| Constante en `config.h` | Por defecto | Cambia si... |
|---|---|---|
| `MOTOR_INVERTIDO` | `false` | "Abrir" mueve la cubierta hacia el final de desplegado |
| `LDR_LUZ_EN_BAJO` | `true` | La consola dice `luz=no` con luz |
| `LLUVIA_MOJADO_EN_BAJO` | `true` | La consola dice `lluvia=si` con el sensor seco |

Los umbrales de luz y lluvia se ajustan con el tornillo azul de cada módulo, mirando su LED.
