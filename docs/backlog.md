# Mensalão — Backlog da Sprint 2 (Pro e publicação nas lojas)

Entrada: `docs/sprint2-direcao.md`. Base: sprint 1 entregue (`docs/sprint1/backlog.md` e `docs/sprint1/relatorio-final.md`). As convenções de domínio da sprint 1 continuam valendo (centavos inteiros, equivalentes mensal/anual, avanço de datas, status `ativa`/`pausada`/`cancelada`, BRL e `dd/mm/aaaa`). As histórias da sprint 2 vão de US-09 a US-18 (10 histórias, incluindo a US-18 pedida depois pelo Renato).

## 1. Visão do produto

O **Mensalão** continua sendo o controle de assinaturas sem conectar ao banco, com tudo guardado no aparelho. Nesta sprint ele ganha um modelo **freemium**: o plano grátis cobre até **5 assinaturas ativas**, e uma **compra única vitalícia, o "Mensalão Pro"**, libera assinaturas ilimitadas, lembrete antes da cobrança, backup automático local, exportação CSV, gráficos por categoria e temas. Sem assinatura mensal, sem anúncios, sem servidor e sem cadastro. A cobrança passa pela loja (Google Play Billing no Android), e o app é empacotado para publicação na Google Play.

### Fora de escopo (sprint 2)

- App para iOS / compra pela Apple (StoreKit). Fica para uma sprint futura (decisão D-03).
- Indicação paga no guia "Como cancelar" (planos mais baratos). Fica para depois, avaliada com cuidado por risco à confiança do usuário.
- Anúncios, assinatura mensal do Pro, cupons, período de teste do Pro, preços regionais customizados pelo app.
- Servidor, contas de usuário, sincronização ou backup em nuvem, notificação push real (FCM/APNs).
- Verificação criptográfica de compra em servidor (a verificação é só no aparelho, decisão D-06).
- Compra fora da Google Play (Pix, cartão direto, código de ativação).
- Novos recursos de domínio além dos citados (metas, divisão de assinaturas, outras moedas).
- Alterar o catálogo de serviços e o guia "onde cancelar".

---

## 2. Definição técnica

Tudo da sprint 1 continua (Vite + TypeScript sem framework de UI, PWA com service worker, `localStorage`, domínio puro e testável, mobile-first a partir de 360 px, acessibilidade, `data-testid`, `base: './'`). Acréscimos:

| Item | Definição |
|---|---|
| Plano e limite | Constante `LIMITE_GRATIS = 5` no domínio. "Ativa" = `status === 'ativa'` (inclui as em teste grátis; pausadas e canceladas não contam). Funções puras, por exemplo `contarAtivas(estado)`, `podeAtivarMais(estado, pro)`, `vagasRestantes(estado, pro)`. |
| Provedor de compra | Toda a lógica de pagamento fica atrás de uma interface `ProvedorCompra` com: `disponivel(): Promise<boolean>`, `detalhes(sku): Promise<{ preco: string } \| null>`, `comprar(sku): Promise<'ok' \| 'cancelado' \| 'erro'>`, `listarCompras(): Promise<string[]>` (SKUs possuídos). Implementações: (a) **Google Play** (Digital Goods API + Payment Request, método `https://play.google.com/billing`, SKU `mensalao_pro`, produto não consumível); (b) **Indisponível** (navegador comum); (c) **Falsa** para testes, controlável pelo teste (compra com sucesso, cancelada, erro, offline, reembolso, lista de compras). A falsa só entra no build de teste (flag de build `VITE_MODO=teste`, usada por `npm run build:teste`); o build de produção **não pode** conter nem expor a falsa (ver US-18). |
| Estado Pro | Chave própria `mensalao:pro:v1` no `localStorage`: `{ pro: boolean, sku, verificadoEm }`. **Fora** do backup JSON e do `mensalao:v1`, para que importar o backup de outra pessoa nunca conceda Pro. Chave ilegível ou inválida é tratada como "não Pro", sem travar o app e sem mexer nas assinaturas. |
| Verificação sem servidor | Ao abrir o app, se o provedor está disponível, ele lista as compras. SKU presente: Pro confirmado e gravado. Provedor respondeu sem a compra: Pro é revogado (ex.: reembolso). Erro, timeout ou offline: **mantém o estado local**, sem revogar. O app não bloqueia a abertura esperando a loja (a resposta atualiza a tela depois). Limite conhecido: o estado local pode ser alterado por quem mexer no armazenamento do navegador; aceito neste produto (D-06). |
| Preferências Pro | Tema, dias de lembrete e controle de lembrete/backup ficam em `mensalao:prefs:v1` (separado do estado e do estado Pro). Backup JSON da sprint 1 permanece no formato versão 1, sem mudança: backups antigos continuam importáveis. |
| Bloqueio de recursos | Um único ponto de decisão (ex.: `recursosDoPlano(pro)`) diz o que cada plano pode. A UI consulta esse ponto; recurso Pro visto no plano grátis aparece **bloqueado com chamada para o Pro**, nunca escondido nem quebrado. |
| Ambiente | Compra só funciona dentro da TWA instalada pela Google Play. Em navegador comum a compra fica indisponível (D-02). Domínio e dados continuam funcionando em qualquer ambiente. |
| Notificação | Notification API + service worker, apenas notificação **local**. Sem push. Comportamento e limites em D-07. |
| Backup automático | Cópias locais rotativas em chave própria (`mensalao:copias:v1`) mais lembrete periódico de exportar arquivo. Detalhes em D-08. |
| CSV | Gerado no aparelho por módulo puro. Detalhes na US-15. |
| Gráficos | SVG gerado no código, sem biblioteca. Dados vêm do mesmo módulo de totais da US-04. |
| Empacotamento | Projeto TWA (Bubblewrap) em `twa/` e `assetlinks.json` no repositório. A TWA exige verificação do domínio por `/.well-known/assetlinks.json` na **raiz do domínio** (ver D-05 e seção 5). |
| Testes | Unitários (Vitest) cobrem limite, estado Pro, verificação, CSV, agregação por categoria, lembretes e cópias. E2E (Playwright) usam o provedor falso. O QA não compra de verdade; a compra real na Play é checklist manual do Renato (seção 5). |

**Convenções de domínio novas**

- Limite: a regra olha **ativas**, nunca o total de cadastradas.
- Lembrete: "cobrança" = a `proxima` de uma assinatura `ativa`, **fora de teste grátis vigente** (no fim do teste, vale a regra normal). Um lembrete por par (id da assinatura, data da cobrança), registrado para não repetir.
- Preço do Pro: texto vindo do provedor (Play) já formatado na moeda do usuário. O app não fixa valor em código (D-04).

