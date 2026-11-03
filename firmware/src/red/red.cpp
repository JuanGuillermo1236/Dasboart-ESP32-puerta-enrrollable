#include "red.h"

#include <ArduinoJson.h>
#include <AsyncJson.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <WiFi.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include "../control/sistema.h"
#include "config.h"
#include "estado_json.h"
#include "secrets.h"

namespace {
AsyncWebServer servidor(80);
AsyncWebSocket ws("/ws");
SemaphoreHandle_t cerrojo;
String jsonActual = "{}";  // lo arma el bucle; los manejadores HTTP solo lo copian
uint32_t ultimoEnvio = 0, ultimoReintento = 0, firmaEnviada = 0;
bool conectadoAntes = false;

String leerJsonActual() {
  xSemaphoreTake(cerrojo, portMAX_DELAY);
  String copia = jsonActual;
  xSemaphoreGive(cerrojo);
  return copia;
}

void responderError(AsyncWebServerRequest *req, int codigo, const char *error, const char *mensaje = nullptr) {
  JsonDocument doc;
  doc["ok"] = false;
  doc["error"] = error;
  if (mensaje) doc["mensaje"] = mensaje;
  String s;
  serializeJson(doc, s);
  req->send(codigo, "application/json", s);
}

void responderOk(AsyncWebServerRequest *req) { req->send(200, "application/json", "{\"ok\":true}"); }

void responderResultado(AsyncWebServerRequest *req, ResultadoComando r) {
  switch (r) {
    case ResultadoComando::Aceptado: responderOk(req); break;
    case ResultadoComando::MotorDeshabilitado: responderError(req, 503, "motor_deshabilitado"); break;
    case ResultadoComando::ModoAutomatico: responderError(req, 409, "modo_automatico"); break;
    case ResultadoComando::FalloFinales: responderError(req, 409, "fallo_finales"); break;
    case ResultadoComando::LluviaActiva: responderError(req, 409, "lluvia_activa"); break;
    case ResultadoComando::YaEnPosicion: responderError(req, 409, "ya_en_posicion"); break;
  }
}

void registrarRutas() {
  servidor.on("/api/estado", HTTP_GET, [](AsyncWebServerRequest *req) { req->send(200, "application/json", leerJsonActual()); });
  servidor.on("/api/config", HTTP_GET, [](AsyncWebServerRequest *req) { req->send(200, "application/json", umbralesComoJson()); });

  servidor.addHandler(new AsyncCallbackJsonWebHandler("/api/comando", [](AsyncWebServerRequest *req, JsonVariant &json) {
    const String accion = json["accion"] | "";
    if (accion == "abrir") responderResultado(req, sistemaComando(Accion::Abrir));
    else if (accion == "cerrar") responderResultado(req, sistemaComando(Accion::Cerrar));
    else if (accion == "detener") responderResultado(req, sistemaComando(Accion::Detener));
    else responderError(req, 400, "accion_invalida");
  }));

  servidor.addHandler(new AsyncCallbackJsonWebHandler("/api/modo", [](AsyncWebServerRequest *req, JsonVariant &json) {
    const String m = json["modo"] | "";
    if (m != "auto" && m != "manual") {
      responderError(req, 400, "modo_invalido");
      return;
    }
    sistemaCambiarModo(m == "auto" ? Modo::Auto : Modo::Manual);
    responderOk(req);
  }));

  servidor.on("/api/*", HTTP_ANY, [](AsyncWebServerRequest *req) { responderError(req, 501, "no_implementado"); });

  // serveStatic entrega el .gz con Content-Encoding: gzip cuando existe.
  servidor.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");
  servidor.onNotFound([](AsyncWebServerRequest *req) { req->send(404, "text/plain", "No encontrado"); });
}

void alEventoWs(AsyncWebSocket *, AsyncWebSocketClient *cliente, AwsEventType tipo, void *, uint8_t *, size_t) {
  if (tipo == WS_EVT_CONNECT) cliente->text(leerJsonActual());
}
}  // namespace

void redIniciar() {
  cerrojo = xSemaphoreCreateMutex();
  if (!LittleFS.begin(false)) Serial.println("LittleFS no montó: ejecuta pio run -t uploadfs");
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_CLAVE);
  configTzTime(ZONA_HORARIA, SERVIDOR_NTP);
  ws.onEvent(alEventoWs);
  servidor.addHandler(&ws);
  registrarRutas();
  servidor.begin();
}

void redActualizar(uint32_t ahoraMs) {
  const bool conectado = WiFi.status() == WL_CONNECTED;
  if (conectado && !conectadoAntes) Serial.printf("Dashboard en http://%s\n", WiFi.localIP().toString().c_str());
  conectadoAntes = conectado;
  // No bloquea: la cubierta sigue funcionando aunque no haya WiFi.
  if (!conectado && ahoraMs - ultimoReintento >= PERIODO_WIFI_REINTENTO_MS) {
    ultimoReintento = ahoraMs;
    WiFi.reconnect();
  }
  const uint32_t firma = firmaEstadoImportante();
  if (ahoraMs - ultimoEnvio < PERIODO_WS_MS && firma == firmaEnviada) return;
  ultimoEnvio = ahoraMs;
  firmaEnviada = firma;
  String nuevo = estadoComoJson();
  xSemaphoreTake(cerrojo, portMAX_DELAY);
  jsonActual = nuevo;
  xSemaphoreGive(cerrojo);
  ws.cleanupClients();
  ws.textAll(nuevo);
}
