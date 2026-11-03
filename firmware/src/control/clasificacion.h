#pragma once
#include "estado.h"

// Reglas puras: se pueden probar sin hardware.

inline Tendencia calcularTendencia(float actual, float anterior, float margen) {
  const float d = actual - anterior;
  if (d > margen) return Tendencia::Sube;
  if (d < -margen) return Tendencia::Baja;
  return Tendencia::Estable;
}

inline EstadoCubierta clasificarCubierta(bool fcAbierto, bool fcCerrado, DirMotor dir, bool atasco) {
  if ((fcAbierto && fcCerrado) || atasco) return EstadoCubierta::Error;
  if (dir != DirMotor::Detenido) return EstadoCubierta::EnMovimiento;
  return fcCerrado ? EstadoCubierta::Cerrada : EstadoCubierta::Abierta;
}
