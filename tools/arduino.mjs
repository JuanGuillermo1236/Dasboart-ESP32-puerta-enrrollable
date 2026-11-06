// npm run arduino: genera firmware/arduino/CacaoCover/ para abrirlo en Arduino IDE.
// Es una copia del firmware de PlatformIO: se edita firmware/src/ y se vuelve a generar.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const firmware = join(dirname(fileURLToPath(import.meta.url)), '..', 'firmware');
const origen = join(firmware, 'src');
const sketch = join(firmware, 'arduino', 'CacaoCover');
const aviso = '// Generado por tools/arduino.mjs: no lo edites aquí, edita firmware/src/ y vuelve a generar.\n';

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

rmSync(sketch, { recursive: true, force: true });
mkdirSync(join(sketch, 'src'), { recursive: true });
cpSync(join(firmware, 'include', 'config.h'), join(sketch, 'src', 'config.h'));

// Arduino IDE compila el .ino y todo lo que haya en src/; config.h se busca con ruta relativa.
for (const ruta of archivos(origen)) {
  const rel = relative(origen, ruta);
  if (rel === 'main.cpp' || rel.startsWith('prueba')) continue;
  const hastaConfig = relative(dirname(join(sketch, 'src', rel)), join(sketch, 'src', 'config.h')).replaceAll('\\', '/');
  const texto = readFileSync(ruta, 'utf8').replaceAll('#include "config.h"', `#include "${hastaConfig}"`);
  mkdirSync(dirname(join(sketch, 'src', rel)), { recursive: true });
  writeFileSync(join(sketch, 'src', rel), aviso + texto);
}

const ino = readFileSync(join(origen, 'main.cpp'), 'utf8').replace(/#include "(.+)"/g, '#include "src/$1"');
writeFileSync(join(sketch, 'CacaoCover.ino'), aviso + ino);

console.log(`Sketch generado en ${sketch}`);
console.log('Ábrelo en Arduino IDE con la placa "DOIT ESP32 DEVKIT V1". Librerías: ArduinoJson, DHT sensor library, Adafruit Unified Sensor y U8g2.');
