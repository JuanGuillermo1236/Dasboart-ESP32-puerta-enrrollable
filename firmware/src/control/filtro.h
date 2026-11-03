#pragma once
#include <stdint.h>

// El valor solo cambia tras mantenerse estable un tiempo. Permite activar rápido y liberar lento.
class FiltroEstable {
 public:
  FiltroEstable(uint32_t msActivar, uint32_t msLiberar) : msActivar_(msActivar), msLiberar_(msLiberar) {}

  bool actualizar(bool entrada, uint32_t ahoraMs) {
    if (!iniciado_) {
      iniciado_ = true;
      valor_ = entrada;
      desde_ = ahoraMs;
    }
    if (entrada == valor_) {
      desde_ = ahoraMs;
    } else if (ahoraMs - desde_ >= (entrada ? msActivar_ : msLiberar_)) {
      valor_ = entrada;
      desde_ = ahoraMs;
    }
    return valor_;
  }

 private:
  uint32_t msActivar_, msLiberar_;
  uint32_t desde_ = 0;
  bool valor_ = false;
  bool iniciado_ = false;
};