---

## 3. Histórias de usuário

Personas (as mesmas da sprint 1):
- **Marina** — usuária comum, várias assinaturas, quer simplicidade e não quer dar acesso ao banco.
- **Carlos** — usuário organizado, quer números exatos, exportação e backup.

Sufixos de `data-testid`: `pro-*` para a tela Pro, `limite-*` para o limite, `lock-*` para recursos bloqueados.

---

### US-09 — Limite de 5 assinaturas ativas no plano grátis (P1)

**Como** Marina, **quero** entender claramente o limite do plano grátis e o que posso fazer ao atingi-lo, **para** não ser surpreendida nem perder o que já cadastrei.

**Critérios de aceite**

- **US-09.CA1** — Dado o plano grátis com 4 ativas, quando abro a tela inicial ou a lista, então vejo o contador "4 de 5 assinaturas ativas" (`data-testid="limite-contador"`) e consigo cadastrar a quinta normalmente.
- **US-09.CA2** — Dado o plano grátis com 5 ativas, quando toco em "Adicionar assinatura" (inclusive pelo botão do estado vazio da lista, pelo catálogo e pelo formulário livre), então não abre o formulário e vejo a mensagem "Você chegou ao limite de 5 assinaturas ativas do plano grátis" (`data-testid="limite-aviso"`) com botão "Conhecer o Pro" (`data-testid="limite-btn-pro"`) que leva à tela Pro (US-11) e botão "Agora não".
- **US-09.CA3** — Dado o plano grátis com 5 ativas, quando pauso ou cancelo uma, então sobra 1 vaga e consigo cadastrar uma nova. Pausadas e canceladas **não** contam no limite.
- **US-09.CA4** — Dado o plano grátis com 5 ativas e uma assinatura pausada, quando toco em "Reativar" nela, então a reativação é bloqueada com a mesma mensagem da CA2 e a assinatura continua pausada. Com 4 ativas, a reativação funciona e o contador vira "5 de 5".
- **US-09.CA5** — Dado o plano grátis, então o limite vale para qualquer origem de nova ativa: cadastro novo, reativação e importação (esta com regra própria na US-10). Editar, pausar, cancelar e excluir **nunca** são bloqueados pelo limite.
- **US-09.CA6** — Dado o plano grátis com 5 ativas, quando a tentativa de adicionar é bloqueada, então nada é gravado e os dados continuam idênticos.
- **US-09.CA7** — Dado o plano Pro, então não há contador de limite, não há bloqueio e consigo cadastrar mais de 5 (por exemplo, 12) ativas.
- **US-09.CA8** — Dado o plano grátis com assinatura em teste grátis, então ela conta como ativa no limite (mesmo não entrando nos totais).
- **US-09.CA9** — Dado o plano grátis com 0 ativas (lista vazia), então o contador mostra "0 de 5" e o estado vazio da US-02.CA9 continua igual.
- **US-09.CA10** — Dado o plano grátis, então o limite se aplica por assinatura ativa e não por valor: uma assinatura de R$ 0,01 conta como uma vaga.
- **US-09.CA11** — Os textos de limite são informativos e sem culpa (sem "bloqueado", sem urgência artificial), e a mensagem do limite é anunciada a leitores de tela (`role="alert"` ou equivalente).

---

### US-10 — Dados acima do limite e importação de backup (P1)

**Como** Carlos, que já usava o app na sprint 1 com 8 assinaturas ativas, **quero** que nada seja perdido, escondido ou travado quando o limite passar a existir, **para** continuar confiando no app.

**Critérios de aceite**

- **US-10.CA1** — Dado um usuário grátis que atualizou o app e tem 8 ativas, quando abre o app, então vê as 8 assinaturas, próximas cobranças, totais e histórico exatamente como antes, sem nenhuma pausada, removida ou ocultada automaticamente.
- **US-10.CA2** — Dado o usuário da CA1, então ele vê o contador "8 de 5 assinaturas ativas — acima do limite do plano grátis" (`data-testid="limite-contador"`), numa linha informativa que não bloqueia a leitura.
- **US-10.CA3** — Dado o usuário da CA1, então ele continua podendo editar, pausar, cancelar e excluir qualquer assinatura, exportar backup e ver todos os totais. Só **adicionar** e **reativar** ficam bloqueados enquanto as ativas forem 5 ou mais.
- **US-10.CA4** — Dado o usuário da CA1, quando pausa/cancela/exclui assinaturas até ficar com 4 ativas, então volta a poder adicionar uma nova (chegando a 5). Com 5 ativas exatas, adicionar continua bloqueado.
- **US-10.CA5** — Dado o usuário grátis, quando importa um backup com 12 ativas, então vê a confirmação da US-07.CA2 com o aviso adicional "Este backup tem 12 assinaturas ativas; o plano grátis permite adicionar novas só com menos de 5 ativas. Seus dados serão importados por inteiro, nada será removido." Ao confirmar, **todas** as 12 são importadas. Nenhuma é pausada, cortada ou ignorada.
- **US-10.CA6** — Dado um backup da sprint 1 (formato versão 1, sem campos novos), quando importo no plano grátis ou Pro, então a importação funciona como antes (US-07), inclusive a regra de avançar datas no passado.
- **US-10.CA7** — Dado um backup que contenha qualquer campo de plano Pro (`pro`, `compra`, `token` ou semelhante), quando importo, então esses campos são **ignorados** e o plano do aparelho não muda. Importar nunca concede nem remove o Pro.
- **US-10.CA8** — Dado um usuário Pro com 20 ativas cujo Pro foi revogado (ex.: reembolso) na verificação, então ele cai no plano grátis na situação da CA1: nenhuma assinatura é alterada, o contador mostra "20 de 5 — acima do limite" e vale a CA3.
- **US-10.CA9** — Dado o plano grátis acima do limite, então os totais e a lista de próximas cobranças continuam contando **todas** as ativas (o limite não afeta cálculo, só cadastro).
- **US-10.CA10** — Dado um recurso Pro já usado (ex.: tema escuro-azulado), quando o Pro é revogado, então o app volta ao tema padrão **sem apagar** a preferência; se o Pro voltar, a preferência é restaurada. As cópias automáticas e os lembretes param, e nenhum dado das assinaturas é perdido.
- **US-10.CA11** — Dado que o estado do plano (`mensalao:pro:v1`) é corrompido, quando abro o app, então ele se comporta como grátis, não trava e não altera as assinaturas (se houver mais de 5 ativas, vale a CA1).

---

### US-11 — Tela "Mensalão Pro": oferta e compra única (P1)

