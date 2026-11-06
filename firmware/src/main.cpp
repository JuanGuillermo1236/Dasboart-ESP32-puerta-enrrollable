#include <Arduino.h>

#include "control/sistema.h"
#include "pantalla/oled.h"
#include "sensores/sensores.h"
#include "serie/protocolo.h"

void setup() {
  sistemaIniciar();  // primero: deja el motor apagado
  serieIniciar();
  sensoresIniciar();
  oledIniciar();
}

void loop() {
  const uint32_t ahora = millis();
  sensoresActualizar(ahora);
  sistemaActualizar(ahora);
  serieActualizar(ahora);
  oledActualizar(ahora);
  delay(5);
}
