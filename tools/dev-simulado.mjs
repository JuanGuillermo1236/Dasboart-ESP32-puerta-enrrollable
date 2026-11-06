// npm run dev:sim: backend con ESP32 simulado + dashboard con recarga en caliente, sin placa.
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const hijos = [
  spawn(process.execPath, ['--disable-warning=ExperimentalWarning', join(raiz, 'backend', 'src', 'main.mjs'), '--simular'], { stdio: 'inherit' }),
  spawn(process.execPath, [join(raiz, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js')], { stdio: 'inherit', cwd: join(raiz, 'frontend') }),
];
const cerrar = () => hijos.forEach((h) => h.kill());
hijos.forEach((h) => h.on('exit', cerrar));
process.on('SIGINT', cerrar);