**Como** Marina, **quero** ver o que o Pro oferece e comprá-lo uma única vez, **para** ter assinaturas ilimitadas e os recursos extras sem mensalidade.

**Critérios de aceite**

- **US-11.CA1** — Dado o plano grátis, quando acesso a tela Pro (pelo menu/Ajustes, pelo limite da US-09 ou por um recurso bloqueado), então vejo (`data-testid="pro-tela"`): título "Mensalão Pro", a promessa "Pague uma vez, use para sempre. Sem mensalidade e sem anúncios", a lista dos seis recursos (assinaturas ilimitadas, lembrete antes da cobrança, backup automático, exportar planilha CSV, gráficos por categoria, temas) e o botão de compra.
- **US-11.CA2** — Dado que a compra está disponível (TWA + provedor responde), então o botão "Comprar Pro por <preço>" (`data-testid="pro-btn-comprar"`) mostra o **preço devolvido pelo provedor** (no provedor falso, por exemplo "R$ 16,90"). O app não escreve o preço em código.
- **US-11.CA3** — Dado que o preço ainda está carregando ou o provedor não devolveu detalhes, então o botão mostra "Comprar Pro" desabilitado com "Carregando preço…" e, se falhar, uma mensagem "Não foi possível consultar o preço agora. Tente de novo." com botão "Tentar de novo" (`data-testid="pro-btn-recarregar"`). A tela nunca fica em branco.
- **US-11.CA4** — Dado que toco em comprar e o provedor devolve `ok`, então o Pro é ativado e gravado, a tela passa a mostrar "Você é Pro" (`data-testid="pro-ativo"`), o contador de limite some e os recursos bloqueados são liberados **sem recarregar** o app.
- **US-11.CA5** — Dado que cancelo a compra na janela da loja (`cancelado`), então nada muda, o plano segue grátis e vejo apenas o aviso discreto "Compra cancelada. Você não foi cobrado." (sem erro).
- **US-11.CA6** — Dado que a compra falha (`erro`, sem internet, loja indisponível), então o plano segue grátis, vejo "Não foi possível concluir a compra. Tente novamente." (`data-testid="pro-erro"`), os dados ficam intactos e o botão permite nova tentativa. Toques repetidos no botão durante a compra não abrem duas compras (botão desabilitado enquanto processa).
- **US-11.CA7** — Dado um navegador comum (provedor "Indisponível"), então a tela Pro mostra a oferta e a lista de recursos, **sem** botão de comprar, com a mensagem "A compra do Pro está disponível no app do Mensalão na Google Play" (`data-testid="pro-indisponivel"`), um botão "Abrir na Google Play" (apontando para a ficha do app quando existir; enquanto o app não estiver publicado, o botão fica oculto e a mensagem continua) e a observação "Seus dados continuam funcionando normalmente aqui." Não existe forma de ativar o Pro fora da loja.
- **US-11.CA8** — Dado que já sou Pro, então a tela Pro mostra "Você é Pro", agradecimento breve e nenhuma oferta de compra; o botão de comprar não existe.
- **US-11.CA9** — Dado que estou offline no app instalado, então a tela Pro abre a partir do cache e mostra o aviso de que é preciso conexão para comprar, sem o botão ativo, sem travar.
- **US-11.CA10** — A tela Pro tem acesso por teclado e leitor de tela (rótulos, foco visível, contraste AA), cabe em 360 px sem rolagem horizontal e o botão tem pelo menos 44×44 px.
- **US-11.CA11** — A tela Pro não usa linguagem de pressão (sem contagem regressiva, sem "oferta limitada") e deixa claro que o app grátis continua funcionando.

---

### US-12 — Restaurar compra e estado Pro persistido (P1)

**Como** Marina, **quero** que o Pro continue ativo ao reabrir o app e poder restaurá-lo se eu trocar de celular ou reinstalar, **para** não pagar duas vezes.

**Critérios de aceite**

- **US-12.CA1** — Dado que sou Pro, quando fecho e reabro o app (inclusive offline), então continuo Pro, pois o estado está em `mensalao:pro:v1`.
- **US-12.CA2** — Dado o plano grátis, quando abro a tela Pro e toco em "Restaurar compra" (`data-testid="pro-btn-restaurar"`), então o app lista as compras no provedor; se o SKU `mensalao_pro` estiver presente, o Pro é ativado com a mensagem "Compra restaurada. Obrigado!".
- **US-12.CA3** — Dado "Restaurar compra" sem nenhuma compra no provedor, então vejo "Não encontramos compra do Pro nesta conta da Google Play" e o plano segue grátis.
- **US-12.CA4** — Dado "Restaurar compra" com erro ou offline, então vejo "Não foi possível verificar agora. Tente de novo mais tarde.", o plano não muda e nada trava.
- **US-12.CA5** — Dado que reinstalei o app (armazenamento limpo) e a Play tem a compra, quando abro o app, então a verificação automática ao abrir (listar compras) ativa o Pro sem eu tocar em nada, e o botão "Restaurar compra" continua disponível como alternativa.
- **US-12.CA6** — Dado que sou Pro e o app abre com o provedor respondendo **sem** a compra (reembolso/estorno), então o Pro é revogado, o app vai ao plano grátis e aplica a US-10.CA8, com um aviso único "Seu Mensalão Pro não foi encontrado na Google Play. Você voltou ao plano grátis; seus dados continuam todos aqui." (`data-testid="pro-revogado-aviso"`).
- **US-12.CA7** — Dado que sou Pro e o app abre offline ou o provedor dá erro/timeout, então continuo Pro (não revoga por falha) e nada é exibido ao usuário.
- **US-12.CA8** — Dado que sou Pro e importo um backup, ou excluo/restauro dados, ou limpo todas as assinaturas, então o estado Pro não muda.
- **US-12.CA9** — Dado a abertura do app, então a verificação não atrasa a primeira tela (a tela aparece com o estado local; a resposta da loja atualiza depois) e roda no máximo uma vez por abertura.
- **US-12.CA10** — Dado um navegador comum (provedor "Indisponível"), então não há verificação nem botão de restaurar ativo; o plano é sempre grátis, mesmo que exista estado Pro local (ele não é honrado, ver US-18.CA11); o botão "Restaurar compra" aparece desabilitado com a explicação da US-11.CA7.
- **US-12.CA11** — Dado que o JSON de `mensalao:pro:v1` tem tipos errados (ex.: `pro: "sim"`), então vale a US-10.CA11 (trata como grátis).

---

### US-13 — Lembrete antes da cobrança (Pro) (P2)

