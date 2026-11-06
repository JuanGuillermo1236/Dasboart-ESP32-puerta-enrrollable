// Etapa 1: firmware de prueba por componentes. Se maneja con teclas desde el monitor serie.
#include <Arduino.h>
#include <DHT.h>
#include <U8g2lib.h>
#include <Wire.h>

#include "config.h"

namespace {
enum class Mov { Parado, Plegar, Desplegar };

DHT dht(PIN_DHT, DHT11);
U8G2_SH1106_128X64_NONAME_F_HW_I2C oledSh1106(U8G2_R0, U8X8_PIN_NONE);
U8G2_SSD1306_128X64_NONAME_F_HW_I2C oledSsd1306(U8G2_R0, U8X8_PIN_NONE);

Mov mov = Mov::Parado;
uint32_t inicioMov = 0;
int pwm = PWM_PRUEBA;
bool otroFcAlInicio = false;
bool monitor = false;
uint32_t ultimoMonitor = 0;

bool fcPlegado() { return (digitalRead(PIN_FC_ABIERTO) == HIGH) == FC_CONTACTO_NC; }
bool fcDesplegado() { return (digitalRead(PIN_FC_CERRADO) == HIGH) == FC_CONTACTO_NC; }
const char *pulsado(bool p) { return p ? "PULSADO" : "libre"; }

void ayuda() {
  Serial.println();
  Serial.println("=== CacaoCover: prueba por componentes ===");
  Serial.println(" s  Mostrar sensores cada 2 s (otra vez para parar)");
  Serial.println(" l  Leer sensores una vez");
  Serial.println(" i  Buscar dispositivos I2C (la OLED debe salir en 0x3C)");
  Serial.println(" 1  Probar OLED como SH1106");
  Serial.println(" 2  Probar OLED como SSD1306");
  Serial.println(" p  Motor: plegar (hacia el final de plegado)");
  Serial.println(" d  Motor: desplegar (hacia el final de desplegado)");
  Serial.println(" x  Detener motor (con el motor en marcha, cualquier tecla lo detiene)");
  Serial.println(" +  Subir PWM      -  Bajar PWM");
  Serial.println(" h  Esta ayuda");
  Serial.printf("PWM actual: %d de %d. Tiempo máximo del motor: %u s.\n", pwm, PWM_MAX, static_cast<unsigned>(TIMEOUT_MOTOR_MS / 1000));
}

void leerSensores() {
  const float t = dht.readTemperature();
  const float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) Serial.print("DHT11: SIN LECTURA (revisa S en D19)");
  else Serial.printf("DHT11: %.1f C  %.0f %%", t, h);
  const int luz = digitalRead(PIN_LDR_DO);
  const int lluvia = digitalRead(PIN_LLUVIA_DO);
  Serial.printf(" | luz DO=%d (%s) | lluvia DO=%d (%s) | FC plegado=%s desplegado=%s\n",
                luz, (luz == LOW) == LDR_LUZ_EN_BAJO ? "hay luz" : "oscuro",
                lluvia, (lluvia == LOW) == LLUVIA_MOJADO_EN_BAJO ? "MOJADO" : "seco",
                pulsado(fcPlegado()), pulsado(fcDesplegado()));
}

void escanearI2c() {
  Serial.println("Buscando dispositivos I2C en SDA=D21, SCL=D22...");
  int encontrados = 0;
  for (uint8_t dir = 1; dir < 127; dir++) {
    Wire.beginTransmission(dir);
    if (Wire.endTransmission() == 0) {
      Serial.printf("  Encontrado en 0x%02X\n", dir);
      encontrados++;
    }
  }
  if (!encontrados) Serial.println("  Nada. Revisa VCC, GND, SDA y SCK de la OLED.");
}

template <typename T>
void probarOled(T &oled, const char *nombre) {
  oled.begin();
  oled.clearBuffer();
  oled.setFont(u8g2_font_6x10_tf);
  oled.drawFrame(0, 0, 128, 64);
  oled.drawStr(6, 16, "CacaoCover");
  oled.drawStr(6, 32, nombre);
  oled.drawStr(6, 48, "Marco completo?");
  oled.sendBuffer();
  Serial.printf("OLED probada como %s. Si ves el marco entero y sin puntos sueltos a la derecha, ese es tu controlador.\n", nombre);
}

