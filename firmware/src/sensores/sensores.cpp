#include "sensores.h"

#include <Arduino.h>
#include <DHT.h>

#include "../control/clasificacion.h"
#include "../control/filtro.h"
#include "config.h"

namespace {
constexpr uint8_t FALLOS_PARA_ALERTA = 3;    // el DHT pierde lecturas sueltas
constexpr uint8_t LECTURAS_TENDENCIA = 100;  // ~5 min entre referencias

DHT dht(PIN_DHT, DHT11);
Lecturas lect;
FiltroEstable filtroFcAbierto(FILTRO_FC_MS, FILTRO_FC_MS);
FiltroEstable filtroFcCerrado(FILTRO_FC_MS, FILTRO_FC_MS);
FiltroEstable filtroLluvia(FILTRO_LLUVIA_ACTIVA_MS, FILTRO_LLUVIA_LIBERA_MS);
FiltroEstable filtroLuz(FILTRO_LUZ_MS, FILTRO_LUZ_MS);
uint32_t ultimoDht = 0;
uint8_t fallosDht = 0;
uint8_t cuentaTendencia = 0;
float refTemp = 0, refHum = 0;
int diaExtremos = -1;

void reiniciarExtremosSiCambioDia() {
  const time_t ahora = time(nullptr);
  struct tm t;
  if (ahora < 1600000000 || !localtime_r(&ahora, &t)) return;  // sin NTP no se conoce el día
  if (t.tm_yday != diaExtremos) {
    if (diaExtremos != -1) lect.dht.hayExtremos = false;
    diaExtremos = t.tm_yday;
  }
}

void leerDht() {
  const float t = dht.readTemperature();
  const float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    if (fallosDht < FALLOS_PARA_ALERTA && ++fallosDht == FALLOS_PARA_ALERTA) {
      lect.dht.ok = false;
      lect.dht.tendTemp = lect.dht.tendHum = Tendencia::Ninguna;
    }
    return;
  }
  LecturaDht &d = lect.dht;
  const bool recupera = !d.ok;
  fallosDht = 0;
  d.ok = true;
  d.temp = t;
  d.hum = h;
  reiniciarExtremosSiCambioDia();
  if (!d.hayExtremos) {
    d.hayExtremos = true;
    d.tempMin = d.tempMax = t;
    d.humMin = d.humMax = h;
  }
  d.tempMin = min(d.tempMin, t);
  d.tempMax = max(d.tempMax, t);
  d.humMin = min(d.humMin, h);
  d.humMax = max(d.humMax, h);
  if (recupera) {
    refTemp = t;
    refHum = h;
    cuentaTendencia = 0;
  }
  d.tendTemp = calcularTendencia(t, refTemp, 1.0f);
  d.tendHum = calcularTendencia(h, refHum, 2.0f);
  if (++cuentaTendencia >= LECTURAS_TENDENCIA) {
    refTemp = t;
    refHum = h;
    cuentaTendencia = 0;
  }
}

void leerDigitales(uint32_t ahoraMs) {
  lect.fcAbierto = filtroFcAbierto.actualizar(digitalRead(PIN_FC_ABIERTO) == LOW, ahoraMs);
  lect.fcCerrado = filtroFcCerrado.actualizar(digitalRead(PIN_FC_CERRADO) == LOW, ahoraMs);
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
