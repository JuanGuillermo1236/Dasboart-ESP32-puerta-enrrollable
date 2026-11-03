// Comprime frontend/dist en firmware/data (.gz) y reporta el peso frente al límite.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'frontend', 'dist');
const data = join(raiz, 'firmware', 'data');
const LIMITE_KB = 300;
const LIMITE_RUTA_LITTLEFS = 31;

rmSync(data, { recursive: true, force: true });
let total = 0;
for (const entrada of readdirSync(dist, { recursive: true, withFileTypes: true })) {
  if (!entrada.isFile()) continue;
  const origen = join(entrada.parentPath, entrada.name);
  const rel = relative(dist, origen).split(sep).join('/');
  const destino = `${rel}.gz`;
  if (destino.length > LIMITE_RUTA_LITTLEFS) throw new Error(`Ruta demasiado larga para LittleFS: ${destino}`);
  const gz = gzipSync(readFileSync(origen), { level: 9 });
  total += gz.length;
  mkdirSync(dirname(join(data, destino)), { recursive: true });
  writeFileSync(join(data, destino), gz);
}

const kb = total / 1024;
console.log(`Frontend: ${kb.toFixed(1)} KB gzip de ${LIMITE_KB} KB`);
if (kb > LIMITE_KB) throw new Error('El frontend supera el límite de peso.');
if (kb > LIMITE_KB * 0.8) console.warn('Aviso: el frontend se acerca al límite de peso.');
