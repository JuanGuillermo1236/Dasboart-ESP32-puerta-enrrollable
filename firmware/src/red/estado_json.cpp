#include "estado_json.h"

#include <ArduinoJson.h>
#include <WiFi.h>
#include <time.h>

#include "../control/clasificacion.h"
#include "../control/sistema.h"
#include "../sensores/sensores.h"
#include "config.h"

namespace {
constexpr time_t HORA_VALIDA_DESDE = 1600000000;
constexpr uint32_t AVISO_MANUAL_S = 120;

const char *textoDir(DirMotor d) { return d == DirMotor::Abrir ? "abrir" : d == DirMotor::Cerrar ? "cerrar" : "detenido"; }
const char *textoCubierta(EstadoCubierta c) {
  switch (c) {
    case EstadoCubierta::Abierta: return "Abierta";
    case EstadoCubierta::Cerrada: return "Cerrada";
    case EstadoCubierta::EnMovimiento: return "En movimiento";
    default: return "Error";
  }
}

void ponerTendencia(JsonVariant destino, Tendencia t) {
  if (t == Tendencia::Sube) destino.set("sube");
  else if (t == Tendencia::Baja) destino.set("baja");
  else if (t == Tendencia::Estable) destino.set("estable");
  else destino.set(nullptr);
}

float redondear(float v, float factor) { return roundf(v * factor) / factor; }

void ponerTs(JsonVariant destino, time_t ahora) {
  if (ahora >= HORA_VALIDA_DESDE) destino.set((long long)ahora);
  else destino.set(nullptr);
}

void agregarAlerta(JsonArray lista, const char *id, const char *severidad, const char *codigo, const char *mensaje, time_t ahora) {
  JsonObject a = lista.add<JsonObject>();
  a["id"] = id;
  a["severidad"] = severidad;
  a["codigo"] = codigo;
  a["mensaje"] = mensaje;
  ponerTs(a["ts"].to<JsonVariant>(), ahora);
}

void llenarUmbrales(JsonObject o) {
  const Umbrales &u = sistemaUmbrales();
  o["hum_max"] = u.humMax;
  o["temp_max"] = u.tempMax;
  o["motor_max_s"] = u.motorMaxS;
  o["pwm_pct"] = u.pwmPct;
  o["hist_hum"] = u.histHum;
  o["hist_temp"] = u.histTemp;
  o["espera_accion_s"] = u.esperaAccionS;
  o["manual_timeout_min"] = u.manualTimeoutMin;
  o["lluvia_manda"] = u.lluviaManda;
}
}  // namespace

