// Preferências do Pro guardadas em `mensalao:prefs:v1` (tema, lembrete, backup automático).
import { gravarChave, lerChave } from '../armazenamento';
import { CHAVE_PREFS, lerPreferencias, type Preferencias } from '../domain/preferencias';

let prefs: Preferencias = lerPreferencias(lerChave(CHAVE_PREFS));

export function obterPrefs(): Preferencias {
  return prefs;
}

/** Aplica uma alteração e grava. */
export function alterarPrefs(fn: (p: Preferencias) => Preferencias): Preferencias {
  prefs = fn(structuredClone(prefs));
  gravarChave(CHAVE_PREFS, JSON.stringify(prefs));
  return prefs;
}
