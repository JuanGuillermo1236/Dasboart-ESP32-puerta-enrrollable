#include "motor.h"

#include <Arduino.h>

#include "config.h"

namespace {
DirMotor dirActual = DirMotor::Detenido;
}

void motorIniciar() {
  // Entradas en bajo antes de activar el PWM. STBY va fijo a 3V3 en este circuito.
  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  digitalWrite(PIN_AIN1, LOW);
  digitalWrite(PIN_AIN2, LOW);
  ledcSetup(PWM_CANAL, PWM_FRECUENCIA_HZ, PWM_RESOLUCION_BITS);
  ledcAttachPin(PIN_PWMA, PWM_CANAL);
  ledcWrite(PWM_CANAL, 0);
}

void motorMover(DirMotor dir, int pwmPct) {
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
  const bool ain1 = (dir == DirMotor::Abrir) != MOTOR_INVERTIDO;
  digitalWrite(PIN_AIN1, ain1 ? HIGH : LOW);
  digitalWrite(PIN_AIN2, ain1 ? LOW : HIGH);
  ledcWrite(PWM_CANAL, constrain(pwmPct, 0, 100) * 255 / 100);
  dirActual = dir;
#else
  (void)dir;
  (void)pwmPct;
#endif
}

void motorDetener() {
  ledcWrite(PWM_CANAL, 0);
  digitalWrite(PIN_AIN1, LOW);
  digitalWrite(PIN_AIN2, LOW);
  dirActual = DirMotor::Detenido;
}

DirMotor motorDireccion() { return dirActual; }
