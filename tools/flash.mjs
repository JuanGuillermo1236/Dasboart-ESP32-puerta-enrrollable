// npm run flash: compila el frontend, graba archivos y firmware, y abre la consola serie.
// npm run flash -- --solo-compilar: lo mismo, sin tocar la placa.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const firmware = join(raiz, 'firmware');
const soloCompilar = process.argv.includes('--solo-compilar');
const python = join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Python', 'Python312', 'python.exe');
const pio = existsSync(python) ? [python, '-m', 'platformio'] : ['pio'];

function correr(titulo, comando, args, cwd, shell = false) {
  console.log(`\n=== ${titulo} ===`);
  const r = spawnSync(comando, args, { cwd, stdio: 'inherit', shell });
  if (r.status !== 0) {
    console.error(`\nFalló: ${titulo}.`);
    if (args.includes('upload') || args.includes('uploadfs')) {
      console.error('Revisa que la placa esté en COM3, que el monitor serie esté cerrado y usa un cable USB de datos.');
      console.error('Si se queda en "Connecting...", mantén pulsado BOOT hasta que empiece a grabar.');
    }
    process.exit(r.status ?? 1);
  }
}

const secretos = join(firmware, 'include', 'secrets.h');
if (!existsSync(secretos)) {
  console.error('Falta firmware/include/secrets.h: copia secrets.example.h y pon tu WiFi.');
  process.exit(1);
}
if (readFileSync(secretos, 'utf8').includes('"TuRed"')) {
  console.warn('Aviso: secrets.h sigue con el WiFi de ejemplo. Verás los datos por consola, pero no el dashboard.');
}

const pioArgs = (...a) => [...pio.slice(1), ...a];
correr('Frontend', 'npm', ['run', 'build'], join(raiz, 'frontend'), true);
if (soloCompilar) {
  correr('Firmware', pio[0], pioArgs('run'), firmware);
  correr('Archivos', pio[0], pioArgs('run', '-t', 'buildfs'), firmware);
  console.log('\nTodo compila. Falta conectar la placa y ejecutar: npm run flash');
} else {
  correr('Grabando archivos', pio[0], pioArgs('run', '-t', 'uploadfs'), firmware);
  correr('Grabando firmware', pio[0], pioArgs('run', '-t', 'upload'), firmware);
  correr('Consola serie (Ctrl + C para salir)', pio[0], pioArgs('device', 'monitor'), firmware);
}
