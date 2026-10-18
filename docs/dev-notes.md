# Mensalão — Notas do Dev (Sprint 2, etapa D1)

Autor: Agente Dev. Entrada: `docs/backlog.md` (G1 aprovado, histórias US-09 e US-11 a US-17) e `docs/design.md` Parte 2 (GD aprovado). Notas da sprint 1: `docs/sprint1/dev-notes.md` (continuam valendo para o que não mudou).

## Arquitetura (o que é novo)

- **Domínio puro** (sem DOM nem `localStorage`) em `src/domain/`: `plano.ts`, `pro.ts`, `preferencias.ts`, `lembretes.ts`, `copias.ts`, `csv.ts`, `grafico.ts`. "Hoje/agora" sempre por parâmetro.
- **Plataforma** em `src/plataforma/`: interface `ProvedorCompra` e `Notificador` (`provedor.ts`), implementações `play.ts` (Digital Goods API + Payment Request, `https://play.google.com/billing`, SKU `mensalao_pro`, acknowledge), `indisponivel.ts`, `falso.ts`, `notificador.ts` (Notification API + service worker), `notificador-falso.ts`.
- **Escolha do ambiente em tempo de build:** o código importa `@ambiente`. O `vite.config.ts` resolve esse alias para `ambiente.producao.ts` (Play ou Indisponível, notificador real, sem controles) ou, com `VITE_MODO=teste` (`.env.teste`, `vite build --mode teste`), para `ambiente.teste.ts` (provedor e notificador falsos + `window.__mensalaoTeste`). O arquivo de produção não importa nada de teste, então o provedor falso não entra no bundle de produção. O `tsconfig.json` aponta `@ambiente` para o de produção; o `vitest.config.ts`, para o de teste.
- **Serviços** em `src/servicos/` (fazem E/S, a UI usa só eles): `pro.ts` (plano efetivo, verificação ao abrir, comprar, restaurar, aviso de revogação), `preferencias.ts`, `lembretes.ts`, `copias.ts`. `armazenamento.ts` ganhou `lerChave`/`gravarChave` (não lançam erro; gravar devolve false em cota excedida). `loja.ts` ganhou `aoMudarEstado` (gatilho das cópias) e `agoraLocal()`.
- **UI:** tela nova `#/pro` (`ui/telas/pro.ts`); `ui/limite.ts` (contador e diálogo de limite); seções novas em `ui/telas/lembretes.ts`, `copias.ts`, `planilha.ts`, `grafico.ts`, `temas.ts`; `ui/temas.ts` aplica `data-tema` no `<html>` e as metas `theme-color`. A moldura (`ui/app.ts`) escuta o plano e remonta a tela quando a loja responde (exceto no formulário, para não perder o que foi digitado).
- **Chaves do `localStorage`:** `mensalao:v1` (estado, igual à sprint 1), `mensalao:pro:v1` (`{ pro, sku, verificadoEm }`), `mensalao:prefs:v1` (tema, lembrete, avisados, backup), `mensalao:copias:v1` (cópias). O backup JSON continua na versão 1 e não inclui nem lê nada disso.

## Como rodar

```bash
npm install
npm run build            # tsc + build de PRODUÇÃO em dist/
npm run build:teste      # tsc + build de TESTE (provedor falso) em dist-teste/
npm run preview          # serve dist/ em http://localhost:4173/
npm run preview:teste    # serve dist-teste/ em http://localhost:4173/
npm run verificar:bundle # gera os dois builds e roda scripts/verificar-provedor-falso.mjs (US-12.CA14)
npm test                 # vitest (tests/**/*.test.ts)
npm run test:e2e         # playwright (sobe os dois builds, ver abaixo)
npm run capturas         # capturas da loja (precisa do preview:teste rodando na 4173)
```

**Playwright (`playwright.config.ts`)** sobe dois servidores:
- projeto `mobile-360`: build de **teste** na porta **4173** — todos os `*.spec.ts`, exceto `*.prod.spec.ts`. Os 64 E2E da sprint 1 rodam aqui sem mudança (o provedor falso padrão responde "sem compra", então o app está no plano grátis).
- projeto `producao-360`: build de **produção** na porta **4174** — só arquivos `*.prod.spec.ts` (ex.: tentar ativar o Pro por URL, console ou `localStorage`, US-12.CA15). Hoje não há nenhum; o QA cria.

