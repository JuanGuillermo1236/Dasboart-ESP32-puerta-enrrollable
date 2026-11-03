#include <unity.h>

#include "../../src/control/filtro.h"
#include "../../src/control/logica.cpp"

namespace {
constexpr uint32_t T0 = 100000;  // ya pasó la espera inicial

Entradas favorable(uint32_t t = T0) {
  Entradas e;
  e.ahoraMs = t;
  e.hayLuz = true;
  e.dhtOk = true;
  e.temp = 28;
  e.hum = 50;
  e.fcAbierto = true;
  return e;
}

Entradas enMedio(uint32_t t = T0) {
  Entradas e = favorable(t);
  e.fcAbierto = false;
  return e;
}

Entradas cerradaFav(uint32_t t = T0) {
  Entradas e = enMedio(t);
  e.fcCerrado = true;
  return e;
}
}  // namespace

void setUp() {}
void tearDown() {}

void test_no_se_mueve_si_todo_esta_bien() {
  ControlCubierta c{Umbrales{}};
  TEST_ASSERT_TRUE(c.actualizar(favorable()) == DirMotor::Detenido);
}

void test_lluvia_cierra_sin_esperar() {
  ControlCubierta c{Umbrales{}};
  Entradas e = favorable(10);  // dentro de la espera inicial
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Cerrar);
  TEST_ASSERT_TRUE(c.razon() == Razon::Lluvia);
}

void test_lluvia_manda_sobre_manual() {
  ControlCubierta c{Umbrales{}};
  c.actualizar(favorable());
  c.cambiarModo(Modo::Manual);
  Entradas e = favorable(T0 + 100);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Cerrar);
}

void test_opcion_lluvia_no_manda_en_manual() {
  Umbrales u;
  u.lluviaManda = false;
  ControlCubierta c{u};
  c.actualizar(favorable());
  c.cambiarModo(Modo::Manual);
  Entradas e = favorable(T0 + 100);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
}

void test_lluvia_invierte_apertura() {
  ControlCubierta c{Umbrales{}};
  c.actualizar(cerradaFav());
  TEST_ASSERT_TRUE(c.dir() == DirMotor::Abrir);
  Entradas e = enMedio(T0 + 500);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Cerrar);
}

void test_rechaza_abrir_con_lluvia() {
  ControlCubierta c{Umbrales{}};
  Entradas e = cerradaFav();
  e.mojado = true;
  c.actualizar(e);
  c.cambiarModo(Modo::Manual);
  TEST_ASSERT_TRUE(c.comando(Accion::Abrir) == ResultadoComando::LluviaActiva);
}

void test_histeresis_humedad() {
  ControlCubierta c{Umbrales{}};
  Entradas e = cerradaFav();
  e.hum = 72;  // bajo 75 pero sobre 70
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.hum = 69;
  e.ahoraMs = T0 + 1000;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Abrir);
}

void test_cierra_por_humedad_y_luz() {
  ControlCubierta c{Umbrales{}};
  Entradas e = favorable();
  e.hum = 76;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Cerrar);
  TEST_ASSERT_TRUE(c.razon() == Razon::Humedad);
  ControlCubierta d{Umbrales{}};
  e = favorable();
  e.hayLuz = false;
  d.actualizar(e);
  TEST_ASSERT_TRUE(d.razon() == Razon::PocaLuz);
}

void test_espera_entre_acciones() {
  ControlCubierta c{Umbrales{}};
  Entradas e = favorable();
  e.hum = 80;
  c.actualizar(e);
  e = cerradaFav(T0 + 5000);  // llegó y mejoró el clima
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  TEST_ASSERT_EQUAL_UINT32(1, c.ciclos());
  e.ahoraMs = T0 + 5000 + 59000;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.ahoraMs = T0 + 5000 + 60000;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Abrir);
}

void test_atasco_por_tiempo_y_no_reintenta() {
  ControlCubierta c{Umbrales{}};
  Entradas e = favorable();
  e.mojado = true;
  c.actualizar(e);
  e = enMedio(T0 + 12001);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  TEST_ASSERT_TRUE(c.atasco());
  e.ahoraMs += 100000;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
}

void test_manual_borra_atasco() {
  ControlCubierta c{Umbrales{}};
  Entradas e = favorable();
  e.hum = 90;
  c.actualizar(e);
  e = enMedio(T0 + 13000);
  e.hum = 90;
  c.actualizar(e);
  TEST_ASSERT_TRUE(c.atasco());
  c.cambiarModo(Modo::Manual);
  TEST_ASSERT_TRUE(c.comando(Accion::Cerrar) == ResultadoComando::Aceptado);
  TEST_ASSERT_FALSE(c.atasco());
}

