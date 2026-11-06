import { useEffect, useState } from 'preact/hooks';
import type { Evento, Foto } from '../api/types.ts';

export const LIMITE_DESACTUALIZADO_MS = 10000;
const MAX_EVENTOS = 500;

export interface AppState {
  foto: Foto | null;
  socketAbierto: boolean; // conexión con el backend
  ahora: number;
  eventos: Evento[];
  toast: { texto: string; error: boolean } | null;
}

let actual: AppState = { foto: null, socketAbierto: false, ahora: Date.now(), eventos: [], toast: null };
const oyentes = new Set<() => void>();

export const leer = () => actual;

export function actualizar(parche: Partial<AppState>): void {
  actual = { ...actual, ...parche };
  oyentes.forEach((f) => f());
}

export function agregarEvento(ev: Evento): void {
  if (actual.eventos.some((e) => e.id === ev.id)) return;
  actualizar({ eventos: [ev, ...actual.eventos].slice(0, MAX_EVENTOS) });
}

export const datosDesactualizados = (s: Pick<AppState, 'foto' | 'ahora'>) =>
  s.foto?.ultima_lectura != null && s.ahora - s.foto.ultima_lectura > LIMITE_DESACTUALIZADO_MS;

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