String estadoComoJson() {
  const Lecturas &l = sensoresLecturas();
  const Umbrales &u = sistemaUmbrales();
  const FotoSistema f = sistemaFoto();
  const time_t ahora = time(nullptr);
  const EstadoCubierta cubierta = clasificarCubierta(l.fcAbierto, l.fcCerrado, f.dir, f.atasco);

  JsonDocument doc;
  ponerTs(doc["ts"].to<JsonVariant>(), ahora);
  doc["uptime"] = millis() / 1000;
  doc["modo"] = f.modo == Modo::Auto ? "auto" : "manual";
  doc["razon_ultima_accion"] = f.razon;

  JsonObject dht = doc["dht"].to<JsonObject>();
  dht["ok"] = l.dht.ok;
  if (l.dht.ok) {
    dht["temp"] = redondear(l.dht.temp, 10);
    dht["hum"] = redondear(l.dht.hum, 10);
  } else {
    dht["temp"] = nullptr;
    dht["hum"] = nullptr;
  }
  if (l.dht.hayExtremos) {
    dht["temp_min"] = redondear(l.dht.tempMin, 10);
    dht["temp_max"] = redondear(l.dht.tempMax, 10);
    dht["hum_min"] = redondear(l.dht.humMin, 10);
    dht["hum_max"] = redondear(l.dht.humMax, 10);
  } else {
    dht["temp_min"] = nullptr;
    dht["temp_max"] = nullptr;
    dht["hum_min"] = nullptr;
    dht["hum_max"] = nullptr;
  }
  ponerTendencia(dht["tendencia_temp"].to<JsonVariant>(), l.dht.tendTemp);
  ponerTendencia(dht["tendencia_hum"].to<JsonVariant>(), l.dht.tendHum);

  JsonObject luz = doc["luz"].to<JsonObject>();
  luz["hay_luz"] = l.hayLuz;
  luz["etiqueta"] = l.hayLuz ? "Con luz" : "Oscuro";

  JsonObject jl = doc["lluvia"].to<JsonObject>();
  jl["estado"] = l.mojado ? "Lluvia" : "Seco";

  JsonObject cub = doc["cubierta"].to<JsonObject>();
  cub["estado"] = textoCubierta(cubierta);
  cub["fc_abierto"] = l.fcAbierto;
  cub["fc_cerrado"] = l.fcCerrado;
  cub["posicion_conocida"] = l.fcAbierto != l.fcCerrado || f.dir != DirMotor::Detenido;

  JsonObject mot = doc["motor"].to<JsonObject>();
  mot["dir"] = textoDir(f.dir);
  mot["pwm_pct"] = u.pwmPct;
  mot["t_funcionamiento_s"] = redondear(f.tiempoS, 10);
  mot["ciclos"] = f.ciclos;
  mot["atasco"] = f.atasco;
  mot["habilitado"] = f.habilitado;

  JsonObject wifi = doc["wifi"].to<JsonObject>();
  const bool conectado = WiFi.status() == WL_CONNECTED;
  wifi["ssid"] = WiFi.SSID();
  wifi["conectado"] = conectado;
  if (conectado) {
    wifi["rssi"] = WiFi.RSSI();
    wifi["ip"] = WiFi.localIP().toString();
  } else {
    wifi["rssi"] = nullptr;
    wifi["ip"] = nullptr;
  }

  JsonObject sis = doc["sistema"].to<JsonObject>();
  sis["mem_libre"] = ESP.getFreeHeap();
  ponerTs(sis["ultima_actualizacion"].to<JsonVariant>(), ahora);

  JsonArray alertas = doc["alertas_activas"].to<JsonArray>();
  if (l.fcAbierto && l.fcCerrado) agregarAlerta(alertas, "fc", "critica", "FC_AMBOS", "Fallo de finales de carrera: ambos presionados", ahora);
  if (f.atasco) agregarAlerta(alertas, "atasco", "critica", "MOTOR_ATASCO", "Posible atasco del motor", ahora);
  if (l.mojado) agregarAlerta(alertas, "lluvia", "aviso", "LLUVIA", "Lluvia detectada", ahora);
  if (!l.dht.ok) agregarAlerta(alertas, "dht", "aviso", "DHT_SIN_LECTURA", "DHT11 sin lectura", ahora);
  if (!conectado) agregarAlerta(alertas, "wifi", "aviso", "WIFI_DESCONECTADO", "WiFi desconectado", ahora);
  if (!f.habilitado) agregarAlerta(alertas, "motor_off", "info", "MOTOR_DESHABILITADO", "Motor deshabilitado en este firmware", ahora);
  if (f.manualRestanteS > 0 && f.manualRestanteS <= AVISO_MANUAL_S) agregarAlerta(alertas, "manual", "info", "MANUAL_POR_VENCER", "El modo Manual vuelve pronto a Automático", ahora);

  llenarUmbrales(doc["umbrales"].to<JsonObject>());

  String salida;
  serializeJson(doc, salida);
  return salida;
}

String umbralesComoJson() {
  JsonDocument doc;
  llenarUmbrales(doc.to<JsonObject>());
  String salida;
  serializeJson(doc, salida);
  return salida;
}

uint32_t firmaEstadoImportante() {
  const Lecturas &l = sensoresLecturas();
  const FotoSistema f = sistemaFoto();
  uint32_t r = static_cast<uint32_t>(clasificarCubierta(l.fcAbierto, l.fcCerrado, f.dir, f.atasco));
  r = r << 1 | l.mojado;
  r = r << 1 | l.hayLuz;
  r = r << 1 | l.dht.ok;
  r = r << 1 | (f.modo == Modo::Auto);
  r = r << 1 | l.fcAbierto;
  r = r << 1 | l.fcCerrado;
  return r;
}