**Verificação do bundle (US-12.CA14):** `scripts/verificar-provedor-falso.mjs [dist] [dist-teste]` procura `provedor-falso-mensalao`, `mensalao:teste:provedor`, `mensalao:teste:notificacao` e `__mensalaoTeste`. Falha (código 1) se algum estiver em `dist/` ou se faltar algum em `dist-teste/`. O CI (`.github/workflows/pages.yml`) agora roda `npm run verificar:bundle` no lugar de `npm run build`.

## Como o teste controla o provedor falso (build de teste)

O provedor é **sempre** o falso no build de teste (US-12.CA16). Ele lê o controle **a cada chamada**, então dá para configurar antes de abrir o app (para a verificação ao abrir) ou durante o teste.

**1. Pelo `localStorage`** (antes do `goto`/`reload`, ou com `page.addInitScript`), chave `mensalao:teste:provedor`, JSON parcial (o que faltar usa o padrão):

| Campo | Padrão | Efeito |
| --- | --- | --- |
| `disponivel` | `true` | `false` simula o navegador comum: tela Pro com `pro-indisponivel`, restaurar desabilitado, cache Pro não honrado. |
| `preco` | `"R$ 16,90"` | Texto do botão "Comprar Pro por …". `null` = loja não devolveu o produto (mostra o erro de preço). |
| `detalhes` | `"ok"` | `"erro"` faz a consulta de preço falhar (`pro-erro-preco`, `pro-btn-recarregar`). |
| `compra` | `"ok"` | Resultado de comprar: `"ok"`, `"cancelado"` ou `"erro"`. Com `"ok"`, o falso acrescenta `mensalao_pro` em `compras` (a "conta da Play" passa a ter a compra). |
| `compras` | `[]` | SKUs da conta. `["mensalao_pro"]` = já comprou (verificação ao abrir ativa o Pro; restaurar encontra). |
| `listar` | `"ok"` | `"erro"` faz a listagem falhar (erro/timeout da loja): verificação mantém o estado local; restaurar mostra erro. |
| `offline` | `false` | `true` simula sem rede (também vale quando `navigator.onLine` é false, ex.: `context.setOffline(true)`): detalhes/listar falham e comprar devolve `"erro"`. |
| `atrasoMs` | `0` | Atraso de cada resposta (para ver "Carregando preço…", "Abrindo a Google Play…", "Verificando…" e testar toque duplo). |

**2. Pelo console/Playwright** (só existe no build de teste): `window.__mensalaoTeste.provedor.configurar({...})` (grava a mesma chave), `.ler()`, `.padrao`, `.chamadas()` → `{ disponivel, detalhes, comprar, listarCompras }` (contagem acumulada em `mensalao:teste:provedor-chamadas`; apague a chave para zerar). Útil para "toques repetidos não abrem duas compras" e "verificação no máximo uma vez por abertura" (cada abertura chama `disponivel` e `listarCompras` uma vez).

**Receitas:**
- *Compra ok:* plano grátis, abrir `#/pro`, clicar `pro-btn-comprar` → `pro-ativo`.
- *Cancelada / erro:* `configurar({ compra: 'cancelado' | 'erro' })` → `pro-cancelada` / `pro-erro`.
- *Offline:* `context.setOffline(true)` (ou `offline: true`) e abrir `#/pro` → `pro-offline`, botão desabilitado.
- *Restaurar:* `compras: ['mensalao_pro']` com `mensalao:pro:v1` ausente; ou, para testar o botão sem a verificação ao abrir ativar antes, abrir com `compras: []` e configurar `compras: ['mensalao_pro']` antes de clicar `pro-btn-restaurar`.
- *Reinstalação (US-12.CA5):* limpar o `localStorage` do app mas manter `compras: ['mensalao_pro']` → ao abrir, vira Pro sozinho.
- *Reembolso (US-12.CA6):* ser Pro (`mensalao:pro:v1` = `{"pro":true,"sku":"mensalao_pro","verificadoEm":"…"}` ou comprar), depois `configurar({ compras: [] })` e recarregar → `pro-revogado-aviso`.
- *Pro mantido em falha (CA7):* Pro + `listar: 'erro'` (ou offline) e recarregar → continua Pro, sem aviso.
- *Começar já Pro num teste:* gravar `mensalao:teste:provedor` com `{"compras":["mensalao_pro"]}` antes do `reload`. Só o `mensalao:pro:v1` não basta: o falso responde "sem compra" e revoga.

