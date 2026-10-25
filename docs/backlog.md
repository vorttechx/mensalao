# Mensalão — Backlog da Sprint 2 (Pro e publicação nas lojas)

Entrada: `docs/sprint2-direcao.md`. Base: sprint 1 entregue (`docs/sprint1/backlog.md` e `docs/sprint1/relatorio-final.md`). As convenções de domínio da sprint 1 continuam valendo (centavos inteiros, equivalentes mensal/anual, avanço de datas, status `ativa`/`pausada`/`cancelada`, BRL e `dd/mm/aaaa`). As histórias da sprint 2 são 8: US-09 e US-11 a US-17 (a US-10 e a US-18 foram removidas a pedido do Renato, sem renumerar).

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
| Provedor de compra | Toda a lógica de pagamento fica atrás de uma interface `ProvedorCompra` com: `disponivel(): Promise<boolean>`, `detalhes(sku): Promise<{ preco: string } \| null>`, `comprar(sku): Promise<'ok' \| 'cancelado' \| 'erro'>`, `listarCompras(): Promise<string[]>` (SKUs possuídos). Implementações: (a) **Google Play** (Digital Goods API + Payment Request, método `https://play.google.com/billing`, SKU `mensalao_pro`, produto não consumível); (b) **Indisponível** (navegador comum); (c) **Falsa** para testes, controlável pelo teste (compra com sucesso, cancelada, erro, offline, reembolso, lista de compras). A falsa só entra no build de teste usado pelo QA (flag de build `VITE_MODO=teste`, `npm run build:teste`); o build de produção **não pode** conter nem expor a falsa (ver D-10 e US-12.CA14 a CA16). |
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
- **US-09.CA5** — Dado o plano grátis, então o limite vale para qualquer origem de nova ativa: cadastro novo e reativação; a importação não é bloqueada (ver CA12). Editar, pausar, cancelar e excluir **nunca** são bloqueados pelo limite.
- **US-09.CA6** — Dado o plano grátis com 5 ativas, quando a tentativa de adicionar é bloqueada, então nada é gravado e os dados continuam idênticos.
- **US-09.CA7** — Dado o plano Pro, então não há contador de limite, não há bloqueio e consigo cadastrar mais de 5 (por exemplo, 12) ativas.
- **US-09.CA8** — Dado o plano grátis com assinatura em teste grátis, então ela conta como ativa no limite (mesmo não entrando nos totais).
- **US-09.CA9** — Dado o plano grátis com 0 ativas (lista vazia), então o contador mostra "0 de 5" e o estado vazio da US-02.CA9 continua igual.
- **US-09.CA10** — Dado o plano grátis, então o limite se aplica por assinatura ativa e não por valor: uma assinatura de R$ 0,01 conta como uma vaga.
- **US-09.CA11** — Os textos de limite são informativos e sem culpa (sem "bloqueado", sem urgência artificial), e a mensagem do limite é anunciada a leitores de tela (`role="alert"` ou equivalente).
- **US-09.CA12** — Dado o plano grátis, quando importo um backup com mais de 5 ativas (ex.: 12), então a importação traz **todas** (nada é removido, pausado ou ignorado), o contador mostra "12 de 5 assinaturas ativas — acima do limite do plano grátis" e a confirmação da US-07.CA2 avisa disso. Enquanto as ativas forem 5 ou mais, só **adicionar** e **reativar** ficam bloqueados; editar, pausar, cancelar, excluir, exportar, totais e próximas cobranças continuam normais e contam todas as ativas. Volta a poder adicionar ao ficar abaixo de 5 ativas ou ao virar Pro.
- **US-09.CA13** — Dado um usuário Pro com mais de 5 ativas (ex.: 20) cujo Pro foi revogado (reembolso, US-12.CA6), então vale a mesma regra da CA12: nada é apagado, o contador mostra "20 de 5 — acima do limite" e só adicionar e reativar ficam bloqueados.

---

### US-10 — Removida a pedido do Renato

Nenhuma versão do app foi para produção, então não há usuários antigos a proteger. Os IDs das demais histórias não foram renumerados. Os casos que não dependem de usuário antigo ficaram na US-09 (CA12 e CA13) e na US-12 (CA12 e CA13).

---

### US-11 — Tela "Mensalão Pro": oferta e compra única (P1)

**Como** Marina, **quero** ver o que o Pro oferece e comprá-lo uma única vez, **para** ter assinaturas ilimitadas e os recursos extras sem mensalidade.

