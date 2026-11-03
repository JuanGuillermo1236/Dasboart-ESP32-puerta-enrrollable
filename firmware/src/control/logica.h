#pragma once
#include <stddef.h>
#include <stdint.h>

#include "estado.h"

// Máquina de estados de la cubierta. Código puro: docs/seguridad.md y test/test_control.

enum class Accion : uint8_t { Abrir, Cerrar, Detener };
enum class ResultadoComando : uint8_t { Aceptado, MotorDeshabilitado, ModoAutomatico, FalloFinales, LluviaActiva, YaEnPosicion };
enum class Razon : uint8_t { Ninguna, Lluvia, Humedad, Temperatura, PocaLuz, Favorable, AperturaManual, CierreManual, DetenidoManual, Atasco, Finales, VueltaAuto };

struct Entradas {
  uint32_t ahoraMs = 0;
  bool mojado = false;
  bool hayLuz = false;
  bool dhtOk = false;
  float temp = 0, hum = 0;
  bool fcAbierto = false;
  bool fcCerrado = false;
};

class ControlCubierta {
 public:
  explicit ControlCubierta(const Umbrales &u) : u_(u) {}

  // Devuelve la dirección que debe tener el motor.
  DirMotor actualizar(const Entradas &e);
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
  uint32_t ciclos_ = 0;
  uint32_t inicioMs_ = 0;
  uint32_t tMs_ = 0;
  uint32_t ultimaAccionMs_ = 0;
  uint32_t manualDesdeMs_ = 0;
};

void textoRazon(Razon r, const Umbrales &u, char *destino, size_t tam);
