#pragma once
#include <stddef.h>
#include <stdint.h>

#include "estado.h"

// Máquina de estados del techo. Código puro: docs/seguridad.md y test/test_control.
// Plegado = techo abierto (cacao al sol); desplegado = techo cerrado.

enum class Accion : uint8_t { Plegar, Desplegar, Detener };
enum class ResultadoComando : uint8_t { Aceptado, MotorDeshabilitado, FalloFinales, LluviaActiva, YaEnPosicion };
enum class Razon : uint8_t { Ninguna, Lluvia, Noche, Favorable, PlegadoManual, DesplegadoManual, DetenidoManual, Atasco, Finales, VueltaAuto };

struct Entradas {
  uint32_t ahoraMs = 0;
  bool mojado = false;
  bool hayLuz = false;
  bool fcPlegado = false;
  bool fcDesplegado = false;
};

class ControlTecho {
 public:
  explicit ControlTecho(const Umbrales &u) : u_(u) {}

  // Devuelve la dirección que debe tener el motor.
  DirMotor actualizar(const Entradas &e);
  // Plegar o desplegar pasan a modo Manual; Detener se acepta siempre.
  ResultadoComando comando(Accion a);
  void cambiarModo(Modo m);

  DirMotor dir() const { return dir_; }
  Modo modo() const { return modo_; }
  Razon razon() const { return razon_; }
  bool atasco() const { return atasco_; }
  uint32_t ciclos() const { return ciclos_; }
  float tiempoS() const { return tMs_ / 1000.0f; }
  // Segundos para volver a Automático; 0 si no está en Manual.
  uint32_t segundosManualRestantes() const;

 private:
  void iniciar(DirMotor d, Razon r);
  void parar();
  bool llegoAlFinal() const;
  void decidirAutomatico();

  Umbrales u_;
  Entradas e_;
  DirMotor dir_ = DirMotor::Detenido;
  Modo modo_ = Modo::Auto;
  Razon razon_ = Razon::Ninguna;
  bool atasco_ = false;
  bool sinPosicionArranque_ = true;
  bool pausaPorDetener_ = false;
  bool huboLluvia_ = false;
  uint32_t ultimaLluviaMs_ = 0;
  uint32_t ciclos_ = 0;
  uint32_t inicioMs_ = 0;
  uint32_t tMs_ = 0;
  uint32_t ultimaAccionMs_ = 0;
  uint32_t manualDesdeMs_ = 0;
};

const char *textoRazon(Razon r);
