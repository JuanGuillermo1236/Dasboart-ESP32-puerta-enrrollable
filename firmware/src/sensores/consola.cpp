#include "consola.h"

#include <Arduino.h>

#include "../control/sistema.h"
#include "config.h"
#include "sensores.h"

void consolaActualizar(uint32_t ahoraMs) {
  static uint32_t ultimo = 0;
  if (ahoraMs - ultimo < PERIODO_CONSOLA_MS) return;
  ultimo = ahoraMs;
  const Lecturas &l = sensoresLecturas();
  const FotoSistema f = sistemaFoto();
  if (l.dht.ok) Serial.printf("T=%.1fC H=%.0f%%", l.dht.temp, l.dht.hum);
  else Serial.print("DHT=sin_lectura");
  Serial.printf(" | luz=%s | lluvia=%s | FC plegado=%d desplegado=%d | motor=%s | %s | %s\n",
                l.hayLuz ? "si" : "no", l.mojado ? "si" : "no", l.fcAbierto, l.fcCerrado,
                f.dir == DirMotor::Abrir ? "abrir" : f.dir == DirMotor::Cerrar ? "cerrar" : "detenido",
                f.modo == Modo::Auto ? "AUTO" : "MANUAL", f.razon);
}