**Como** Marina (Pro), **quero** ser lembrada antes de uma cobrança, **para** cancelar a tempo se não quiser pagar.

**Contexto:** sem servidor de push, um PWA não consegue agendar notificação com o app fechado de forma confiável. O comportamento definido é realista e testável (decisão D-07): (1) **aviso dentro do app ao abrir**, que sempre funciona; (2) **notificação local** quando o usuário concedeu permissão, disparada ao abrir o app e, onde o aparelho suportar, em verificações periódicas em segundo plano (melhor esforço, sem garantia de horário).

**Critérios de aceite**

- **US-13.CA1** — Dado o plano grátis, quando abro Ajustes, então vejo "Lembretes antes da cobrança" bloqueado (`data-testid="lock-lembrete"`) com chamada para o Pro. Nenhum lembrete é gerado no plano grátis.
- **US-13.CA2** — Dado o plano Pro, quando abro Ajustes, então posso ligar/desligar o lembrete (`data-testid="lembrete-ativar"`) e escolher "quantos dias antes" (`data-testid="lembrete-dias"`), inteiro de 0 a 7 (0 = no dia). Padrão: 1 dia. Valor fora da faixa ou não numérico mostra erro e mantém o anterior.
- **US-13.CA3** — Dado o lembrete ligado com 1 dia de antecedência e uma assinatura ativa com cobrança amanhã, quando abro o app, então vejo no topo da tela inicial o aviso "Amanhã: Netflix — R$ 44,90" (`data-testid="lembrete-aviso"`). Vários vencimentos viram uma lista, ordenada por data e nome.
- **US-13.CA4** — Dado a CA3, então cada par (assinatura, data da cobrança) gera aviso e notificação **uma só vez**; reabrir o app no mesmo dia não repete a notificação, mas o aviso dentro do app continua visível enquanto a cobrança estiver na janela.
- **US-13.CA5** — Dado que ligo o lembrete pela primeira vez, então o app explica o motivo e **só então** pede a permissão de notificações do sistema. Se eu negar, o lembrete funciona só como aviso dentro do app, com o texto "Notificações do sistema desativadas. Você verá os avisos ao abrir o app." (`data-testid="lembrete-sem-permissao"`).
- **US-13.CA6** — Dado a permissão concedida, quando abro o app com cobrança na janela, então o app dispara a notificação local com título "Mensalão" e corpo como "Amanhã: Netflix — R$ 44,90".
- **US-13.CA7** — Dado que o navegador/aparelho não suporta notificações, então a opção mostra "Seu aparelho não permite notificações; usaremos o aviso dentro do app" e o aviso interno funciona.
- **US-13.CA8** — Dado assinaturas pausadas, canceladas ou em teste grátis vigente, então não geram lembrete de cobrança. Dado teste grátis que **termina** dentro da janela, então o lembrete avisa "Teste grátis de X termina amanhã" (uma vez por assinatura e data de fim).
- **US-13.CA9** — Dado cobrança com data no passado, então o avanço de datas da US-02.CA4 acontece **antes** de montar os lembretes (nunca lembra data vencida).
- **US-13.CA10** — Dado 0 dias de antecedência, então o lembrete é do dia: "Hoje: Spotify — R$ 21,90".
- **US-13.CA11** — Dado centavos (ex.: R$ 9,99), então o valor no lembrete é exato.
- **US-13.CA12** — Dado a lista vazia ou nenhuma cobrança na janela, então nenhum aviso aparece e não há erro.
- **US-13.CA13** — Dado que o Pro é revogado, então os lembretes param e as configurações são mantidas para o caso de o Pro voltar.
- **US-13.CA14** — As telas de configuração e o aviso deixam clara a limitação: "Com o app fechado, o aviso depende do seu aparelho e pode atrasar. Abra o app para ver tudo." (`data-testid="lembrete-limite-texto"`).
- **US-13.CA15** — Para teste, o horário/"hoje" e a decisão de notificar vêm de módulo puro (`lembretesDevidos(estado, hoje, dias, jaAvisados)`), e a UI chama a notificação através de uma interface substituível (falsa nos testes).

---

### US-14 — Backup automático local (Pro) (P2)

**Como** Carlos (Pro), **quero** que o app guarde cópias de segurança sozinho e me lembre de exportar um arquivo, **para** recuperar meus dados após um erro meu.

**Contexto:** sem nuvem, "backup automático" significa (decisão D-08): (1) **cópias locais automáticas** rotativas dentro do aparelho, para desfazer erros (importação errada, exclusão sem querer); (2) **lembrete periódico para exportar um arquivo**, que é a única proteção contra perder o aparelho ou limpar os dados do navegador. O app deixa claro essa diferença.

**Critérios de aceite**

- **US-14.CA1** — Dado o plano grátis, então "Backup automático" aparece bloqueado (`data-testid="lock-backup"`) com chamada para o Pro; a exportação manual de arquivo JSON da US-07 continua grátis e sem limite.
- **US-14.CA2** — Dado o plano Pro com o backup automático ligado (padrão: ligado), quando o estado das assinaturas mudou desde a última cópia e abro o app (ou depois de qualquer alteração), então o app cria uma cópia local, no máximo **uma por dia** e mantendo as **3 mais recentes** (a mais antiga é descartada).
- **US-14.CA3** — Dado que nada mudou desde a última cópia, então nenhuma cópia nova é criada.
- **US-14.CA4** — Dado a lista de cópias (`data-testid="copias-lista"`), então cada item mostra data/hora (`dd/mm/aaaa hh:mm`) e quantidade de assinaturas, e posso tocar em "Restaurar" (`data-testid="copia-restaurar"`).
- **US-14.CA5** — Dado que toco em "Restaurar" uma cópia, então vejo a confirmação "Substituir os dados atuais por esta cópia (N assinaturas)?"; ao confirmar, **antes** de substituir o app guarda uma cópia do estado atual (para poder desfazer), e as telas atualizam. Cancelar não altera nada.
- **US-14.CA6** — Dado uma cópia corrompida, então ao restaurar vejo erro claro, os dados atuais permanecem intactos e a cópia inválida é marcada como inutilizável (não é descartada em silêncio).
- **US-14.CA7** — Dado que o `localStorage` está cheio (cota excedida) ao gravar a cópia, então o app não trava, não perde os dados principais e avisa "Não foi possível criar a cópia automática (sem espaço)".
- **US-14.CA8** — Dado o plano Pro, então o app mostra o lembrete "Faz X dias que você não exporta um arquivo de backup" (`data-testid="backup-lembrete"`) quando passam **7 dias** desde a última exportação (ou desde a primeira abertura como Pro, se nunca exportou), com botão "Exportar agora" (que usa a exportação da US-07) e "Lembrar depois" (adia 7 dias). Exportar com sucesso zera a contagem.
- **US-14.CA9** — Dado a lista de assinaturas vazia, então não há lembrete de exportar nem cópia criada.
- **US-14.CA10** — Dado o texto da tela de backup, então ele informa: "As cópias automáticas ficam neste aparelho. Se você limpar os dados do navegador, desinstalar o app ou perder o celular, elas se vão. Exporte um arquivo e guarde onde quiser." (`data-testid="backup-aviso-limite"`).
- **US-14.CA11** — Dado o Pro revogado, então novas cópias deixam de ser criadas e as cópias existentes ficam preservadas (não são apagadas), o restauro fica bloqueado com chamada para o Pro, e tudo volta a funcionar se o Pro voltar. O usuário continua podendo exportar arquivo manualmente.
- **US-14.CA12** — Dado o módulo de cópias, então as regras (um por dia, manter 3, detectar mudança) estão em função pura testável com "hoje/agora" por parâmetro.
- **US-14.CA13** — As cópias automáticas **não** são incluídas no arquivo de backup JSON exportado.