**Critérios de aceite**

- **US-11.CA1** — Dado o plano grátis, quando acesso a tela Pro (pelo menu/Ajustes, pelo limite da US-09 ou por um recurso bloqueado), então vejo (`data-testid="pro-tela"`): título "Mensalão Pro", a promessa "Pague uma vez, use para sempre. Sem mensalidade e sem anúncios", a lista dos seis recursos (assinaturas ilimitadas, lembrete antes da cobrança, backup automático, exportar planilha CSV, gráficos por categoria, temas) e o botão de compra.
- **US-11.CA2** — Dado que a compra está disponível (TWA + provedor responde), então o botão "Comprar Pro por <preço>" (`data-testid="pro-btn-comprar"`) mostra o **preço devolvido pelo provedor** (no provedor falso, por exemplo "R$ 19,99"). O app não escreve o preço em código.
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
- **US-12.CA6** — Dado que sou Pro e o app abre com o provedor respondendo **sem** a compra (reembolso/estorno), então o Pro é revogado, o app vai ao plano grátis e aplica a US-09.CA13, com um aviso único "Seu Mensalão Pro não foi encontrado na Google Play. Você voltou ao plano grátis; seus dados continuam todos aqui." (`data-testid="pro-revogado-aviso"`).
- **US-12.CA7** — Dado que sou Pro e o app abre offline ou o provedor dá erro/timeout, então continuo Pro (não revoga por falha) e nada é exibido ao usuário.
- **US-12.CA8** — Dado que sou Pro e importo um backup, ou excluo/restauro dados, ou limpo todas as assinaturas, então o estado Pro não muda.
- **US-12.CA9** — Dado a abertura do app, então a verificação não atrasa a primeira tela (a tela aparece com o estado local; a resposta da loja atualiza depois) e roda no máximo uma vez por abertura.
- **US-12.CA10** — Dado um navegador comum (provedor "Indisponível"), então não há verificação nem botão de restaurar ativo; o plano é sempre grátis, mesmo que exista estado Pro local (ele não é honrado, ver CA15); o botão "Restaurar compra" aparece desabilitado com a explicação da US-11.CA7.
- **US-12.CA11** — Dado que o JSON de `mensalao:pro:v1` tem tipos errados (ex.: `pro: "sim"`), então o app se comporta como grátis, não trava e não altera as assinaturas.
- **US-12.CA12** — Dado um backup que contenha qualquer campo de plano Pro (`pro`, `compra`, `token` ou semelhante), quando importo, então esses campos são **ignorados** e o plano do aparelho não muda. Importar nunca concede nem remove o Pro.
- **US-12.CA13** — Dado que o Pro foi revogado, então o app volta ao tema padrão **sem apagar** as preferências; lembretes e cópias automáticas param; nenhum dado das assinaturas é perdido. Se o Pro voltar, as preferências são restauradas.
- **US-12.CA14** — Dado o build de **produção**, então o provedor falso e qualquer controle que ative o Pro sem a loja **não existem no bundle**, eliminados em tempo de build pela flag (não por parâmetro de URL, console ou `localStorage`). Uma verificação automática (script de CI/QA) procura no `dist/` de produção o identificador do provedor falso e falha se o encontrar; o mesmo script confirma que o `dist/` de teste o contém.
- **US-12.CA15** — Dado o build de produção, então nenhuma URL (ex.: `?pro=1`), parâmetro, objeto global do console nem valor forjado em `localStorage` (ex.: `mensalao:pro:v1` com `pro: true` sem compra) ativa o Pro. Em produção o Pro só vale se o provedor Play confirmou a compra na abertura atual; o valor em `mensalao:pro:v1` serve apenas de cache enquanto o provedor Play está disponível mas sem resposta (offline/erro). Com o provedor "Indisponível" (navegador comum), o cache não é honrado e o plano é grátis. O teste E2E de produção tenta ativar por essas vias e não consegue.
- **US-12.CA16** — Dado o build de teste (QA), então o provedor é sempre o falso, nunca a Play Billing real, e os testes controlam compra ok, cancelada, erro, offline, restaurar e reembolso.

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
- **US-17.CA6** — Dado o Pro revogado, então o app usa o tema padrão sem apagar a preferência (US-12.CA13); se o Pro voltar, o tema escolhido é reaplicado.
- **US-17.CA7** — Dado um valor de tema desconhecido ou corrompido nas preferências, então o app usa o padrão sem travar.
- **US-17.CA8** — A cor do navegador (`theme-color`) acompanha o tema escolhido.
- **US-17.CA9** — A troca de tema não depende de rede e não envia dado nenhum.

