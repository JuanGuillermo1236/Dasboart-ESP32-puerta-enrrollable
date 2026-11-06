// npm run flash: graba el firmware completo y abre la consola serie.
// npm run prueba: graba el firmware de prueba por componentes (etapa 1).
// Añade -- --solo-compilar para compilar sin tocar la placa.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const firmware = join(dirname(fileURLToPath(import.meta.url)), '..', 'firmware');
const entorno = process.argv.includes('--prueba') ? 'prueba' : 'esp32dev';
const soloCompilar = process.argv.includes('--solo-compilar');
const python = join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Python', 'Python312', 'python.exe');
const pio = existsSync(python) ? [python, '-m', 'platformio'] : ['pio'];

function correr(titulo, ...args) {
  console.log(`\n=== ${titulo} ===`);
  const r = spawnSync(pio[0], [...pio.slice(1), ...args], { cwd: firmware, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\nFalló: ${titulo}.`);
    if (args.includes('upload')) {
      console.error('Revisa que la placa esté en COM3 y que nada más use el puerto (monitor serie o backend).');
      console.error('Mantén pulsado BOOT durante toda la grabación.');
    }
    process.exit(r.status ?? 1);
  }
}

if (soloCompilar) {
  correr('Compilando', 'run', '-e', entorno);
} else {
  correr('Grabando (mantén pulsado BOOT)', 'run', '-e', entorno, '-t', 'upload');
  correr('Consola serie (Ctrl + C para salir)', 'device', 'monitor', '-e', entorno);
}
