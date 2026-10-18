// US-14 — Backup automático: seção de Ajustes (design 9.5), lembrete de exportar no Início e erro sem espaço.
import { formatarDataHora, type Copia } from '../../domain/copias';
import { alterarBackupAutomatico, conferirCopia, diasSemExportar, lembrarDepois, listarCopias, restaurarCopia } from '../../servicos/copias';
import { obterPrefs } from '../../servicos/preferencias';
import { ehPro } from '../../servicos/pro';
import { renderizar } from '../app';
import { exportarBackup } from '../backup';
import { botao, cartaoRecursoPro, confirmar, interruptor, selo } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisar, navegar } from '../navegacao';

function plural(n: number): string {
  return `${n} ${n === 1 ? 'assinatura' : 'assinaturas'}`;
}

async function acaoRestaurar(id: string): Promise<void> {
  const conferida = conferirCopia(id);
  if (conferida === 'danificada' || conferida === null) {
    avisar({ tipo: 'erro', linhas: ['Esta cópia está danificada e não pôde ser restaurada. Seus dados atuais não foram alterados.'], testid: 'copia-erro' });
    renderizar();
    return;
  }
  const ok = await confirmar({
    titulo: `Substituir os dados atuais por esta cópia (${plural(conferida.quantidade)})?`,
    texto: 'Antes de substituir, o app guarda uma cópia do estado atual, para você poder desfazer.',
    rotuloConfirmar: 'Substituir dados',
  });
  if (!ok) return;
  const r = restaurarCopia(id);
  if (r.ok) {
    avisar({
      tipo: 'ok',
      linhas: [`Cópia de ${formatarDataHora(r.copia.criadaEm)} restaurada. A versão anterior ficou guardada nas cópias.`],
      testid: 'copia-restaurada',
    });
  } else {
    avisar({ tipo: 'erro', linhas: ['Esta cópia está danificada e não pôde ser restaurada. Seus dados atuais não foram alterados.'], testid: 'copia-erro' });
  }
  renderizar();
}

function itemCopia(c: Copia, comRestaurar: boolean): HTMLElement {
  const quando = formatarDataHora(c.criadaEm);
  return h(
    'li',
    { class: 'copia', testid: 'copia-item' },
    h('div', { class: 'copia-info' }, h('b', {}, quando), h('span', {}, plural(c.quantidade))),
    c.inutilizavel
      ? h('div', { class: 'copia-danificada', testid: 'copia-inutilizavel' }, selo('danificada', 'Danificada', 'badge-danificada'), h('span', { class: 'nota' }, 'Não pode ser restaurada.'))
      : comRestaurar
        ? botao('Restaurar', 'secundario', () => void acaoRestaurar(c.id), { testid: 'copia-restaurar', attrs: { 'aria-label': `Restaurar cópia de ${quando}` } })
        : null,
  );
}

function listaCopias(copias: Copia[], comRestaurar: boolean): HTMLElement {
  return h('ul', { class: 'cartao-lista lista-copias', testid: 'copias-lista', 'aria-label': 'Cópias guardadas' }, copias.map((c) => itemCopia(c, comRestaurar)));
}

/** Subseção "Backup automático" dentro de "Backup e exportação". */
export function secaoBackupAutomatico(): HTMLElement {
  const copias = listarCopias();
  const titulo = h('h3', { class: 'subsecao', id: 'titulo-backup-auto' }, 'Backup automático');
  if (!ehPro()) {
    return h(
      'section',
      { 'aria-labelledby': 'titulo-backup-auto' },
      cartaoRecursoPro({
        testid: 'lock-backup',
        titulo: 'Backup automático',
        descricao: ['O app guarda sozinho até 3 cópias neste aparelho e lembra você de exportar um arquivo. Exportar e importar backup em arquivo continuam grátis, logo acima.'],
        recurso: 'backup automático',
        extra:
          copias.length > 0
            ? h('p', { class: 'cartao-pro-desc' }, `Suas ${copias.length} ${copias.length === 1 ? 'cópia continua guardada' : 'cópias continuam guardadas'} neste aparelho. Restaurar uma cópia faz parte do Pro.`)
            : null,
        aoConhecer: () => navegar('#/pro'),
      }),
      copias.length > 0 ? listaCopias(copias, false) : null,
    );
  }
  return h(
    'section',
    { 'aria-labelledby': 'titulo-backup-auto' },
    titulo,
    h(
      'div',
      { class: 'cartao cartao-switch' },
      interruptor({
        rotulo: 'Fazer cópias automáticas',
        testid: 'backup-ativar',
        marcado: obterPrefs().backup.ativo,
        aoMudar: (ligado) => {
          alterarBackupAutomatico(ligado);
          renderizar();
          document.querySelector<HTMLElement>('[data-testid="backup-ativar"]')?.focus();
        },
      }),
    ),
    h(
      'div',
      { class: 'aviso-caixa', testid: 'backup-aviso-limite' },
      icone('info', 'ic24'),
      h(
        'p',
        {},
        'As cópias automáticas ficam neste aparelho. Se você limpar os dados do navegador, desinstalar o app ou perder o celular, elas se vão. Exporte um arquivo e guarde onde quiser.',
      ),
    ),
    h('p', { class: 'rotulo-lista' }, 'Cópias guardadas'),
    copias.length > 0
      ? listaCopias(copias, true)
      : h('p', { class: 'nota', testid: 'copias-vazia' }, 'Nenhuma cópia ainda. A primeira é criada quando você tiver assinaturas e algo mudar.'),
    h('p', { class: 'nota' }, 'Até 3 cópias, no máximo uma por dia, só quando algo mudou.'),
  );
}

/** Lembrete de exportar arquivo no Início (CA8). */
export function lembreteExportar(): HTMLElement | null {
  const dias = diasSemExportar();
  if (dias === null) return null;
  return h(
    'div',
    { class: 'banner banner-ok lembrete-backup', role: 'status', testid: 'backup-lembrete' },
    icone('info', 'ic24'),
    h(
      'div',
      { class: 'texto' },
      h('p', {}, `Faz ${dias} dias que você não exporta um arquivo de backup`),
      h(
        'div',
        { class: 'acoes-banner' },
        botao('Exportar agora', 'secundario', () => {
          const nome = exportarBackup();
          avisar({ tipo: 'ok', linhas: [`Backup exportado: ${nome}`], testid: 'export-ok' });
          renderizar();
        }, { testid: 'backup-btn-exportar' }),
        botao('Lembrar depois', 'texto', () => {
          lembrarDepois();
          renderizar();
        }, { testid: 'backup-btn-depois' }),
      ),
    ),
  );
}