---

### US-18 — Removida a pedido do Renato

A versão de teste com Pro liberado sem pagamento saiu do escopo. O provedor falso continua existindo só para testes automatizados (Definição técnica e D-10); as garantias de que a produção não pode ser liberada de graça ficaram na US-12 (CA14 a CA16).

---

## 4. Decisões do Produto (para o Renato confirmar na aprovação)

| ID | Decisão | Motivo / consequência |
|---|---|---|
| D-01 | **Limite do grátis:** 5 assinaturas **ativas**. Pausadas e canceladas não contam; em teste grátis conta. O limite bloqueia só **adicionar** e **reativar**; editar, pausar, cancelar, excluir, ver, totais e exportar nunca são bloqueados. Dados acima do limite (importação de backup, Pro revogado) **nunca são removidos, pausados nem ocultados**; o usuário só fica sem poder adicionar até voltar a menos de 5 ativas. | Regra simples: o limite barra só novas ativas. Evita "refém dos próprios dados". |
| D-02 | **Fora da TWA (navegador comum):** a compra não está disponível. A tela Pro mostra a oferta e a mensagem "disponível no app da Google Play" (com botão para a ficha quando publicada), sem forma de ativar o Pro e sem comprar por outro meio. O app grátis funciona normalmente no navegador. | A Digital Goods API só existe na TWA via Play. |
| D-03 | **iOS fica fora da sprint 2.** Um PWA não acessa compra dentro do app da Apple; exigiria invólucro nativo (Capacitor + StoreKit), conta Apple Developer (US$ 99/ano), Mac e revisão da App Store. Proposta: sprint futura própria. No iPhone, o PWA grátis continua instalável pelo Safari, sem Pro. | Reduz risco desta sprint e mantém foco em uma loja. |
| D-04 | **Preço: R$ 19,99** (confirmado pelo Renato em 25/10/2026; proposta inicial R$ 16,90), vitalício. O preço fica cadastrado no Play Console (SKU `mensalao_pro`) e o app exibe o valor devolvido pela loja, sem preço em código. Trocar o preço depois não exige nova versão do app. | Escolha do Renato; abaixo de R$ 20 (percepção de "compra simples"). |
| D-05 | **Domínio próprio (confirmado pelo Renato em 18/10/2026):** a TWA só fica em tela cheia e a cobrança só funciona se `https://<domínio>/.well-known/assetlinks.json` estiver na **raiz** do domínio, e o GitHub Pages de projeto (`vorttechx.github.io/mensalao/`) não serve a raiz. Padrão: o Renato **registra um domínio próprio nesta sprint** (ex.: no Registro.br, se for .com.br) e aponta o DNS para o GitHub Pages. O id de pacote `br.com.mensalao.app` sugere `mensalao.com.br`; o Renato confere se está disponível (não afirmamos). O domínio é pré-requisito da **publicação na Play**, não do desenvolvimento: Dev e QA trabalham no GitHub Pages atual sem depender dele. Momento: o Renato registra e aponta o DNS antes da etapa de empacotamento/publicação, até a entrega da sprint. A squad entrega a configuração do domínio personalizado no Pages (arquivo `CNAME` no build, HTTPS) e o `assetlinks.json` na raiz. Com o domínio, o próprio repositório `mensalao` é servido na **raiz**: produção na raiz, e `vorttechx.github.io/mensalao/` passa a redirecionar para o domínio. **Alternativa sem custo:** repositório `vorttechx.github.io` (site de usuário), com a desvantagem de amarrar o app ao nome da organização no GitHub; trocar de endereço depois quebra a verificação da TWA e exige nova versão do app. | Sem domínio na raiz a TWA não verifica a origem. |
| D-06 | **Verificação de compra no aparelho:** ao abrir, lista as compras na Play; se a compra existe, Pro; se a loja responde sem a compra, revoga; se falhar/offline, mantém o que já estava. O estado Pro fica em `localStorage` só como cache para offline/erro na TWA; fora da TWA ele não é honrado. Quem adulterar o armazenamento dentro da TWA ainda pode obter Pro offline até a próxima verificação: risco aceito, é o limite do modelo sem servidor. Estado Pro fora do backup. | Mantém "sem servidor e sem cadastro". |
| D-07 | **Lembrete:** o PWA não agenda notificação confiável com o app fechado. Comportamento definido: aviso dentro do app ao abrir (garantido) + notificação local ao abrir quando há permissão + verificação periódica em segundo plano, quando o aparelho suportar, em melhor esforço. A limitação é dita ao usuário na tela. Padrão: 1 dia antes (0 a 7 configurável). Notificação real com app fechado, com hora certa, fica para depois (exigiria push ou app nativo). | Honesto e testável. |
| D-08 | **Backup automático:** cópias locais rotativas (1 por dia, só se houve mudança, 3 mais recentes, com restauro) + lembrete a cada 7 dias para exportar um arquivo. Não protege contra perda do aparelho nem limpeza do navegador; o aviso diz isso. Exportação manual JSON segue grátis. | Sem nuvem, é o que dá para entregar com honestidade. |
| D-09 | **Divisão grátis × Pro:** continua grátis tudo da sprint 1 (catálogo, próximas cobranças, reajuste, totais e totais por categoria em lista, editar/pausar/cancelar/excluir, guia, backup manual JSON, instalar e offline, tema claro/escuro automático). Pro: ilimitadas, lembrete, backup automático, CSV, gráficos, temas extras. | Mantém o app grátis útil e deixa o Pro como ampliação. |
| D-10 | **Provedor falso só em build de teste:** o build de produção não contém a implementação falsa nem formas de ativar o Pro por URL, console, parâmetro ou `localStorage`. O QA usa um build de teste dedicado (`npm run build:teste`, flag de build `VITE_MODO=teste`). O id de pacote Android sugerido é `br.com.mensalao.app` (a confirmar pelo Renato antes de criar o app na Play, pois não muda depois). | Evita "Pro de graça" em produção. |
| D-11 | **Recursos Pro na versão grátis:** aparecem bloqueados e explicados, nunca escondidos, e levam à tela Pro. Sem anúncios, sem contagem regressiva, sem pop-up repetitivo. | Coerência com a proposta do produto. |
| D-12 | **Política de privacidade:** a squad escreve e hospeda no mesmo domínio (`/privacidade.html`); diz que nenhum dado sai do aparelho, que a compra é processada pela Google e que não há análises nem anúncios. O Renato revisa antes de enviar. | Exigência da Play. |

