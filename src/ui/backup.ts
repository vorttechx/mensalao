// Fluxos de exportar/importar backup na interface (usados em Ajustes e na recuperação de dados).
import { gerarBackup, lerBackup, mensagensErroBackup, nomeArquivoBackup } from '../domain/backup';
import type { Estado } from '../domain/tipos';
import { contarAtivas, LIMITE_GRATIS } from '../domain/plano';
import { definirEstado, hoje, obterEstado } from '../loja';
import { registrarExportacao } from '../servicos/copias';
import { ehPro } from '../servicos/pro';
import { confirmar } from './componentes';
import { h } from './dom';
import { avisar } from './navegacao';

/** Baixa o arquivo JSON (blob local, sem rede) e devolve o nome usado. */
export function exportarBackup(): string {
  const nome = nomeArquivoBackup(hoje());
  const conteudo = JSON.stringify(gerarBackup(obterEstado(), new Date().toISOString()), null, 2);
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const a = h('a', { href: url, download: nome, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  registrarExportacao();
  return nome;
}

function plural(n: number): string {
  return `${n} ${n === 1 ? 'assinatura' : 'assinaturas'}`;
}

/**
 * Lê o arquivo escolhido, valida e, após confirmação, substitui os dados.
 * Em qualquer erro os dados atuais ficam intactos. Chama `aoTerminar` no fim (com ou sem sucesso).
 */
export async function importarArquivo(arquivo: File, aoTerminar: (importou: boolean) => void, aoAplicar?: (e: Estado) => void): Promise<void> {
  let texto: string;
  try {
    texto = await arquivo.text();
  } catch {
    avisar({ tipo: 'erro', linhas: mensagensErroBackup('json'), testid: 'import-error' });
    aoTerminar(false);
    return;
  }
  const r = lerBackup(texto, hoje());
  if (!r.ok) {
    avisar({ tipo: 'erro', linhas: mensagensErroBackup(r.motivo), testid: 'import-error' });
    aoTerminar(false);
    return;
  }
  // Importar nunca é bloqueado pelo limite; só avisa (US-09.CA12).
  const ativas = contarAtivas(r.estado);
  const extra =
    !ehPro() && ativas >= LIMITE_GRATIS
      ? {
          testid: 'import-aviso-limite',
          texto: `${
            ativas > LIMITE_GRATIS
              ? `Este backup tem ${ativas} assinaturas ativas, acima das ${LIMITE_GRATIS} do plano grátis.`
              : `Este backup tem ${ativas} assinaturas ativas, o limite do plano grátis.`
          } Todas serão importadas. Enquanto houver ${LIMITE_GRATIS} ou mais ativas, adicionar e reativar ficam indisponíveis.`,
        }
      : undefined;
  const ok = await confirmar({
    titulo: 'Importar backup?',
    texto: `O arquivo tem ${plural(r.quantidade)}. Seus dados atuais serão substituídos e isso não pode ser desfeito.`,
    rotuloConfirmar: 'Substituir dados',
    extra,
  });
  if (!ok) {
    aoTerminar(false);
    return;
  }
  definirEstado(r.estado);
  aoAplicar?.(r.estado);
  avisar({ tipo: 'ok', linhas: [`Backup importado: ${plural(r.quantidade)}.`], testid: 'import-ok' });
  aoTerminar(true);
}

/** Campo de arquivo oculto + função para abri-lo a partir de um botão. */
export function seletorDeArquivo(aoEscolher: (f: File) => void): { input: HTMLInputElement; abrir: () => void } {
  const input = h('input', {
    type: 'file',
    accept: '.json,application/json',
    hidden: true,
    testid: 'input-importar',
    'aria-label': 'Arquivo de backup',
  });
  input.addEventListener('change', () => {
    const f = input.files?.[0];
    input.value = '';
    if (f) aoEscolher(f);
  });
  return { input, abrir: () => input.click() };
}
