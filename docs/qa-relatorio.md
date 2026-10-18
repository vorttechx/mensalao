# Mensalão — Relatório de QA (Sprint 2, etapa Q1)

Autor: Agente QA. Data: 18/10/2026. Código testado: após a aprovação G2 (inclui a máscara de data). O relatório da sprint 1 está em `docs/sprint1/qa-relatorio.md`.

## Resultados

| Comando | Resultado |
| --- | --- |
| `npm run build` | OK (tsc estrito + vite build de produção) |
| `npm run verificar:bundle` | OK: `dist/` não contém o provedor falso nem controles de teste; `dist-teste/` contém (US-12.CA14) |
| `npm test` (Vitest) | 178 passaram, 0 falharam (18 arquivos). Sprint 1: 82. Novos: 96, em `plano`, `pro`, `preferencias-temas`, `lembretes`, `copias`, `csv`, `grafico`, `mascara-data` e `empacotamento` |
| `npm run test:e2e` (Playwright, 360×780, relógio fixo em 30/09/2026) | 191 passaram, 2 falharam (193 no total; duas execuções seguidas com o mesmo resultado). Projeto `mobile-360` (build de teste): 187. Projeto `producao-360` (build de produção): 6. A suíte da sprint 1 segue passando inteira |

As 2 falhas são defeitos reais do app (BUG-01 e BUG-02). Ajustes feitos nos próprios testes (defeitos do teste, não do app): campos obrigatórios do formulário (ciclo, pagamento, categoria); `selo-pro` só existe nas telas com a marca (Início); semeadura do `localStorage` com uma única recarga, porque cada abertura roda a verificação da loja e o aviso de revogação é por abertura; esperas por estado após ações (pausar, cancelar, excluir) antes de navegar.

## Bugs abertos

| Severidade | Qtde | IDs |
| --- | --- | --- |
| Crítica / Alta | 0 | |
| Média | 1 | BUG-01 (diálogo de limite permanece sobre a nova tela após mudar a rota) |
| Baixa | 1 | BUG-02 (lista de cópias desatualizada ao abrir direto em Ajustes) |

A observação do orquestrador foi reproduzida e virou o BUG-01 (média: o diálogo é modal e fala de uma tela que já não está à vista, mas não perde dados e "Agora não" resolve).

## Critérios cobertos

Todo teste cita o ID do critério no título. Unitários em `tests/unit/`, E2E em `tests/e2e/`.

| História | Cobertura |
| --- | --- |
| US-09 | CA1 a CA13 (unitário + `us09-limite.spec.ts`): 4/5/12/20 ativas, exatamente 5, pausada/cancelada/teste, reativar, editar/pausar/cancelar/excluir livres, Pro com 12, importação com 12 e com 5, Pro revogado com 20, catálogo e formulário por URL, `alertdialog`, nada gravado ao bloquear. CA10 só no unitário |
| US-11 | CA1 a CA11 (`us11-pro.spec.ts`): oferta, preço do provedor (dois valores), carregando, erro de preço e "Tentar de novo", preço nulo, compra ok sem recarregar, cancelada, erro, toque duplo (1 chamada), navegador comum, já Pro, offline (evento e recarga pelo service worker), 44 px/rolagem/foco, sem linguagem de pressão |
| US-12 | CA1 a CA13 e CA16 (`us12-restaurar.spec.ts` + unitário de `pro.ts`): persistência, restaurar (ok, sem compra, erro, offline), reinstalação, reembolso com aviso único, falha mantém Pro, importar/excluir/limpar, verificação não bloqueia a primeira tela e roda uma vez, provedor indisponível, JSON inválido, campos de Pro no backup, revogação preserva preferências |
| US-12 (produção) | CA14 e CA15 (`us12-producao.prod.spec.ts`, build de produção): sem `window.__mensalaoTeste`, sem os identificadores do provedor falso nos JS servidos, `?pro=1` e variações, `mensalao:pro:v1` forjado, chaves `mensalao:teste:*`, objetos criados no console: nada ativa o Pro |
| US-13 | CA1 a CA14 (`us13-lembretes.spec.ts` + unitário de `lembretes.ts`): bloqueado no grátis, 0 a 7 dias com erro mantendo o valor, aviso com texto exato, lista ordenada, notificação uma vez por par com título "Mensalão", explicação antes da permissão (concedida, negada, "Voltar"), sem suporte, pausada/cancelada/teste, fim do teste, data vencida, 0 dias, centavos, lista vazia, revogação. CA15 coberto pelo unitário (módulo puro) |
| US-14 | CA1 a CA11 e CA13 (`us14-copias.spec.ts` + unitário de `copias.ts`): bloqueio, cópia ao abrir, sem mudança não duplica, uma por dia, máximo de 3, lista vazia, desligado, restaurar com confirmação/cancelar/cópia prévia, cópia corrompida, cota excedida (simulada), lembrete de 7 dias, "Exportar agora", "Lembrar depois", texto do aviso, revogação, JSON sem cópias. CA12 no unitário |
| US-15 | CA1 a CA12 (`us15-csv.spec.ts` + unitário de `csv.ts`): nome do arquivo, BOM, `;`, `\r\n`, cabeçalho exato, valores, equivalentes, todas as situações em ordem alfabética, escape, fórmula, acentos/emoji, lista vazia, revogado, offline sem rede e sem alterar o estado |
| US-16 | CA1 a CA11 (`us16-grafico.spec.ts` + unitário de `grafico.ts`): 50/25/25, soma 100%, "Outras categorias", categoria única, vazio sem NaN, centavos, SVG com `role="img"` e legenda, 360 px, atualização após pausar/reativar/cancelar/excluir, revogado. CA12 no unitário |
| US-17 | CA1 a CA9 (`us17-temas.spec.ts` + unitário de preferências): bloqueio, 4 opções com prévia, aplicação imediata sem recarregar, persistência inclusive offline, contraste AA medido no texto e no botão primário (claro e escuro, 4 temas), revogado, valores corrompidos, `theme-color`, sem rede |
| US-01 (máscara) | `mascara-data.spec.ts` + unitário de `mascararDataBR`: "30092026" vira "30/09/2026", barras durante a digitação, letras ignoradas, Backspace até esvaziar sem travar, colar "1/2/2026", mesma máscara no fim do teste, data impossível recusada |
| Seção 5.1 | `empacotamento.test.ts`: TWA coerente com o manifest, `playBilling`, `assetlinks.json` com o mesmo pacote, manifest com id/escopo/ícones maskable, política de privacidade, ficha (descrição curta até 80), capturas e guia |
| Design (Parte 2) | `design-sprint2.spec.ts`: sem rolagem horizontal em 360 px, alvos de 44 px, nomes acessíveis (grátis e Pro), foco e Esc no diálogo de limite, tom do texto |

