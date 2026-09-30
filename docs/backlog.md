# Assina Aí — Backlog do MVP (Sprint 1)

## 1. Visão do produto

O **Assina Aí** é um PWA instalável no celular que ajuda brasileiros a retomar o controle das assinaturas e cobranças recorrentes (streaming, música, academia, internet, apps e autorizações de Pix Automático) **sem conectar ao banco**. Todos os dados ficam no próprio aparelho. O app mostra o que vai ser cobrado e quando, quanto isso pesa por mês e por ano, avisa quando um preço subiu e explica onde cancelar — num cenário em que as recorrências estão espalhadas por vários bancos, cartões e, desde jul/2026, também pela conta-salário.

### Fora de escopo (MVP)

- Conexão com bancos, Open Finance ou leitura de extratos/faturas.
- Notificações push reais, e-mail ou SMS (no MVP o destaque é apenas visual, dentro do app).
- Contas de usuário, login, sincronização em nuvem ou entre aparelhos (backup é só via arquivo JSON manual).
- Cancelamento automático de assinaturas ou de autorizações de Pix Automático.
- Múltiplas moedas (somente BRL).
- Divisão de assinaturas entre pessoas, metas de orçamento, gráficos avançados.
- Atualização automática de preços do catálogo (valores são sugestões fixas e editáveis).
- Links para sites de terceiros no guia de cancelamento.

---

## 2. Definição técnica

Restrições fixadas pelo tech lead — obrigatórias para todas as histórias:

| Item | Definição |
|---|---|
| Stack | Vite + TypeScript, **sem framework de UI** (DOM nativo). |
| Persistência | `localStorage` (chave versionada, ex.: `assina-ai:v1`). Nada sai do aparelho. |
| PWA | `manifest.webmanifest` + service worker: app instalável e funcional **offline** após o primeiro acesso. |
| Domínio | Lógica de domínio em **módulos puros e testáveis** (sem acesso a DOM nem a `localStorage`): cálculo de totais, lista de próximas cobranças, cálculo de reajuste, avanço da data de cobrança para o próximo ciclo. Data "hoje" recebida por parâmetro para permitir teste. |
| Build | `base: './'` (caminhos relativos) no Vite, para funcionar em qualquer subdiretório. |
| Formatação | Valores em BRL (`R$ 1.234,56`, via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`); datas em `dd/mm/aaaa`. Entrada de valor aceita vírgula decimal (`39,90`). |
| Interface | Mobile-first (funciona bem a partir de 360 px de largura); acessível: todo campo com `<label>` associado, contraste mínimo WCAG AA, navegação por teclado, foco visível, mensagens de erro ligadas ao campo (`aria-describedby`). |
| QA | Atributos `data-testid` nos elementos principais (formulário, campos, botões, itens de lista, selos, totais). Sugestões de nomes aparecem nos critérios de aceite. |

**Convenções de domínio (valem para todos os critérios):**

- Valores armazenados em **centavos inteiros** para evitar erro de ponto flutuante.
- Equivalente mensal: mensal = valor; anual = valor / 12; semanal = valor × 52 / 12. Equivalente anual = equivalente mensal × 12. Arredondamento para centavos apenas na exibição.
- Avanço de data: mensal soma 1 mês (se o dia não existir no mês, usa o último dia do mês, ex.: 31/01 → 28/02 ou 29/02); anual soma 1 ano (29/02 → 28/02 em ano não bissexto); semanal soma 7 dias.
- Status possíveis: `ativa`, `pausada`, `cancelada`. Só `ativa` entra em totais e em "Próximas cobranças".

---

## 3. Histórias de usuário

Personas:
- **Marina** — usuária comum, 29 anos, várias assinaturas em cartões e bancos diferentes, não quer dar acesso bancário a apps.
- **Carlos** — usuário organizado, quer números exatos e backup dos próprios dados.

---

### US-01 — Cadastrar assinatura a partir do catálogo ou livremente (P1)

**Como** Marina, **quero** cadastrar uma assinatura escolhendo um serviço conhecido ou digitando livremente, **para** registrar minhas cobranças em poucos segundos sem conectar meu banco.

**Critérios de aceite**

- **US-01.CA1** — Dado que estou na tela de nova assinatura, quando digito "net" no campo de busca do catálogo (`data-testid="catalog-search"`), então vejo sugestões que contêm o termo (ex.: Netflix) sem diferenciar maiúsculas/minúsculas nem acentos.
- **US-01.CA2** — Dado que escolhi "Spotify" no catálogo, quando o formulário é aberto, então nome, valor sugerido, ciclo e categoria vêm pré-preenchidos e **todos continuam editáveis**.
- **US-01.CA3** — Dado que o serviço não está no catálogo, quando escolho "Cadastrar livremente", então vejo o formulário vazio com todos os campos: nome, valor (BRL), ciclo (mensal/anual/semanal), próxima cobrança, forma de pagamento (cartão, Pix Automático, boleto, débito), banco/cartão (texto livre), categoria, "em teste grátis" (sim/não) e data de fim do teste.
- **US-01.CA4** — Dado que preenchi valor "39,90", quando salvo, então a assinatura é gravada com 3990 centavos e exibida como "R$ 39,90".
- **US-01.CA5** — Dado que o campo valor está vazio, com "0", negativo, com letras (ex.: "abc") ou com mais de 2 casas decimais (ex.: "10,999"), quando tento salvar, então o app não salva e mostra mensagem de erro junto ao campo (`data-testid="error-valor"`), mantendo os outros dados digitados.
- **US-01.CA6** — Dado que o nome está vazio ou só com espaços, quando tento salvar, então vejo erro "Informe o nome" e nada é gravado.
- **US-01.CA7** — Dado que não informei a próxima cobrança ou informei data inválida (ex.: 31/02/2026), quando tento salvar, então vejo erro no campo de data.
- **US-01.CA8** — Dado que informei uma próxima cobrança **no passado** (ex.: hoje 30/09/2026, ciclo mensal, data 15/08/2026), quando salvo, então a data é avançada automaticamente para a primeira ocorrência igual ou posterior a hoje (15/10/2026) e aviso isso na tela.
- **US-01.CA9** — Dado que marquei "em teste grátis", quando não informo a data de fim do teste, então não consigo salvar e vejo erro no campo. Dado que não marquei teste grátis, o campo de fim do teste fica oculto/desabilitado.
- **US-01.CA10** — Dado que salvei com sucesso, quando fecho e reabro o app (inclusive offline), então a assinatura continua lá (persistida no `localStorage`).
- **US-01.CA11** — Dado que o formulário está aberto, então cada campo tem `<label>` visível e `data-testid` (`field-nome`, `field-valor`, `field-ciclo`, `field-proxima`, `field-pagamento`, `field-banco`, `field-categoria`, `field-teste`, `field-fim-teste`, `btn-salvar`).

---

### US-02 — Ver próximas cobranças e testes grátis perto do fim (P1)

**Como** Marina, **quero** ver uma lista das próximas cobranças por data, com destaque para o que vence logo, **para** não ser pega de surpresa e cancelar antes se quiser.

**Critérios de aceite**

- **US-02.CA1** — Dado que tenho assinaturas ativas, quando abro a tela inicial, então vejo "Próximas cobranças" (`data-testid="upcoming-list"`) ordenada pela data da próxima cobrança, da mais próxima para a mais distante; empates ordenados por nome.
- **US-02.CA2** — Dado N = 3 (padrão) e hoje 30/09/2026, quando há cobranças em 30/09, 03/10 e 04/10, então as de 30/09 e 03/10 aparecem destacadas (`data-testid="badge-vence-logo"`, com texto como "hoje" / "em 3 dias") e a de 04/10 não.
- **US-02.CA3** — Dado que altero N para 7 nas configurações (`data-testid="config-dias-aviso"`), quando volto à lista, então o destaque passa a cobrir 7 dias e o valor fica salvo. N aceita inteiros de 0 a 30; valores fora disso ou não numéricos mostram erro e mantêm o valor anterior.
- **US-02.CA4** — Dado que uma assinatura tem data de próxima cobrança já passada (ex.: app não aberto por semanas), quando abro o app, então a data é avançada para o próximo ciclo (mensal/anual/semanal) antes de montar a lista, e a nova data é persistida.
- **US-02.CA5** — Dado ciclo **anual** com cobrança em 10/03/2026 e hoje 30/09/2026, quando a lista é montada, então a próxima cobrança exibida é 10/03/2027.
- **US-02.CA6** — Dado ciclo mensal com cobrança no dia 31, quando a data avança de 31/01, então a próxima é 28/02 (ou 29/02 em ano bissexto); a partir daí, o dia de referência original (31) é mantido quando o mês permitir (31/03).
- **US-02.CA7** — Dado uma assinatura em teste grátis cujo fim é em até N dias, quando vejo a lista, então aparece o selo "Teste grátis termina em X dias" (`data-testid="badge-teste-fim"`) com destaque visual diferente do vencimento comum.
- **US-02.CA8** — Dado um teste grátis cuja data de fim **já passou**, quando vejo a lista, então o item deixa de ser mostrado como teste, aparece o aviso "Teste terminou em dd/mm/aaaa — agora é cobrança normal" e ele passa a contar como assinatura paga nos totais.
- **US-02.CA9** — Dado que não há assinaturas ativas, quando abro a tela inicial, então vejo estado vazio (`data-testid="empty-state"`) com texto explicativo e botão "Adicionar assinatura".
- **US-02.CA10** — Dado assinaturas pausadas ou canceladas, então elas **não** aparecem em "Próximas cobranças".
- **US-02.CA11** — Cada item mostra nome, valor em BRL, data em dd/mm/aaaa e forma de pagamento (`data-testid="upcoming-item"`).

---

### US-03 — Alerta de reajuste com histórico de preços (P1)

**Como** Marina, **quero** ver quando uma assinatura ficou mais cara e quanto subiu, **para** decidir se ainda vale a pena mantê-la.

**Critérios de aceite**

- **US-03.CA1** — Dado uma assinatura de R$ 39,90, quando edito o valor para R$ 44,90 e salvo, então o valor anterior é guardado no histórico com a data da alteração e a assinatura mostra o selo "subiu 12,5% (R$ 5,00)" (`data-testid="badge-reajuste"`).
- **US-03.CA2** — O percentual é calculado sobre o valor imediatamente anterior e exibido com 1 casa decimal no formato brasileiro (ex.: 12,5%); a diferença em R$ é exata em centavos (ex.: 19,90 → 21,90 = "R$ 2,00" e "10,1%").
- **US-03.CA3** — Dado que o valor foi reduzido (ex.: 44,90 → 39,90), quando salvo, então o histórico registra a mudança e o selo mostra "caiu R$ 5,00 (11,1%)" com estilo neutro/positivo, não de alerta.
- **US-03.CA4** — Dado que edito outros campos sem mudar o valor, quando salvo, então nenhum registro é adicionado ao histórico e nenhum selo novo aparece.
- **US-03.CA5** — Dado vários reajustes (29,90 → 34,90 → 39,90), quando abro o detalhe da assinatura, então vejo o histórico completo (`data-testid="price-history"`) em ordem cronológica com data e valor, e o selo compara apenas o valor atual com o imediatamente anterior.
- **US-03.CA6** — Dado uma assinatura recém-cadastrada (sem histórico), então nenhum selo de reajuste é exibido.
- **US-03.CA7** — Dado que o novo valor é inválido (vazio, zero, negativo, texto), quando tento salvar, então aplicam-se as mesmas validações da US-01.CA5 e o histórico não é alterado.
- **US-03.CA8** — O selo de reajuste aparece tanto na lista geral quanto em "Próximas cobranças".

---

### US-04 — Painel de totais mensal e anual (P1)

**Como** Carlos, **quero** ver quanto gasto por mês e por ano com assinaturas, separado por forma de pagamento e por categoria, **para** entender o peso real das recorrências no meu orçamento.

**Critérios de aceite**

- **US-04.CA1** — Dado assinaturas ativas Netflix R$ 44,90 (mensal) e Amazon Prime R$ 166,80 (anual), quando abro o painel, então o total mensal equivalente (`data-testid="total-mensal"`) é R$ 58,80 (44,90 + 13,90) e o anual equivalente (`data-testid="total-anual"`) é R$ 705,60.
- **US-04.CA2** — Dado uma assinatura semanal de R$ 10,00, então seu equivalente mensal é R$ 43,33 (10 × 52 / 12 = 43,333…) e o anual R$ 520,00; o arredondamento é feito só na exibição, sobre a soma total (não item a item).
- **US-04.CA3** — Dado valores com centavos (ex.: 3 × R$ 0,10), então o total exibido é exatamente R$ 0,30 (sem erro de ponto flutuante).
- **US-04.CA4** — Quando abro o painel, então vejo o total mensal equivalente agrupado por forma de pagamento (cartão, Pix Automático, boleto, débito) (`data-testid="total-por-pagamento"`), mostrando só as formas com valor > 0.
- **US-04.CA5** — Quando abro o painel, então vejo o total mensal equivalente por categoria (`data-testid="total-por-categoria"`), ordenado do maior para o menor.
- **US-04.CA6** — Dado assinaturas pausadas ou canceladas, então elas não entram em nenhum total.
- **US-04.CA7** — Dado uma assinatura em teste grátis ainda vigente, então ela **não** entra nos totais, mas o painel mostra à parte "Em teste: X assinaturas — R$ Y/mês após o teste". Dado teste já terminado, ela entra normalmente.
- **US-04.CA8** — Dado que não há assinaturas ativas, quando abro o painel, então os totais mostram R$ 0,00 e uma mensagem de estado vazio, sem erros.
- **US-04.CA9** — Os totais são recalculados imediatamente após criar, editar, pausar, cancelar, reativar, excluir ou importar.

---

### US-05 — Editar, pausar, cancelar e excluir assinatura (P1)

**Como** Marina, **quero** editar, pausar, marcar como cancelada ou excluir uma assinatura, **para** manter a lista fiel à minha realidade.

**Critérios de aceite**

- **US-05.CA1** — Dado uma assinatura existente, quando toco em "Editar" (`data-testid="btn-editar"`), então o formulário abre com os dados atuais, e ao salvar as mudanças aparecem na lista e nos totais (com as validações da US-01).
- **US-05.CA2** — Dado uma assinatura ativa, quando toco em "Pausar" (`data-testid="btn-pausar"`), então ela ganha status "pausada", sai dos totais e das próximas cobranças, e continua visível na lista geral com etiqueta "Pausada".
- **US-05.CA3** — Dado uma assinatura ativa ou pausada, quando toco em "Marcar como cancelada" (`data-testid="btn-cancelar"`), então ela ganha status "cancelada" com a data do cancelamento, sai dos totais e das próximas cobranças, e aparece numa seção/filtro "Canceladas".
- **US-05.CA4** — Dado uma assinatura pausada ou cancelada, quando toco em "Reativar", então ela volta a "ativa"; se a próxima cobrança estiver no passado, a data é avançada para o próximo ciclo (mesma regra da US-02.CA4).
- **US-05.CA5** — Dado uma assinatura, quando toco em "Excluir" (`data-testid="btn-excluir"`), então vejo confirmação ("Excluir Netflix? Esta ação não pode ser desfeita."); ao confirmar, ela e seu histórico de preços são removidos; ao cancelar a confirmação, nada muda.
- **US-05.CA6** — Dado que excluí a última assinatura, então a tela inicial mostra o estado vazio (US-02.CA9).
- **US-05.CA7** — Todas as alterações persistem após recarregar a página.

---

### US-06 — Guia "onde cancelar" (P2)

**Como** Marina, **quero** ver onde e como cancelar cada assinatura, **para** não perder tempo procurando o caminho quando decidir cancelar.

**Critérios de aceite**

- **US-06.CA1** — Dado uma assinatura criada a partir do catálogo, quando abro o detalhe e toco em "Como cancelar" (`data-testid="btn-como-cancelar"`), então vejo o texto curto de cancelamento do catálogo (`data-testid="cancel-guide"`).
- **US-06.CA2** — Dado uma assinatura com forma de pagamento **Pix Automático**, então o guia mostra (adicionalmente ao do serviço, se houver) a instrução genérica: "Abra o app do banco de onde sai o pagamento, procure Pix > Pix Automático (ou 'Recorrências/Autorizações') e revogue a autorização deste recebedor. Cancelar no banco interrompe as cobranças futuras, mas confira também o contrato com a empresa." Se o campo banco/cartão estiver preenchido, o texto cita o banco informado ("no app do Banco X").
- **US-06.CA3** — Dado uma assinatura de cadastro livre sem Pix Automático, então o guia mostra instrução genérica: "Procure no app ou site do serviço a área Conta/Perfil > Assinatura ou Plano > Cancelar. Se pagar no cartão, guarde o comprovante do cancelamento."
- **US-06.CA4** — Nenhum texto do guia contém URLs, telefones ou e-mails; o guia funciona offline.
- **US-06.CA5** — O guia informa que o app **não** cancela nada automaticamente e sugere, após cancelar no serviço, usar "Marcar como cancelada" (link para a ação da US-05.CA3).

---

### US-07 — Exportar e importar backup JSON (P2)

**Como** Carlos, **quero** exportar e importar meus dados em um arquivo JSON, **para** não perder tudo se trocar de celular ou limpar o navegador.

**Critérios de aceite**

- **US-07.CA1** — Dado que tenho dados, quando toco em "Exportar backup" (`data-testid="btn-exportar"`), então é baixado um arquivo `assina-ai-backup-aaaa-mm-dd.json` com versão do formato, data de exportação, configurações (N dias) e todas as assinaturas (incluindo pausadas, canceladas e histórico de preços).
- **US-07.CA2** — Dado um backup válido, quando escolho "Importar backup" (`data-testid="btn-importar"`) e seleciono o arquivo, então vejo confirmação com a quantidade de assinaturas e o aviso de que os dados atuais serão **substituídos**; ao confirmar, os dados são carregados e todas as telas atualizam.
- **US-07.CA3** — Dado um arquivo inválido (não é JSON, JSON sem o formato esperado, versão desconhecida, valores negativos ou datas inválidas), quando tento importar, então vejo mensagem de erro clara e **os dados atuais permanecem intactos**.
- **US-07.CA4** — Dado que exporto e em seguida importo o mesmo arquivo, então os dados resultantes são idênticos aos originais (ida e volta sem perdas, incluindo centavos e histórico).
- **US-07.CA5** — Dado que não tenho nenhuma assinatura, quando exporto, então o arquivo é gerado com lista vazia e importá-lo resulta em estado vazio, sem erro.
- **US-07.CA6** — Dado um backup com datas de cobrança no passado, quando importo, então as datas são avançadas para o próximo ciclo (regra US-02.CA4).
- **US-07.CA7** — Exportação e importação funcionam offline; nenhum dado é enviado para servidor.

---

### US-08 — Instalar e usar offline (P1)

**Como** Marina, **quero** instalar o Assina Aí na tela inicial do celular e usá-lo sem internet, **para** consultar minhas cobranças a qualquer momento, como um app comum.

**Critérios de aceite**

- **US-08.CA1** — Dado que acesso o app num navegador compatível, então o manifest (nome "Assina Aí", ícones 192 e 512 px, `display: standalone`, cores de tema) permite a instalação.
- **US-08.CA2** — Dado que o app já foi aberto uma vez com internet, quando fico offline e reabro, então todas as telas carregam e os dados locais aparecem.
- **US-08.CA3** — Dado que o build é servido de um subdiretório (ex.: `/apps/assina-ai/`), então todos os recursos carregam (base relativa `./`).
- **US-08.CA4** — Dado que o `localStorage` contém dados corrompidos, quando abro o app, então ele não trava: mostra aviso, oferece começar do zero ou importar backup, e não sobrescreve os dados corrompidos sem confirmação.
- **US-08.CA5** — A interface funciona em 360 px de largura sem rolagem horizontal, com áreas de toque de pelo menos 44×44 px.

---

## 4. Catálogo inicial de serviços

> **Atenção:** os valores abaixo são **sugestões aproximadas** para agilizar o cadastro, baseadas em planos comuns, e **podem estar desatualizados**. O usuário sempre pode (e deve) editar o valor para o que realmente paga. As instruções de cancelamento são caminhos genéricos; os nomes de menus podem variar conforme a versão do app.

| # | Serviço | Categoria | Ciclo sugerido | Valor sugerido (editável) | Como cancelar (texto curto) |
|---|---|---|---|---|---|
| 1 | Netflix | Streaming de vídeo | Mensal | R$ 44,90 | No site ou app: Conta > Assinatura > Cancelar assinatura. |
| 2 | Spotify | Música | Mensal | R$ 21,90 | Pelo navegador: Conta > Seu plano > Mudar plano > Cancelar Premium. |
| 3 | Amazon Prime | Streaming / Compras | Anual | R$ 166,80 | No site da Amazon: Sua conta > Assinatura Prime > Encerrar assinatura. |
| 4 | Disney+ | Streaming de vídeo | Mensal | R$ 43,90 | No site ou app: Perfil > Conta > Assinatura > Cancelar assinatura. |
| 5 | Max (HBO) | Streaming de vídeo | Mensal | R$ 39,90 | No site: Perfil > Assinatura > Gerenciar assinatura > Cancelar. |
| 6 | Globoplay | Streaming de vídeo | Mensal | R$ 29,90 | No site: Minha conta > Assinaturas > Cancelar assinatura. |
| 7 | YouTube Premium | Streaming de vídeo / Música | Mensal | R$ 26,90 | No app ou site: Perfil > Compras e assinaturas > Premium > Desativar. |
| 8 | Apple (iCloud+ / Apple One) | Armazenamento em nuvem | Mensal | R$ 5,90 | No iPhone: Ajustes > [seu nome] > Assinaturas > escolher > Cancelar. |
| 9 | Google One | Armazenamento em nuvem | Mensal | R$ 9,99 | No app Google One: Configurações > Gerenciar assinatura > Cancelar. |
| 10 | Deezer | Música | Mensal | R$ 22,90 | Pelo navegador: Minha conta > Minhas assinaturas > Cancelar. |
| 11 | Paramount+ | Streaming de vídeo | Mensal | R$ 27,90 | No site: Conta > Assinatura > Cancelar assinatura. |
| 12 | iFood Clube | Delivery | Mensal | R$ 12,90 | No app: Perfil > Clube iFood > Gerenciar > Cancelar assinatura. |
| 13 | Mercado Livre (Meli+) | Compras | Mensal | R$ 19,90 | No app: Você > Meli+ > Gerenciar assinatura > Cancelar. |
| 14 | Academia | Saúde e bem-estar | Mensal | R$ 99,90 | Verifique o contrato: em geral pelo app da rede ou na recepção; peça comprovante do cancelamento. |
| 15 | Internet residencial | Casa e serviços | Mensal | R$ 99,90 | Pelo app ou central da operadora (área do cliente > Cancelamento); anote o protocolo. |
| 16 | Plano de celular | Telefonia | Mensal | R$ 49,90 | Pelo app ou central da operadora; anote o número do protocolo. |
| 17 | Microsoft 365 | Software / Produtividade | Anual | R$ 449,00 | Na conta Microsoft: Serviços e assinaturas > Gerenciar > Cancelar assinatura. |
| 18 | ChatGPT Plus | Software / Produtividade | Mensal | R$ 110,00 | No app ou site: Configurações > Conta/Assinatura > Gerenciar > Cancelar plano. |

**Regras gerais do catálogo**
- Assinaturas compradas pela loja de apps (App Store / Google Play) devem ser canceladas na própria loja: iPhone em Ajustes > [seu nome] > Assinaturas; Android na Play Store > Perfil > Pagamentos e assinaturas > Assinaturas. Essa observação aparece no guia de todos os itens do catálogo.
- Para qualquer item pago via **Pix Automático**, soma-se a instrução genérica da US-06.CA2.
- Categorias disponíveis no MVP: Streaming de vídeo, Música, Armazenamento em nuvem, Software / Produtividade, Compras, Delivery, Saúde e bem-estar, Casa e serviços, Telefonia, Educação, Outros.

---

## 5. Definição de Pronto (DoD)

Uma história só está pronta quando:

1. Todos os critérios de aceite da história foram verificados pelo QA e não há bug de severidade Alta/Crítica aberto em `docs/bugs.md` para ela.
2. A lógica de domínio envolvida está em módulo puro (sem DOM/`localStorage`) com testes unitários cobrindo os casos de borda citados (centavos, ciclo anual/semanal, data passada, fim de mês, teste grátis encerrado, lista vazia, valores inválidos) — todos passando.
3. `npm run build` gera o app sem erros de TypeScript (modo `strict`) e com base relativa `./`.
4. O app funciona offline após o primeiro carregamento e continua instalável (manifest + service worker válidos).
5. Valores exibidos em BRL (`R$ 1.234,56`) e datas em `dd/mm/aaaa` em todas as telas afetadas.
6. Elementos principais possuem `data-testid` conforme indicado nos critérios.
7. Acessibilidade verificada: labels em todos os campos, contraste AA, navegação por teclado e foco visível, mensagens de erro associadas aos campos.
8. Layout validado em 360 px de largura (sem rolagem horizontal).
9. Dados persistem após recarregar a página; nenhum dado é enviado para rede.
10. Nenhum erro no console do navegador durante o fluxo da história.