---

### US-15 — Exportar para planilha CSV (Pro) (P2)

**Como** Carlos (Pro), **quero** exportar minhas assinaturas para um arquivo CSV, **para** abrir no Excel ou Google Planilhas e analisar do meu jeito.

**Critérios de aceite**

- **US-15.CA1** — Dado o plano grátis, então "Exportar CSV" aparece bloqueado (`data-testid="lock-csv"`) com chamada para o Pro.
- **US-15.CA2** — Dado o plano Pro com dados, quando toco em "Exportar CSV" (`data-testid="btn-exportar-csv"`), então é baixado `mensalao-assinaturas-aaaa-mm-dd.csv`.
- **US-15.CA3** — Dado o CSV, então o arquivo é UTF-8 **com BOM**, separador **ponto e vírgula** (abre direto no Excel em português), quebra de linha `\r\n`, e a primeira linha é o cabeçalho: `Nome;Valor;Ciclo;Equivalente mensal;Equivalente anual;Próxima cobrança;Forma de pagamento;Banco/cartão;Categoria;Status;Em teste grátis;Fim do teste;Cancelada em;Criada em`.
- **US-15.CA4** — Dado o valor R$ 39,90, então a coluna Valor traz `39,90` (vírgula decimal, sem símbolo, sem separador de milhar); R$ 1.234,56 sai `1234,56`. Datas saem em `dd/mm/aaaa`. Ciclo e status saem com rótulos legíveis (Mensal, Ativa...). "Em teste grátis" sai `Sim`/`Não`.
- **US-15.CA5** — Dado uma assinatura anual de R$ 166,80, então "Equivalente mensal" sai `13,90` e "Equivalente anual" `166,80`; semanal de R$ 10,00 sai `43,33` e `520,00` (mesma regra e arredondamento da US-04, centavos exatos, sem erro de ponto flutuante: 3 × R$ 0,10 → soma `0,30`).
- **US-15.CA6** — Dado que o CSV inclui **todas** as assinaturas (ativas, pausadas e canceladas, em ordem alfabética por nome), então o usuário distingue pela coluna Status. Pausadas/canceladas mostram o equivalente mensal do valor mesmo assim (informativo); a planilha não faz soma por si só.
- **US-15.CA7** — Dado um nome ou banco com ponto e vírgula, aspas, vírgula ou quebra de linha (ex.: `Plano "Família"; 2 telas`), então o campo sai entre aspas com aspas internas duplicadas, preservando a coluna.
- **US-15.CA8** — Dado um nome começando com `=`, `+`, `-` ou `@` (ex.: `=1+1`), então o campo recebe um apóstrofo à frente (`'=1+1`) para evitar execução de fórmula na planilha. O valor numérico e as datas não sofrem esse tratamento.
- **US-15.CA9** — Dado acentos e emoji no nome (ex.: "Cinéfilo 🎬"), então chegam íntegros ao arquivo.
- **US-15.CA10** — Dado a lista vazia, então o botão exporta só o cabeçalho e o app avisa "Você ainda não tem assinaturas; o arquivo contém só o cabeçalho", sem erro.
- **US-15.CA11** — Dado que o Pro foi revogado, então o botão volta a ficar bloqueado; nenhum dado é perdido.
- **US-15.CA12** — A exportação funciona offline, não envia dado a servidor e não altera o estado. O CSV é gerado por módulo puro (`gerarCsv(estado, hoje)`) testável sem DOM.

---

### US-16 — Gráficos por categoria (Pro) (P2)

**Como** Carlos (Pro), **quero** ver um gráfico do gasto mensal por categoria, **para** perceber de relance onde meu dinheiro de assinaturas mais pesa.

**Critérios de aceite**

- **US-16.CA1** — Dado o plano grátis, quando abro o painel (US-04), então os totais por categoria em lista continuam grátis e o gráfico aparece como cartão bloqueado (`data-testid="lock-grafico"`) com chamada para o Pro.
- **US-16.CA2** — Dado o plano Pro, quando abro o painel, então vejo o gráfico "Gasto mensal por categoria" (`data-testid="grafico-categorias"`), em rosca ou barras (escolha do UX), com a mesma base de dados do `total-por-categoria`: só assinaturas ativas, fora de teste grátis vigente, equivalente mensal.
- **US-16.CA3** — Dado Streaming de vídeo R$ 100,00, Música R$ 50,00 e Compras R$ 50,00, então as fatias/barras são 50%, 25% e 25%, a soma dos percentuais exibidos é exatamente 100% (ajuste do maior resto no arredondamento a 1 casa decimal) e a legenda mostra categoria, valor em BRL e percentual no formato brasileiro (ex.: `50,0%`).
- **US-16.CA4** — Dado muitas categorias, então as categorias ordenam do maior para o menor e as menores além das 6 maiores são agrupadas em "Outras categorias" no gráfico (a lista completa continua no `total-por-categoria`).
- **US-16.CA5** — Dado uma só categoria, então o gráfico mostra 100% em uma única fatia/barra sem erro de desenho.
- **US-16.CA6** — Dado a lista vazia ou sem assinaturas ativas fora de teste, então o gráfico é substituído por "Sem dados para o gráfico" e nada quebra (sem divisão por zero, sem `NaN`).
- **US-16.CA7** — Dado centavos (ex.: 3 × R$ 0,10), então o total exibido é R$ 0,30 e as proporções usam centavos inteiros ou frações exatas, com arredondamento só na exibição.
- **US-16.CA8** — Dado o gráfico, então ele é acessível: cada fatia/barra tem texto equivalente (legenda ou tabela visível ou `aria-label`), as cores não são o único modo de distinguir (rótulo/legenda sempre presente) e atinge contraste AA.
- **US-16.CA9** — Dado um aparelho em 360 px, então o gráfico cabe sem rolagem horizontal.
- **US-16.CA10** — O gráfico atualiza imediatamente após criar, editar, pausar, cancelar, reativar, excluir ou importar (mesma regra da US-04.CA9).
- **US-16.CA11** — Dado o Pro revogado, então o gráfico volta a ficar bloqueado.
- **US-16.CA12** — A agregação (categorias, percentuais, agrupamento em "Outras categorias") fica em módulo puro testável, reaproveitando o cálculo de `totais`.