---

## 5. Empacotamento e publicação nas lojas

### 5.1 O que a squad entrega (Dev e UX; QA valida o que for verificável)

| # | Entrega | Verificação |
|---|---|---|
| E-01 | Projeto TWA com Bubblewrap em `twa/` (`twa-manifest.json` com nome, ícones, `start_url`, escopo, cor de tema, fingerprint como parâmetro, `enableSiteSettingsShortcut` etc., e `playBilling` ativado) e instruções para gerar o pacote (`.aab`). | Arquivo presente e coerente com o manifest do PWA (nome, ícones, escopo). |
| E-02 | Configuração do domínio personalizado no Pages (`CNAME` no build, redirecionamento do endereço antigo) e `assetlinks.json` de modelo, com o nome do pacote e o campo do SHA-256 como marcador a preencher, pronto para ser servido em `/.well-known/assetlinks.json` na raiz do domínio (D-05). | JSON válido; build o inclui; teste confere formato. |
| E-03 | Manifest do PWA revisado para a TWA (ícone maskable, `id`, escopo e `start_url` coerentes). | Teste do manifest. |
| E-04 | Integração Google Play do provedor de compra (Digital Goods + Payment Request), SKU `mensalao_pro`, com confirmação (acknowledge) da compra conforme a exigência do Play. | Só por revisão de código e testes com o provedor falso; compra real é checklist do Renato. |
| E-05 | Política de privacidade em português, `docs/loja/politica-de-privacidade.md`, e página `privacidade.html` no app. | Página abre offline e linkada nos Ajustes. |
| E-06 | Textos da ficha da loja em `docs/loja/ficha-play.md`: nome, descrição curta (até 80 caracteres), descrição completa, o que há de novo, categoria sugerida, respostas sugeridas para "Segurança dos dados" e classificação indicativa, e descrição do produto Pro. | Revisão do Renato. |
| E-07 | Capturas de tela da loja (360×780 e proporções exigidas) geradas a partir do app de teste. | Arquivos em `docs/loja/capturas/`. |
| E-08 | Guia passo a passo para o Renato (`docs/loja/guia-publicacao.md`) com a ordem das ações da seção 5.2. | Revisão do Renato. |

