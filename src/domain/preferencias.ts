// Preferências do Pro (tema, aparência, lembrete e backup automático) em `mensalao:prefs:v1`, separadas do estado
// das assinaturas e do estado Pro. Leitura tolerante: campo inválido volta ao padrão, sem travar (US-17.CA7).

export const CHAVE_PREFS = 'mensalao:prefs:v1';

export type IdTema = 'verde-cedula' | 'azul-noite' | 'grafite' | 'ameixa';
export const TEMAS: IdTema[] = ['verde-cedula', 'azul-noite', 'grafite', 'ameixa'];
export const TEMA_PADRAO: IdTema = 'verde-cedula';

/** Aparência (US-19.CA7): automático segue o celular; claro e escuro forçam o modo (só no Pro, D-07). */
export type Aparencia = 'auto' | 'claro' | 'escuro';
export const APARENCIAS: Aparencia[] = ['auto', 'claro', 'escuro'];
export const APARENCIA_PADRAO: Aparencia = 'auto';

export const LEMBRETE_DIAS_PADRAO = 1;
export const LEMBRETE_DIAS_MAX = 7;

export interface Preferencias {
  tema: IdTema;
  /** Ausente ou inválido = 'auto' (US-19.CA7). */
  aparencia: Aparencia;
  lembrete: { ativo: boolean; dias: number };
  /** Pares já avisados por notificação: "c|<id>|<data>" (cobrança) e "t|<id>|<data>" (fim do teste). */
  lembretesAvisados: string[];
  backup: {
    /** Cópias automáticas ligadas (padrão: ligado, US-14.CA2). */
    ativo: boolean;
    /** Data ISO da última exportação de arquivo de backup. */
    ultimaExportacao: string | null;
    /** "Lembrar depois": não mostra o lembrete de exportar antes desta data ISO. */
    adiadoAte: string | null;
    /** Data ISO da primeira abertura como Pro (referência quando nunca exportou). */
    inicioPro: string | null;
  };
}

export function preferenciasPadrao(): Preferencias {
  return {
    tema: TEMA_PADRAO,
    aparencia: APARENCIA_PADRAO,
    lembrete: { ativo: false, dias: LEMBRETE_DIAS_PADRAO },
    lembretesAvisados: [],
    backup: { ativo: true, ultimaExportacao: null, adiadoAte: null, inicioPro: null },
  };
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const ISO = /^\d{4}-\d{2}-\d{2}$/;
function dataOuNull(v: unknown): string | null {
  return typeof v === 'string' && ISO.test(v) ? v : null;
}

export function ehTema(v: unknown): v is IdTema {
  return typeof v === 'string' && (TEMAS as string[]).includes(v);
}

export function ehAparencia(v: unknown): v is Aparencia {
  return typeof v === 'string' && (APARENCIAS as string[]).includes(v);
}

export function lerPreferencias(bruto: string | null): Preferencias {
  const p = preferenciasPadrao();
  if (bruto === null) return p;
  let v: unknown;
  try {
    v = JSON.parse(bruto);
  } catch {
    return p;
  }
  if (!ehObjeto(v)) return p;
  if (ehTema(v.tema)) p.tema = v.tema;
  if (ehAparencia(v.aparencia)) p.aparencia = v.aparencia;
  if (ehObjeto(v.lembrete)) {
    if (typeof v.lembrete.ativo === 'boolean') p.lembrete.ativo = v.lembrete.ativo;
    const d = v.lembrete.dias;
    if (typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= LEMBRETE_DIAS_MAX) p.lembrete.dias = d;
  }
  if (Array.isArray(v.lembretesAvisados)) p.lembretesAvisados = v.lembretesAvisados.filter((x): x is string => typeof x === 'string');
  if (ehObjeto(v.backup)) {
    if (typeof v.backup.ativo === 'boolean') p.backup.ativo = v.backup.ativo;
    p.backup.ultimaExportacao = dataOuNull(v.backup.ultimaExportacao);
    p.backup.adiadoAte = dataOuNull(v.backup.adiadoAte);
    p.backup.inicioPro = dataOuNull(v.backup.inicioPro);
  }
  return p;
}

/** Tema efetivo: o escolhido só vale no Pro; sem Pro, o padrão, sem apagar a escolha (US-12.CA13, US-17.CA6). */
export function temaEfetivo(prefs: Preferencias, pro: boolean): IdTema {
  return pro ? prefs.tema : TEMA_PADRAO;
}

/** Aparência efetiva: a escolhida só vale no Pro; sem Pro, automático, sem apagar a escolha (US-19.CA8, CA9). */
export function aparenciaEfetiva(prefs: Preferencias, pro: boolean): Aparencia {
  return pro ? prefs.aparencia : APARENCIA_PADRAO;
}

/**
 * Cores das duas metas theme-color [sem media, com media escuro] (design 2.3a, US-19.CA10):
 * automático mantém o par claro/escuro do tema; claro ou escuro forçado põe a mesma cor nas duas.
 */
export function coresNavegador(par: [string, string], aparencia: Aparencia): [string, string] {
  if (aparencia === 'claro') return [par[0], par[0]];
  if (aparencia === 'escuro') return [par[1], par[1]];
  return [par[0], par[1]];
}
