#pragma once
#include <stdint.h>

// Pines: ver docs/pines.md
constexpr uint8_t PIN_DHT = 19;
constexpr uint8_t PIN_LDR_DO = 34;
constexpr uint8_t PIN_LLUVIA_DO = 35;
constexpr uint8_t PIN_FC_ABIERTO = 25;  // final de plegado
constexpr uint8_t PIN_FC_CERRADO = 26;  // final de desplegado
constexpr uint8_t PIN_AIN1 = 33;
constexpr uint8_t PIN_AIN2 = 32;
constexpr uint8_t PIN_PWMA = 27;
constexpr uint8_t PIN_SDA = 21;
constexpr uint8_t PIN_SCL = 22;

#ifndef MOTOR_HABILITADO
#define MOTOR_HABILITADO 1
#endif

// Los cables del motor van en cualquier orden: si "plegar" despliega, cambia esto a true.
constexpr bool MOTOR_INVERTIDO = false;

// Finales de carrera soldados en COM y NO: en reposo quedan abiertos (HIGH); pulsados cierran a GND (LOW).
// Un cable suelto se lee como no pulsado: solo lo cubre el tiempo máximo del motor. Con COM y NC, pon true.
constexpr bool FC_CONTACTO_NC = false;

// Salidas digitales de los módulos LM393: LOW = hay luz y LOW = mojado (comprobado en la etapa 1).
constexpr bool LDR_LUZ_EN_BAJO = true;
constexpr bool LLUVIA_MOJADO_EN_BAJO = true;

// Motor (TB6612FNG por LEDC)
constexpr uint32_t PWM_FRECUENCIA_HZ = 1000;
constexpr uint8_t PWM_RESOLUCION_BITS = 8;
constexpr uint8_t PWM_CANAL = 0;
constexpr uint32_t PAUSA_INVERSION_MS = 100;
constexpr int PWM_MAX = 170;        // de 255: limita el pico de corriente
constexpr int PWM_PRUEBA = 120;     // velocidad inicial del firmware de prueba
constexpr uint32_t RAMPA_MS = 600;  // arranque suave de 0 al PWM elegido
constexpr uint32_t TIMEOUT_MOTOR_MS = 12000;

// OLED SH1106 de 1,3" (comprobada en la etapa 1)
constexpr uint8_t OLED_DIRECCION = 0x3C;

// Tiempos en milisegundos
constexpr uint32_t PERIODO_DHT_MS = 3000;
constexpr uint32_t PERIODO_ESTADO_MS = 2000;
constexpr uint32_t PERIODO_OLED_MS = 1000;
constexpr uint32_t FILTRO_FC_MS = 30;
constexpr uint32_t FILTRO_LLUVIA_ACTIVA_MS = 2000;
constexpr uint32_t FILTRO_LLUVIA_LIBERA_MS = 10000;
constexpr uint32_t FILTRO_LUZ_MS = 60000;  // una sombra o una nube no cuentan como noche
constexpr uint32_t BAUDIOS = 115200;
