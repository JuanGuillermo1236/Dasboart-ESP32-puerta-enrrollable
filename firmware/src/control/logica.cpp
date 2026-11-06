#include "logica.h"

void ControlTecho::iniciar(DirMotor d, Razon r) {
  dir_ = d;
  razon_ = r;
  inicioMs_ = e_.ahoraMs;
  tMs_ = 0;
}

void ControlTecho::parar() {
  dir_ = DirMotor::Detenido;
  ultimaAccionMs_ = e_.ahoraMs;
}

bool ControlTecho::llegoAlFinal() const {
  return (dir_ == DirMotor::Plegar && e_.fcPlegado) || (dir_ == DirMotor::Desplegar && e_.fcDesplegado);
}

DirMotor ControlTecho::actualizar(const Entradas &e) {
  e_ = e;
  if (e.fcPlegado || e.fcDesplegado) sinPosicionArranque_ = false;
  if (e.mojado) {
    huboLluvia_ = true;
    ultimaLluviaMs_ = e.ahoraMs;
  }

  // Ambos finales activos (o un cable suelto en NC): nada se mueve hasta que se resuelva.
  if (e.fcPlegado && e.fcDesplegado) {
    if (dir_ != DirMotor::Detenido) parar();
    razon_ = Razon::Finales;
    return dir_;
  }

  if (dir_ != DirMotor::Detenido) {
    tMs_ = e.ahoraMs - inicioMs_;
    if (llegoAlFinal()) {
      parar();
      ciclos_++;
    } else if (tMs_ > static_cast<uint32_t>(u_.motorMaxS) * 1000) {
      parar();
      atasco_ = true;
      razon_ = Razon::Atasco;
    }
  }

  if (modo_ == Modo::Manual && e.ahoraMs - manualDesdeMs_ >= static_cast<uint32_t>(u_.manualTimeoutMin) * 60000) {
    modo_ = Modo::Auto;
    if (dir_ == DirMotor::Detenido) razon_ = Razon::VueltaAuto;
  }

  decidirAutomatico();
  return dir_;
}

void ControlTecho::decidirAutomatico() {
  if (atasco_) return;
  const bool enEspera = e_.ahoraMs - ultimaAccionMs_ < static_cast<uint32_t>(u_.esperaAccionS) * 1000;
  // Tras pulsar Detener, ni la lluvia reanuda el motor durante la espera: la persona está interviniendo.
  if (pausaPorDetener_ && !enEspera) pausaPorDetener_ = false;
  if (pausaPorDetener_) return;

  // La lluvia no respeta la espera y puede invertir un plegado en curso.
  if (e_.mojado && (u_.lluviaManda || modo_ == Modo::Auto)) {
    if (!e_.fcDesplegado && dir_ != DirMotor::Desplegar) iniciar(DirMotor::Desplegar, Razon::Lluvia);
    return;
  }

  if (modo_ != Modo::Auto || dir_ != DirMotor::Detenido || sinPosicionArranque_ || enEspera) return;

  // De noche se cierra: el rocío vuelve a mojar el cacao.
  if (!e_.hayLuz) {
    if (!e_.fcDesplegado) iniciar(DirMotor::Desplegar, Razon::Noche);
    return;
  }
  const bool secoSuficiente = !huboLluvia_ || e_.ahoraMs - ultimaLluviaMs_ >= static_cast<uint32_t>(u_.secoParaAbrirMin) * 60000;
  if (secoSuficiente && !e_.fcPlegado) iniciar(DirMotor::Plegar, Razon::Favorable);
}

ResultadoComando ControlTecho::comando(Accion a) {
  if (a == Accion::Detener) {
    if (dir_ != DirMotor::Detenido) {
      parar();
      razon_ = Razon::DetenidoManual;
      pausaPorDetener_ = true;
    }
    return ResultadoComando::Aceptado;
  }
  if (e_.fcPlegado && e_.fcDesplegado) return ResultadoComando::FalloFinales;
  if (a == Accion::Plegar && e_.mojado && u_.lluviaManda) return ResultadoComando::LluviaActiva;
  if ((a == Accion::Plegar && e_.fcPlegado) || (a == Accion::Desplegar && e_.fcDesplegado)) return ResultadoComando::YaEnPosicion;
  cambiarModo(Modo::Manual);
  atasco_ = false;
  pausaPorDetener_ = false;
  sinPosicionArranque_ = false;
  if (a == Accion::Plegar) iniciar(DirMotor::Plegar, Razon::PlegadoManual);
  else iniciar(DirMotor::Desplegar, Razon::DesplegadoManual);
  return ResultadoComando::Aceptado;
}

void ControlTecho::cambiarModo(Modo m) {
  if (m == Modo::Manual) manualDesdeMs_ = e_.ahoraMs;  // cada acción manual renueva el plazo
  modo_ = m;
}

uint32_t ControlTecho::segundosManualRestantes() const {
  if (modo_ != Modo::Manual) return 0;
  const uint32_t total = static_cast<uint32_t>(u_.manualTimeoutMin) * 60;
  const uint32_t pasado = (e_.ahoraMs - manualDesdeMs_) / 1000;
  return pasado >= total ? 0 : total - pasado;
}

const char *textoRazon(Razon r) {
  switch (r) {
    case Razon::Lluvia: return "Cerrado por lluvia";
    case Razon::Noche: return "Cerrado por la noche";
    case Razon::Favorable: return "Abierto: sin lluvia y con luz";
    case Razon::PlegadoManual: return "Abierto manualmente";
    case Razon::DesplegadoManual: return "Cerrado manualmente";
    case Razon::DetenidoManual: return "Detenido manualmente";
    case Razon::Atasco: return "Detenido: tiempo máximo sin llegar al final";
    case Razon::Finales: return "Fallo: ambos finales activos o desconectados";
    case Razon::VueltaAuto: return "Volvió a Automático por tiempo";
    default: return "";
  }
}
