// Única camada que toca o localStorage. Nada sai do aparelho.
import { validarEstado } from './domain/esquema';
import type { Estado } from './domain/tipos';

export const CHAVE = 'mensalao:v1';

export type Carga = { tipo: 'vazio' } | { tipo: 'ok'; estado: Estado } | { tipo: 'corrompido' };

export function carregar(): Carga {
  let bruto: string | null;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    return { tipo: 'corrompido' };
  }
  if (bruto === null) return { tipo: 'vazio' };
  try {
    const r = validarEstado(JSON.parse(bruto));
    return r.ok ? { tipo: 'ok', estado: r.estado } : { tipo: 'corrompido' };
  } catch {
    return { tipo: 'corrompido' };
  }
}

export function salvar(estado: Estado): void {
  localStorage.setItem(CHAVE, JSON.stringify(estado));
}
