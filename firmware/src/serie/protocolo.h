#pragma once
#include <stdint.h>

// Comunicación con el backend por USB: una línea JSON por mensaje. Ver docs/protocolo-serie.md.
void serieIniciar();
void serieActualizar(uint32_t ahoraMs);
