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

// Los cables del motor van en cualquier orden: si abre cuando debe cerrar, cambia esto a true.
constexpr bool MOTOR_INVERTIDO = false;

// Salidas digitales de los módulos LM393: en la mayoría, LOW = hay luz y LOW = mojado.
constexpr bool LDR_LUZ_EN_BAJO = true;
constexpr bool LLUVIA_MOJADO_EN_BAJO = true;

// PWM del TB6612FNG (LEDC)
constexpr uint32_t PWM_FRECUENCIA_HZ = 1000;
constexpr uint8_t PWM_RESOLUCION_BITS = 8;
constexpr uint8_t PWM_CANAL = 0;
constexpr uint32_t PAUSA_INVERSION_MS = 100;

// OLED
constexpr uint8_t OLED_DIRECCION = 0x3C;

// Tiempos en milisegundos
constexpr uint32_t PERIODO_DHT_MS = 3000;
constexpr uint32_t PERIODO_WS_MS = 2500;
constexpr uint32_t PERIODO_CONSOLA_MS = 3000;
constexpr uint32_t PERIODO_OLED_MS = 1000;
constexpr uint32_t PERIODO_WIFI_REINTENTO_MS = 10000;
constexpr uint32_t FILTRO_FC_MS = 30;
constexpr uint32_t FILTRO_LLUVIA_ACTIVA_MS = 2000;
constexpr uint32_t FILTRO_LLUVIA_LIBERA_MS = 30000;
constexpr uint32_t FILTRO_LUZ_MS = 30000;

// Hora de Perú (UTC-5, sin horario de verano)
constexpr const char *ZONA_HORARIA = "<-05>5";
constexpr const char *SERVIDOR_NTP = "pool.ntp.org";