## Critérios não cobertos ou só parcialmente

Não testado pelo QA, conforme a DoD (item 9 do backlog): compra real na Play, acknowledge, restauração após reinstalar e reembolso reais (checklist R-07 do Renato), notificação do sistema com o app fechado, app instalado como TWA e verificação do domínio (`assetlinks.json` com fingerprint real; hoje há marcadores a preencher), geração do `.aab`, gráfico de destaque 1024×500.

Parcial:
- US-13.CA6/CA7: usa o notificador falso; a Notification API real e o clique na notificação não foram exercitados. A "verificação em segundo plano" da D-07 não existe (só ao abrir, ao voltar ao app e ao ligar o lembrete), como o Dev registrou.
- US-14.CA7: a cota excedida foi simulada trocando `Storage.prototype.setItem` para a chave das cópias, não com o armazenamento realmente cheio.
- US-11.CA10 e US-16.CA8: foco, nomes acessíveis e texto alternativo verificados por máquina; leitor de tela real não.
- US-17.CA4: contraste medido só no texto principal sobre o fundo e no botão primário; os demais pares (selos, bordas, cores das fatias do gráfico) não foram medidos.
- US-15: o arquivo foi conferido byte a byte, mas a abertura no Excel/Planilhas não.
- US-12.CA9: "não atrasa a primeira tela" medido com a loja falsa lenta (3 s); com a Play real o tempo pode ser outro.
- Maskable: o manifest declara os mesmos PNG para `any` e `maskable`; não foi verificado se a arte respeita a zona segura.
- BUG-01 foi reproduzido no diálogo de limite; os demais diálogos modais não foram testados com mudança de rota.

## Divergências em relação a `docs/design.md` (Parte 2)

Nenhuma divergência visível nova encontrada pelos testes automatizados (360 px, alvos de 44 px, nomes acessíveis, contraste, textos exatos do aviso de limite, da tela Pro, dos lembretes e das cópias). Os desvios que o Dev declarou em `docs/dev-notes.md` (banner de revogação em qualquer tela, selo "Danificada" com ícone de alerta, rótulo do Plano no Pro, vãos do gráfico) não foram tratados como bugs. Não houve comparação visual pixel a pixel com `docs/design-preview.html`.

## Recomendação

Corrigir antes de liberar, em uma rodada curta: não há bug de severidade alta ou crítica, mas o BUG-01 (média) é um comportamento visível em um fluxo central da sprint (limite) e o conserto é pequeno (fechar os diálogos abertos quando a rota muda). O BUG-02 (baixa) pode entrar na mesma rodada ou ficar como pendência conhecida. Depois da correção, o reteste é rodar a suíte inteira; os dois testes que hoje falham passam a validar as correções. O que depende de Play, domínio e dispositivo real continua pendente do Renato (R-01 a R-10).
