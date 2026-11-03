#pragma once
#include <stdint.h>

// Datos del sistema, sin dependencias de hardware.

enum class Modo : uint8_t { Auto, Manual };
enum class DirMotor : uint8_t { Detenido, Abrir, Cerrar };
enum class EstadoCubierta : uint8_t { Abierta, Cerrada, EnMovimiento, Error };
enum class Tendencia : uint8_t { Ninguna, Sube, Baja, Estable };

struct Umbrales {
  int humMax = 75;  // el DHT11 pierde precisión cerca de su límite superior
  int tempMax = 40;
  int motorMaxS = 12;
  int pwmPct = 100;
  int histHum = 5;
  int histTemp = 2;
  int esperaAccionS = 60;
  int manualTimeoutMin = 30;
  bool lluviaManda = true;
};

struct LecturaDht {
  bool ok = false;
  bool hayExtremos = false;
  float temp = 0, hum = 0;
  float tempMin = 0, tempMax = 0, humMin = 0, humMax = 0;
  Tendencia tendTemp = Tendencia::Ninguna;
  Tendencia tendHum = Tendencia::Ninguna;
};

struct Lecturas {
  LecturaDht dht;
  bool hayLuz = false;
  bool mojado = false;
  bool fcAbierto = false;
  bool fcCerrado = false;
};
