#pragma once
#include <stdint.h>

// Datos del sistema, sin dependencias de hardware.

enum class Modo : uint8_t { Auto, Manual };
enum class DirMotor : uint8_t { Detenido, Plegar, Desplegar };
enum class EstadoTecho : uint8_t { Plegado, Desplegado, Plegando, Desplegando, Detenido, Error };

struct Umbrales {
  int motorMaxS = 12;
  int pwm = 170;  // de 255
  int esperaAccionS = 60;
  int secoParaAbrirMin = 15;
  int manualTimeoutMin = 30;
  bool lluviaManda = true;
};

struct Lecturas {
  bool dhtOk = false;
  float temp = 0, hum = 0;
  bool hayLuz = false;
  bool mojado = false;
  bool fcPlegado = false;
  bool fcDesplegado = false;
};
