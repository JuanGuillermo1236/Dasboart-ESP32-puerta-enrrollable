#include "sensores.h"

#include <Arduino.h>
#include <DHT.h>

#include "../control/filtro.h"
#include "config.h"

namespace {
constexpr uint8_t FALLOS_PARA_ALERTA = 3;  // el DHT11 pierde lecturas sueltas

DHT dht(PIN_DHT, DHT11);
Lecturas lect;
FiltroEstable filtroFcPlegado(FILTRO_FC_MS, FILTRO_FC_MS);
FiltroEstable filtroFcDesplegado(FILTRO_FC_MS, FILTRO_FC_MS);
FiltroEstable filtroLluvia(FILTRO_LLUVIA_ACTIVA_MS, FILTRO_LLUVIA_LIBERA_MS);
FiltroEstable filtroLuz(FILTRO_LUZ_MS, FILTRO_LUZ_MS);
uint32_t ultimoDht = 0;
uint8_t fallosDht = 0;

void leerDht() {
  const float t = dht.readTemperature();
  const float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    if (fallosDht < FALLOS_PARA_ALERTA && ++fallosDht == FALLOS_PARA_ALERTA) lect.dhtOk = false;
    return;
  }
  fallosDht = 0;
  lect.dhtOk = true;
  lect.temp = t;
  lect.hum = h;
}

bool finalActivo(uint8_t pin) { return (digitalRead(pin) == HIGH) == FC_CONTACTO_NC; }

void leerDigitales(uint32_t ahoraMs) {
  lect.fcPlegado = filtroFcPlegado.actualizar(finalActivo(PIN_FC_ABIERTO), ahoraMs);
  lect.fcDesplegado = filtroFcDesplegado.actualizar(finalActivo(PIN_FC_CERRADO), ahoraMs);
  lect.mojado = filtroLluvia.actualizar((digitalRead(PIN_LLUVIA_DO) == LOW) == LLUVIA_MOJADO_EN_BAJO, ahoraMs);
  lect.hayLuz = filtroLuz.actualizar((digitalRead(PIN_LDR_DO) == LOW) == LDR_LUZ_EN_BAJO, ahoraMs);
}
}  // namespace

void sensoresIniciar() {
  pinMode(PIN_FC_ABIERTO, INPUT_PULLUP);
  pinMode(PIN_FC_CERRADO, INPUT_PULLUP);
  // GPIO34 y 35 son solo entrada: el pull-up lo pone el módulo.
  pinMode(PIN_LDR_DO, INPUT);
  pinMode(PIN_LLUVIA_DO, INPUT);
  dht.begin();
  leerDigitales(millis());
}

void sensoresActualizar(uint32_t ahoraMs) {
  leerDigitales(ahoraMs);
  if (ahoraMs - ultimoDht >= PERIODO_DHT_MS) {
    ultimoDht = ahoraMs;
    leerDht();
  }
}

const Lecturas &sensoresLecturas() { return lect; }