---

### US-17 — Temas de cor (Pro) (P2)

**Como** Marina (Pro), **quero** escolher um tema de cores para o app, **para** deixá-lo com a minha cara.

**Critérios de aceite**

- **US-17.CA1** — Dado o plano grátis, então o app mantém a identidade verde-cédula da sprint 1, com tema claro/escuro automático conforme o sistema, **sem perda**: nada que já é grátis passa a exigir o Pro. Em Ajustes, a seção "Temas" mostra os temas extras bloqueados (`data-testid="lock-temas"`) com chamada para o Pro.
- **US-17.CA2** — Dado o plano Pro, quando abro Ajustes > Temas (`data-testid="temas-lista"`), então posso escolher entre "Verde-cédula (padrão)" e **3 temas extras** (nomes e paletas definidos pelo UX, por exemplo azul-noite, grafite e âmbar), cada um com prévia de cores (`data-testid="tema-<id>"`).
- **US-17.CA3** — Dado que escolho um tema, então ele é aplicado na hora a todas as telas, sem recarregar, por variáveis CSS, e fica salvo em `mensalao:prefs:v1`, valendo após fechar e reabrir (inclusive offline).
- **US-17.CA4** — Dado cada tema extra, então ele atende contraste AA em texto e controles (par de cores verificado pelo UX no design), mantém foco visível e continua legível em 360 px.
- **US-17.CA5** — Dado o sistema em modo escuro, então cada tema extra define sua versão para claro e escuro (ou fica explícito no design que ele é único); "Verde-cédula" mantém o automático.
- **US-17.CA6** — Dado o Pro revogado, então o app usa o tema padrão sem apagar a preferência (US-10.CA10); se o Pro voltar, o tema escolhido é reaplicado.
- **US-17.CA7** — Dado um valor de tema desconhecido ou corrompido nas preferências, então o app usa o padrão sem travar.
- **US-17.CA8** — A cor do navegador (`theme-color`) acompanha o tema escolhido.
- **US-17.CA9** — A troca de tema não depende de rede e não envia dado nenhum.

---

### US-18 — Versão de teste com Pro liberado sem pagamento (P1)

**Como** Renato (dono do produto), **quero** uma versão de teste instalável no meu celular em que eu possa liberar e retirar o Pro sem pagar, separada da produção, **para** experimentar todos os recursos Pro sem risco de confundir com o app real.

**Critérios de aceite**

- **US-18.CA1** — Dado o comando `npm run build:teste`, então é gerado um build de teste (flag de build `VITE_MODO=teste`) com `base` relativa, publicável em `/mensalao/teste/` no mesmo domínio da produção, instalável como PWA com nome "Mensalão (teste)", ícone distinguível (ex.: com marca "T") e service worker com escopo próprio, sem interferir no da produção.
- **US-18.CA2** — Dado o Android, então existe configuração TWA de teste (`twa/teste/`) com pacote `br.com.mensalao.app.teste`, que pode ficar instalado ao lado do app de produção (`br.com.mensalao.app`). O `assetlinks.json` lista os dois pacotes.
- **US-18.CA3** — Dado o build de teste, então todas as telas exibem uma faixa/selo "Versão de teste" (`data-testid="faixa-teste"`), visível, com contraste AA e sem cobrir conteúdo nem botões em 360 px.
- **US-18.CA4** — Dado o build de teste no plano grátis, quando abro a tela Pro, então vejo o controle "Liberar Pro (teste)" (`data-testid="pro-teste-liberar"`). Ao tocar, o Pro é ativado sem passar pela loja, os recursos Pro são liberados sem recarregar e a tela mostra "Você é Pro (modo teste)".
- **US-18.CA5** — Dado o build de teste com Pro liberado, quando toco em "Voltar ao grátis" (`data-testid="pro-teste-voltar"`), então o plano volta a grátis imediatamente, as preferências e dados são mantidos e vale a US-10.CA8 (nada é removido, mesmo acima do limite).
- **US-18.CA6** — Dado o build de teste, então o estado liberado persiste ao fechar e reabrir (inclusive offline). A verificação ao abrir (US-12) usa o provedor falso e **não** revoga o Pro liberado manualmente.
- **US-18.CA7** — Dado o build de teste, então o fluxo normal de compra (US-11) também pode ser exercitado com o provedor falso (ok, cancelado, erro, offline, reembolso), para uso do QA.
- **US-18.CA8** — Dado o build de teste, então seus dados são separados dos da produção: todas as chaves usam o prefixo `mensalao-teste:` (ex.: `mensalao-teste:v1`, `mensalao-teste:pro:v1`, `mensalao-teste:prefs:v1`), pois `localStorage` é compartilhado entre subcaminhos da mesma origem. Alterar dados na versão de teste não altera os da produção, e vice-versa.
- **US-18.CA9** — Dado o build de **produção**, então o controle "Liberar Pro (teste)", "Voltar ao grátis (teste)", a faixa "Versão de teste" e o provedor falso **não existem no bundle**, eliminados em tempo de build pela flag (não por parâmetro de URL, console ou `localStorage`).
- **US-18.CA10** — Dado o CI/QA, então há uma verificação automática (script de teste) que procura no `dist/` de produção os textos "Liberar Pro (teste)", "Versão de teste" e o identificador do provedor falso e **falha** se encontrar qualquer um. O mesmo teste confirma que o `dist/` de teste os contém.
- **US-18.CA11** — Dado o build de produção, então nenhuma URL (ex.: `?pro=1`, `?modo=teste`), parâmetro, valor de `localStorage` (ex.: `mensalao:pro:v1` forjado com `pro: true` sem compra confirmada pelo provedor Play) nem objeto global do console ativa o Pro sem compra. Em navegador comum o provedor "Indisponível" mantém o estado como grátis. (O teste E2E de produção tenta ativar por essas vias e falha em ativar.)

    *Nota:* para cumprir isto, em produção o Pro só vale se o provedor Play confirmou a compra na abertura atual; o valor em `mensalao:pro:v1` serve apenas de cache enquanto o provedor Play está disponível mas sem resposta (offline/erro). Com o provedor "Indisponível" (navegador comum), o cache não é honrado e o plano é grátis. Isso ajusta a US-12.CA10 e a D-06.
