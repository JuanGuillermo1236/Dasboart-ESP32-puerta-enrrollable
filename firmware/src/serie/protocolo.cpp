#include "protocolo.h"

#include <Arduino.h>
#include <ArduinoJson.h>

#include "../control/clasificacion.h"
#include "../control/sistema.h"
#include "../sensores/sensores.h"
#include "config.h"

namespace {
constexpr size_t MAX_LINEA = 128;

char linea[MAX_LINEA];
size_t largo = 0;
uint32_t ultimoEstado = 0;

// Estado anterior, para detectar eventos y enviar el estado apenas cambie algo importante.
EstadoTecho techoPrev = EstadoTecho::Detenido;
DirMotor dirPrev = DirMotor::Detenido;
Modo modoPrev = Modo::Auto;
bool mojadoPrev = false, luzPrev = false, dhtPrev = false, atascoPrev = false;

const char *textoDir(DirMotor d) { return d == DirMotor::Plegar ? "plegar" : d == DirMotor::Desplegar ? "desplegar" : "detenido"; }

void enviar(JsonDocument &doc) {
  serializeJson(doc, Serial);
  Serial.println();
}

void enviarEvento(const char *evento, const char *descripcion) {
  JsonDocument doc;
  doc["tipo"] = "evento";
  doc["ts"] = millis();
  doc["evento"] = evento;
  doc["descripcion"] = descripcion;
  enviar(doc);
}

void enviarEstado() {
  const Lecturas &l = sensoresLecturas();
  const FotoSistema f = sistemaFoto();
  JsonDocument doc;
  doc["tipo"] = "estado";
  doc["ts"] = millis();
  if (l.dhtOk) {
    doc["temp"] = roundf(l.temp * 10) / 10;
    doc["hum"] = roundf(l.hum);
  } else {
    doc["temp"] = nullptr;
    doc["hum"] = nullptr;
  }
  doc["dht_ok"] = l.dhtOk;
  doc["lluvia"] = l.mojado;
  doc["luz"] = l.hayLuz;
  doc["estado"] = textoTecho(clasificarTecho(l.fcPlegado, l.fcDesplegado, f.dir, f.atasco));
  doc["fc_plegado"] = l.fcPlegado;
  doc["fc_desplegado"] = l.fcDesplegado;
  doc["modo"] = f.modo == Modo::Auto ? "auto" : "manual";
  doc["razon"] = textoRazon(f.razon);
  JsonObject m = doc["motor"].to<JsonObject>();
  m["dir"] = textoDir(f.dir);
  m["pwm"] = sistemaUmbrales().pwm;
  m["t"] = roundf(f.tiempoS * 10) / 10;
  m["ciclos"] = f.ciclos;
  m["atasco"] = f.atasco;
  doc["manual_restante_s"] = f.manualRestanteS;
  enviar(doc);
}

// Compara con la vuelta anterior; devuelve true si cambió algo que el dashboard debe ver ya.
bool detectarEventos() {
  const Lecturas &l = sensoresLecturas();
  const FotoSistema f = sistemaFoto();
  const EstadoTecho techo = clasificarTecho(l.fcPlegado, l.fcDesplegado, f.dir, f.atasco);
  bool cambio = false;

  static bool primera = true;  // al arrancar se toma la foto sin generar eventos
  if (!primera && f.dir != dirPrev) {
    if (f.dir == DirMotor::Plegar) enviarEvento("plegando", textoRazon(f.razon));
    else if (f.dir == DirMotor::Desplegar) enviarEvento("desplegando", textoRazon(f.razon));
    else if (techo == EstadoTecho::Plegado) enviarEvento("plegado", "Techo abierto: llegó al final de plegado");
    else if (techo == EstadoTecho::Desplegado) enviarEvento("desplegado", "Techo cerrado: llegó al final de desplegado");
    else if (!f.atasco) enviarEvento("detenido", textoRazon(f.razon));
    cambio = true;
  }
  if (primera) {
    primera = false;
    mojadoPrev = l.mojado;
    luzPrev = l.hayLuz;
    dhtPrev = l.dhtOk;
    techoPrev = techo;
    modoPrev = f.modo;
    atascoPrev = f.atasco;
    dirPrev = f.dir;
    return true;
  }
  if (f.atasco && !atascoPrev) enviarEvento("atasco", textoRazon(Razon::Atasco));
  if (techo == EstadoTecho::Error && techoPrev != EstadoTecho::Error && !f.atasco) enviarEvento("fallo_finales", textoRazon(Razon::Finales));
  if (l.mojado != mojadoPrev) enviarEvento(l.mojado ? "lluvia" : "lluvia_fin", l.mojado ? "Lluvia detectada" : "Dejó de llover");
  if (l.hayLuz != luzPrev) enviarEvento(l.hayLuz ? "luz" : "oscuro", l.hayLuz ? "Hay luz" : "Oscureció");
  if (l.dhtOk != dhtPrev) enviarEvento(l.dhtOk ? "dht_ok" : "dht_falla", l.dhtOk ? "DHT11 leyendo" : "DHT11 sin lectura");
  if (f.modo != modoPrev) enviarEvento("modo", f.modo == Modo::Auto ? "Modo Automático" : "Modo Manual");

  cambio = cambio || techo != techoPrev || f.atasco != atascoPrev || l.mojado != mojadoPrev ||
           l.hayLuz != luzPrev || l.dhtOk != dhtPrev || f.modo != modoPrev;
  techoPrev = techo;
  dirPrev = f.dir;
  modoPrev = f.modo;
  mojadoPrev = l.mojado;
  luzPrev = l.hayLuz;
  dhtPrev = l.dhtOk;
  atascoPrev = f.atasco;
  return cambio;
}

const char *textoError(ResultadoComando r) {
  switch (r) {
    case ResultadoComando::MotorDeshabilitado: return "motor_deshabilitado";
    case ResultadoComando::FalloFinales: return "fallo_finales";
    case ResultadoComando::LluviaActiva: return "lluvia_activa";
    case ResultadoComando::YaEnPosicion: return "ya_en_posicion";
    default: return nullptr;
  }
}

void atenderComando(const char *texto) {
  JsonDocument entrada;
  JsonDocument salida;
  salida["tipo"] = "respuesta";
  if (deserializeJson(entrada, texto)) {
    salida["ok"] = false;
    salida["error"] = "json_invalido";
    enviar(salida);
    return;
  }
  const String cmd = entrada["cmd"] | "";
  salida["cmd"] = cmd;
  const char *error = nullptr;
  if (cmd == "abrir") error = textoError(sistemaComando(Accion::Plegar));
  else if (cmd == "cerrar") error = textoError(sistemaComando(Accion::Desplegar));
  else if (cmd == "detener") error = textoError(sistemaComando(Accion::Detener));
  else if (cmd == "auto") sistemaCambiarModo(Modo::Auto);
  else if (cmd == "manual") sistemaCambiarModo(Modo::Manual);
  else if (cmd == "estado") {}  // solo pide un estado inmediato
  else error = "cmd_desconocido";
  salida["ok"] = error == nullptr;
  if (error) salida["error"] = error;
  enviar(salida);
  ultimoEstado = 0;  // el backend ve el efecto sin esperar 2 s
}

void leerComandos() {
  while (Serial.available()) {
    const char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (largo > 0) {
        linea[largo] = '\0';
        atenderComando(linea);
        largo = 0;
      }
    } else if (largo < MAX_LINEA - 1) {
      linea[largo++] = c;
    } else {
      largo = 0;  // línea demasiado larga: se descarta
    }
  }
}
}  // namespace

void serieIniciar() {
  Serial.begin(BAUDIOS);
  enviarEvento("inicio", "ESP32 iniciado");
}

void serieActualizar(uint32_t ahoraMs) {
  leerComandos();
  const bool cambio = detectarEventos();
  if (cambio || ultimoEstado == 0 || ahoraMs - ultimoEstado >= PERIODO_ESTADO_MS) {
    ultimoEstado = ahoraMs == 0 ? 1 : ahoraMs;
    enviarEstado();
  }
}
