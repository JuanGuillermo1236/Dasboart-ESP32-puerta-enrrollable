#include "sistema.h"

#include <Arduino.h>

#include "../actuadores/motor.h"
#include "../sensores/sensores.h"
#include "config.h"

namespace {
Umbrales umbrales;
ControlTecho control(umbrales);
}  // namespace

void sistemaIniciar() { motorIniciar(); }

void sistemaActualizar(uint32_t ahoraMs) {
  const Lecturas &l = sensoresLecturas();
  Entradas e;
  e.ahoraMs = ahoraMs;
  e.mojado = l.mojado;
  e.hayLuz = l.hayLuz;
  e.fcPlegado = l.fcPlegado;
  e.fcDesplegado = l.fcDesplegado;
  const DirMotor dir = control.actualizar(e);
  if (dir != motorDireccion()) motorMover(dir, umbrales.pwm);
  motorActualizar(ahoraMs);
}

ResultadoComando sistemaComando(Accion a) {
  if (!MOTOR_HABILITADO && a != Accion::Detener) return ResultadoComando::MotorDeshabilitado;
  return control.comando(a);
}

void sistemaCambiarModo(Modo m) { control.cambiarModo(m); }

const Umbrales &sistemaUmbrales() { return umbrales; }

FotoSistema sistemaFoto() {
  FotoSistema f;
  f.modo = control.modo();
  f.dir = control.dir();
  f.tiempoS = control.tiempoS();
  f.ciclos = control.ciclos();
  f.atasco = control.atasco();
  f.manualRestanteS = control.segundosManualRestantes();
  f.razon = control.razon();
  return f;
}
