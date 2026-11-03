import { useEffect, useState } from 'preact/hooks';
import type { Estado } from '../api/types.ts';

export const LIMITE_DESACTUALIZADO_MS = 10000;

export interface AppState {
  estado: Estado | null;
  conectado: boolean;
  recibidoEn: number | null;
  ahora: number;
  toast: { texto: string; error: boolean } | null;
}

let actual: AppState = { estado: null, conectado: false, recibidoEn: null, ahora: Date.now(), toast: null };
const oyentes = new Set<() => void>();

export const leer = () => actual;

export function actualizar(parche: Partial<AppState>): void {
  actual = { ...actual, ...parche };
  oyentes.forEach((f) => f());
}

export const datosDesactualizados = (s: AppState) =>
  s.recibidoEn !== null && s.ahora - s.recibidoEn > LIMITE_DESACTUALIZADO_MS;

export function useStore(): AppState {
  const [, marcar] = useState(0);
  useEffect(() => {
    const f = () => marcar((n) => n + 1);
    oyentes.add(f);
    return () => {
      oyentes.delete(f);
    };
  }, []);
  return actual;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function mostrarToast(texto: string, error = false): void {
  clearTimeout(toastTimer);
  actualizar({ toast: { texto, error } });
  toastTimer = setTimeout(() => actualizar({ toast: null }), 3500);
}