- **US-18.CA12** — Dado o build de teste, então ele nunca usa a Play Billing real: o provedor é sempre o falso, e a tela Pro informa "Esta versão não cobra nada".
- **US-18.CA13** — Dado uma publicação, então o fluxo de deploy publica produção na raiz do app e teste em `/teste/` como artefatos distintos, e nunca o build de teste no endereço de produção (verificado por script que confere a flag no `dist/` antes de publicar).

---

## 4. Decisões do Produto (para o Renato confirmar na aprovação)

| ID | Decisão | Motivo / consequência |
|---|---|---|
| D-01 | **Limite do grátis:** 5 assinaturas **ativas**. Pausadas e canceladas não contam; em teste grátis conta. O limite bloqueia só **adicionar** e **reativar**; editar, pausar, cancelar, excluir, ver, totais e exportar nunca são bloqueados. Dados acima do limite (usuário da sprint 1 com 8 ativas, importação, Pro revogado) **nunca são removidos, pausados nem ocultados**; o usuário só fica sem poder adicionar até voltar a menos de 5 ativas. | Respeita a confiança do usuário que já usava o app. Evita "refém dos próprios dados". |
| D-02 | **Fora da TWA (navegador comum):** a compra não está disponível. A tela Pro mostra a oferta e a mensagem "disponível no app da Google Play" (com botão para a ficha quando publicada), sem forma de ativar o Pro e sem comprar por outro meio. O app grátis funciona normalmente no navegador. | A Digital Goods API só existe na TWA via Play. |
| D-03 | **iOS fica fora da sprint 2.** Um PWA não acessa compra dentro do app da Apple; exigiria invólucro nativo (Capacitor + StoreKit), conta Apple Developer (US$ 99/ano), Mac e revisão da App Store. Proposta: sprint futura própria. No iPhone, o PWA grátis continua instalável pelo Safari, sem Pro. | Reduz risco desta sprint e mantém foco em uma loja. |
| D-04 | **Preço proposto: R$ 16,90**, vitalício, a **confirmar pelo Renato** (faixa R$ 14,90 a R$ 19,90). O preço fica cadastrado no Play Console (SKU `mensalao_pro`) e o app exibe o valor devolvido pela loja, sem preço em código. Trocar o preço depois não exige nova versão do app. | Ponto médio da faixa, abaixo de R$ 20 (percepção de "compra simples"). |
| D-05 | **Domínio e `assetlinks.json`:** a TWA só fica em tela cheia (sem barra de endereço) e a cobrança só funciona se `https://<domínio>/.well-known/assetlinks.json` estiver na **raiz** do domínio. O app hoje está em `https://vorttechx.github.io/mensalao/` (GitHub Pages de projeto), e **projeto no GitHub Pages não serve a raiz do domínio**. Opções: (a) domínio próprio apontado para o Pages (recomendado, também serve para a política de privacidade); (b) repositório `vorttechx.github.io` (site de usuário) com o arquivo na raiz. A squad entrega o arquivo pronto; o Renato escolhe e configura o domínio. | Sem isso a TWA não verifica a origem. |
| D-06 | **Verificação de compra no aparelho:** ao abrir, lista as compras na Play; se a compra existe, Pro; se a loja responde sem a compra, revoga; se falhar/offline, mantém o que já estava. O estado Pro fica em `localStorage` só como cache para offline/erro na TWA; fora da TWA ele não é honrado. Quem adulterar o armazenamento dentro da TWA ainda pode obter Pro offline até a próxima verificação: risco aceito, é o limite do modelo sem servidor. Estado Pro fora do backup. | Mantém "sem servidor e sem cadastro". |
| D-07 | **Lembrete:** o PWA não agenda notificação confiável com o app fechado. Comportamento definido: aviso dentro do app ao abrir (garantido) + notificação local ao abrir quando há permissão + verificação periódica em segundo plano, quando o aparelho suportar, em melhor esforço. A limitação é dita ao usuário na tela. Padrão: 1 dia antes (0 a 7 configurável). Notificação real com app fechado, com hora certa, fica para depois (exigiria push ou app nativo). | Honesto e testável. |
| D-08 | **Backup automático:** cópias locais rotativas (1 por dia, só se houve mudança, 3 mais recentes, com restauro) + lembrete a cada 7 dias para exportar um arquivo. Não protege contra perda do aparelho nem limpeza do navegador; o aviso diz isso. Exportação manual JSON segue grátis. | Sem nuvem, é o que dá para entregar com honestidade. |
| D-09 | **Divisão grátis × Pro:** continua grátis tudo da sprint 1 (catálogo, próximas cobranças, reajuste, totais e totais por categoria em lista, editar/pausar/cancelar/excluir, guia, backup manual JSON, instalar e offline, tema claro/escuro automático). Pro: ilimitadas, lembrete, backup automático, CSV, gráficos, temas extras. | Ninguém perde funcionalidade que já tinha. |
| D-10 | **Versão de teste do Renato (US-18):** o build de teste (`npm run build:teste`, flag `VITE_MODO=teste`) deixa de ser só do QA e passa a ser a **versão de teste instalável do Renato**, com Pro liberável sem pagamento. Nomes: endereço `https://<domínio>/mensalao/teste/` (subcaminho da produção); pacote Android de produção `br.com.mensalao.app` e de teste `br.com.mensalao.app.teste` (ids a confirmar pelo Renato antes de criar o app na Play, pois não mudam depois); chave de armazenamento com prefixo `mensalao-teste:`; nome exibido "Mensalão (teste)". O provedor falso e o controle "Liberar Pro (teste)" são removidos do bundle de produção em tempo de build; em produção nenhuma URL, parâmetro, console ou valor de `localStorage` ativa o Pro. | Evita "Pro de graça" em produção e permite ao Renato testar tudo no celular. |
| D-11 | **Recursos Pro na versão grátis:** aparecem bloqueados e explicados, nunca escondidos, e levam à tela Pro. Sem anúncios, sem contagem regressiva, sem pop-up repetitivo. | Coerência com a proposta do produto. |
| D-12 | **Política de privacidade:** a squad escreve e hospeda no mesmo domínio (`/privacidade.html`); diz que nenhum dado sai do aparelho, que a compra é processada pela Google e que não há análises nem anúncios. O Renato revisa antes de enviar. | Exigência da Play. |