void pararMotor(const char *motivo) {
  ledcWrite(PWM_CANAL, 0);
  digitalWrite(PIN_AIN1, LOW);
  digitalWrite(PIN_AIN2, LOW);
  if (mov != Mov::Parado) Serial.printf("Motor detenido: %s (%.1f s)\n", motivo, (millis() - inicioMov) / 1000.0f);
  mov = Mov::Parado;
}

void arrancarMotor(Mov m) {
  const bool plegar = m == Mov::Plegar;
  if (plegar ? fcPlegado() : fcDesplegado()) {
    Serial.println(plegar ? "Ya está en el final de plegado." : "Ya está en el final de desplegado.");
    return;
  }
  const bool ain1 = plegar != MOTOR_INVERTIDO;
  digitalWrite(PIN_AIN1, ain1 ? HIGH : LOW);
  digitalWrite(PIN_AIN2, ain1 ? LOW : HIGH);
  mov = m;
  inicioMov = millis();
  otroFcAlInicio = plegar ? fcDesplegado() : fcPlegado();
  Serial.printf("%s con PWM %d. Pulsa cualquier tecla para detener.\n", plegar ? "Plegando" : "Desplegando", pwm);
}

void actualizarMotor() {
  if (mov == Mov::Parado) return;
  const uint32_t t = millis() - inicioMov;
  // Rampa: sube de 0 al PWM elegido para evitar el pico de corriente que reinicia el ESP32.
  ledcWrite(PWM_CANAL, t >= RAMPA_MS ? pwm : pwm * t / RAMPA_MS);
  const bool plegar = mov == Mov::Plegar;
  const bool destino = plegar ? fcPlegado() : fcDesplegado();
  const bool otro = plegar ? fcDesplegado() : fcPlegado();
  if (destino) {
    pararMotor("llegó al final de carrera correcto");
  } else if (otro && !otroFcAlInicio) {
    pararMotor("tocó el final de carrera CONTRARIO. El giro está invertido: pon MOTOR_INVERTIDO = true en config.h");
  } else if (t > TIMEOUT_MOTOR_MS) {
    pararMotor("tiempo máximo sin llegar al final. Si empujó contra el tope, el giro está invertido");
  }
  if (!otro) otroFcAlInicio = false;
}

void atenderTecla(char c) {
  if (mov != Mov::Parado) {
    pararMotor("detenido por teclado");
    return;
  }
  switch (c) {
    case 's':
      monitor = !monitor;
      Serial.println(monitor ? "Mostrando sensores cada 2 s." : "Monitor de sensores detenido.");
      break;
    case 'l': leerSensores(); break;
    case 'i': escanearI2c(); break;
    case '1': probarOled(oledSh1106, "SH1106"); break;
    case '2': probarOled(oledSsd1306, "SSD1306"); break;
    case 'p': arrancarMotor(Mov::Plegar); break;
    case 'd': arrancarMotor(Mov::Desplegar); break;
    case '+': pwm = min(PWM_MAX, pwm + 10); Serial.printf("PWM: %d\n", pwm); break;
    case '-': pwm = max(60, pwm - 10); Serial.printf("PWM: %d\n", pwm); break;
    case 'h': ayuda(); break;
    default: break;
  }
}
}  // namespace

void setup() {
  // Motor apagado antes que nada: STBY va fijo a 3V3.
  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  digitalWrite(PIN_AIN1, LOW);
  digitalWrite(PIN_AIN2, LOW);
  ledcSetup(PWM_CANAL, PWM_FRECUENCIA_HZ, PWM_RESOLUCION_BITS);
  ledcAttachPin(PIN_PWMA, PWM_CANAL);
  ledcWrite(PWM_CANAL, 0);

  pinMode(PIN_FC_ABIERTO, INPUT_PULLUP);
  pinMode(PIN_FC_CERRADO, INPUT_PULLUP);
  pinMode(PIN_LDR_DO, INPUT);
  pinMode(PIN_LLUVIA_DO, INPUT);
  Serial.begin(115200);
  Wire.begin(PIN_SDA, PIN_SCL);
  dht.begin();
  delay(500);
  ayuda();
}

void loop() {
  while (Serial.available()) {
    const char c = Serial.read();
    if (c != '\r' && c != '\n') atenderTecla(c);
  }
  actualizarMotor();
  if (monitor && millis() - ultimoMonitor >= 2000) {
    ultimoMonitor = millis();
    leerSensores();
  }
}
