#pragma once
#include "../control/estado.h"

void motorIniciar();
void motorMover(DirMotor dir, int pwmPct);
void motorDetener();
DirMotor motorDireccion();
