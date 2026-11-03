#pragma once
#include <stdint.h>

#include "estado.h"
#include "logica.h"

// Une la lógica con el hardware. Los manejadores HTTP corren en otra tarea: todo pasa por un cerrojo.

struct FotoSistema {
  Modo modo;
  DirMotor dir;
  float tiempoS;
  uint32_t ciclos;
  bool atasco;
  bool habilitado;
  uint32_t manualRestanteS;
  char razon[64];
};

void sistemaIniciar();
void sistemaActualizar(uint32_t ahoraMs);

ResultadoComando sistemaComando(Accion a);
void sistemaCambiarModo(Modo modo);

const Umbrales &sistemaUmbrales();
FotoSistema sistemaFoto();