---

## 5. Empacotamento e publicação nas lojas

### 5.1 O que a squad entrega (Dev e UX; QA valida o que for verificável)

| # | Entrega | Verificação |
|---|---|---|
| E-01 | Projeto TWA com Bubblewrap em `twa/` (`twa-manifest.json` com nome, ícones, `start_url`, escopo, cor de tema, fingerprint como parâmetro, `enableSiteSettingsShortcut` etc., e `playBilling` ativado) e instruções para gerar o pacote (`.aab`). | Arquivo presente e coerente com o manifest do PWA (nome, ícones, escopo). |
| E-02 | `assetlinks.json` de modelo, com o nome do pacote e o campo do SHA-256 como marcador a preencher, pronto para ser servido em `/.well-known/assetlinks.json` na raiz do domínio (D-05). | JSON válido; build o inclui; teste confere formato. |
| E-03 | Manifest do PWA revisado para a TWA (ícone maskable, `id`, escopo e `start_url` coerentes). | Teste do manifest. |
| E-04 | Integração Google Play do provedor de compra (Digital Goods + Payment Request), SKU `mensalao_pro`, com confirmação (acknowledge) da compra conforme a exigência do Play. | Só por revisão de código e testes com o provedor falso; compra real é checklist do Renato. |
| E-05 | Política de privacidade em português, `docs/loja/politica-de-privacidade.md`, e página `privacidade.html` no app. | Página abre offline e linkada nos Ajustes. |
| E-06 | Textos da ficha da loja em `docs/loja/ficha-play.md`: nome, descrição curta (até 80 caracteres), descrição completa, o que há de novo, categoria sugerida, respostas sugeridas para "Segurança dos dados" e classificação indicativa, e descrição do produto Pro. | Revisão do Renato. |
| E-07 | Capturas de tela da loja (360×780 e proporções exigidas) geradas a partir do app de teste. | Arquivos em `docs/loja/capturas/`. |
| E-09 | Versão de teste (US-18): script `build:teste`, publicação em `/teste/`, projeto TWA `twa/teste/` com pacote `.teste`, faixa "Versão de teste", controles de liberar/voltar ao grátis e verificação automática de que o bundle de produção não os contém. | Testes unitários/E2E da US-18 e script de verificação no CI. |
| E-08 | Guia passo a passo para o Renato (`docs/loja/guia-publicacao.md`) com a ordem das ações da seção 5.2. | Revisão do Renato. |

### 5.2 O que só o Renato pode fazer (dependências externas)

| # | Ação do Renato | Observação |
|---|---|---|
| R-01 | Criar a conta de desenvolvedor da Google Play (taxa única de US$ 25 e verificação de identidade). | Contas pessoais novas podem exigir fase de **teste fechado** (com número mínimo de testadores por um período) antes da produção; confirmar a regra vigente no Play Console. |
| R-02 | Decidir o domínio e configurar HTTPS com `/.well-known/assetlinks.json` na raiz (D-05). | A squad não cria domínio. |
| R-03 | Gerar/guardar a **chave de assinatura** e fornecer o fingerprint SHA-256 (ou usar a assinatura gerenciada pelo Google Play App Signing e copiar o fingerprint do Play Console). | A chave privada nunca entra no repositório. |
| R-04 | Criar o app no Play Console e subir o `.aab`. | |
| R-05 | Cadastrar o **produto in-app "Pro"** no Play Console, do tipo não consumível, SKU exato `mensalao_pro`, com o preço confirmado (D-04). | O SKU tem de bater com o código. |
| R-06 | Preencher a ficha: textos (E-06), capturas (E-07), ícone e gráfico de destaque, URL da política de privacidade, formulário "Segurança dos dados", classificação indicativa, público-alvo, declaração de anúncios (nenhum). | |
| R-07 | Configurar contas de teste de licença no Play Console e testar a **compra real** de ponta a ponta (comprar, restaurar após reinstalar, reembolso). | O QA não consegue; fica como checklist manual dele. |
| R-07b | Complemento (não substitui a US-18): para testar a **compra real** na Play sem cobrança, cadastrar a própria conta (e as dos testadores) como "testador de licença" no Play Console. | Já faz parte do R-07. |
| R-10 | Confirmar os ids de pacote (`br.com.mensalao.app` e `.teste`) antes de criar o app, e fornecer o fingerprint SHA-256 também para o pacote de teste, se for instalá-lo como TWA. | O id não muda depois de publicado. |
| R-08 | Autorizar o `git push` e o deploy do site hospedado, quando for o momento. | Conforme o `CLAUDE.md`. |
| R-09 | Enviar para revisão, acompanhar a aprovação e publicar. | |

---

## 6. Definição de Pronto (DoD)

Vale a da sprint 1 (itens 1 a 10) e, nesta sprint, também:

1. Todos os critérios de aceite das histórias foram verificados pelo QA, sem bug de severidade Alta/Crítica aberto em `docs/bugs.md`.
2. Limite, estado Pro, verificação de compra, lembretes, cópias, CSV e agregação por categoria estão em módulos puros com testes unitários cobrindo os casos de borda citados (exatamente 5 ativas, 8 ativas de usuário da sprint 1, importação acima do limite, centavos, ciclo anual/semanal, lista vazia, data no passado, estado corrompido, revogação de Pro).
3. Toda a lógica de pagamento passa pela interface `ProvedorCompra`; os E2E usam o build de teste com o provedor falso (compra ok, cancelada, erro, offline, restaurar, reembolso). O build de produção não contém o provedor falso nem os controles de teste, verificado por script automático (US-18.CA10).
4. Backup JSON da sprint 1 importa sem mudanças; backups não carregam nem concedem estado Pro.
5. Dados de um usuário da sprint 1 com mais de 5 ativas permanecem íntegros após a atualização (teste E2E com dados semeados).
6. Interface conforme o `docs/design.md` aprovado, incluindo telas de limite, Pro, recursos bloqueados, lembretes, cópias, gráficos e temas, com contraste AA verificado para cada tema.
7. `npm run build` sem erros, `npm test` e `npm run test:e2e` passando, nenhum dado enviado a rede, funciona offline após o primeiro carregamento.
8. Entregas E-01 a E-08 presentes e revisadas; as ações R-01 a R-09 estão registradas no relatório final como pendentes do Renato (não bloqueiam a aceitação da sprint, mas bloqueiam a publicação).
9. A compra real na Play fica fora do QA automatizado: o relatório de QA lista explicitamente o que não foi testado (compra real, notificação com app fechado, TWA instalada, verificação do domínio).
