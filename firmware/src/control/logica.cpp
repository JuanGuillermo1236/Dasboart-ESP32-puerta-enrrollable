#include "logica.h"

#include <stdio.h>
#include <string.h>

void ControlCubierta::iniciar(DirMotor d, Razon r) {
  dir_ = d;
  razon_ = r;
  inicioMs_ = e_.ahoraMs;
  tMs_ = 0;
}

void ControlCubierta::parar() {
  dir_ = DirMotor::Detenido;
  ultimaAccionMs_ = e_.ahoraMs;
}

bool ControlCubierta::llegoAlFinal() const {
  return (dir_ == DirMotor::Abrir && e_.fcAbierto) || (dir_ == DirMotor::Cerrar && e_.fcCerrado);
}

DirMotor ControlCubierta::actualizar(const Entradas &e) {
  e_ = e;
  if (e.fcAbierto || e.fcCerrado) sinPosicionArranque_ = false;

  // Ambos finales presionados: nada se mueve hasta que se resuelva.
  if (e.fcAbierto && e.fcCerrado) {
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

void ControlCubierta::decidirAutomatico() {
  if (atasco_) return;
  const bool enEspera = e_.ahoraMs - ultimaAccionMs_ < static_cast<uint32_t>(u_.esperaAccionS) * 1000;
  // Tras pulsar Detener, ni la lluvia reanuda el motor durante la espera: la persona está interviniendo.
  if (pausaPorDetener_ && !enEspera) pausaPorDetener_ = false;
  if (pausaPorDetener_) return;

  // La lluvia no respeta la espera y puede invertir una apertura en curso.
  const bool lluviaCierra = e_.mojado && (u_.lluviaManda || modo_ == Modo::Auto);
  if (lluviaCierra) {
    if (!e_.fcCerrado && dir_ != DirMotor::Cerrar) iniciar(DirMotor::Cerrar, Razon::Lluvia);
    return;
  }

  if (modo_ != Modo::Auto || dir_ != DirMotor::Detenido || sinPosicionArranque_ || enEspera) return;

  // Sin DHT solo deciden la lluvia y la luz.
  Razon cierre = Razon::Ninguna;
  if (e_.dhtOk && e_.hum > u_.humMax) cierre = Razon::Humedad;
  else if (e_.dhtOk && e_.temp > u_.tempMax) cierre = Razon::Temperatura;
  else if (!e_.hayLuz) cierre = Razon::PocaLuz;

  if (cierre != Razon::Ninguna) {
    if (!e_.fcCerrado) iniciar(DirMotor::Cerrar, cierre);
    return;
  }
  const bool aireBien = !e_.dhtOk || (e_.hum < u_.humMax - u_.histHum && e_.temp < u_.tempMax - u_.histTemp);
  if (aireBien && !e_.fcAbierto) iniciar(DirMotor::Abrir, Razon::Favorable);
}

ResultadoComando ControlCubierta::comando(Accion a) {
  if (a == Accion::Detener) {
    if (dir_ != DirMotor::Detenido) {
      parar();
      razon_ = Razon::DetenidoManual;
      pausaPorDetener_ = true;
    }
    return ResultadoComando::Aceptado;
  }
  if (modo_ != Modo::Manual) return ResultadoComando::ModoAutomatico;
  if (e_.fcAbierto && e_.fcCerrado) return ResultadoComando::FalloFinales;
  if (a == Accion::Abrir && e_.mojado && u_.lluviaManda) return ResultadoComando::LluviaActiva;
  if ((a == Accion::Abrir && e_.fcAbierto) || (a == Accion::Cerrar && e_.fcCerrado)) return ResultadoComando::YaEnPosicion;
  atasco_ = false;
  pausaPorDetener_ = false;
  sinPosicionArranque_ = false;
  iniciar(a == Accion::Abrir ? DirMotor::Abrir : DirMotor::Cerrar, a == Accion::Abrir ? Razon::AperturaManual : Razon::CierreManual);
  return ResultadoComando::Aceptado;
}

void ControlCubierta::cambiarModo(Modo m) {
  if (m == Modo::Manual && modo_ != Modo::Manual) manualDesdeMs_ = e_.ahoraMs;
  modo_ = m;
}

uint32_t ControlCubierta::segundosManualRestantes() const {
  if (modo_ != Modo::Manual) return 0;
  const uint32_t total = static_cast<uint32_t>(u_.manualTimeoutMin) * 60;
  const uint32_t pasado = (e_.ahoraMs - manualDesdeMs_) / 1000;
  return pasado >= total ? 0 : total - pasado;
}

void textoRazon(Razon r, const Umbrales &u, char *destino, size_t tam) {
  switch (r) {
    case Razon::Lluvia: snprintf(destino, tam, "Cerrado por lluvia"); break;
    case Razon::Humedad: snprintf(destino, tam, "Cerrado por humedad > %d%%", u.humMax); break;
    case Razon::Temperatura: snprintf(destino, tam, "Cerrado por temperatura > %d C", u.tempMax); break;
    case Razon::PocaLuz: snprintf(destino, tam, "Cerrado por poca luz"); break;
    case Razon::Favorable: snprintf(destino, tam, "Abierto por luz y aire favorable"); break;
    case Razon::AperturaManual: snprintf(destino, tam, "Apertura manual"); break;
    case Razon::CierreManual: snprintf(destino, tam, "Cierre manual"); break;
    case Razon::DetenidoManual: snprintf(destino, tam, "Detenido manualmente"); break;
    case Razon::Atasco: snprintf(destino, tam, "Detenido: supero %d s sin final de carrera", u.motorMaxS); break;
    case Razon::Finales: snprintf(destino, tam, "Detenido: ambos finales de carrera activos"); break;
    case Razon::VueltaAuto: snprintf(destino, tam, "Volvio a Automatico por tiempo"); break;
    default: destino[0] = '\0'; break;
  }
}
