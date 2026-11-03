#pragma once
#include <Arduino.h>

// Serializa el estado según docs/api-contract.md.
String estadoComoJson();
String umbralesComoJson();

// Cambia cuando varían cubierta, lluvia o alertas: dispara un envío inmediato.
uint32_t firmaEstadoImportante();