**Notificações (US-13)**, chave `mensalao:teste:notificacao` (ou `window.__mensalaoTeste.notificacao.configurar`): `suporte` (padrão `true`; `false` → `lembrete-sem-suporte`), `permissao` (`'default'` | `'granted'` | `'denied'`, padrão `'default'`), `resposta` ao pedido (padrão `'granted'`). As notificações "exibidas" ficam em `mensalao:teste:notificacoes` (lista `{ titulo, corpo }`) e em `window.__mensalaoTeste.notificacao.enviadas()`.

**Datas:** como na sprint 1, `page.clock.setFixedTime(...)` antes do `goto`. As cópias usam data e hora locais do relógio do navegador.

## Funções de domínio novas (para os unitários)

| Módulo | Funções |
| --- | --- |
| `domain/plano.ts` | `LIMITE_GRATIS`, `contarAtivas`, `podeAtivarMais(estado, pro)`, `vagasRestantes`, `acimaDoLimite`, `textoContador(ativas)`, `recursosDoPlano(pro)` |
| `domain/pro.ts` | `CHAVE_PRO`, `SKU_PRO`, `lerEstadoPro(bruto)`, `proEfetivo({ disponibilidade, confirmacao, cache })`, `aplicarVerificacao(cache, resposta, agora)` |
| `domain/preferencias.ts` | `lerPreferencias(bruto)`, `preferenciasPadrao`, `temaEfetivo(prefs, pro)`, `ehTema` |
| `domain/lembretes.ts` | `lembretesDevidos(estado, hoje, dias, jaAvisados)` → `{ itens, novos }`, `registrarAvisados`, `lerDiasLembrete`, `textoAntecedencia`, `prefixoDias` |
| `domain/copias.ts` | `lerCopias`, `decidirCopia(copias, estado, agora, id)`, `adicionarCopia`, `copiaAntesDeRestaurar`, `lerConteudoCopia`, `marcarInutilizavel`, `diasParaLembrarExportar(info, hoje, temAssinaturas)`, `adiarLembreteExportar`, `formatarDataHora` |
| `domain/csv.ts` | `gerarCsv(estado, hoje)`, `nomeArquivoCsv(hoje)`, `valorCsv`, `escaparCampo`, `protegerFormula`, `CABECALHO_CSV` |
| `domain/grafico.ts` | `agregarCategorias(porCategoria)`, `dadosGrafico(assinaturas, hoje)`, `percentuaisMaiorResto(pesos)`, `formatarDecimos` |

## Decisões (ambiguidades resolvidas pelo mais simples)

1. **Plano efetivo (US-12.CA15):** provedor indisponível → grátis sempre; loja confirmou → Pro; loja respondeu sem a compra → grátis; sem resposta ainda, erro ou offline → vale o cache `mensalao:pro:v1`. Na produção num navegador comum o provedor é "Indisponível" desde o início, então o cache nunca é honrado.
2. **Verificação ao abrir:** `disponivel()` + `listarCompras()` com prazo de 10 s; uma vez por abertura; a primeira tela já aparece com o estado local.
3. **Restaurar sem compra** não revoga um Pro em cache (o botão só aparece no grátis); revogação só acontece na verificação ao abrir.
4. **Limite:** o diálogo abre em todo "Adicionar" (flutuante, estados vazios de Início, Assinaturas e Totais), no catálogo e no formulário abertos por URL (diálogo por cima; "Agora não" volta), no "Salvar" de nova assinatura e no "Reativar". O contador aparece também no estado vazio de Assinaturas e no cartão "Plano" de Ajustes (só texto).
5. **Importar com exatamente 5 ativas:** o aviso diz "Este backup tem 5 assinaturas ativas, o limite do plano grátis. Todas serão importadas…" (o texto do design fala "acima das 5", que só vale para 6 ou mais).
6. **Lembretes:** padrão desligado (ligar passa pela explicação + permissão), 1 dia. O par é registrado como avisado na primeira vez que entra na janela, mesmo sem permissão (não notifica depois retroativamente). Com teste grátis vigente, só o aviso de fim do teste (a cobrança volta a contar quando o teste acaba). A lista de avisados descarta datas passadas.
7. **Verificação em segundo plano (D-07):** não há Periodic Background Sync (o service worker não lê `localStorage`). O "melhor esforço" é: ao abrir, quando a loja confirma o Pro, ao ligar o lembrete e ao voltar ao app (`visibilitychange`). O texto de limitação está na tela.
8. **Cópias:** a regra de "uma por dia" mantém a primeira cópia do dia (a que tem o estado antes dos erros do dia). A cópia de segurança antes de restaurar ignora a regra do dia, mas não duplica se for igual à mais recente. Cópia danificada é detectada ao tocar em "Restaurar" (antes da confirmação), marcada e mantida na lista.
9. **Lembrete de exportar:** conta a partir da última exportação de arquivo (botão dos Ajustes ou "Exportar agora", em qualquer plano) ou, se nunca exportou, da primeira abertura como Pro. "Lembrar depois" esconde por 7 dias.
10. **CSV:** linhas terminam em `\r\n` inclusive a última; o apóstrofo anti-fórmula vale para nome, banco e categoria.
11. **Gráfico:** percentuais em décimos pelo maior resto sobre o equivalente anual (inteiro). "Outras categorias" só existe com 7 ou mais categorias. Com a tela de Totais vazia no Pro, o cartão do gráfico mostra "Sem dados para o gráfico" acima do estado vazio; no grátis aparece o cartão `lock-grafico`.
12. **Preço da Play:** formatado com `Intl.NumberFormat(navigator.language, { currency })` a partir do valor e moeda devolvidos; nada fixo no código.
13. **Acknowledge da compra:** chama `service.acknowledge(token, 'onetime')` se existir (API 1.0) e `PaymentResponse.complete('success')` (API 2.0). Precisa ser confirmado na compra real (R-07).
14. **Página de privacidade** é uma segunda entrada do Vite (`privacidade.html`), com a mesma folha de estilos; entra no cache offline. O service worker passou a ser gerado no `writeBundle` (com a lista final de arquivos) e, offline, serve a própria página navegada antes de cair no `index.html`.

