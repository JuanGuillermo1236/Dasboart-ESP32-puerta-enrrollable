#include "oled.h"

#include <U8g2lib.h>
#include <Wire.h>

#include "../control/clasificacion.h"
#include "../control/sistema.h"
#include "../sensores/sensores.h"
#include "config.h"

namespace {
U8G2_SH1106_128X64_NONAME_F_HW_I2C pantalla(U8G2_R0, U8X8_PIN_NONE);
uint32_t ultima = 0;
}  // namespace

void oledIniciar() {
  Wire.begin(PIN_SDA, PIN_SCL);
  pantalla.setI2CAddress(OLED_DIRECCION * 2);  // U8g2 usa la dirección de 8 bits
  pantalla.begin();
  pantalla.setFont(u8g2_font_6x10_tf);
}

void oledActualizar(uint32_t ahoraMs) {
  if (ahoraMs - ultima < PERIODO_OLED_MS) return;
  ultima = ahoraMs;
  const Lecturas &l = sensoresLecturas();
  const FotoSistema f = sistemaFoto();
  char txt[24];

  pantalla.clearBuffer();
  pantalla.drawBox(0, 0, 128, 11);
  pantalla.setDrawColor(0);
  pantalla.drawStr(2, 9, "CacaoCover");
  pantalla.drawStr(f.modo == Modo::Auto ? 102 : 90, 9, f.modo == Modo::Auto ? "AUTO" : "MANUAL");
  pantalla.setDrawColor(1);
  if (l.dhtOk) snprintf(txt, sizeof(txt), "T %.1fC  H %.0f%%", l.temp, l.hum);
  else snprintf(txt, sizeof(txt), "DHT11: sin lectura");
  pantalla.drawStr(2, 24, txt);
  snprintf(txt, sizeof(txt), "Luz %s  Lluvia %s", l.hayLuz ? "si" : "no", l.mojado ? "SI" : "no");
  pantalla.drawStr(2, 37, txt);
  pantalla.drawStr(2, 50, "Techo:");
  pantalla.drawStr(44, 50, textoTecho(clasificarTecho(l.fcPlegado, l.fcDesplegado, f.dir, f.atasco)));
  snprintf(txt, sizeof(txt), "FC P:%d D:%d", l.fcPlegado, l.fcDesplegado);
  pantalla.drawStr(2, 63, txt);
  pantalla.sendBuffer();
}
