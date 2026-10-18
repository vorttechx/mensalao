# Mensalão — Notas do Dev (Sprint 1, etapa D1)

Autor: Agente Dev. Entrada: `docs/backlog.md` (G1 aprovado) e `docs/design.md` (GD aprovado, com as Decisões de UX), em 17/10/2026.

## Arquitetura

- **Vite + TypeScript estrito, sem framework.** DOM nativo com um auxiliar `h()` (`src/ui/dom.ts`).
- **Domínio puro** em `src/domain/` (sem DOM nem `localStorage`). Toda função que depende do dia recebe `hoje` (ISO `aaaa-mm-dd`) por parâmetro.
- **Persistência:** só `src/armazenamento.ts` toca o `localStorage` (chave `mensalao:v1`). `src/loja.ts` guarda o estado em memória, grava a cada mudança e é o único ponto que lê o relógio (`hoje()`).
- **UI:** `src/ui/app.ts` é o roteador por hash e a moldura (topo, banner, conteúdo, botão flutuante, navegação). Cada tela em `src/ui/telas/*.ts` devolve um objeto `Tela`. A tela é remontada a cada troca de rota ou ação.
- **PWA:** `public/manifest.webmanifest`, ícones em `public/icons/`. O `sw.js` é gerado no build por um plugin em `vite.config.ts`, com a lista de todos os arquivos (cache para uso offline). `base: './'`.
- **Formato dos dados:** datas em ISO `aaaa-mm-dd` (sem fuso), valores em centavos inteiros, histórico `{ data, deCentavos, paraCentavos }` em ordem cronológica.

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento (sem service worker)
npm run build      # tsc (src + configs) e vite build em dist/
npm run preview    # serve dist/ em http://localhost:4173/
npm test           # vitest: tests/**/*.test.ts (fora de tests/e2e)
npm run test:e2e   # playwright: tests/e2e/**/*.spec.ts; sobe build + preview na porta 4173
```

- Playwright configurado em `playwright.config.ts`: viewport 360×780, `locale pt-BR`, `timezoneId America/Sao_Paulo`, `@playwright/test` 1.56.1, que usa o Chromium já instalado em `/opt/pw-browsers` (não precisa de `playwright install`).
- O "hoje" vem de `new Date()`, então nos E2E dá para fixar a data com `page.clock.setFixedTime(...)` antes do `goto`.
- Para injetar dados nos E2E: gravar o JSON do estado em `localStorage['mensalao:v1']` (formato abaixo) e recarregar a página.

```json
{ "versao": 1, "config": { "diasAviso": 3 }, "assinaturas": [ {
  "id": "x", "nome": "Netflix", "valorCentavos": 4490, "ciclo": "mensal", "proxima": "2026-10-20", "diaRef": 20,
  "pagamento": "cartao", "banco": "", "categoria": "Streaming de vídeo", "emTeste": false, "fimTeste": null,
  "status": "ativa", "canceladaEm": null, "catalogoId": "netflix", "historico": [], "criadaEm": "2026-10-01" } ] }
