// Validação estrutural do estado (usada ao ler o localStorage e ao importar backup).
import { ehIsoValida } from './datas';
import { ehCiclo, ehPagamento, ehStatus, VERSAO_ESTADO, type Assinatura, type Estado, type MudancaPreco } from './tipos';

export type MotivoInvalido = 'formato' | 'versao' | 'valores';
export type ResultadoEsquema = { ok: true; estado: Estado } | { ok: false; motivo: MotivoInvalido };

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function ehCentavos(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
}

function lerMudanca(v: unknown): MudancaPreco | null {
  if (!ehObjeto(v)) return null;
  if (!ehIsoValida(v.data) || !ehCentavos(v.deCentavos) || !ehCentavos(v.paraCentavos)) return null;
  return { data: v.data, deCentavos: v.deCentavos, paraCentavos: v.paraCentavos };
}

/** Lê uma assinatura; devolve 'formato' se faltar campo e 'valores' se houver valor/data inválidos. */
function lerAssinatura(v: unknown): Assinatura | MotivoInvalido {
  if (!ehObjeto(v)) return 'formato';
  const { id, nome, valorCentavos, ciclo, proxima, diaRef, pagamento, banco, categoria, emTeste, fimTeste, status, canceladaEm, catalogoId, historico, criadaEm } = v;
  if (typeof id !== 'string' || id === '' || typeof nome !== 'string' || nome.trim() === '') return 'formato';
  if (typeof banco !== 'string' || typeof categoria !== 'string' || typeof emTeste !== 'boolean') return 'formato';
  if (!ehCiclo(ciclo) || !ehPagamento(pagamento) || !ehStatus(status) || !Array.isArray(historico)) return 'formato';
  if (catalogoId !== null && typeof catalogoId !== 'string') return 'formato';
  if (!ehCentavos(valorCentavos)) return 'valores';
  if (!ehIsoValida(proxima) || !ehIsoValida(criadaEm)) return 'valores';
  if (typeof diaRef !== 'number' || !Number.isInteger(diaRef) || diaRef < 1 || diaRef > 31) return 'valores';
  if (emTeste ? !ehIsoValida(fimTeste) : fimTeste !== null) return 'valores';
  if (status === 'cancelada' ? !ehIsoValida(canceladaEm) : canceladaEm !== null) return 'valores';
  const hist: MudancaPreco[] = [];
  for (const h of historico) {
    const m = lerMudanca(h);
    if (!m) return 'valores';
    hist.push(m);
  }
  return {
    id, nome, valorCentavos, ciclo, proxima, diaRef, pagamento, banco, categoria, emTeste,
    fimTeste: emTeste ? (fimTeste as string) : null,
    status,
    canceladaEm: status === 'cancelada' ? (canceladaEm as string) : null,
    catalogoId: catalogoId as string | null,
    historico: hist,
    criadaEm,
  };
}

/** Valida configurações + lista de assinaturas vindas de JSON. */
export function validarConteudo(config: unknown, assinaturas: unknown): ResultadoEsquema {
  if (!ehObjeto(config) || !Array.isArray(assinaturas)) return { ok: false, motivo: 'formato' };
  const dias = config.diasAviso;
  if (typeof dias !== 'number' || !Number.isInteger(dias) || dias < 0 || dias > 30) return { ok: false, motivo: 'valores' };
  const lista: Assinatura[] = [];
  const ids = new Set<string>();
  for (const item of assinaturas) {
    const a = lerAssinatura(item);
    if (typeof a === 'string') return { ok: false, motivo: a };
    if (ids.has(a.id)) return { ok: false, motivo: 'formato' };
    ids.add(a.id);
    lista.push(a);
  }
  return { ok: true, estado: { versao: VERSAO_ESTADO, config: { diasAviso: dias }, assinaturas: lista } };
}

/** Valida o estado salvo no localStorage (formato { versao, config, assinaturas }). */
export function validarEstado(v: unknown): ResultadoEsquema {
  if (!ehObjeto(v)) return { ok: false, motivo: 'formato' };
  if (v.versao !== VERSAO_ESTADO) return { ok: false, motivo: 'versao' };
  return validarConteudo(v.config, v.assinaturas);
}
