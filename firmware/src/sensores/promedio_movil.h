#pragma once
#include <stdint.h>

template <uint8_t N>
class PromedioMovil {
 public:
  uint16_t agregar(uint16_t v) {
    suma_ += v - datos_[i_];
    datos_[i_] = v;
    i_ = (i_ + 1) % N;
    if (n_ < N) n_++;
    return suma_ / n_;
  }

 private:
  uint16_t datos_[N] = {};
  uint32_t suma_ = 0;
  uint8_t i_ = 0;
  uint8_t n_ = 0;
};