## Desvios do design

- **Banner de revogação e de "sem espaço"** ficam no topo do conteúdo de qualquer tela (até serem fechados), não só da primeira; a resposta da loja pode chegar depois de a pessoa trocar de tela.
- **Selo "Danificada"** usa o ícone de alerta (o design pede "!"; é o mesmo ícone dos erros de campo).
- **Rótulo do Ajustes > Plano no Pro:** o título "Plano" ganha o selo Pro ao lado; "Ver detalhes" leva à tela Pro.
- **Gráfico:** os vãos de 2 px entre fatias são feitos encurtando cada arco (não com borda da cor da superfície); visualmente equivalente.

## Mapa história → arquivos

| História | Arquivos |
| --- | --- |
| US-09 | `domain/plano.ts`, `ui/limite.ts`, `ui/telas/inicio.ts`, `assinaturas.ts`, `totais.ts`, `catalogo.ts`, `formulario.ts`, `detalhe.ts`, `ui/backup.ts` (aviso na importação), `ui/componentes.ts` (`dialogoInfo`, `confirmar` com `extra`) |
| US-11 | `plataforma/*` (provedores, ambientes), `servicos/pro.ts`, `ui/telas/pro.ts`, `ui/telas/ajustes.ts` (Plano), `ui/app.ts` (rota, selo Pro), `vite.config.ts`, `.env.teste`, `playwright.config.ts` |
| US-12 | `domain/pro.ts`, `servicos/pro.ts` (verificação, restaurar, revogação), `ui/app.ts` (aviso), `scripts/verificar-provedor-falso.mjs`, `.github/workflows/pages.yml` |
| US-13 | `domain/lembretes.ts`, `domain/preferencias.ts`, `plataforma/notificador*.ts`, `servicos/lembretes.ts`, `servicos/preferencias.ts`, `ui/telas/lembretes.ts`, `vite.config.ts` (clique na notificação) |
| US-14 | `domain/copias.ts`, `servicos/copias.ts`, `ui/telas/copias.ts`, `loja.ts` (`aoMudarEstado`) |
| US-15 | `domain/csv.ts`, `ui/telas/planilha.ts` |
| US-16 | `domain/grafico.ts`, `ui/telas/grafico.ts` |
| US-17 | `ui/temas.ts`, `ui/telas/temas.ts`, `styles.css` (temas e tokens do cartão de total) |
| 5.1 (E-01 a E-08) | `twa/`, `public/.well-known/assetlinks.json`, `public/manifest.webmanifest` (`id`), `vite.config.ts` (CNAME), `privacidade.html`, `docs/loja/*`, `scripts/capturas.mjs` |

## `data-testid` novos

**Limite:** `limite-contador` (só o texto), `limite-link-pro`, `limite-aviso` (diálogo, `role="alertdialog"`), `limite-btn-pro`, `limite-btn-agora-nao`, `import-aviso-limite`.

