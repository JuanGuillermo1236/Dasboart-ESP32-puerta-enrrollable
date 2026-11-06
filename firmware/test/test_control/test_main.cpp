#include <unity.h>

#include "../../src/control/clasificacion.h"
#include "../../src/control/filtro.h"
#include "../../src/control/logica.cpp"

namespace {
constexpr uint32_t T0 = 100000;  // ya pasó la espera inicial
constexpr uint32_t MIN = 60000;

// Techo plegado (abierto), de día y seco.
Entradas plegado(uint32_t t = T0) {
  Entradas e;
  e.ahoraMs = t;
  e.hayLuz = true;
  e.fcPlegado = true;
  return e;
}

Entradas enMedio(uint32_t t = T0) {
  Entradas e = plegado(t);
  e.fcPlegado = false;
  return e;
}

Entradas desplegado(uint32_t t = T0) {
  Entradas e = enMedio(t);
  e.fcDesplegado = true;
  return e;
}
}  // namespace

void setUp() {}
void tearDown() {}

void test_de_dia_y_seco_queda_plegado() {
  ControlTecho c{Umbrales{}};
  TEST_ASSERT_TRUE(c.actualizar(plegado()) == DirMotor::Detenido);
}

void test_lluvia_despliega_sin_esperar() {
  ControlTecho c{Umbrales{}};
  Entradas e = plegado(10);  // dentro de la espera inicial
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Desplegar);
  TEST_ASSERT_TRUE(c.razon() == Razon::Lluvia);
}

void test_lluvia_manda_sobre_manual() {
  ControlTecho c{Umbrales{}};
  c.actualizar(plegado());
  c.cambiarModo(Modo::Manual);
  Entradas e = plegado(T0 + 100);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Desplegar);
}

void test_opcion_lluvia_no_manda_en_manual() {
  Umbrales u;
  u.lluviaManda = false;
  ControlTecho c{u};
  c.actualizar(plegado());
  c.cambiarModo(Modo::Manual);
  Entradas e = plegado(T0 + 100);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
}

void test_lluvia_invierte_un_plegado() {
  ControlTecho c{Umbrales{}};
  TEST_ASSERT_TRUE(c.actualizar(desplegado()) == DirMotor::Plegar);
  Entradas e = enMedio(T0 + 500);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Desplegar);
}

void test_espera_15_min_sin_lluvia_para_plegar() {
  ControlTecho c{Umbrales{}};
  Entradas e = desplegado();
  e.mojado = true;
  c.actualizar(e);  // última lluvia en T0
  e = desplegado(T0 + 15 * MIN - 1);
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.ahoraMs = T0 + 15 * MIN;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Plegar);
}

void test_llovizna_corta_reinicia_los_15_min() {
  ControlTecho c{Umbrales{}};
  Entradas e = desplegado();
  e.mojado = true;
  c.actualizar(e);
  e = desplegado(T0 + 10 * MIN);
  e.mojado = true;
  c.actualizar(e);
  e = desplegado(T0 + 16 * MIN);
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.ahoraMs = T0 + 25 * MIN;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Plegar);
}

void test_de_noche_despliega_y_no_pliega() {
  ControlTecho c{Umbrales{}};
  Entradas e = plegado();
  e.hayLuz = false;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Desplegar);
  TEST_ASSERT_TRUE(c.razon() == Razon::Noche);
  ControlTecho d{Umbrales{}};
  e = desplegado();
  e.hayLuz = false;
  TEST_ASSERT_TRUE(d.actualizar(e) == DirMotor::Detenido);
}

void test_espera_entre_acciones() {
  ControlTecho c{Umbrales{}};
  Entradas e = plegado();
  e.hayLuz = false;
  c.actualizar(e);
  e = desplegado(T0 + 5000);  // llegó y volvió la luz
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  TEST_ASSERT_EQUAL_UINT32(1, c.ciclos());
  e.ahoraMs = T0 + 5000 + 59000;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.ahoraMs = T0 + 5000 + 60000;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Plegar);
}

void test_atasco_por_tiempo_y_no_reintenta() {
  ControlTecho c{Umbrales{}};
  Entradas e = plegado();
  e.mojado = true;
  c.actualizar(e);
  e = enMedio(T0 + 12001);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  TEST_ASSERT_TRUE(c.atasco());
  e.ahoraMs += 100000;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
}

