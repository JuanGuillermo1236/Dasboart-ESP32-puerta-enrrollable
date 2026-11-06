#include "motor.h"

#include <Arduino.h>

#include "config.h"

namespace {
DirMotor dirActual = DirMotor::Detenido;
int pwmObjetivo = 0;
uint32_t inicioMs = 0;

// El núcleo ESP32 3.x (el de Arduino IDE) maneja el PWM por pin; el 2.x (PlatformIO), por canal.
void pwmIniciar() {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttachChannel(PIN_PWMA, PWM_FRECUENCIA_HZ, PWM_RESOLUCION_BITS, PWM_CANAL);
#else
  ledcSetup(PWM_CANAL, PWM_FRECUENCIA_HZ, PWM_RESOLUCION_BITS);
  ledcAttachPin(PIN_PWMA, PWM_CANAL);
#endif
}

void pwmEscribir(uint32_t ciclo) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(PIN_PWMA, ciclo);
#else
  ledcWrite(PWM_CANAL, ciclo);
#endif
}
}  // namespace

void motorIniciar() {
  // Entradas en bajo antes de activar el PWM. STBY va fijo a 3V3 en este circuito.
  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  digitalWrite(PIN_AIN1, LOW);
  digitalWrite(PIN_AIN2, LOW);
  pwmIniciar();
  pwmEscribir(0);
}

void motorMover(DirMotor dir, int pwm) {
#if MOTOR_HABILITADO
  if (dir == DirMotor::Detenido) {
    motorDetener();
    return;
  }
  // Invertir de golpe genera un pico de corriente que puede reiniciar el ESP32.
  if (dirActual != DirMotor::Detenido) {
    motorDetener();
    delay(PAUSA_INVERSION_MS);
  }
  const bool ain1 = (dir == DirMotor::Plegar) != MOTOR_INVERTIDO;
  digitalWrite(PIN_AIN1, ain1 ? HIGH : LOW);
  digitalWrite(PIN_AIN2, ain1 ? LOW : HIGH);
  pwmObjetivo = constrain(pwm, 0, PWM_MAX);
  inicioMs = millis();
  dirActual = dir;
#else
  (void)dir;
  (void)pwm;
#endif
}

void motorActualizar(uint32_t ahoraMs) {
  if (dirActual == DirMotor::Detenido) return;
  // Rampa: sube de 0 al PWM elegido para evitar el pico de corriente al arrancar.
  const uint32_t t = ahoraMs - inicioMs;
  pwmEscribir(t >= RAMPA_MS ? pwmObjetivo : pwmObjetivo * t / RAMPA_MS);
}

void motorDetener() {
  pwmEscribir(0);
  digitalWrite(PIN_AIN1, LOW);
  digitalWrite(PIN_AIN2, LOW);
  dirActual = DirMotor::Detenido;
}

DirMotor motorDireccion() { return dirActual; }
