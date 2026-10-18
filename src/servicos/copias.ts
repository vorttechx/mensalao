// US-14 — Backup automático: grava cópias locais, restaura e controla o lembrete de exportar arquivo.
import { gravarChave, lerChave } from '../armazenamento';
import {
  CHAVE_COPIAS,
  adiarLembreteExportar,
  copiaAntesDeRestaurar,
  decidirCopia,
  diasParaLembrarExportar,
  lerConteudoCopia,
  lerCopias,
  marcarInutilizavel,
  type Copia,
} from '../domain/copias';
import { agoraLocal, definirEstado, emRecuperacao, gerarId, hoje, obterEstado } from '../loja';
import { alterarPrefs, obterPrefs } from './preferencias';
import { ehPro } from './pro';

let erroEspaco = false;

export function listarCopias(): Copia[] {
  return lerCopias(lerChave(CHAVE_COPIAS));
}

function gravarCopias(copias: Copia[]): boolean {
  return gravarChave(CHAVE_COPIAS, JSON.stringify(copias));
}

/** Registra a primeira abertura como Pro (referência do lembrete de exportar). */
function registrarInicioPro(): void {
  if (ehPro() && !obterPrefs().backup.inicioPro) alterarPrefs((p) => ({ ...p, backup: { ...p.backup, inicioPro: hoje() } }));
}

/** Cria a cópia automática quando cabe (Pro, ligado, algo mudou, uma por dia). Revogado: para (CA11). */
export function processarCopias(): void {
  registrarInicioPro();
  if (!ehPro() || !obterPrefs().backup.ativo || emRecuperacao()) return;
  const nova = decidirCopia(listarCopias(), obterEstado(), agoraLocal(), gerarId());
  if (!nova) return;
  // Cota excedida: não trava e não mexe nos dados principais (CA7).
  erroEspaco = !gravarCopias(nova);
}

export function haErroEspaco(): boolean {
  return erroEspaco;
}
export function fecharErroEspaco(): void {
  erroEspaco = false;
}

/** Confere a cópia antes de pedir confirmação; danificada é marcada como inutilizável (CA6). */
export function conferirCopia(id: string): Copia | 'danificada' | null {
  const copias = listarCopias();
  const copia = copias.find((c) => c.id === id);
  if (!copia) return null;
  if (!lerConteudoCopia(copia).ok) {
    gravarCopias(marcarInutilizavel(copias, id));
    return 'danificada';
  }
  return copia;
}

export type ResultadoRestaurarCopia = { ok: true; copia: Copia } | { ok: false; motivo: 'danificada' | 'nao-encontrada' | 'sem-pro' };

/** Valida a cópia; antes de substituir, guarda o estado atual (CA5). Cópia danificada é marcada (CA6). */
export function restaurarCopia(id: string): ResultadoRestaurarCopia {
  if (!ehPro()) return { ok: false, motivo: 'sem-pro' };
  const copias = listarCopias();
  const copia = copias.find((c) => c.id === id);
  if (!copia) return { ok: false, motivo: 'nao-encontrada' };
  const lida = lerConteudoCopia(copia);
  if (!lida.ok) {
    gravarCopias(marcarInutilizavel(copias, id));
    return { ok: false, motivo: 'danificada' };
  }
  erroEspaco = !gravarCopias(copiaAntesDeRestaurar(copias, obterEstado(), agoraLocal(), gerarId()));
  definirEstado(lida.estado);
  return { ok: true, copia };
}

/** Dias sem exportar (para o lembrete do Início) ou null. Só no Pro. */
export function diasSemExportar(): number | null {
  if (!ehPro() || emRecuperacao()) return null;
  return diasParaLembrarExportar(obterPrefs().backup, hoje(), obterEstado().assinaturas.length > 0);
}

/** Exportar com sucesso zera a contagem (CA8). Vale também para a exportação dos Ajustes. */
export function registrarExportacao(): void {
  alterarPrefs((p) => ({ ...p, backup: { ...p.backup, ultimaExportacao: hoje(), adiadoAte: null } }));
}

export function lembrarDepois(): void {
  alterarPrefs((p) => ({ ...p, backup: { ...p.backup, adiadoAte: adiarLembreteExportar(hoje()) } }));
}

export function alterarBackupAutomatico(ativo: boolean): void {
  alterarPrefs((p) => ({ ...p, backup: { ...p.backup, ativo } }));
  if (ativo) processarCopias();
}