void test_comando_borra_atasco_y_pasa_a_manual() {
  ControlTecho c{Umbrales{}};
  Entradas e = plegado();
  e.hayLuz = false;
  c.actualizar(e);
  e = enMedio(T0 + 13000);
  e.hayLuz = false;
  c.actualizar(e);
  TEST_ASSERT_TRUE(c.atasco());
  TEST_ASSERT_TRUE(c.comando(Accion::Desplegar) == ResultadoComando::Aceptado);
  TEST_ASSERT_FALSE(c.atasco());
  TEST_ASSERT_TRUE(c.modo() == Modo::Manual);
}

void test_ambos_finales_detiene_y_bloquea() {
  ControlTecho c{Umbrales{}};
  Entradas e = plegado();
  e.hayLuz = false;
  c.actualizar(e);
  e = plegado(T0 + 100);
  e.fcDesplegado = true;
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  TEST_ASSERT_TRUE(c.comando(Accion::Desplegar) == ResultadoComando::FalloFinales);
  TEST_ASSERT_TRUE(clasificarTecho(true, true, DirMotor::Detenido, false) == EstadoTecho::Error);
}

void test_arranque_sin_posicion_solo_despliega_con_lluvia() {
  ControlTecho c{Umbrales{}};
  Entradas e = enMedio();
  e.hayLuz = false;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Desplegar);
}

void test_detener_gana_a_la_lluvia_durante_la_espera() {
  ControlTecho c{Umbrales{}};
  Entradas e = plegado();
  e.mojado = true;
  c.actualizar(e);
  TEST_ASSERT_TRUE(c.comando(Accion::Detener) == ResultadoComando::Aceptado);
  e = enMedio(T0 + 100);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Detenido);
  e.ahoraMs = T0 + 60001;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Desplegar);
}

void test_rechaza_plegar_con_lluvia_y_si_ya_esta() {
  ControlTecho c{Umbrales{}};
  Entradas e = desplegado();
  e.mojado = true;
  c.actualizar(e);
  TEST_ASSERT_TRUE(c.comando(Accion::Plegar) == ResultadoComando::LluviaActiva);
  TEST_ASSERT_TRUE(c.comando(Accion::Desplegar) == ResultadoComando::YaEnPosicion);
}

void test_manual_vuelve_a_automatico() {
  ControlTecho c{Umbrales{}};
  c.actualizar(plegado());
  c.cambiarModo(Modo::Manual);
  c.actualizar(plegado(T0 + 30 * MIN - 1));
  TEST_ASSERT_TRUE(c.modo() == Modo::Manual);
  c.actualizar(plegado(T0 + 30 * MIN));
  TEST_ASSERT_TRUE(c.modo() == Modo::Auto);
}

void test_funciona_al_desbordar_millis() {
  ControlTecho c{Umbrales{}};
  Entradas e = plegado(0xFFFFFFF0u);
  e.mojado = true;
  c.actualizar(e);
  e = enMedio(1000);
  e.mojado = true;
  TEST_ASSERT_TRUE(c.actualizar(e) == DirMotor::Desplegar);
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
  RUN_TEST(test_de_dia_y_seco_queda_plegado);
  RUN_TEST(test_lluvia_despliega_sin_esperar);
  RUN_TEST(test_lluvia_manda_sobre_manual);
  RUN_TEST(test_opcion_lluvia_no_manda_en_manual);
  RUN_TEST(test_lluvia_invierte_un_plegado);
  RUN_TEST(test_espera_15_min_sin_lluvia_para_plegar);
  RUN_TEST(test_llovizna_corta_reinicia_los_15_min);
  RUN_TEST(test_de_noche_despliega_y_no_pliega);
  RUN_TEST(test_espera_entre_acciones);
  RUN_TEST(test_atasco_por_tiempo_y_no_reintenta);
  RUN_TEST(test_comando_borra_atasco_y_pasa_a_manual);
  RUN_TEST(test_ambos_finales_detiene_y_bloquea);
  RUN_TEST(test_arranque_sin_posicion_solo_despliega_con_lluvia);
  RUN_TEST(test_detener_gana_a_la_lluvia_durante_la_espera);
  RUN_TEST(test_rechaza_plegar_con_lluvia_y_si_ya_esta);
  RUN_TEST(test_manual_vuelve_a_automatico);
  RUN_TEST(test_funciona_al_desbordar_millis);
  RUN_TEST(test_filtro_asimetrico);
  return UNITY_END();
}