**Pro:** `pro-tela`, `pro-recursos`, `pro-btn-comprar`, `pro-carregando`, `pro-erro-preco`, `pro-btn-recarregar`, `pro-cancelada`, `pro-erro`, `pro-offline`, `pro-indisponivel`, `pro-btn-play` (oculto até haver `URL_FICHA_PLAY`), `pro-btn-restaurar`, `pro-restaurar-msg`, `pro-ativo`, `pro-btn-voltar-app`, `pro-nota-gratis`, `pro-revogado-aviso`, `selo-pro`, `plano-cartao`, `plano-btn-pro`.

**Recursos bloqueados:** `lock-lembrete`, `lock-backup`, `lock-csv`, `lock-grafico`, `lock-temas` (cada um com botão `lock-btn-pro`).

**Lembretes:** `lembrete-ativar` (switch), `lembrete-dias`, `error-lembrete-dias`, `lembrete-btn-salvar`, `form-lembrete`, `lembrete-salvo` (banner), `lembrete-limite-texto` (Ajustes e Início), `lembrete-sem-permissao`, `lembrete-sem-suporte`, `lembrete-dialogo`, `lembrete-btn-continuar`, `lembrete-btn-voltar`, `lembrete-aviso`, `lembrete-item`.

**Backup automático:** `backup-ativar`, `backup-aviso-limite`, `copias-lista`, `copia-item`, `copia-restaurar`, `copia-inutilizavel`, `badge-danificada`, `copias-vazia`, `copia-restaurada` (banner), `copia-erro` (banner), `backup-erro-espaco`, `backup-lembrete`, `backup-btn-exportar`, `backup-btn-depois`. A confirmação de restaurar usa `confirm-dialog`/`btn-confirmar`/`btn-dialogo-voltar`.

**CSV:** `btn-exportar-csv`, `csv-ok`, `csv-vazio`.

**Gráfico:** `grafico-categorias`, `grafico-item`, `grafico-pct`, `grafico-vazio`; o SVG tem `role="img"` com `<title id="grafico-titulo">`.

**Temas:** `temas-lista` (fieldset), `tema-verde-cedula`, `tema-azul-noite`, `tema-grafite`, `tema-ameixa` (inputs radio), `tema-aplicado` (banner). Tema aplicado = atributo `data-tema` no `<html>` (ausente no verde-cédula).

**Sobre:** `link-privacidade`; na página `privacidade.html`: `privacidade`, `privacidade-voltar`.

## Testes existentes da sprint 1

Os 82 unitários e os 64 E2E passam sem alteração (os E2E agora rodam contra o build de teste na mesma porta 4173). Nenhum teste do QA quebrou.

## Empacotamento: o que ficou pendente do Renato

- **Domínio (R-02):** `twa/twa-manifest.json` usa `DOMINIO-A-DEFINIR.com.br`. O `CNAME` só é gerado com a variável `MENSALAO_DOMINIO` (no CI, variável do repositório); sem ela o Pages atual segue igual.
- **Fingerprint SHA-256 (R-03):** marcador `SHA256_DA_CHAVE_DE_ASSINATURA_A_PREENCHER` em `twa/twa-manifest.json` e `public/.well-known/assetlinks.json`.
- **Id do pacote (R-10):** `br.com.mensalao.app` usado nos dois arquivos, a confirmar.
- **Ficha publicada:** `URL_FICHA_PLAY` em `src/ui/telas/pro.ts` está vazio; com ele preenchido aparece "Abrir na Google Play".
- **E-mail de contato** da política de privacidade; revisão dos textos de `docs/loja/`.
- Gerar o `.aab` (Bubblewrap, JDK e Android SDK) e o gráfico de destaque 1024×500 não foram feitos aqui.

## Limitações conhecidas

- A integração Google Play não foi exercitada de verdade (só revisão de código); compra real, acknowledge, restauração após reinstalar e reembolso ficam para o checklist R-07.
- Lembretes com o app fechado não existem de fato (sem push nem sincronização periódica); só ao abrir/voltar ao app.
- Se o `localStorage` estiver cheio a ponto de não caber nem o estado principal, o comportamento é o da sprint 1 (a gravação principal não trata cota).
- Dentro da TWA, quem adulterar `mensalao:pro:v1` fica Pro enquanto a loja não responder (risco aceito em D-06).
- As capturas da loja estão em 1080×1920 (9:16); o backlog cita 360×780, mas 780/360 passa da proporção máxima de 2:1 aceita pela Play.
