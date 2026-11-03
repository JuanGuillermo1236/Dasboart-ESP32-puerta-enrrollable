#include "oled.h"

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <Wire.h>

#include "../control/clasificacion.h"
#include "../control/sistema.h"
#include "../sensores/sensores.h"
#include "config.h"

namespace {
Adafruit_SSD1306 pantalla(128, 64, &Wire, -1);
bool lista = false;
uint32_t ultima = 0;

const char *textoCubierta(const Lecturas &l, const FotoSistema &f) {
  switch (clasificarCubierta(l.fcAbierto, l.fcCerrado, f.dir, f.atasco)) {
    case EstadoCubierta::Error: return "ERROR";
    case EstadoCubierta::EnMovimiento: return f.dir == DirMotor::Abrir ? "ABRIENDO" : "CERRANDO";
    case EstadoCubierta::Cerrada: return "CERRADA";
    default: return l.fcAbierto ? "ABIERTA" : "DETENIDA";
  }
}
}  // namespace

void oledIniciar() {
  Wire.begin(PIN_SDA, PIN_SCL);
  // Sin pantalla el sistema sigue funcionando.
  lista = pantalla.begin(SSD1306_SWITCHCAPVCC, OLED_DIRECCION);
  if (!lista) Serial.println("OLED no encontrada");
}

void oledActualizar(uint32_t ahoraMs) {
  if (!lista || ahoraMs - ultima < PERIODO_OLED_MS) return;
  ultima = ahoraMs;
  const Lecturas &l = sensoresLecturas();
  const FotoSistema f = sistemaFoto();
  pantalla.clearDisplay();
  pantalla.setTextSize(1);
  pantalla.fillRect(0, 0, 128, 10, SSD1306_WHITE);
  pantalla.setTextColor(SSD1306_BLACK);
  pantalla.setCursor(2, 1);
  pantalla.print("CacaoCover");
  pantalla.setCursor(f.modo == Modo::Auto ? 102 : 90, 1);
  pantalla.print(f.modo == Modo::Auto ? "AUTO" : "MANUAL");
  pantalla.setTextColor(SSD1306_WHITE);
  pantalla.setCursor(2, 14);
  if (l.dht.ok) pantalla.printf("T %.1fC  H %.0f%%", l.dht.temp, l.dht.hum);
  else pantalla.print("DHT11: SIN LECTURA");
  pantalla.setCursor(2, 25);
  pantalla.printf("Luz %s  Lluvia %s", l.hayLuz ? "si" : "no", l.mojado ? "si" : "no");
  pantalla.setCursor(2, 36);
  pantalla.printf("Cub: %s", textoCubierta(l, f));
  pantalla.setCursor(2, 50);
  if (WiFi.status() == WL_CONNECTED) pantalla.print(WiFi.localIP());
  else pantalla.print("WiFi: sin conexion");
  pantalla.display();
}
