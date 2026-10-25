// US-21 — Monograma de cada serviço (design 3.5): iniciais sobre a cor do serviço do catálogo ou,
// para nomes digitados à mão, sobre uma cor neutra estável derivada do nome. Função pura, sem DOM.
import { CATALOGO, MONOGRAMAS_CATALOGO, normalizarBusca } from './catalogo';

export interface Monograma {
  /** Até 2 caracteres legíveis (ou "•" quando o nome não tem letra nem dígito). */
  iniciais: string;
  /** Cor de fundo (hex). */
  fundo: string;
  /** Cor das iniciais (hex), com contraste de pelo menos 4,5:1 sobre o fundo. */
  texto: string;
}

/** Paleta neutra de 8 tons para nomes fora do catálogo; todos passam 4,5:1 com texto branco. */
export const PALETA_NEUTRA = ['#5B6670', '#6A5D4D', '#4F6B5A', '#5E5A7A', '#7A5560', '#4D6878', '#6E6650', '#605A55'];
const TEXTO_NEUTRO = '#FFFFFF';

/** Palavras ignoradas ao tirar as iniciais ("Plano de saúde" → "PS"). */
const PALAVRAS_IGNORADAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/** Hash djb2 (32 bits, sem sinal) do texto. */
export function hashDjb2(texto: string): number {
  let h = 5381;
  for (let i = 0; i < texto.length; i += 1) h = (Math.imul(h, 33) + texto.charCodeAt(i)) >>> 0;
  return h;
}

/** Índice da cor neutra: o mesmo nome sempre gera a mesma cor, em qualquer aparelho. */
export function indiceCorNeutra(nome: string): number {
  return hashDjb2(normalizarBusca(nome)) % PALETA_NEUTRA.length;
}

/** Separa o texto em grafemas (acento combinado não vira caractere solto). */
function grafemas(texto: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: 'grapheme' }) => { segment(t: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg('pt-BR', { granularity: 'grapheme' }).segment(texto), (s) => s.segment);
  return Array.from(texto);
}

/**
 * Iniciais de um nome (design 3.5, regra 2): palavras separadas por espaço e pontuação, só letras
 * (com acento) e dígitos; ignora "de, da, do, das, dos, e". Duas ou mais palavras: primeira letra
 * das duas primeiras, em maiúscula. Uma palavra: dois primeiros caracteres (o segundo em minúscula).
 * Sem letra nem dígito: "•".
 */
export function iniciaisDe(nome: string): string {
  const palavras = nome.normalize('NFC').match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) ?? [];
  if (palavras.length === 0) return '•';
  const uteis = palavras.filter((p) => !PALAVRAS_IGNORADAS.has(p.toLocaleLowerCase('pt-BR')));
  const lista = uteis.length > 0 ? uteis : palavras;
  if (lista.length >= 2) {
    return lista
      .slice(0, 2)
      .map((p) => grafemas(p)[0].toLocaleUpperCase('pt-BR'))
      .join('');
  }
  const g = grafemas(lista[0]);
  return g[0].toLocaleUpperCase('pt-BR') + (g[1] ? g[1].toLocaleLowerCase('pt-BR') : '');
}

/** Id do catálogo da assinatura: o informado ou o do serviço com o mesmo nome (sem caixa nem acento). */
function idDoCatalogo(nome: string, catalogoId?: string | null): string | null {
  if (catalogoId && MONOGRAMAS_CATALOGO[catalogoId]) return catalogoId;
  const n = normalizarBusca(nome);
  const s = CATALOGO.find((x) => normalizarBusca(x.nome) === n);
  return s && MONOGRAMAS_CATALOGO[s.id] ? s.id : null;
}

/** Monograma de uma assinatura ou serviço (US-21.CA1 a CA3). */
export function monograma(nome: string, catalogoId?: string | null): Monograma {
  const id = idDoCatalogo(nome, catalogoId);
  if (id) return { ...MONOGRAMAS_CATALOGO[id] };
  return { iniciais: iniciaisDe(nome), fundo: PALETA_NEUTRA[indiceCorNeutra(nome)], texto: TEXTO_NEUTRO };
}
