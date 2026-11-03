#include "sistema.h"

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include "../actuadores/motor.h"
#include "../sensores/sensores.h"
#include "config.h"

namespace {
Umbrales umbrales;
ControlCubierta control(umbrales);
SemaphoreHandle_t cerrojo;

struct Bloqueo {
  Bloqueo() { xSemaphoreTake(cerrojo, portMAX_DELAY); }
  ~Bloqueo() { xSemaphoreGive(cerrojo); }
};
}  // namespace

void sistemaIniciar() {
  cerrojo = xSemaphoreCreateMutex();
  motorIniciar();
}

void sistemaActualizar(uint32_t ahoraMs) {
  const Lecturas &l = sensoresLecturas();
  Entradas e;
  e.ahoraMs = ahoraMs;
  e.mojado = l.mojado;
  e.hayLuz = l.hayLuz;
  e.dhtOk = l.dht.ok;
  e.temp = l.dht.temp;
  e.hum = l.dht.hum;
  e.fcAbierto = l.fcAbierto;
  e.fcCerrado = l.fcCerrado;
  DirMotor dir;
  {
    Bloqueo b;
    dir = control.actualizar(e);
  }
  if (dir != motorDireccion()) motorMover(dir, umbrales.pwmPct);
}

ResultadoComando sistemaComando(Accion a) {
  if (!MOTOR_HABILITADO && a != Accion::Detener) return ResultadoComando::MotorDeshabilitado;
  Bloqueo b;
  return control.comando(a);
}

void sistemaCambiarModo(Modo m) {
  Bloqueo b;
  control.cambiarModo(m);
}

const Umbrales &sistemaUmbrales() { return umbrales; }

FotoSistema sistemaFoto() {
  Bloqueo b;
  FotoSistema f;
  f.modo = control.modo();
  f.dir = control.dir();
  f.tiempoS = control.tiempoS();
  f.ciclos = control.ciclos();
  f.atasco = control.atasco();
  f.habilitado = MOTOR_HABILITADO;
  f.manualRestanteS = control.segundosManualRestantes();
  textoRazon(control.razon(), umbrales, f.razon, sizeof(f.razon));
  return f;
}
