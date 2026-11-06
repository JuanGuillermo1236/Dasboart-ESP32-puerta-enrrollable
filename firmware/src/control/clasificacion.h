#pragma once
#include "estado.h"

// Regla pura: se puede probar sin hardware.
inline EstadoTecho clasificarTecho(bool fcPlegado, bool fcDesplegado, DirMotor dir, bool atasco) {
  if ((fcPlegado && fcDesplegado) || atasco) return EstadoTecho::Error;
  if (dir == DirMotor::Plegar) return EstadoTecho::Plegando;
  if (dir == DirMotor::Desplegar) return EstadoTecho::Desplegando;
  if (fcPlegado) return EstadoTecho::Plegado;
  if (fcDesplegado) return EstadoTecho::Desplegado;
  return EstadoTecho::Detenido;  // a medio camino: posición desconocida
}

inline const char *textoTecho(EstadoTecho e) {
  switch (e) {
    case EstadoTecho::Plegado: return "PLEGADO";
    case EstadoTecho::Desplegado: return "DESPLEGADO";
    case EstadoTecho::Plegando: return "PLEGANDO";
    case EstadoTecho::Desplegando: return "DESPLEGANDO";
    case EstadoTecho::Detenido: return "DETENIDO";
    default: return "ERROR";
  }
}
