#include <Arduino.h>

#include "control/sistema.h"
#include "pantalla/oled.h"
#include "red/red.h"
#include "sensores/consola.h"
#include "sensores/sensores.h"

void setup() {
  Serial.begin(115200);
  sistemaIniciar();  // primero: deja el motor apagado
  sensoresIniciar();
  oledIniciar();
  redIniciar();
}

void loop() {
  const uint32_t ahora = millis();
  sensoresActualizar(ahora);
  sistemaActualizar(ahora);
  redActualizar(ahora);
  oledActualizar(ahora);
  consolaActualizar(ahora);
  delay(5);
}