void test_ambos_finales_detiene_y_bloquea() {
  ControlCubierta c{Umbrales{}};
  Entradas e = favorable();
  e.hum = 90;
  c.actualizar(e);
  e = favorable(T0 + 100);
  e.fcCerrado = true;
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  c.cambiarModo(Modo::Manual);
  TEST_ASSERT_TRUE(c.comando(Accion::Cerrar) == ResultadoComando::FalloFinales);
}

void test_sin_dht_decide_con_luz_y_lluvia() {
  ControlCubierta c{Umbrales{}};
  Entradas e = cerradaFav();
  e.dhtOk = false;
  e.hum = 99;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Abrir);
}

void test_arranque_sin_posicion_solo_cierra_con_lluvia() {
  ControlCubierta c{Umbrales{}};
  Entradas e = enMedio();
  e.hum = 90;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Cerrar);
}

void test_detener_gana_a_la_lluvia_durante_la_espera() {
  ControlCubierta c{Umbrales{}};
  Entradas e = favorable();
  e.mojado = true;
  c.actualizar(e);
  TEST_ASSERT_TRUE(c.comando(Accion::Detener) == ResultadoComando::Aceptado);
  e = enMedio(T0 + 100);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.ahoraMs = T0 + 60001;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Cerrar);
}

void test_comandos_en_automatico_y_posicion() {
  ControlCubierta c{Umbrales{}};
  c.actualizar(favorable());
  TEST_ASSERT_TRUE(c.comando(Accion::Cerrar) == ResultadoComando::ModoAutomatico);
  c.cambiarModo(Modo::Manual);
  TEST_ASSERT_TRUE(c.comando(Accion::Abrir) == ResultadoComando::YaEnPosicion);
}

void test_manual_vuelve_a_automatico() {
  ControlCubierta c{Umbrales{}};
  c.actualizar(favorable());
  c.cambiarModo(Modo::Manual);
  c.actualizar(favorable(T0 + 30 * 60000 - 1));
  TEST_ASSERT_TRUE(c.modo() == Modo::Manual);
  c.actualizar(favorable(T0 + 30 * 60000));
  TEST_ASSERT_TRUE(c.modo() == Modo::Auto);
}

void test_funciona_al_desbordar_millis() {
  ControlCubierta c{Umbrales{}};
  Entradas e = favorable(0xFFFFFFF0u);
  e.mojado = true;
  c.actualizar(e);
  e = enMedio(1000);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Cerrar);
  TEST_ASSERT_FALSE(c.atasco());
}

void test_filtro_asimetrico() {
  FiltroEstable f(2000, 30000);
  TEST_ASSERT_FALSE(f.actualizar(false, 0));
  TEST_ASSERT_FALSE(f.actualizar(true, 1000));
  TEST_ASSERT_TRUE(f.actualizar(true, 3000));
  TEST_ASSERT_TRUE(f.actualizar(false, 20000));
  TEST_ASSERT_FALSE(f.actualizar(false, 50001));
}

int main() {
  UNITY_BEGIN();
  RUN_TEST(test_no_se_mueve_si_todo_esta_bien);
  RUN_TEST(test_lluvia_cierra_sin_esperar);
  RUN_TEST(test_lluvia_manda_sobre_manual);
  RUN_TEST(test_opcion_lluvia_no_manda_en_manual);
  RUN_TEST(test_lluvia_invierte_apertura);
  RUN_TEST(test_rechaza_abrir_con_lluvia);
  RUN_TEST(test_histeresis_humedad);
  RUN_TEST(test_cierra_por_humedad_y_luz);
  RUN_TEST(test_espera_entre_acciones);
  RUN_TEST(test_atasco_por_tiempo_y_no_reintenta);
  RUN_TEST(test_manual_borra_atasco);
  RUN_TEST(test_ambos_finales_detiene_y_bloquea);
  RUN_TEST(test_sin_dht_decide_con_luz_y_lluvia);
  RUN_TEST(test_arranque_sin_posicion_solo_cierra_con_lluvia);
  RUN_TEST(test_detener_gana_a_la_lluvia_durante_la_espera);
  RUN_TEST(test_comandos_en_automatico_y_posicion);
  RUN_TEST(test_manual_vuelve_a_automatico);
  RUN_TEST(test_funciona_al_desbordar_millis);
  RUN_TEST(test_filtro_asimetrico);
  return UNITY_END();
}