```
Valores aceitos: `ciclo` mensal|anual|semanal; `pagamento` cartao|pix|boleto|debito; `status` ativa|pausada|cancelada. `fimTeste` é obrigatório se `emTeste` e `null` caso contrário; `canceladaEm` é obrigatório só para `cancelada`. Estado fora desse formato é tratado como corrompido (US-08.CA4).

## Funções de domínio (para os testes unitários)

| Módulo | Funções principais |
| --- | --- |
| `domain/datas.ts` | `lerDataBR`, `formatarDataBR`, `somarMeses(iso, n, diaRef?)`, `proximoCiclo`, `avancarAteHoje(iso, ciclo, hoje, diaRef?)`, `diferencaDias` |
| `domain/dinheiro.ts` | `lerValor(texto)` → `{ok, centavos}` ou `{ok:false, erro:'invalido'|'casas'}`, `formatarBRL(centavos)`, `formatarPercentual` |
| `domain/validacao.ts` | `validarFormulario(entrada, hoje)` (erros por campo + data avançada), `lerDiasAviso(texto)` |
| `domain/operacoes.ts` | `criarAssinatura`, `editarAssinatura`, `pausar`, `marcarCancelada`, `reativar`, `excluirAssinatura`, `normalizarDatas` |
| `domain/proximas.ts` | `listarProximas(assinaturas, hoje, n)`, `testeVigente`, `testeEncerrado`, `textoVenceLogo`, `textoFimTeste` |
| `domain/reajuste.ts` | `calcularReajuste(anterior, atual)`, `ultimoReajuste`, `textoReajuste` |
| `domain/totais.ts` | `calcularTotais(assinaturas, hoje)`, `equivalenteMensal`, `equivalenteAnual` |
| `domain/catalogo.ts` | `CATALOGO`, `buscarCatalogo(termo)`, `normalizarBusca` |
| `domain/guia.ts` | `montarGuia(assinatura)`, `textoPix(banco)` |
| `domain/backup.ts` | `gerarBackup(estado, exportadoEm)`, `lerBackup(texto, hoje)`, `nomeArquivoBackup(hoje)` |
| `domain/esquema.ts` | `validarEstado`, `validarConteudo` (estrutura do estado e do backup) |

## Decisões (ambiguidades resolvidas pelo mais simples)

1. **Decisões de UX aprovadas, seguidas como estão:** 4 abas + botão flutuante; ações no detalhe; canceladas em `<details>` recolhível; datas como texto `dd/mm/aaaa`; selos "hoje / amanhã / em X dias"; selects começam em "Selecione…" e dão erro se ficarem sem escolha; "Marcar como cancelada" sem confirmação; diálogo com "Voltar".
2. **Catálogo pré-preenche só nome, valor, ciclo e categoria** (US-01.CA2). A forma de pagamento continua em "Selecione…" e é obrigatória, como em qualquer cadastro (Decisão de UX 6). Nos E2E, escolha `field-pagamento` e informe `field-proxima` antes de salvar.
3. **Categorias:** as 11 do MVP mais as duas compostas do catálogo ("Streaming / Compras" e "Streaming de vídeo / Música"), para o pré-preenchimento ficar válido.
4. **Valor:** aceita vírgula ou ponto decimal, prefixo "R$" e milhar com ponto (`1.234,56`). Mais de 2 casas dá erro específico ("Use no máximo 2 casas decimais…"); vazio, zero, negativo e letras dão "Informe um valor maior que zero, como 39,90".
5. **BRL:** `Intl.NumberFormat('pt-BR', BRL)` com o espaço não separável trocado por espaço comum, para o texto ser exatamente `R$ 39,90`.
6. **Vence logo:** destaca quando `0 ≤ dias até a cobrança ≤ N` (com N = 3, hoje 30/09: 30/09 e 03/10 sim, 04/10 não). O teste grátis é vigente quando `fimTeste ≥ hoje` ("termina hoje" ainda é teste); encerrado quando `fimTeste < hoje`.
7. **Dia de referência (`diaRef`):** guarda o dia digitado na próxima cobrança para manter o "31" ao avançar meses (31/01 → 28/02 → 31/03). Na edição, só muda se o usuário alterar a data.
8. **Avanço de datas vencidas:** feito ao abrir o app e a cada montagem de tela, para **todas** as assinaturas (inclusive pausadas/canceladas, o que não muda nada para o usuário), além de na reativação e na importação.
9. **Totais exatos:** soma em inteiros (mensal × 12, anual × 1, semanal × 52). Total anual = essa soma; mensal = soma ÷ 12, arredondado só na exibição. Formas de pagamento na ordem fixa Cartão, Pix Automático, Boleto, Débito; categorias do maior para o menor (empate: nome).
10. **Histórico de preços:** cada entrada é "valor anterior → novo valor" com a data da alteração; abaixo vem "Valor atual". O selo compara o valor atual com o `deCentavos` da última entrada.
11. **Guia Pix com banco:** "Abra o app do banco de onde sai o pagamento (no app do Itaú), procure Pix > …", com o restante do texto exatamente como no US-06.CA2. Cadastro livre pago por Pix mostra só o bloco do Pix (o genérico do US-06.CA3 vale só "sem Pix Automático").
12. **Backup:** `{ formato: "mensalao-backup", versao: 1, exportadoEm, config, assinaturas }`. A importação valida tudo (JSON, formato, versão, valores positivos, datas reais, ids únicos) antes de pedir confirmação; nada muda em caso de erro.
13. **Retorno após salvar:** volta no histórico até a tela de origem (Início/Assinaturas/detalhe), então o "Voltar" do navegador funciona igual ao da barra de topo.
14. **Navegação inferior** fica oculta no catálogo, no formulário e também no **detalhe** (telas internas com "Voltar"); o design só falava dos formulários. Ver desvios.

## Desvios do design (o mais próximo do desenhado)

- **Detalhe sem navegação inferior:** o wireframe 4.4 não mostra a navegação e a tela tem "Voltar"; ocultei para dar espaço às ações.
- **Recuperação de dados (4.8):** o título "Não conseguimos ler seus dados salvos" é o `h1` da tela, logo acima da caixa vermelha (`corrupt-warning`), que traz o texto explicativo. No wireframe o título fica dentro da caixa.
- **Máscara de data** (opcional no design) não foi feita: o campo aceita `dd/mm/aaaa` digitado (o placeholder orienta).
- **Ícone PNG** gerado a partir do SVG próprio (`public/icons/icone.svg`) renderizado no Chromium; o mesmo arquivo serve como favicon. Manifest declara entradas `any` e `maskable` separadas.

## Mapa história → arquivos

| História | Arquivos |
| --- | --- |
| US-01 | `domain/tipos.ts`, `domain/datas.ts`, `domain/dinheiro.ts`, `domain/catalogo.ts`, `domain/validacao.ts`, `domain/operacoes.ts`, `domain/esquema.ts`, `armazenamento.ts`, `loja.ts`, `ui/telas/catalogo.ts`, `ui/telas/formulario.ts`, `ui/componentes.ts`, `ui/app.ts`, `styles.css` |
| US-02 | `domain/proximas.ts`, `ui/telas/inicio.ts`, `ui/telas/ajustes.ts` (N dias) |
| US-03 | `domain/reajuste.ts`, `ui/telas/detalhe.ts` (histórico), `ui/telas/comum.ts` (selo), `ui/telas/formulario.ts` (edição) |
| US-04 | `domain/totais.ts`, `ui/telas/totais.ts` |
| US-05 | `domain/operacoes.ts`, `ui/telas/assinaturas.ts`, `ui/telas/detalhe.ts` (ações), `ui/componentes.ts` (diálogo) |
| US-06 | `domain/guia.ts`, `ui/telas/detalhe.ts` (painel "Como cancelar") |
| US-07 | `domain/backup.ts`, `ui/backup.ts`, `ui/telas/ajustes.ts` (seção Backup) |
| US-08 | `public/manifest.webmanifest`, `public/icons/*`, `vite.config.ts` (sw.js), `main.ts`, `ui/telas/recuperacao.ts`, `index.html` |

## `data-testid`

**Formulário e catálogo:** `catalog-search`, `catalog-list`, `catalog-item` (com `data-catalogo-id`), `catalog-contagem` (anúncio aria-live), `catalog-vazio`, `btn-cadastrar-livre`, `form-assinatura`, `field-nome`, `field-valor`, `field-ciclo`, `field-proxima`, `field-pagamento`, `field-banco`, `field-categoria`, `field-teste`, `field-fim-teste`, `btn-salvar`, `error-nome`, `error-valor`, `error-ciclo`, `error-proxima`, `error-pagamento`, `error-categoria`, `error-fim-teste` (as mensagens de erro ficam ocultas com `hidden` quando não há erro).

**Início:** `upcoming-list`, `upcoming-item` (com `data-id`), `badge-vence-logo`, `badge-teste-fim`, `badge-reajuste`, `aviso-teste-terminou`, `empty-state`, `btn-adicionar-vazio`, `btn-adicionar` (flutuante), `subtitulo`. Dentro de cada item: `item-nome`, `item-valor`, `item-meta`.

**Assinaturas:** `sub-list`, `sub-item`, `badge-pausada`, `badge-cancelada`, `filtro-canceladas` (`<details>`), `canceladas-list`, `empty-state-assinaturas`.

**Detalhe:** `detalhe-valor`, `detalhe-dados`, `detalhe-proxima`, `detalhe-situacao`, `detalhe-cancelada-em`, `btn-editar`, `btn-como-cancelar` (`aria-expanded`), `cancel-guide`, `guia-servico`, `guia-loja`, `guia-pix`, `btn-guia-marcar-cancelada`, `price-history` (`<ol>`), `price-history-item`, `price-history-vazio`, `btn-pausar`, `btn-reativar`, `btn-cancelar` (Marcar como cancelada), `btn-excluir`, `nao-encontrada`.

**Totais:** `cartao-total`, `total-mensal`, `total-anual`, `total-quantidade`, `total-em-teste`, `total-por-pagamento` (+ `total-por-pagamento-item`), `total-por-categoria` (+ `total-por-categoria-item`), `empty-state-totais`.

**Ajustes e backup:** `form-config`, `config-dias-aviso`, `error-config-dias`, `btn-salvar-config` (Enter no campo também salva), `aviso-config-salva`, `btn-exportar`, `btn-importar`, `input-importar` (`<input type=file>` oculto; usar `setInputFiles`), `export-ok`, `import-ok`, `import-error`.

**Diálogo, banners, navegação e recuperação:** `confirm-dialog`, `btn-confirmar`, `btn-dialogo-voltar`, `banner` (sucesso genérico), `aviso-data-avancada` (banner após salvar com data ajustada), `btn-voltar`, `titulo-tela` (h1), `nav-inicio`, `nav-assinaturas`, `nav-totais`, `nav-ajustes`, `corrupt-warning`, `btn-comecar-zero`.

## Limitações conhecidas

- Não há testes automatizados escritos pelo Dev (trabalho do QA); a verificação foi manual com scripts Playwright fora do repositório.
- O service worker só existe no build (`npm run preview`), não no `npm run dev`. Na primeira visita a página ainda não é controlada; o modo offline vale a partir do segundo carregamento (ou após o SW ativar, com `clients.claim`).
- O aviso "Teste terminou em …" fica no item enquanto "Está em teste grátis" estiver marcado (Decisão de UX 7; o Produto ainda não definiu um prazo).
- Se o app ficar aberto na virada do dia, as datas são recalculadas na próxima montagem de tela (troca de rota ou ação), não automaticamente à meia-noite.
- O banner "Backup exportado" aparece logo após o clique, sem confirmação de que o navegador salvou o arquivo.
- O histórico de preços quebra a data e os valores em duas linhas quando os valores são grandes (≥ R$ 1.000,00) em 360 px.
