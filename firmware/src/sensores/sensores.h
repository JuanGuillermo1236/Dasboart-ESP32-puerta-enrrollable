#pragma once
#include "../control/estado.h"

// Lee todos los sensores respetando sus frecuencias. Llamar en cada vuelta del bucle.
void sensoresIniciar();
void sensoresActualizar(uint32_t ahoraMs);
const Lecturas &sensoresLecturas();
