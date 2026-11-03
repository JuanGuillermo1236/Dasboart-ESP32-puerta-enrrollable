// npm run dev:mock: arranca el mock-server y Vite juntos; al cerrar uno, cierra el otro.
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const frontend = join(aqui, '..', '..', 'frontend');
const hijos = [
  spawn(process.execPath, [join(aqui, 'server.mjs')], { stdio: 'inherit' }),
  spawn(process.execPath, [join(frontend, 'node_modules', 'vite', 'bin', 'vite.js')], { stdio: 'inherit', cwd: frontend }),
];
const cerrar = () => hijos.forEach((h) => h.kill());
hijos.forEach((h) => h.on('exit', cerrar));
process.on('SIGINT', cerrar);