### 5.2 O que só o Renato pode fazer (dependências externas)

| # | Ação do Renato | Observação |
|---|---|---|
| R-01 | Criar a conta de desenvolvedor da Google Play (taxa única de US$ 25 e verificação de identidade). | Contas pessoais novas podem exigir fase de **teste fechado** (com número mínimo de testadores por um período) antes da produção; confirmar a regra vigente no Play Console. |
| R-02 | **Registrar o domínio próprio nesta sprint** (ex.: `mensalao.com.br`, se disponível; custo anual no Registro.br), apontar o DNS para o GitHub Pages e habilitar HTTPS no repositório, antes da etapa de empacotamento/publicação (D-05). A squad entrega o `CNAME` e o `assetlinks.json` na raiz. | Não bloqueia Dev nem QA; bloqueia a publicação. Alternativa sem custo: `vorttechx.github.io`. |
| R-03 | Gerar/guardar a **chave de assinatura** e fornecer o fingerprint SHA-256 (ou usar a assinatura gerenciada pelo Google Play App Signing e copiar o fingerprint do Play Console). | A chave privada nunca entra no repositório. |
| R-04 | Criar o app no Play Console e subir o `.aab`. | |
| R-05 | Cadastrar o **produto in-app "Pro"** no Play Console, do tipo não consumível, SKU exato `mensalao_pro`, com o preço confirmado (D-04). | O SKU tem de bater com o código. |
| R-06 | Preencher a ficha: textos (E-06), capturas (E-07), ícone e gráfico de destaque, URL da política de privacidade, formulário "Segurança dos dados", classificação indicativa, público-alvo, declaração de anúncios (nenhum). | |
| R-07 | Configurar contas de teste de licença no Play Console e testar a **compra real** de ponta a ponta (comprar, restaurar após reinstalar, reembolso). | O QA não consegue; fica como checklist manual dele. |
| R-10 | Confirmar o id de pacote (`br.com.mensalao.app`) antes de criar o app. | O id não muda depois de publicado. |
| R-08 | Autorizar o `git push` e o deploy do site hospedado, quando for o momento. | Conforme o `CLAUDE.md`. |
| R-09 | Enviar para revisão, acompanhar a aprovação e publicar. | |

---

## 6. Definição de Pronto (DoD)

Vale a da sprint 1 (itens 1 a 10) e, nesta sprint, também:

1. Todos os critérios de aceite das histórias foram verificados pelo QA, sem bug de severidade Alta/Crítica aberto em `docs/bugs.md`.
2. Limite, estado Pro, verificação de compra, lembretes, cópias, CSV e agregação por categoria estão em módulos puros com testes unitários cobrindo os casos de borda citados (exatamente 5 ativas, importação com mais de 5 ativas, Pro revogado com mais de 5 ativas, centavos, ciclo anual/semanal, lista vazia, data no passado, estado corrompido, revogação de Pro).
3. Toda a lógica de pagamento passa pela interface `ProvedorCompra`; os E2E usam o build de teste com o provedor falso (compra ok, cancelada, erro, offline, restaurar, reembolso). O build de produção não contém o provedor falso nem os controles de teste, verificado por script automático (US-12.CA14).
4. Backup JSON da sprint 1 importa sem mudanças; backups não carregam nem concedem estado Pro.
5. Backup com mais de 5 ativas importado no plano grátis permanece íntegro, com adicionar e reativar bloqueados (teste E2E com dados semeados).
6. Interface conforme o `docs/design.md` aprovado, incluindo telas de limite, Pro, recursos bloqueados, lembretes, cópias, gráficos e temas, com contraste AA verificado para cada tema.
7. `npm run build` sem erros, `npm test` e `npm run test:e2e` passando, nenhum dado enviado a rede, funciona offline após o primeiro carregamento.
8. Entregas E-01 a E-08 presentes e revisadas; as ações R-01 a R-09 estão registradas no relatório final como pendentes do Renato (não bloqueiam a aceitação da sprint, mas bloqueiam a publicação).
9. A compra real na Play fica fora do QA automatizado: o relatório de QA lista explicitamente o que não foi testado (compra real, notificação com app fechado, TWA instalada, verificação do domínio).
