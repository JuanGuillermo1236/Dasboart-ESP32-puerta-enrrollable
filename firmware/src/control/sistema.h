#pragma once
#include <stdint.h>

#include "estado.h"
#include "logica.h"

// Une la lógica con el hardware.

struct FotoSistema {
  Modo modo;
  DirMotor dir;
  float tiempoS;
  uint32_t ciclos;
  bool atasco;
  uint32_t manualRestanteS;
  Razon razon;
};

void sistemaIniciar();
void sistemaActualizar(uint32_t ahoraMs);

ResultadoComando sistemaComando(Accion a);
void sistemaCambiarModo(Modo modo);

const Umbrales &sistemaUmbrales();
FotoSistema sistemaFoto();
