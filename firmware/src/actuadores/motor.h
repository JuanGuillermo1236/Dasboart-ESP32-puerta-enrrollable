#pragma once
#include <stdint.h>

#include "../control/estado.h"

void motorIniciar();
// Fija la dirección; la velocidad sube en rampa con motorActualizar().
void motorMover(DirMotor dir, int pwm);
void motorActualizar(uint32_t ahoraMs);
void motorDetener();
DirMotor motorDireccion();
