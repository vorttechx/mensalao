# Mensalão — Design (Sprint 1 + Sprint 2)

Autor: Agente UX. Entradas: `docs/backlog.md` (sprint 2, aprovado pelo Renato em 18/10/2026, G1), `docs/design-direcao.md` (Renato, 01/10/2026) e o design da sprint 1 (aprovado e implementado; cópia em `docs/sprint1/design.md`).
Referência visual: `docs/design-preview.html` (abrir no navegador; material de referência, não é o app). A prévia atual prioriza o que é novo na sprint 2.

**Como ler:** as seções 1 a 6 são o design da sprint 1, que continua valendo sem mudança (identidade, tokens, componentes e telas). A **Parte 2 — Sprint 2** (seções 7 a 12, no fim do arquivo) acrescenta o que é novo: tokens de tema e gráfico, componentes novos, telas das histórias US-09 e US-11 a US-17, navegação para a tela Pro e as decisões de UX da sprint 2. Onde a sprint 2 altera algo da sprint 1, isso está dito explicitamente na Parte 2 (seção 7.4).

---

## 1. Princípios

1. **O número é o herói.** Valores e datas são a informação mais forte da tela (tamanho, peso, números tabulares); rótulos ficam em segundo plano.
2. **Verde é a marca, não o status.** O verde-cédula identifica o app e as ações principais. Alerta usa âmbar (vence logo) e vermelho (subiu, excluir), teste grátis usa índigo. Nenhum estado depende só da cor: todo selo tem texto e ícone.
3. **Uma tarefa por tela, muito respiro.** Poucos elementos, espaçamento generoso, nada de ornamento. Ações destrutivas ficam afastadas das principais e sempre pedem confirmação quando não têm volta.
4. **Acessível e offline por padrão.** Contraste AA conferido, foco sempre visível, toque mínimo de 44×44 px, fontes de sistema (nada depende de rede).

---

## 2. Tokens

Todos os tokens viram variáveis CSS em `:root`. O tema escuro troca só as variáveis de cor (seção 2.8). O Dev pode copiar o bloco abaixo como está.

```css
:root {
  /* Cores — tema claro */
  --cor-fundo: #F5F8F6;            /* fundo da página */
  --cor-superficie: #FFFFFF;       /* cartões, itens, campos, diálogos */
  --cor-superficie-2: #ECEFED;     /* selo neutro, trilho de barras, botão desabilitado */
  --cor-texto: #13221B;            /* texto principal, valores */
  --cor-texto-2: #4A5C53;          /* texto secundário, ajuda, metadados */
  --cor-borda: #7A8C83;            /* borda de campos e botão secundário (não-texto, 3:1) */
  --cor-divisor: #DCE3DF;          /* linhas divisórias decorativas */
  --cor-primaria: #0B6B47;         /* verde-cédula: botão primário, links, foco, cartão de total */
  --cor-primaria-forte: #08573A;   /* hover/pressionado do primário */
  --cor-primaria-suave: #E3F4EC;   /* menta: fundo de selo "caiu", item de navegação ativo */
  --cor-sobre-primaria: #FFFFFF;   /* texto sobre primária */
  --cor-acento: #D4A72C;           /* dourado: só decorativo (moeda do ícone, filete) — nunca texto */
  --cor-aviso: #8F4A00;            /* âmbar escuro: texto/ícone "vence logo" */
  --cor-aviso-suave: #FFF3DC;      /* fundo do selo "vence logo" */
  --cor-perigo: #B42318;           /* vermelho: "subiu", erro de campo, botão excluir */
  --cor-perigo-suave: #FDECEA;     /* fundo do selo "subiu" e de banner de erro */
  --cor-info: #4338A8;             /* índigo: "teste grátis" */
  --cor-info-suave: #EEEDFB;       /* fundo do selo "teste grátis" */
  --cor-foco: #0B6B47;             /* anel de foco */

  /* Tipografia */
  --fonte: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif;
  --texto-sm: 0.875rem;   /* 14px — metadados, selos, ajuda, erro */
  --texto-base: 1rem;     /* 16px — corpo, campos (evita zoom no iOS) */
  --texto-md: 1.125rem;   /* 18px — nome no item, títulos de seção */
  --texto-lg: 1.375rem;   /* 22px — título da tela */
  --texto-xl: 1.75rem;    /* 28px — valor no detalhe, total anual */
  --texto-2xl: 2.25rem;   /* 36px — total mensal */
  --peso-normal: 400;
  --peso-medio: 500;
  --peso-forte: 600;
  --peso-numero: 700;     /* valores em destaque */
  --altura-linha: 1.5;    /* corpo */
  --altura-linha-titulo: 1.25;
  --altura-linha-numero: 1.1;

  /* Espaçamento (base 4px) */
  --espaco-1: 4px;
  --espaco-2: 8px;
  --espaco-3: 12px;
  --espaco-4: 16px;   /* margem lateral da tela */
  --espaco-5: 24px;
  --espaco-6: 32px;
  --espaco-7: 48px;

  /* Tamanhos */
  --toque-min: 44px;        /* área mínima de toque */
  --altura-campo: 48px;
  --altura-botao: 48px;
  --altura-barra-topo: 56px;
  --altura-nav: 64px;       /* + env(safe-area-inset-bottom) */
  --largura-max: 560px;     /* conteúdo centralizado em telas largas */

  /* Raios */
  --raio-sm: 8px;      /* campos, botões */
  --raio-md: 12px;     /* itens, cartões */
  --raio-lg: 16px;     /* cartão de total, diálogo */
  --raio-pilula: 999px;/* selos, botão flutuante */

  /* Sombras (discretas; a hierarquia vem de espaço e tipografia) */
  --sombra-1: 0 1px 2px rgba(19, 34, 27, 0.08);
  --sombra-2: 0 4px 12px rgba(19, 34, 27, 0.12);
  --sombra-dialogo: 0 12px 32px rgba(19, 34, 27, 0.24);

  /* Movimento */
  --duracao-rapida: 120ms;  /* hover, pressionado */
  --duracao-media: 200ms;   /* abrir diálogo, expandir guia */
  --curva: cubic-bezier(0.2, 0, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root { --duracao-rapida: 0ms; --duracao-media: 0ms; }
}
```

### 2.1 Paleta e uso

| Token | Hex | Uso |
| --- | --- | --- |
| `--cor-fundo` | #F5F8F6 | Fundo da página (branco esverdeado, quase neutro) |
| `--cor-superficie` | #FFFFFF | Cartões, itens de lista, campos, diálogos, barra de navegação |
| `--cor-superficie-2` | #ECEFED | Selos neutros (pausada, cancelada), trilho das barras de total, desabilitado |
| `--cor-texto` | #13221B | Texto principal e números |
| `--cor-texto-2` | #4A5C53 | Metadados (data, forma de pagamento), textos de ajuda |
| `--cor-borda` | #7A8C83 | Borda de campos, checkbox e botão secundário |
| `--cor-divisor` | #DCE3DF | Linhas entre itens (decorativo) |
| `--cor-primaria` | #0B6B47 | Verde-cédula: botão primário, links, foco, cartão de total, ícone da nav ativo |
| `--cor-primaria-forte` | #08573A | Hover/pressionado do primário; fundo do ícone do app |
| `--cor-primaria-suave` | #E3F4EC | Menta: selo "caiu", fundo do item ativo da navegação |
| `--cor-acento` | #D4A72C | Dourado: moeda no ícone e filete decorativo no cartão de total. **Nunca como texto** |
| `--cor-aviso` / `-suave` | #8F4A00 / #FFF3DC | Âmbar: selo "vence logo" |
| `--cor-perigo` / `-suave` | #B42318 / #FDECEA | Vermelho: selo "subiu", erros, botão Excluir, banner de erro |
| `--cor-info` / `-suave` | #4338A8 / #EEEDFB | Índigo: selo "teste grátis" (diferente do vencimento comum, US-02.CA7) |

### 2.2 Contraste (WCAG 2.1, calculado pela fórmula de luminância relativa)

Texto normal exige 4,5:1; texto grande (≥ 24 px, ou ≥ 18,66 px em negrito), ícones e bordas de componentes exigem 3:1.

| Primeiro plano | Fundo | Razão | Uso | AA |
| --- | --- | --- | --- | --- |
| #13221B texto | #FFFFFF superfície | 16,50:1 | corpo, valores | Sim |
| #13221B texto | #F5F8F6 fundo | 15,44:1 | títulos sobre a página | Sim |
| #13221B texto | #E3F4EC menta | 14,48:1 | item de nav ativo | Sim |
| #4A5C53 texto-2 | #FFFFFF | 7,13:1 | metadados | Sim |
| #4A5C53 texto-2 | #F5F8F6 | 6,66:1 | ajuda sobre a página | Sim |
| #4A5C53 texto-2 | #ECEFED | 6,15:1 | selo Pausada/Cancelada | Sim |
| #0B6B47 primária | #FFFFFF | 6,54:1 | links, botão secundário | Sim |
| #0B6B47 primária | #F5F8F6 | 6,12:1 | links sobre a página | Sim |
| #0B6B47 primária | #E3F4EC menta | 5,74:1 | selo "caiu" | Sim |
| #FFFFFF | #0B6B47 primária | 6,54:1 | botão primário, cartão de total | Sim |
| #FFFFFF | #08573A primária-forte | 8,63:1 | botão primário pressionado | Sim |
| #E3F4EC menta | #0B6B47 primária | 5,74:1 | rótulos do cartão de total | Sim |
| #8F4A00 aviso | #FFF3DC aviso-suave | 6,07:1 | selo "vence logo" | Sim |
| #8F4A00 aviso | #FFFFFF | 6,67:1 | ícone/texto âmbar sobre cartão | Sim |
| #B42318 perigo | #FDECEA perigo-suave | 5,75:1 | selo "subiu", banner de erro | Sim |
| #B42318 perigo | #FFFFFF | 6,57:1 | mensagem de erro do campo | Sim |
| #B42318 perigo | #F5F8F6 | 6,15:1 | erro sobre a página | Sim |
| #FFFFFF | #B42318 perigo | 6,57:1 | botão de confirmar exclusão | Sim |
| #4338A8 info | #EEEDFB info-suave | 7,66:1 | selo "teste grátis" | Sim |
| #4338A8 info | #FFFFFF | 8,86:1 | texto índigo sobre cartão | Sim |
| #7A8C83 borda | #FFFFFF | 3,56:1 | borda de campo (não-texto) | Sim (3:1) |
| #7A8C83 borda | #F5F8F6 | 3,33:1 | borda de botão secundário | Sim (3:1) |
| #0B6B47 foco | #FFFFFF / #F5F8F6 | 6,54 / 6,12:1 | anel de foco | Sim (3:1) |
| #D4A72C acento | #08573A | 3,85:1 | moeda do ícone (gráfico) | Sim (3:1) |
| #D4A72C acento | #0B6B47 | 2,92:1 | filete do cartão de total | Decorativo, isento |

### 2.3 Tipografia

- **Família:** pilha de sistema (`--fonte`). Sem fonte baixada: funciona offline e carrega instantaneamente.
- **Números:** sempre com `font-variant-numeric: tabular-nums;` para valores e datas alinharem na lista.
- **Escala:** 14 / 16 / 18 / 22 / 28 / 36 px. Nada menor que 14 px. Campos sempre em 16 px.
- **Pesos:** 400 corpo, 500 rótulos e botões, 600 títulos e nomes, 700 valores em destaque.
- **Altura de linha:** 1,5 no corpo; 1,25 em títulos; 1,1 nos números grandes.
- Textos usam `rem` para respeitar o zoom do sistema; o layout precisa aguentar 200% de zoom sem rolagem horizontal (quebra de linha, não corte).

### 2.4 Espaçamento e grade

- Margem lateral da tela: `--espaco-4` (16 px). Em 360 px sobram 328 px de conteúdo.
- Entre itens de lista: `--espaco-2` (8 px). Entre seções: `--espaco-5` (24 px). Padding interno de cartão/item: `--espaco-4`.
- Acima de 560 px o conteúdo fica centralizado com `max-width: var(--largura-max)`.

### 2.5 Raios, sombras e bordas

- Campos e botões: `--raio-sm`; itens e cartões: `--raio-md`; cartão de total e diálogo: `--raio-lg`; selos: `--raio-pilula`.
- Itens de lista usam `--sombra-1` sobre o fundo; diálogo usa `--sombra-dialogo` com véu `rgba(19, 34, 27, 0.5)`.

### 2.6 Movimento

- Transições só de cor, opacidade e altura (expandir o guia), em `--duracao-rapida`/`--duracao-media` com `--curva`.
- Sem animação de entrada de lista nem de troca de tela. `prefers-reduced-motion` zera as durações.

### 2.7 Foco visível (todos os elementos interativos)

```css
:focus-visible { outline: 3px solid var(--cor-foco); outline-offset: 2px; border-radius: var(--raio-sm); }
```
O deslocamento de 2 px faz o anel ficar sobre o fundo, inclusive em botões verdes e vermelhos. Nunca usar `outline: none` sem substituto.

### 2.8 Tema escuro

Aplicado automaticamente com `@media (prefers-color-scheme: dark)`; sem chave manual no MVP. Só as cores mudam.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --cor-fundo: #0E1A15;
    --cor-superficie: #16261F;
    --cor-superficie-2: #1F3329;
    --cor-texto: #E8F1EC;
    --cor-texto-2: #A9BBB2;
    --cor-borda: #6F8579;
    --cor-divisor: #253A30;
    --cor-primaria: #5FD4A0;         /* menta clara: links, foco, botão primário */
    --cor-primaria-forte: #7FE0B5;
    --cor-primaria-suave: #1F3329;
    --cor-sobre-primaria: #0E1A15;   /* texto escuro sobre botão menta */
    --cor-acento: #D4A72C;
    --cor-aviso: #F2B544;
    --cor-aviso-suave: #1F3329;
    --cor-perigo: #FF8A80;
    --cor-perigo-suave: #1F3329;
    --cor-info: #A5A0FF;
    --cor-info-suave: #1F3329;
    --cor-foco: #5FD4A0;
  }
}
```
No escuro os selos ganham borda de 1 px na cor do texto do selo, porque o fundo é o mesmo (`#1F3329`) para todos. O **cartão de total** mantém fundo `#0B6B47` com texto branco (6,54:1) nos dois temas, para preservar a identidade.

| Primeiro plano | Fundo | Razão | AA |
| --- | --- | --- | --- |
| #E8F1EC texto | #0E1A15 fundo | 15,48:1 | Sim |
| #E8F1EC texto | #16261F superfície | 13,69:1 | Sim |
| #A9BBB2 texto-2 | #16261F | 7,84:1 | Sim |
| #A9BBB2 texto-2 | #1F3329 | 6,67:1 | Sim |
| #5FD4A0 primária | #16261F | 8,57:1 | Sim |
| #5FD4A0 primária | #1F3329 (selo "caiu") | 7,30:1 | Sim |
| #0E1A15 | #5FD4A0 (botão primário) | 9,69:1 | Sim |
| #F2B544 aviso | #1F3329 (selo) | 7,33:1 | Sim |
| #FF8A80 perigo | #1F3329 (selo) / #16261F | 5,88 / 6,91:1 | Sim |
| #0E1A15 | #FF8A80 (botão excluir) | 7,81:1 | Sim |
| #A5A0FF info | #1F3329 (selo) | 5,80:1 | Sim |
| #6F8579 borda | #16261F / #0E1A15 | 3,99 / 4,51:1 | Sim (3:1) |
| #5FD4A0 foco | #16261F | 8,57:1 | Sim (3:1) |

---

## 3. Componentes

Regra geral: todo elemento interativo tem no mínimo 44×44 px de área de toque (`min-height: var(--toque-min)`; ícones isolados com padding até 44×44). Ícones são SVG inline desenhados no próprio código (sem biblioteca), com `aria-hidden="true"` quando há texto ao lado.

### 3.1 Botões

| Variante | Anatomia | Padrão | Hover/pressionado | Foco | Desabilitado |
| --- | --- | --- | --- | --- | --- |
| **Primário** | fundo `--cor-primaria`, texto `--cor-sobre-primaria` 16 px peso 500, ícone opcional à esquerda, altura 48, padding 0 20 px, `--raio-sm` | verde, texto branco | `--cor-primaria-forte` | anel 3 px + 2 px de deslocamento | fundo `--cor-superficie-2`, texto `--cor-texto-2`, `disabled` real (evitar: preferir validar ao salvar) |
| **Secundário** | fundo `--cor-superficie`, borda 1 px `--cor-borda`, texto `--cor-primaria` | contorno | fundo `--cor-primaria-suave` | idem | idem |
| **Perigo** | fundo `--cor-superficie`, borda 1 px `--cor-perigo`, texto `--cor-perigo` (na tela); na confirmação do diálogo vira sólido: fundo `--cor-perigo`, texto branco | contorno vermelho | fundo `--cor-perigo-suave` | idem | idem |
| **Texto/link** | sem fundo, texto `--cor-primaria` sublinhado no hover, altura mínima 44 | — | sublinhado | idem | — |
| **Flutuante "Adicionar"** | pílula 56 px de altura, ícone "+" e texto "Adicionar", primário, `--sombra-2`, fixo 16 px acima da navegação e 16 px da direita | — | — | idem | — |

- Botões de largura total em telas de formulário e diálogo; em pares, o principal fica à direita no diálogo e embaixo em pilha vertical quando não couber.
- Texto do botão é sempre verbo + objeto ("Salvar assinatura", "Excluir"). Nunca só ícone, exceto "Voltar" na barra de topo (com `aria-label="Voltar"`).

### 3.2 Campo com label e erro

Anatomia (de cima para baixo): **label** visível (14 px, peso 500, `--cor-texto`, `for`=id do campo) → texto de ajuda opcional (14 px, `--cor-texto-2`, `id="ajuda-x"`) → **controle** (altura 48, fundo `--cor-superficie`, borda 1 px `--cor-borda`, `--raio-sm`, texto 16 px) → **mensagem de erro** (14 px, `--cor-perigo`, ícone "!" em círculo, `id="erro-x"`).

| Estado | Visual |
| --- | --- |
| Padrão | borda 1 px `--cor-borda` |
| Foco | anel de foco padrão (borda continua) |
| Erro | borda 2 px `--cor-perigo`, mensagem abaixo, `aria-invalid="true"`, `aria-describedby="ajuda-x erro-x"` |
| Desabilitado/oculto | "Fim do teste" fica com atributo `hidden` quando o checkbox está desmarcado (US-01.CA9) |

Variações:
- **Valor:** `type="text" inputmode="decimal"`, prefixo visual "R$" dentro do campo (à esquerda, `--cor-texto-2`, `aria-hidden`), placeholder "0,00". O label diz "Valor (R$)".
- **Data:** `type="text" inputmode="numeric"`, placeholder "dd/mm/aaaa", `autocomplete="off"`, máscara opcional que insere as barras (ver Decisões de UX).
- **Seleção** (ciclo, forma de pagamento, categoria): `<select>` nativo com seta desenhada, mesma altura.
- **Checkbox** "Está em teste grátis": caixa 24×24 com borda `--cor-borda`, marcado em `--cor-primaria`; label clicável ocupa a linha inteira (área ≥ 44 px).
- Ao tentar salvar com erros: nada é gravado, os valores digitados permanecem, o foco vai para o **primeiro campo com erro**.

### 3.3 Selos

Pílula com ícone de 16 px + texto de 14 px peso 500, padding 4×10 px, `--raio-pilula`. São informativos (não clicáveis), então não precisam de 44 px; se ficarem ao lado de algo clicável, mantêm 8 px de distância. Sempre texto + ícone (nunca só cor).

| Selo | Texto | Ícone | Cores (claro) | `data-testid` |
| --- | --- | --- | --- | --- |
| Vence logo | "hoje", "amanhã", "em 3 dias" | relógio | `--cor-aviso` sobre `--cor-aviso-suave` | `badge-vence-logo` |
| Teste grátis termina | "Teste grátis termina em 5 dias" | ampulheta | `--cor-info` sobre `--cor-info-suave` | `badge-teste-fim` |
| Reajuste subiu | "subiu 12,5% (R$ 5,00)" | seta para cima | `--cor-perigo` sobre `--cor-perigo-suave` | `badge-reajuste` |
| Reajuste caiu | "caiu R$ 5,00 (11,1%)" | seta para baixo | `--cor-primaria` sobre `--cor-primaria-suave` | `badge-reajuste` |
| Pausada | "Pausada" | pausa (‖) | `--cor-texto-2` sobre `--cor-superficie-2` | `badge-pausada` (sugerido) |
| Cancelada | "Cancelada" | X | `--cor-texto-2` sobre `--cor-superficie-2`, borda tracejada 1 px `--cor-borda` | `badge-cancelada` (sugerido) |

Os textos de reajuste seguem literalmente o backlog (US-03.CA1 e CA3), inclusive a ordem diferente entre "subiu" e "caiu".

### 3.4 Item de lista (assinatura)

Anatomia (cartão `--cor-superficie`, `--raio-md`, `--sombra-1`, padding 16, altura mínima 72):

```
┌────────────────────────────────────────┐
│ Nome (18/600)              R$ 44,90    │  ← valor 18/700 tabular, alinhado à direita
│ 03/10/2026 · Cartão · Nubank           │  ← 14/400 texto-2
│ [relógio em 3 dias] [seta subiu 12,5%…] │  ← selos (quebram linha se faltar espaço)
│ Teste terminou em 25/09/2026 — agora é │  ← aviso opcional 14/400 texto-2 com ícone "i"
│ cobrança normal                        │
└────────────────────────────────────────┘
```

- O item inteiro é um link para o detalhe (`<a>` ou `<button>` envolvendo o conteúdo), com nome acessível começando pelo nome da assinatura.
- Estados: padrão; hover/pressionado com fundo `--cor-primaria-suave`; foco com anel envolvendo o cartão. Não há estado desabilitado. Itens pausados/cancelados na lista geral mostram o nome e valor em `--cor-texto-2`.
- Nome longo: quebra em até 2 linhas e corta com reticências; o valor nunca quebra (`white-space: nowrap`).

### 3.5 Cartão de total

Fundo `--cor-primaria` (#0B6B47 nos dois temas), `--raio-lg`, padding 24, filete superior de 4 px em `--cor-acento` (decorativo).

```
┌────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔ (filete dourado)       │
│ Por mês (14/500, menta)            │
│ R$ 58,80   (36/700 branco)         │  data-testid="total-mensal"
│ Por ano (14/500, menta)            │
│ R$ 705,60  (28/700 branco)         │  data-testid="total-anual"
└────────────────────────────────────┘
```
O `data-testid` fica no elemento que contém apenas o valor formatado (para o QA ler o texto exato). Não é interativo.

Cartões de agrupamento (por forma de pagamento e por categoria) usam `--cor-superficie`: linha com rótulo à esquerda, valor à direita e uma barra fina (6 px, `--cor-primaria` sobre trilho `--cor-superficie-2`) proporcional ao maior valor. A barra é decorativa (`aria-hidden`); o valor em texto é a informação.

### 3.6 Estado vazio

Centralizado, padding 32: ilustração simples em SVG inline (carteira/moeda em linha, 96 px, `--cor-primaria` e `--cor-acento`, `aria-hidden`), título 18/600, texto 16/400 `--cor-texto-2`, botão primário. Sem estados de foco próprios além do botão.

### 3.7 Diálogo de confirmação

`<dialog>` nativo aberto com `showModal()` (foco preso, Esc fecha = mesma ação de "Voltar"). Largura `min(100% - 32px, 400px)`, `--raio-lg`, padding 24, véu escuro.

```
┌──────────────────────────────────┐
│ Excluir Netflix?   (22/600)      │
│ Esta ação não pode ser desfeita. │
│                                  │
│ [ Voltar ]   [ Excluir ]         │
└──────────────────────────────────┘
```
- Ao abrir, o foco vai para o botão **seguro** ("Voltar"). Ao fechar, volta para o botão que abriu.
- `aria-labelledby` no título e `aria-describedby` no texto.
- Botão de confirmação: perigo sólido para ações destrutivas (excluir, substituir dados, começar do zero).
- `data-testid`: `confirm-dialog`, `btn-confirmar`, `btn-dialogo-voltar` (sugeridos). **Não usar `btn-cancelar`** no diálogo: esse id já é "Marcar como cancelada" (US-05.CA3).

### 3.8 Navegação

- **Barra de topo** (56 px, `--cor-fundo`): título da tela 22/600 à esquerda; nas telas internas, botão "Voltar" (seta, 44×44, `aria-label="Voltar"`) antes do título.
- **Navegação inferior** fixa (64 px + área segura, `--cor-superficie`, divisor superior): 4 destinos com ícone 24 px + rótulo 14 px, cada um com 1/4 da largura (90 px em 360 px) e altura 64. Ativo: ícone e texto `--cor-primaria`, peso 600, pílula `--cor-primaria-suave` atrás do ícone, `aria-current="page"`. Inativo: `--cor-texto-2`.
- Destinos: **Início** (próximas cobranças), **Assinaturas** (lista geral), **Totais**, **Ajustes**.
- Elemento `<nav aria-label="Principal">`. O conteúdo tem `padding-bottom` suficiente para o último item não ficar atrás da navegação nem do botão flutuante.

### 3.9 Banners (aviso, sucesso, erro)

Faixa no topo do conteúdo, `--raio-md`, padding 12×16, ícone + texto 14–16 px + botão "Fechar" (44×44, `aria-label="Fechar aviso"`).
- Informativo/sucesso: `--cor-primaria-suave` com texto `--cor-texto`, `role="status"`.
- Erro: `--cor-perigo-suave` com texto `--cor-perigo`, `role="alert"`.
- Não somem sozinhos (sem tempo limite); saem ao fechar ou ao trocar de tela.

---

## 4. Telas por história

Convenções dos wireframes: largura de 360 px, margem 16. `[ ]` = botão, `[_____]` = campo, `( )` = selo. "(sugerido)" marca `data-testid` que o backlog não definiu, para facilitar o trabalho do QA; o Dev pode adotar.

Não há estado de carregamento visível: os dados vêm do `localStorage` de forma síncrona e a tela é montada direto. Se algum dia houver espera (importação de arquivo grande), o botão mostra "Importando…" e fica `aria-busy="true"`.

### 4.1 US-02 — Início: Próximas cobranças (tela inicial)

**Objetivo:** ver o que vai ser cobrado e quando, com destaque para o que vence em até N dias.

```
┌──────────────────────────────────────┐ 360
│ Mensalão                             │ barra de topo (logo-texto)
│                                      │
│ Próximas cobranças         (h1 22/600)│
│ Destaque para os próximos 3 dias     │ 14 texto-2 (N vem dos Ajustes)
│                                      │
│ ┌──────────────────────────────────┐ │ upcoming-list (<ul>)
│ │ Spotify                R$ 21,90  │ │ upcoming-item
│ │ 17/10/2026 · Pix Automático      │ │
│ │ (⏱ hoje)                         │ │ badge-vence-logo
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Netflix                R$ 44,90  │ │
│ │ 20/10/2026 · Cartão · Nubank     │ │
│ │ (⏱ em 3 dias) (↑ subiu 12,5% (R$ 5,00))│ badge-reajuste
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Max (HBO)              R$ 39,90  │ │
│ │ 21/10/2026 · Cartão              │ │
│ │ (⌛ Teste grátis termina em 4 dias)│ │ badge-teste-fim
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Globoplay              R$ 29,90  │ │
│ │ 02/11/2026 · Boleto              │ │
│ │ ⓘ Teste terminou em 25/09/2026 — │ │ aviso-teste-terminou (sugerido)
│ │   agora é cobrança normal        │ │
│ └──────────────────────────────────┘ │
│                       [ + Adicionar ]│ btn-adicionar (sugerido), flutuante
├──────────────────────────────────────┤
│ Início | Assinaturas | Totais | Ajustes│
└──────────────────────────────────────┘
```

**Hierarquia:** nome e valor (linha 1) > data e forma de pagamento > selos > aviso.
**Componentes:** barra de topo, item de lista, selos vence logo / teste grátis / reajuste, botão flutuante, navegação.
**Microcopy:**
- Subtítulo: "Destaque para os próximos N dias" (N = 0 → "Destaque só para cobranças de hoje"; N = 1 → "Destaque para hoje e amanhã").
- Selo vence logo: "hoje", "amanhã", "em X dias".
- Selo teste: "Teste grátis termina em X dias" ("termina hoje" / "termina amanhã" para 0 e 1).
- Aviso de teste encerrado: "Teste terminou em dd/mm/aaaa — agora é cobrança normal".
- Forma de pagamento exibida: "Cartão", "Pix Automático", "Boleto", "Débito"; o banco/cartão aparece depois de " · " se preenchido.
**Regras visuais:** item com teste vigente que termina em até N dias mostra só o selo de teste (índigo) quando a data de fim coincide com a próxima cobrança; se a cobrança comum também cair em N dias e for outra data, mostra os dois selos (teste primeiro).
**`data-testid`:** `upcoming-list` no `<ul>`; `upcoming-item` em cada `<li>`; `badge-vence-logo`, `badge-teste-fim`, `badge-reajuste` nos selos dentro do item.

**Estado vazio (US-02.CA9, US-05.CA6)** — substitui a lista:
```
│ Próximas cobranças                   │
│        (ilustração carteira)         │ empty-state (contêiner)
│   Nenhuma cobrança por aqui          │
│   Cadastre suas assinaturas para ver │
│   o que vai ser cobrado e quando.    │
│   Seus dados ficam só neste celular. │
│   [ + Adicionar assinatura ]         │ btn-adicionar-vazio (sugerido)
```
Se houver só assinaturas pausadas/canceladas, o texto vira "Nenhuma assinatura ativa no momento. As pausadas e canceladas ficam em Assinaturas." (mesmo `empty-state`). O botão flutuante some no estado vazio para não duplicar a ação.

### 4.2 US-01 — Nova assinatura (passo 1: catálogo)

**Objetivo:** achar o serviço em poucos toques ou partir para o cadastro livre.

```
┌──────────────────────────────────────┐
│ ←  Nova assinatura                   │
│                                      │
│ Buscar serviço                       │ label
│ [🔍 Ex.: Netflix, academia______]    │ catalog-search (type="search")
│                                      │
│ [ Cadastrar livremente ]             │ secundário, largura total; btn-cadastrar-livre (sugerido)
│                                      │
│ Serviços conhecidos (18/600)         │
│ ┌──────────────────────────────────┐ │ catalog-list (sugerido)
│ │ Netflix                          │ │ catalog-item (sugerido), botão 56 px
│ │ R$ 44,90/mês · Streaming de vídeo│ │
│ ├──────────────────────────────────┤ │
│ │ Spotify                          │ │
│ │ R$ 21,90/mês · Música            │ │
│ └──────────────────────────────────┘ │
│ Valores sugeridos podem estar        │ 14 texto-2
│ desatualizados. Você confere antes   │
│ de salvar.                           │
└──────────────────────────────────────┘
```
- Sem busca: mostra os 18 serviços em ordem alfabética. Com busca: filtra enquanto digita, sem diferenciar maiúsculas e acentos (US-01.CA1). O número de resultados é anunciado num `aria-live="polite"` ("3 serviços encontrados").
- Sem resultado: "Nenhum serviço encontrado para "xyz". Use Cadastrar livremente." (o botão continua visível no alto).
- A navegação inferior fica oculta nas telas de formulário (passo 1 e 2) para dar espaço e evitar saída acidental; "Voltar" retorna à tela anterior.

### 4.3 US-01 / US-05 — Formulário (passo 2: nova ou edição)

**Objetivo:** conferir/preencher os dados e salvar.

```
┌──────────────────────────────────────┐
│ ←  Nova assinatura | Editar Netflix  │
│                                      │
│ Nome                                 │
│ [Spotify___________________________] │ field-nome
│ ! Informe o nome                     │ error-nome (sugerido)
│                                      │
│ Valor (R$)                           │
│ Sugestão do catálogo; confira o que  │ ajuda (só quando veio do catálogo)
│ você paga.                           │
│ [R$ 21,90__________________________] │ field-valor
│ ! Informe um valor maior que zero,   │ error-valor
│   como 39,90                         │
│                                      │
│ Ciclo                                │
│ [Mensal                         ▾]   │ field-ciclo (Mensal/Anual/Semanal)
│                                      │
│ Próxima cobrança                     │
│ [dd/mm/aaaa________________________] │ field-proxima
│ ! Informe uma data válida            │ error-proxima (sugerido)
│                                      │
│ Forma de pagamento                   │
│ [Cartão                         ▾]   │ field-pagamento
│                                      │
│ Banco ou cartão (opcional)           │
│ [Ex.: Nubank, Itaú, cartão final 1234]│ field-banco
│                                      │
│ Categoria                            │
│ [Música                         ▾]   │ field-categoria
│                                      │
│ [✓] Está em teste grátis             │ field-teste (checkbox)
│                                      │
│ Fim do teste grátis                  │ (hidden se desmarcado)
│ [dd/mm/aaaa________________________] │ field-fim-teste
│ ! Informe quando o teste termina     │ error-fim-teste (sugerido)
│                                      │
│ [        Salvar assinatura         ] │ btn-salvar, primário, largura total
└──────────────────────────────────────┘
```

**Hierarquia:** nome e valor primeiro (o que o usuário mais confere), depois quando/como paga, por último categoria e teste.
**Valores padrão no cadastro livre:** todos os campos vazios; ciclo e pagamento com a opção "Selecione…" (o backlog pede formulário vazio — ver Decisões de UX sobre validação desses selects); categoria "Selecione…".
**Microcopy de erro (curta, diz como corrigir):**
- Nome: "Informe o nome" (texto exato do US-01.CA6).
- Valor vazio/zero/negativo/letras: "Informe um valor maior que zero, como 39,90". Mais de 2 casas: "Use no máximo 2 casas decimais, como 10,99".
- Próxima cobrança vazia: "Informe a data da próxima cobrança". Inválida: "Data inválida. Use dd/mm/aaaa, como 15/10/2026".
- Fim do teste vazio/inválido: "Informe quando o teste termina (dd/mm/aaaa)".
- Ciclo/pagamento/categoria sem escolha: "Escolha o ciclo" / "Escolha a forma de pagamento" / "Escolha a categoria".
**Depois de salvar:** volta à tela de onde veio (Início, Assinaturas ou detalhe) com banner de sucesso "Spotify salva." Se a data foi avançada (US-01.CA8), o banner diz: "A próxima cobrança estava no passado e foi ajustada para 15/10/2026." (`role="status"`, `data-testid="aviso-data-avancada"` sugerido).
**Edição (US-05.CA1, US-03):** mesmo formulário, título "Editar Netflix", botão "Salvar alterações" (mesmo `btn-salvar`). Se o valor mudou, o banner de sucesso inclui o reajuste: "Netflix salva. Valor subiu 12,5% (R$ 5,00)."

### 4.4 US-03 / US-05 / US-06 — Detalhe da assinatura

**Objetivo:** ver tudo sobre uma assinatura, seu histórico de preços e agir (editar, pausar, cancelar, excluir, saber como cancelar).

```
┌──────────────────────────────────────┐
│ ←  Netflix                           │
│                                      │
│ R$ 44,90 /mês        (28/700)        │
│ (↑ subiu 12,5% (R$ 5,00))            │ badge-reajuste
│                                      │
│ ┌──────────────────────────────────┐ │ lista de definição <dl>
│ │ Próxima cobrança     20/10/2026  │ │
│ │ Ciclo                Mensal      │ │
│ │ Pagamento            Cartão      │ │
│ │ Banco ou cartão      Nubank      │ │
│ │ Categoria   Streaming de vídeo   │ │
│ │ Situação             Ativa       │ │ (ou selo Pausada / Cancelada em dd/mm/aaaa)
│ └──────────────────────────────────┘ │
│                                      │
│ [ Editar ]          [ Como cancelar ]│ btn-editar | btn-como-cancelar (secundários, 2 colunas)
│ ┌ Como cancelar ───────────────────┐ │ cancel-guide (expande abaixo do botão)
│ │ No site ou app: Conta >          │ │
│ │ Assinatura > Cancelar assinatura.│ │
│ │ Comprou pela loja de apps? ...   │ │
│ │ ⓘ O Mensalão não cancela nada    │ │
│ │ sozinho. Depois de cancelar no   │ │
│ │ serviço, marque aqui:            │ │
│ │ [ Marcar como cancelada ]        │ │ btn-guia-marcar-cancelada (sugerido)
│ └──────────────────────────────────┘ │
│                                      │
│ Histórico de preços  (18/600)        │
│ ┌──────────────────────────────────┐ │ price-history (<ol>, mais antigo primeiro)
│ │ 10/03/2026  R$ 29,90 → R$ 34,90  │ │
│ │ 12/06/2026  R$ 34,90 → R$ 39,90  │ │
│ │ 01/10/2026  R$ 39,90 → R$ 44,90  │ │
│ │ Valor atual           R$ 44,90   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [ Pausar ]                           │ btn-pausar (secundário, largura total)
│ [ Marcar como cancelada ]            │ btn-cancelar (secundário, largura total)
│                                      │
│ [ Excluir assinatura ]               │ btn-excluir (perigo, 24 px abaixo dos demais)
└──────────────────────────────────────┘
```

**Hierarquia:** valor e selo > dados > ações frequentes (Editar, Como cancelar) > histórico > mudança de situação > Excluir (último, separado).
**Variações por situação:**
- Ativa: Pausar, Marcar como cancelada, Excluir.
- Pausada: selo "Pausada"; **Reativar** (primário, `btn-reativar` sugerido) no lugar de Pausar; Marcar como cancelada; Excluir.
- Cancelada: selo "Cancelada" e linha "Cancelada em dd/mm/aaaa"; Reativar; Excluir. "Marcar como cancelada" some (inclusive no guia).
- Ao pausar/cancelar/reativar: fica na mesma tela, atualiza a situação e mostra banner ("Netflix pausada. Ela não entra nos totais nem nas próximas cobranças." / "Netflix marcada como cancelada." / "Netflix reativada. Próxima cobrança: 20/11/2026."). O foco vai para o banner.
**Histórico (US-03.CA5):** sem histórico, a seção mostra "Sem alterações de preço desde o cadastro." e nenhum selo (US-03.CA6).
**Guia "Como cancelar" (US-06):** o botão é um disclosure (`aria-expanded`, `aria-controls="guia"`); o painel `cancel-guide` mostra, nesta ordem e em parágrafos curtos:
1. Texto do serviço (catálogo) ou o genérico do US-06.CA3 (cadastro livre sem Pix).
2. Observação da loja de apps (só itens do catálogo).
3. Se Pix Automático: título "Pix Automático" + texto do US-06.CA2, com "no app do Banco X" quando houver banco.
4. Aviso fixo: "O Mensalão não cancela nada automaticamente. Depois de cancelar no serviço, use Marcar como cancelada." + botão que executa a mesma ação de `btn-cancelar`.
Sem links externos, telefones ou e-mails.
**Excluir (US-05.CA5):** abre o diálogo "Excluir Netflix?" / "Esta ação não pode ser desfeita." / [Voltar] [Excluir]. Ao confirmar, volta ao Início com banner "Netflix excluída."

### 4.5 US-05 — Assinaturas (lista geral)

**Objetivo:** ver todas as assinaturas, inclusive pausadas e canceladas, e entrar no detalhe.

```
┌──────────────────────────────────────┐
│ Assinaturas                          │
│ 7 ativas · 1 pausada                 │ 14 texto-2
│                                      │
│ ┌──────────────────────────────────┐ │ sub-list (sugerido)
│ │ Academia             R$ 99,90/mês│ │ sub-item (sugerido)
│ │ Saúde e bem-estar · Débito       │ │
│ ├──────────────────────────────────┤ │
│ │ Deezer               R$ 22,90/mês│ │ (texto-2 quando pausada)
│ │ Música · Cartão                  │ │
│ │ (‖ Pausada)                      │ │ badge-pausada (sugerido)
│ ├──────────────────────────────────┤ │
│ │ Netflix              R$ 44,90/mês│ │
│ │ (↑ subiu 12,5% (R$ 5,00))        │ │ badge-reajuste (US-03.CA8)
│ └──────────────────────────────────┘ │
│                                      │
│ ▸ Canceladas (2)                     │ <details>, filtro-canceladas (sugerido)
│   Paramount+   R$ 27,90/mês          │ (expandido) badge-cancelada
│   (× Cancelada em 02/09/2026)        │
│                       [ + Adicionar ]│
├──────────────────────────────────────┤
│ Início | Assinaturas | Totais | Ajustes│
└──────────────────────────────────────┘
```
- Ordem alfabética (ativas e pausadas juntas, pausadas com selo). Canceladas numa seção recolhível no fim, fechada por padrão.
- Valor com sufixo do ciclo: "/mês", "/ano", "/semana".
- Vazia: mesmo componente de estado vazio, texto "Você ainda não cadastrou assinaturas." + "Adicionar assinatura".

### 4.6 US-04 — Totais

**Objetivo:** entender quanto as assinaturas pesam por mês e por ano.

```
┌──────────────────────────────────────┐
│ Totais                               │
│                                      │
│ ┌──────────────────────────────────┐ │ cartão de total (verde)
│ │ Por mês                          │ │
│ │ R$ 58,80                         │ │ total-mensal
│ │ Por ano                          │ │
│ │ R$ 705,60                        │ │ total-anual
│ │ 2 assinaturas ativas             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌ ⌛ ──────────────────────────────┐ │ total-em-teste (sugerido), fundo info-suave
│ │ Em teste: 1 assinatura —         │ │
│ │ R$ 39,90/mês após o teste        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Por forma de pagamento (18/600)      │
│ ┌──────────────────────────────────┐ │ total-por-pagamento
│ │ Cartão                 R$ 44,90  │ │
│ │ ███████████████████████████░░░░  │ │
│ │ Pix Automático         R$ 13,90  │ │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░░  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Por categoria (18/600)               │
│ ┌──────────────────────────────────┐ │ total-por-categoria (maior → menor)
│ │ Streaming de vídeo     R$ 44,90  │ │
│ │ Streaming / Compras    R$ 13,90  │ │
│ └──────────────────────────────────┘ │
│ Valores mensais equivalentes:        │ 14 texto-2
│ anuais ÷ 12, semanais × 52 ÷ 12.     │
├──────────────────────────────────────┤
│ Início | Assinaturas | Totais | Ajustes│
└──────────────────────────────────────┘
```
- Nos grupos, cada linha mostra o valor mensal equivalente. Só formas de pagamento com valor > 0 (US-04.CA4).
- "Em teste" só aparece se houver teste vigente; plural correto ("1 assinatura", "2 assinaturas").
- **Estado vazio (US-04.CA8):** o cartão continua com "R$ 0,00" nos dois totais; abaixo, o componente de estado vazio sem ilustração: "Sem assinaturas ativas. Os totais aparecem quando você cadastrar ou reativar uma." + [Adicionar assinatura] (`data-testid="empty-state-totais"` sugerido). As seções de agrupamento não aparecem.

### 4.7 US-02 / US-07 — Ajustes

**Objetivo:** mudar o aviso de N dias e fazer backup.

```
┌──────────────────────────────────────┐
│ Ajustes                              │
│                                      │
│ Avisos (18/600)                      │
│ Destacar cobranças com quantos dias  │ label
│ de antecedência?                     │
│ De 0 a 30 dias. 0 = só no dia.       │ ajuda
│ [ 3 ______ ] dias                    │ config-dias-aviso (inputmode="numeric", 120 px)
│ ! Use um número inteiro de 0 a 30    │ error-config-dias (sugerido)
│ [ Salvar aviso ]                     │ btn-salvar-config (sugerido), secundário
│                                      │
│ Backup (18/600)                      │
│ Seus dados ficam só neste celular.   │ texto-2
│ Guarde uma cópia em arquivo para não │
│ perder tudo ao trocar de aparelho.   │
│ [ Exportar backup ]                  │ btn-exportar (primário, largura total)
│ [ Importar backup ]                  │ btn-importar (secundário, largura total)
│   (input type=file oculto, accept=".json,application/json") input-importar (sugerido)
│                                      │
│ Sobre (18/600)                       │
│ Mensalão não se conecta a bancos e   │
│ não envia seus dados para a internet.│
├──────────────────────────────────────┤
│ Início | Assinaturas | Totais | Ajustes│
└──────────────────────────────────────┘
```
- N salvo: banner "Aviso atualizado: destaque para os próximos 7 dias." Inválido: erro no campo e o valor anterior continua valendo (o campo mostra o que foi digitado até corrigir; ao sair da tela volta ao valor salvo).
- Exportar: baixa `mensalao-backup-aaaa-mm-dd.json` e mostra banner "Backup exportado: mensalao-backup-2026-10-17.json".
- Importar (US-07.CA2): após escolher o arquivo válido, diálogo "Importar backup?" / "O arquivo tem 12 assinaturas. Seus dados atuais serão substituídos e isso não pode ser desfeito." / [Voltar] [Substituir dados]. Ao confirmar: banner "Backup importado: 12 assinaturas."
- Importar inválido (US-07.CA3): banner de erro (`role="alert"`, `data-testid="import-error"` sugerido): "Não foi possível importar. O arquivo não é um backup válido do Mensalão. Seus dados atuais não foram alterados." Quando der para ser específico, uma segunda linha: "Versão do backup desconhecida." / "Há valores ou datas inválidos no arquivo."

### 4.8 US-08 — Instalação, offline e dados corrompidos

- **Instalável:** manifest conforme seção 5. Não há botão próprio de instalar no MVP; o navegador oferece a instalação.
- **Offline:** nenhuma tela muda; não há aviso de "sem conexão", porque nada depende de rede.
- **360 px:** todas as telas acima foram desenhadas em 360 px; selos e textos longos quebram linha, valores não quebram. Nenhum elemento com largura fixa maior que 328 px.
- **Dados corrompidos (US-08.CA4):** tela cheia no lugar do Início, sem navegação inferior:

```
┌──────────────────────────────────────┐
│ Mensalão                             │
│                                      │
│ ┌ ! ───────────────────────────────┐ │ corrupt-warning (sugerido), role="alert"
│ │ Não conseguimos ler seus dados   │ │ fundo perigo-suave
│ │ salvos                           │ │
│ │ Os dados deste aparelho parecem  │ │
│ │ danificados. Nada foi apagado.   │ │
│ │ Você pode restaurar um backup ou │ │
│ │ começar do zero.                 │ │
│ └──────────────────────────────────┘ │
│ [ Importar backup ]                  │ btn-importar (primário)
│ [ Começar do zero ]                  │ btn-comecar-zero (sugerido), perigo
└──────────────────────────────────────┘
```
"Começar do zero" abre o diálogo "Apagar os dados salvos?" / "Os dados danificados serão apagados e o app começará vazio. Se tiver um backup, importe-o antes." / [Voltar] [Apagar e começar]. Só depois da confirmação os dados são sobrescritos.

---

## 5. Navegação e manifest

### 5.1 Mapa de telas

```
             ┌────────── navegação inferior (sempre visível nas 4 abas) ──────────┐
             Início ─────────── Assinaturas ─────────── Totais ─────────── Ajustes
               │                    │                                       │
  [+ Adicionar]│        [+ Adicionar]│ toque no item                         │ dados corrompidos
               ▼                    ▼                                       ▼
        Nova: catálogo ──▶ Formulário (novo) ──salvar──▶ volta à origem    tela de recuperação
               ▲                                                           (substitui o Início)
  toque no item│ (Início ou Assinaturas)
               ▼
            Detalhe ──[Editar]──▶ Formulário (edição) ──salvar──▶ Detalhe
               │──[Como cancelar]──▶ guia expandido na mesma tela
               │──[Pausar/Reativar/Marcar como cancelada]──▶ mesma tela, banner
               └──[Excluir]──▶ diálogo ──confirmar──▶ Início
```

Rotas sugeridas (hash, funcionam em subdiretório e offline): `#/` Início, `#/assinaturas`, `#/totais`, `#/ajustes`, `#/nova`, `#/nova/form` (com o serviço escolhido), `#/assinatura/<id>`, `#/assinatura/<id>/editar`. O botão "Voltar" do navegador/Android precisa funcionar igual ao "Voltar" da barra de topo. A cada troca de tela, o foco vai para o título (`h1`, `tabindex="-1"`) e o `document.title` muda ("Totais — Mensalão").

### 5.2 Manifest e ícone

| Campo | Valor |
| --- | --- |
| `name` / `short_name` | "Mensalão" / "Mensalão" |
| `display` | `standalone` |
| `start_url` / `scope` | `./` / `./` |
| `theme_color` | `#0B6B47` |
| `background_color` | `#F5F8F6` |
| `lang` | `pt-BR` |
| Meta `theme-color` no HTML | `#0B6B47` (claro) e `#0E1A15` com `media="(prefers-color-scheme: dark)"` |

**Ícone (192×192 e 512×512 px, PNG gerado localmente pelo Dev a partir de um SVG próprio):**
- Fundo quadrado cheio `#08573A` (verde-cédula forte), sem transparência, para servir também como `maskable`.
- No centro, uma moeda: círculo `#D4A72C` (dourado) com diâmetro de 56% do lado, com um anel interno fino `#08573A` a 8% da borda da moeda.
- Dentro da moeda, a letra "M" em `#08573A`, peso forte, altura de 26% do lado, centralizada. Contraste moeda/fundo e "M"/moeda: 3,85:1 (gráfico, AA).
- Todo o desenho fica dentro da zona segura central de 80% (exigência de ícone maskable). Declarar `"purpose": "any maskable"` ou duas entradas.
- Favicon: o mesmo desenho em SVG.

---

## 6. Decisões de UX (para o Renato confirmar)

Fixadas por mim porque o backlog não definia:

1. **Navegação em 4 abas inferiores** (Início, Assinaturas, Totais, Ajustes) + botão flutuante "Adicionar". Formulários escondem a navegação.
2. **Ações de editar/pausar/cancelar/excluir/como cancelar ficam no detalhe** da assinatura (toque no item abre o detalhe), não no item da lista. Mantém a lista limpa e evita toques acidentais.
3. **Canceladas numa seção recolhível** no fim da lista geral (atende "seção/filtro Canceladas" do US-05.CA3); pausadas ficam na lista principal com selo.
4. **Campos de data como texto `dd/mm/aaaa`** (teclado numérico), não `<input type="date">`. O seletor nativo usa outro formato no DOM e não permite digitar 31/02/2026, que o US-01.CA7 pede para validar. Alternativa: seletor nativo (mais confortável no celular), com o QA ajustando o teste.
5. **Selos de proximidade com "amanhã"**: 0 = "hoje", 1 = "amanhã", 2+ = "em X dias"; no teste grátis, "termina hoje" / "termina amanhã". O backlog cita "hoje" e "em 3 dias"; confirmar se "amanhã" pode (o QA testará o texto).
6. **Cadastro livre com selects em "Selecione…"** e erro se ficarem sem escolha (o backlog pede formulário vazio, mas não fala de validação de ciclo, pagamento e categoria). Alternativa: pré-selecionar Mensal / Cartão / Outros.
7. **Aviso "Teste terminou…"** continua no item enquanto a opção "Está em teste grátis" estiver marcada; some quando o usuário edita e desmarca. **Sugestão ao Produto:** definir por quanto tempo esse aviso aparece.
8. **Banners não somem sozinhos** e o retorno após salvar é para a tela de origem, com o aviso de data ajustada (US-01.CA8) no banner.
9. **Diálogo com "Voltar"** (não "Cancelar") como ação segura, para não confundir com "Marcar como cancelada"; o foco abre no "Voltar".
10. **"Marcar como cancelada" não pede confirmação** (é reversível com Reativar). Excluir, substituir dados na importação e começar do zero pedem.
11. **Tema escuro automático** pelo sistema, sem chave manual; o cartão de total fica verde nos dois temas.
12. **Âmbar para "vence logo", vermelho para "subiu" e erros, índigo para teste grátis.** O dourado da direção fica só decorativo (ícone e filete), porque como texto não passa em AA sobre fundos claros. Ajuste por acessibilidade registrado.
13. **`data-testid` sugeridos** (marcados "sugerido" na seção 4) para elementos que o backlog não nomeou: `btn-adicionar`, `btn-adicionar-vazio`, `btn-cadastrar-livre`, `catalog-list`, `catalog-item`, `error-nome`, `error-proxima`, `error-fim-teste`, `aviso-data-avancada`, `aviso-teste-terminou`, `btn-reativar`, `btn-guia-marcar-cancelada`, `badge-pausada`, `badge-cancelada`, `sub-list`, `sub-item`, `filtro-canceladas`, `total-em-teste`, `empty-state-totais`, `btn-salvar-config`, `error-config-dias`, `input-importar`, `import-error`, `confirm-dialog`, `btn-confirmar`, `btn-dialogo-voltar`, `corrupt-warning`, `btn-comecar-zero`.
14. **Sugestão ao Produto:** os textos de reajuste do backlog têm ordens diferentes ("subiu 12,5% (R$ 5,00)" × "caiu R$ 5,00 (11,1%)"). Mantive literalmente; se quiserem padronizar, o ajuste tem que ser feito no critério de aceite.

---
---

# Parte 2 — Sprint 2 (Pro e publicação)

Entrada: `docs/backlog.md` da sprint 2 (US-09, US-11 a US-17; US-10 e US-18 removidas), decisões D-01 a D-12. Tudo da Parte 1 continua valendo; aqui só o que é novo ou muda.

## 7. Princípios e tokens da sprint 2

### 7.1 Princípios (acréscimos)

1. **O Pro se explica, não insiste.** Recurso Pro no plano grátis aparece no lugar onde estaria, com o que faz e um botão "Conhecer o Pro". Nada de cadeado gritante, contagem regressiva, "oferta", pop-up que reaparece sozinho ou anúncio (D-11). O único diálogo do Pro aparece quando a própria pessoa tenta adicionar ou reativar além do limite.
2. **O grátis nunca piora.** Nada que a sprint 1 entregou ganha cadeado. Limite e revogação nunca apagam, escondem ou pausam dados; os textos dizem isso.
3. **Honestidade sobre limites técnicos.** Lembrete sem garantia de horário e backup que não sobrevive à perda do aparelho são ditos na própria tela, em linguagem simples, junto do controle.
4. **Gráfico é texto com desenho, não desenho com texto.** Todo valor do gráfico também está em texto (legenda-tabela com categoria, R$ e %); a cor ajuda, mas nunca é o único meio.

### 7.2 Tokens novos (valem para todos os temas)

Acrescentar ao `:root` da seção 2. O cartão de total deixa de ter cores fixas no CSS e passa a usar tokens (os valores padrão são exatamente os da sprint 1, então nada muda visualmente no verde-cédula).

```css
:root {
  /* Cartão de total (antes fixo em #0B6B47 / #FFFFFF / #E3F4EC no CSS) */
  --cor-total-fundo: #0B6B47;
  --cor-total-texto: #FFFFFF;
  --cor-total-rotulo: #E3F4EC;

  /* Gráfico por categoria — tema claro (iguais em todos os temas; superfície clara é sempre #FFFFFF) */
  --cor-grafico-1: #0B6B47;  /* verde */
  --cor-grafico-2: #2563B0;  /* azul */
  --cor-grafico-3: #B4530F;  /* terracota */
  --cor-grafico-4: #7B3FA8;  /* roxo */
  --cor-grafico-5: #B0285F;  /* framboesa */
  --cor-grafico-6: #5C6E0A;  /* oliva */
  --cor-grafico-7: #66706B;  /* cinza: "Outras categorias" */

  /* Interruptor (switch) */
  --largura-switch: 52px;
  --altura-switch: 32px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --cor-grafico-1: #5FD4A0;
    --cor-grafico-2: #7DB3FF;
    --cor-grafico-3: #FFA36B;
    --cor-grafico-4: #C9A2FF;
    --cor-grafico-5: #FF8FB8;
    --cor-grafico-6: #C8D46A;
    --cor-grafico-7: #A9BBB2;
  }
}
```

**Contraste das cores do gráfico** (elemento gráfico: exige 3:1 contra o fundo do cartão). Cada fatia também é separada das vizinhas por um vão de 2 px na cor da superfície, então a fronteira entre fatias sempre tem o contraste da tabela abaixo.

| Cor (claro) | vs #FFFFFF | Cor (escuro) | vs superfície escura mais clara dos 4 temas (#16261F) | AA (3:1) |
| --- | --- | --- | --- | --- |
| #0B6B47 | 6,54:1 | #5FD4A0 | 8,57:1 | Sim |
| #2563B0 | 6,02:1 | #7DB3FF | 7,33:1 | Sim |
| #B4530F | 5,02:1 | #FFA36B | 8,04:1 | Sim |
| #7B3FA8 | 6,73:1 | #C9A2FF | 7,58:1 | Sim |
| #B0285F | 6,33:1 | #FF8FB8 | 7,42:1 | Sim |
| #5C6E0A | 5,69:1 | #C8D46A | 9,83:1 | Sim |
| #66706B | 5,13:1 | #A9BBB2 | 7,84:1 | Sim |

As superfícies escuras dos temas extras (#152037, #1C1C1E, #221820) são ainda mais escuras que #16261F, então as razões só aumentam. A cor do gráfico **não muda com o tema** (o verde do item 1 é a cor do gráfico, não a primária do tema), para a mesma categoria não trocar de cor quando o usuário troca de tema.

### 7.3 Temas Pro (US-17)

Quatro temas. **Verde-cédula** é o padrão (o da sprint 1, grátis, claro/escuro automático). Os três extras do Pro são **Azul-noite**, **Grafite** e **Ameixa**; cada um tem versão clara e escura, escolhida automaticamente pelo `prefers-color-scheme` do sistema, igual ao verde-cédula (US-17.CA5). O âmbar sugerido como exemplo no backlog **não** virou tema: ele se confundiria com o âmbar de "vence logo" (ver decisão S2-6).

**Aplicação:** atributo `data-tema` no `<html>` (`verde-cedula` = sem atributo). Só variáveis de cor mudam; nenhum tema altera tamanhos, espaços ou componentes. As cores semânticas (aviso, perigo, info e seus fundos suaves), o acento dourado e o texto do botão de perigo sólido continuam as mesmas da sprint 1 em todos os temas; os pares delas com os novos fundos foram conferidos abaixo.

```css
/* ===== Azul-noite ===== */
[data-tema="azul-noite"] {
  --cor-fundo: #F4F6FA;  --cor-superficie: #FFFFFF;  --cor-superficie-2: #E8ECF3;
  --cor-texto: #121A2B;  --cor-texto-2: #475266;  --cor-borda: #76839A;  --cor-divisor: #D9DFE9;
  --cor-primaria: #1F4E8C;  --cor-primaria-forte: #173D6E;  --cor-primaria-suave: #E3ECF8;
  --cor-sobre-primaria: #FFFFFF;  --cor-foco: #1F4E8C;
  --cor-total-fundo: #1F4E8C;  --cor-total-texto: #FFFFFF;  --cor-total-rotulo: #E3ECF8;
}
@media (prefers-color-scheme: dark) {
  [data-tema="azul-noite"] {
    --cor-fundo: #0D1424;  --cor-superficie: #152037;  --cor-superficie-2: #1E2B45;
    --cor-texto: #E6ECF7;  --cor-texto-2: #A8B4CA;  --cor-borda: #6E7C96;  --cor-divisor: #26344F;
    --cor-primaria: #8DB8FF;  --cor-primaria-forte: #B0CEFF;  --cor-primaria-suave: #1E2B45;
    --cor-sobre-primaria: #0D1424;  --cor-foco: #8DB8FF;
    --cor-aviso-suave: #1E2B45;  --cor-perigo-suave: #1E2B45;  --cor-info-suave: #1E2B45;
    /* total igual ao claro: #1F4E8C com texto branco */
  }
}

/* ===== Grafite ===== */
[data-tema="grafite"] {
  --cor-fundo: #F5F5F4;  --cor-superficie: #FFFFFF;  --cor-superficie-2: #EAEAE8;
  --cor-texto: #1C1C1E;  --cor-texto-2: #545458;  --cor-borda: #7D7D82;  --cor-divisor: #DEDEDB;
  --cor-primaria: #34495E;  --cor-primaria-forte: #243444;  --cor-primaria-suave: #E7EAED;
  --cor-sobre-primaria: #FFFFFF;  --cor-foco: #34495E;
  --cor-total-fundo: #34495E;  --cor-total-texto: #FFFFFF;  --cor-total-rotulo: #E7EAED;
}
@media (prefers-color-scheme: dark) {
  [data-tema="grafite"] {
    --cor-fundo: #121212;  --cor-superficie: #1C1C1E;  --cor-superficie-2: #2A2A2D;
    --cor-texto: #ECECEC;  --cor-texto-2: #B0B0B5;  --cor-borda: #7A7A80;  --cor-divisor: #333336;
    --cor-primaria: #C9D3DD;  --cor-primaria-forte: #E1E7ED;  --cor-primaria-suave: #2A2A2D;
    --cor-sobre-primaria: #121212;  --cor-foco: #C9D3DD;
    --cor-aviso-suave: #2A2A2D;  --cor-perigo-suave: #2A2A2D;  --cor-info-suave: #2A2A2D;
  }
}

/* ===== Ameixa ===== */
[data-tema="ameixa"] {
  --cor-fundo: #F8F5F7;  --cor-superficie: #FFFFFF;  --cor-superficie-2: #EFE9ED;
  --cor-texto: #22161E;  --cor-texto-2: #5C4B56;  --cor-borda: #8A7884;  --cor-divisor: #E4DAE0;
  --cor-primaria: #7A2E62;  --cor-primaria-forte: #5F2049;  --cor-primaria-suave: #F5E6EF;
  --cor-sobre-primaria: #FFFFFF;  --cor-foco: #7A2E62;
  --cor-total-fundo: #7A2E62;  --cor-total-texto: #FFFFFF;  --cor-total-rotulo: #F5E6EF;
}
@media (prefers-color-scheme: dark) {
  [data-tema="ameixa"] {
    --cor-fundo: #170F15;  --cor-superficie: #221820;  --cor-superficie-2: #30232D;
    --cor-texto: #F2E9EF;  --cor-texto-2: #C2AFBC;  --cor-borda: #8C7986;  --cor-divisor: #3A2B36;
    --cor-primaria: #F0A8D8;  --cor-primaria-forte: #F7C8E7;  --cor-primaria-suave: #30232D;
    --cor-sobre-primaria: #170F15;  --cor-foco: #F0A8D8;
    --cor-aviso-suave: #30232D;  --cor-perigo-suave: #30232D;  --cor-info-suave: #30232D;
  }
}
```

Atenção de especificidade: o bloco escuro do verde-cédula está em `:root`; os temas usam `[data-tema=...]` no mesmo elemento `<html>`, que tem especificidade maior, então vencem nos dois modos. Os blocos claros dos temas não podem ficar dentro de `@media (prefers-color-scheme: light)`, senão o escuro do `:root` vence no modo escuro antes do bloco escuro do tema.

**Cor do navegador (`theme-color`, US-17.CA8).** O app atualiza as duas metas `theme-color` (com `media` claro e escuro) ao aplicar o tema:

| Tema | `theme-color` claro | `theme-color` escuro |
| --- | --- | --- |
| Verde-cédula (padrão) | #0B6B47 | #0E1A15 |
| Azul-noite | #1F4E8C | #0D1424 |
| Grafite | #34495E | #121212 |
| Ameixa | #7A2E62 | #170F15 |

O `theme_color` do manifest continua #0B6B47 (o manifest é estático; a meta do HTML acompanha o tema em tempo de execução).

#### 7.3.1 Contraste dos temas (WCAG 2.1, luminância relativa)

Texto normal 4,5:1; bordas, foco e ícones 3:1. "sup" = superfície; "sup-2" = superfície-2 (também fundo de selos e item ativo da navegação no escuro).

**Azul-noite — claro**

| Par | Razão | AA |
| --- | --- | --- |
| texto #121A2B / sup #FFFFFF · fundo #F4F6FA · primária-suave #E3ECF8 | 17,38 · 16,06 · 14,58 | Sim |
| texto-2 #475266 / sup · fundo · sup-2 #E8ECF3 | 7,87 · 7,28 · 6,65 | Sim |
| primária #1F4E8C / sup · fundo · primária-suave (selo "caiu", selo Pro) | 8,31 · 7,68 · 6,97 | Sim |
| #FFFFFF / primária (botão, total) · primária-forte #173D6E | 8,31 · 10,89 | Sim |
| rótulo do total #E3ECF8 / #1F4E8C | 6,97 | Sim |
| borda #76839A / sup · fundo | 3,83 · 3,54 | Sim (3:1) |
| perigo #B42318 · aviso #8F4A00 · info #4338A8 / fundo #F4F6FA | 6,07 · 6,16 · 8,19 | Sim |

**Azul-noite — escuro**

| Par | Razão | AA |
| --- | --- | --- |
| texto #E6ECF7 / fundo #0D1424 · sup #152037 · sup-2 #1E2B45 | 15,49 · 13,69 · 11,91 | Sim |
| texto-2 #A8B4CA / fundo · sup · sup-2 | 8,79 · 7,77 · 6,76 | Sim |
| primária #8DB8FF / fundo · sup · sup-2 | 9,13 · 8,06 · 7,02 | Sim |
| #0D1424 / primária (botão) · primária-forte #B0CEFF | 9,13 · 11,48 | Sim |
| borda #6E7C96 / sup · fundo | 3,85 · 4,36 | Sim (3:1) |
| aviso #F2B544 · perigo #FF8A80 · info #A5A0FF / sup-2 (selos) | 7,71 · 6,19 · 6,10 | Sim |
| perigo #FF8A80 / sup (erro de campo) | 7,11 | Sim |
| total #FFFFFF / #1F4E8C · rótulo #E3ECF8 / #1F4E8C | 8,31 · 6,97 | Sim |

**Grafite — claro**

| Par | Razão | AA |
| --- | --- | --- |
| texto #1C1C1E / sup · fundo #F5F5F4 · primária-suave #E7EAED | 17,01 · 15,60 · 14,09 | Sim |
| texto-2 #545458 / sup · fundo · sup-2 #EAEAE8 | 7,54 · 6,91 · 6,26 | Sim |
| primária #34495E / sup · fundo · primária-suave | 9,29 · 8,52 · 7,69 | Sim |
| #FFFFFF / primária · primária-forte #243444 | 9,29 · 12,73 | Sim |
| rótulo do total #E7EAED / #34495E | 7,69 | Sim |
| borda #7D7D82 / sup · fundo | 4,10 · 3,75 | Sim (3:1) |
| perigo · aviso · info / fundo #F5F5F4 | 6,02 · 6,11 · 8,12 | Sim |

**Grafite — escuro**

| Par | Razão | AA |
| --- | --- | --- |
| texto #ECECEC / fundo #121212 · sup #1C1C1E · sup-2 #2A2A2D | 15,86 · 14,40 · 12,11 | Sim |
| texto-2 #B0B0B5 / fundo · sup · sup-2 | 8,67 · 7,88 · 6,63 | Sim |
| primária #C9D3DD / fundo · sup · sup-2 | 12,35 · 11,22 · 9,44 | Sim |
| #121212 / primária · primária-forte #E1E7ED | 12,35 · 15,04 | Sim |
| borda #7A7A80 / sup · fundo | 3,99 · 4,39 | Sim (3:1) |
| aviso · perigo · info / sup-2 | 7,82 · 6,27 · 6,18 | Sim |
| perigo / sup | 7,45 | Sim |
| total #FFFFFF / #34495E | 9,29 | Sim |

**Ameixa — claro**

| Par | Razão | AA |
| --- | --- | --- |
| texto #22161E / sup · fundo #F8F5F7 · primária-suave #F5E6EF | 17,48 · 16,14 · 14,52 | Sim |
| texto-2 #5C4B56 / sup · fundo · sup-2 #EFE9ED | 8,09 · 7,47 · 6,76 | Sim |
| primária #7A2E62 / sup · fundo · primária-suave | 8,77 · 8,10 · 7,29 | Sim |
| #FFFFFF / primária · primária-forte #5F2049 | 8,77 · 11,74 | Sim |
| rótulo do total #F5E6EF / #7A2E62 | 7,29 | Sim |
| borda #8A7884 / sup · fundo | 4,12 · 3,80 | Sim (3:1) |
| perigo · aviso · info / fundo #F8F5F7 | 6,07 · 6,16 · 8,18 | Sim |

**Ameixa — escuro**

| Par | Razão | AA |
| --- | --- | --- |
| texto #F2E9EF / fundo #170F15 · sup #221820 · sup-2 #30232D | 15,85 · 14,50 · 12,59 | Sim |
| texto-2 #C2AFBC / fundo · sup · sup-2 | 9,10 · 8,32 · 7,23 | Sim |
| primária #F0A8D8 / fundo · sup · sup-2 | 10,13 · 9,26 · 8,05 | Sim |
| #170F15 / primária · primária-forte #F7C8E7 | 10,13 · 12,88 | Sim |
| borda #8C7986 / sup · fundo | 4,26 · 4,66 | Sim (3:1) |
| aviso · perigo · info / sup-2 | 8,17 · 6,55 · 6,46 | Sim |
| perigo / sup | 7,54 | Sim |
| total #FFFFFF / #7A2E62 | 8,77 | Sim |

Em todos os temas o foco usa a primária do tema, que passa de 3:1 contra fundo e superfície (tabelas acima), e o deslocamento de 2 px mantém o anel sobre o fundo mesmo em botões preenchidos. No escuro, os selos continuam com borda de 1 px na cor do texto (regra da seção 2.8), porque todos dividem o mesmo fundo.

**Distinção de matiz (não é requisito AA, é cuidado de leitura):** Azul-noite fica perto do índigo de "teste grátis" e Ameixa escuro fica perto do salmão de "subiu"/erro. Como todo selo tem ícone e texto próprios (seção 3.3), a informação não se perde; registro como ponto de atenção para o Renato ver na prévia.

### 7.4 O que muda no que já existe (sprint 1)

| Onde | Mudança | Motivo |
| --- | --- | --- |
| CSS `.total` | `background`, `color` e rótulos passam a usar `--cor-total-fundo`, `--cor-total-texto`, `--cor-total-rotulo`. No verde-cédula o resultado é idêntico. | Temas (US-17) |
| Início e Assinaturas | Ganham o **contador de limite** no plano grátis (seção 8.2). | US-09.CA1 |
| Botão "Adicionar" (flutuante, estado vazio, catálogo, formulário livre) e "Reativar" | No limite, abrem o diálogo de limite em vez de seguir (seção 9.1). Continuam **visíveis e habilitados**. | US-09.CA2, CA4 |
| Barra de topo do Início | No Pro, selo "Pro" ao lado da marca (seção 8.1). | Reconhecimento da compra |
| Ajustes | Nova ordem e novas seções: Plano, Avisos, Lembretes, Backup e exportação, Temas, Sobre (seção 9.8). | US-11, 13, 14, 15, 17; E-05 |
| Totais | Novo bloco do gráfico entre o cartão de total e "Por forma de pagamento" (seção 9.6). | US-16 |
| Diálogo de importar (US-07.CA2) | Parágrafo extra quando o arquivo tem 5 ou mais ativas no plano grátis (seção 9.1). | US-09.CA12 |
| Início (topo do conteúdo) | Pode mostrar, nesta ordem: banner de revogação, aviso de lembretes, lembrete de exportar backup, erro de cópia sem espaço. | US-12.CA6, US-13, US-14 |

---

## 8. Componentes novos

Todos seguem a regra geral da seção 3: área de toque ≥ 44×44 px, foco visível padrão (seção 2.7), ícones SVG inline com `aria-hidden` quando há texto ao lado.

### 8.1 Selo Pro

Pílula igual aos selos (seção 3.3): ícone de moeda 16 px + texto "Pro" 14/600, `--cor-primaria` sobre `--cor-primaria-suave` (verde: 5,74:1; demais temas na seção 7.3.1). A moeda do ícone é dourada com contorno `--cor-primaria-forte` (decorativa, `aria-hidden`).

- **Onde:** ao lado de "Mensalão" na barra de topo do Início quando o usuário é Pro (`data-testid="selo-pro"`, sugerido); dentro dos cartões de recurso Pro (8.3) e na seção "Plano" dos Ajustes.
- **Estados:** só padrão (não é interativo). Nome acessível: "Pro" no topo vira `aria-label="Mensalão Pro ativo"`.

### 8.2 Contador de limite (US-09)

Linha compacta, sem cartão (fica logo abaixo do subtítulo da tela), para não competir com a lista.

```
4 de 5 assinaturas ativas                ← 14/500 --cor-texto   data-testid="limite-contador"
▬▬▬▬▬▬ ▬▬▬▬▬▬ ▬▬▬▬▬▬ ▬▬▬▬▬▬ ▭▭▭▭▭▭        ← medidor: 5 segmentos de 6 px de altura, 4 px de vão
                                            (preenchido --cor-primaria, vazio --cor-superficie-2 com
                                             borda 1 px --cor-divisor), aria-hidden
```

| Situação | Texto do contador (exato) | Linha de apoio (14/400 texto-2) | Ação |
| --- | --- | --- | --- |
| 0 a 4 ativas | "N de 5 assinaturas ativas" | — | — |
| 5 ativas | "5 de 5 assinaturas ativas" | "Para adicionar outra, pause ou cancele uma que você não usa, ou conheça o Pro." | link "Conhecer o Pro" (`btn-texto`, 44 px, `limite-link-pro` sugerido) |
| Mais de 5 (importação, Pro revogado) | "12 de 5 assinaturas ativas — acima do limite do plano grátis" | "Tudo continua funcionando. Para adicionar ou reativar, fique com menos de 5 ativas ou conheça o Pro." | mesmo link |
| Pro | contador não existe (US-09.CA7) | — | — |

- O `data-testid="limite-contador"` fica no elemento que tem **só** o texto do contador (para o QA ler o texto exato). O medidor e a linha de apoio ficam fora dele.
- Cores neutras em todos os casos: nada de vermelho ou âmbar no limite (US-09.CA11, sem culpa). Acima do limite os 5 segmentos ficam cheios; não se desenham segmentos extras.
- Não é interativo além do link. O contador é texto comum (não `aria-live`), porque muda junto com a tela.

### 8.3 Cartão de recurso Pro (recurso bloqueado no grátis)

Usado em `lock-lembrete`, `lock-backup`, `lock-csv`, `lock-grafico` e `lock-temas`. Fica exatamente onde o recurso estaria.

```
┌──────────────────────────────────────┐  --cor-superficie, --raio-md, borda 1 px tracejada --cor-borda
│ Exportar planilha CSV       (moeda Pro)│  título 16/600 + selo Pro (8.1) à direita
│ Abra suas assinaturas no Excel ou no │  descrição 14/400 --cor-texto-2 (o que o recurso faz)
│ Google Planilhas.                    │
│ [prévia opcional, decorativa]        │  só no gráfico e nos temas (aria-hidden)
│ [ Conhecer o Pro ]                   │  botão secundário, altura 48 → tela Pro
└──────────────────────────────────────┘
```

- O contêiner (`<section>` com `aria-labelledby` no título) recebe o `data-testid` do backlog (`lock-csv` etc.). O botão recebe `lock-btn-pro` (sugerido) e nome acessível completo: `aria-label="Conhecer o Pro para exportar planilha CSV"` (cada cartão com o nome do seu recurso, para leitor de tela não ouvir 5 botões iguais).
- **Sem** cadeado, sem a palavra "bloqueado", sem cinza "desabilitado": a borda tracejada e o selo Pro já dizem que é do Pro. O texto descreve o benefício.
- Estados: padrão; botão com hover (`--cor-primaria-suave`) e foco padrão. Não tem desabilitado nem erro.
- Borda tracejada `--cor-borda` sobre `--cor-fundo`: 3,33:1 (verde); nos temas ≥ 3,54:1.

### 8.4 Interruptor (switch)

Para "Lembrar antes da cobrança" (`lembrete-ativar`) e "Fazer cópias automáticas" (`backup-ativar`, sugerido).

- HTML: `<input type="checkbox" role="switch">` dentro de um `<label>` que ocupa a linha inteira (min-height 56, texto à esquerda 16/500, controle à direita). O `data-testid` vai no `<input>`.
- Trilho 52×32 px, `--raio-pilula`; botão interno 24 px.
  - **Ligado:** trilho `--cor-primaria`, botão `--cor-sobre-primaria`, ícone ✓ de 12 px dentro do botão.
  - **Desligado:** trilho `--cor-superficie-2` com borda 2 px `--cor-borda` (3,56:1 sobre branco), botão `--cor-texto-2`.
  - **Foco:** anel padrão em volta do trilho.
  - **Desabilitado:** opacidade não; trilho `--cor-superficie-2` com borda tracejada, botão `--cor-borda`, `disabled` real e texto de ajuda dizendo por quê. (Na prática não há interruptor desabilitado no Pro; no grátis aparece o cartão 8.3 no lugar.)
- O estado não depende só da cor: ✓ no ligado e a posição do botão; o leitor de tela anuncia "ligado/desligado" pelo `role="switch"`.
- Movimento do botão: `--duracao-rapida`; zerado com `prefers-reduced-motion`.

### 8.5 Opção de tema

Grupo de rádio: `<fieldset data-testid="temas-lista">` com `<legend>` "Tema do app" e uma opção por tema.

```
┌──────────────────────────────────────┐  label, min-height 64, --raio-md, --cor-superficie
│ (•)  ●●●  Azul-noite        Em uso   │  rádio nativo 24 px · prévia: 3 bolinhas de 20 px
│                                      │  (fundo, primária, superfície do tema, com borda 1 px
└──────────────────────────────────────┘   --cor-borda) · nome 16/500 · "Em uso" 14 texto-2
```

- `data-testid="tema-<id>"` no `<input type="radio">` (ids: `verde-cedula`, `azul-noite`, `grafite`, `ameixa`). Nome acessível = nome do tema.
- **Selecionado:** rádio marcado, borda 2 px `--cor-primaria` no cartão e o texto "Em uso". **Foco:** anel padrão no cartão (`:focus-within`). **Hover:** fundo `--cor-primaria-suave`. Não há desabilitado nem erro.
- A prévia mostra as cores da **versão clara e escura** do tema lado a lado (3 + 3 bolinhas pequenas, 16 px) para deixar claro que o tema acompanha o modo do sistema. Decorativa (`aria-hidden`).
- Troca na hora (evento `change`), sem botão salvar; banner `role="status"`: "Tema Azul-noite aplicado."

### 8.6 Aviso de lembretes (Início)

```
┌──────────────────────────────────────┐  --cor-aviso-suave, --raio-md, padding 12×16
│ 🔔 Lembretes                          │  ícone sino 16 px --cor-aviso + título 16/600 --cor-texto
│ Hoje: Spotify — R$ 21,90             │  <ul>, 16/400 --cor-texto, valores tabulares
│ Amanhã: Netflix — R$ 44,90           │
│ ⌛ Teste grátis de Max termina amanhã │  linha de teste com ícone ampulheta --cor-info
│ Com o app fechado, o aviso depende do│  14/400 --cor-texto-2   data-testid="lembrete-limite-texto"
│ seu aparelho e pode atrasar. Abra o  │
│ app para ver tudo.                   │
└──────────────────────────────────────┘
```

- `data-testid="lembrete-aviso"` no contêiner; cada linha `lembrete-item` (sugerido). `role="status"` no contêiner (não `alert`: é informativo).
- Não tem botão de fechar: o backlog pede que fique visível enquanto a cobrança estiver na janela (US-13.CA4).
- Toque numa linha: abre o detalhe da assinatura (a linha é um link com altura ≥ 44 px).
- Contraste: texto #13221B sobre #FFF3DC 15,01:1; texto-2 6,49:1; ícone âmbar 6,07:1. No escuro, fundo = superfície-2 do tema com borda 1 px `--cor-aviso` (mesma regra dos selos).

### 8.7 Item de cópia de segurança

Linha dentro de um `cartao-lista` (`<ul data-testid="copias-lista">`):

```
│ 18/10/2026 09:12                     │  16/600 tabular
│ 7 assinaturas            [Restaurar] │  14 texto-2 · botão secundário compacto 44 px de altura, min 104 px
├──────────────────────────────────────┤
│ 15/10/2026 21:40                     │
│ 6 assinaturas  (! Danificada)        │  selo perigo com ícone alerta; sem botão Restaurar
```

- Botão `data-testid="copia-restaurar"` com `aria-label="Restaurar cópia de 18/10/2026 09:12"`.
- **Danificada:** selo "Danificada" (`--cor-perigo` sobre `--cor-perigo-suave`, ícone "!") e texto "Não pode ser restaurada." no lugar do botão (`data-testid="copia-inutilizavel"`, sugerido). Não some da lista (US-14.CA6).
- **Pro revogado:** linhas sem botão; ver 9.7.

### 8.8 Gráfico de rosca com legenda-tabela (US-16)

```
        ╭───────╮                       rosca 176 px, espessura 28 px, centro vazio
     ╭──╯       ╰──╮                    fatias da maior para a menor, sentido horário a partir das 12 h,
     │  R$ 200,00  │                    vão de 2 px (cor da superfície) entre fatias
     │   por mês   │                    centro: total 18/700 tabular + "por mês" 14 texto-2
     ╰──╮       ╭──╯
        ╰───────╯
┌───┬──────────────────────┬──────────┬────────┐  <table> visível
│ ■ │ Streaming de vídeo   │ R$ 100,00│  50,0% │  quadrado 12 px na cor da fatia (aria-hidden)
│ ■ │ Música               │  R$ 50,00│  25,0% │  categoria 16/400 (quebra linha) · valor 16/700 nowrap
│ ■ │ Compras              │  R$ 50,00│  25,0% │  % 16/500 nowrap, alinhados à direita
└───┴──────────────────────┴──────────┴────────┘
```

- **Acessibilidade (US-16.CA8):** o SVG tem `role="img"` e `aria-labelledby` apontando para um `<title>` com o resumo ("Gasto mensal por categoria: Streaming de vídeo 50,0%, Música 25,0%, Compras 25,0%"). A tabela visível é a fonte da informação: cabeçalhos `<th scope="col">` "Categoria", "Por mês", "Parte" (visualmente ocultos com `.sr-only`, para não pesar no visual). A ordem das linhas é a mesma das fatias, então cor nunca é o único meio de ligar fatia e legenda.
- **Cores:** `--cor-grafico-1` a `-6` na ordem das 6 maiores; `--cor-grafico-7` para "Outras categorias" (sempre por último, US-16.CA4).
- **Uma categoria (CA5):** desenhar um círculo completo (não um arco de 360°, que some em alguns navegadores), sem vão.
- **Fatia muito pequena:** arco mínimo visível de 2° (só no desenho; o % da tabela é o real).
- **360 px (CA9):** rosca centralizada; tabela em largura total (328 px); nomes longos quebram linha, valor e % nunca quebram.
- **Vazio (CA6):** a rosca e a tabela são substituídas por um parágrafo 16/400 texto-2 centralizado "Sem dados para o gráfico" (`grafico-vazio`, sugerido) dentro do mesmo cartão.
- `data-testid="grafico-categorias"` na `<section>`; linhas `grafico-item` (sugerido); célula de % `grafico-pct` (sugerido).
- Sem animação de desenho.

### 8.9 Indicador de carregamento (inline)

Usado só na tela Pro (consulta de preço, compra, restaurar). Texto sempre presente + ícone circular de 16 px girando (`--duracao` 1 s linear; com `prefers-reduced-motion` o ícone fica parado). O texto fica num `aria-live="polite"`. O botão relacionado fica `disabled` e com `aria-busy="true"` enquanto espera (impede duas compras, US-11.CA6).

### 8.10 Diálogo informativo

Variante do diálogo da seção 3.7 para mensagens que **não** destroem nada (limite, permissão de notificação):
- `role="alertdialog"` no `<dialog>` quando a mensagem precisa ser anunciada (limite: US-09.CA11).
- Ação principal **primária** (verde, não vermelha) à direita; ação de saída secundária à esquerda e com o foco inicial.
- Ícone de 24 px antes do título opcional (moeda para o limite, sino para permissão).

### 8.11 Banner informativo neutro

Igual ao banner da seção 3.9 (`--cor-primaria-suave`, `role="status"`), com ícone "i". Usado para "Compra cancelada…", "Não encontramos compra…" e para o aviso de revogação. Não é vermelho porque nenhum desses casos é erro do usuário nem perda de dados.

---

## 9. Telas por história (sprint 2)

Convenções iguais às da seção 4 (360 px, margem 16, `[ ]` botão, `( )` selo, "(sugerido)" para `data-testid` que o backlog não definiu).

### 9.1 US-09 — Limite de 5 ativas no plano grátis

**Objetivo:** saber quanto do grátis está em uso e, no limite, entender as opções sem perder nada.

**Início com contador (grátis, 4 ativas):**
```
┌──────────────────────────────────────┐ 360
│ Mensalão                             │
│ Próximas cobranças                   │ h1
│ Destaque para os próximos 3 dias     │
│ 4 de 5 assinaturas ativas            │ limite-contador (14/500)
│ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ▭▭▭                  │ medidor (aria-hidden)
│                                      │
│ ┌ Spotify               R$ 21,90 ──┐ │ upcoming-item...
│ ...                                  │
│                       [ + Adicionar ]│
├──────────────────────────────────────┤
│ Início | Assinaturas | Totais | Ajustes│
└──────────────────────────────────────┘
```
Em **Assinaturas**, o contador fica logo abaixo da linha "7 ativas · 1 pausada", com o mesmo componente.

**Limite atingido (5 de 5) — toque em qualquer "Adicionar" ou em "Reativar":**
```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ véu ░░░░░░░░░░░░░░░░░░░░░ │
│ ┌──────────────────────────────────┐ │ <dialog role="alertdialog"> limite-aviso
│ │ (moeda)                          │ │
│ │ Você chegou ao limite de 5       │ │ título 22/600 (texto exato do backlog)
│ │ assinaturas ativas do plano      │ │
│ │ grátis                           │ │
│ │ Para adicionar outra, pause ou   │ │ 16 texto-2
│ │ cancele uma que você não usa, ou │ │
│ │ conheça o Pro: compra única,     │ │
│ │ assinaturas ilimitadas.          │ │
│ │                                  │ │
│ │ [ Agora não ] [ Conhecer o Pro ] │ │ limite-btn-agora-nao (sugerido) | limite-btn-pro (primário)
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```
- Na reativação, o texto de apoio muda para: "Para reativar Netflix, pause ou cancele outra antes, ou conheça o Pro." (título igual).
- Foco inicial em "Agora não"; Esc = "Agora não"; ao fechar, o foco volta ao botão que abriu. Nada é gravado (US-09.CA6). Se a pessoa chegou ao catálogo ou ao formulário por outro caminho (ex.: URL `#/nova` digitada), o diálogo abre por cima e "Agora não" volta para a tela anterior.
- "Conhecer o Pro" fecha o diálogo e abre a tela Pro (`#/pro`).
- O diálogo **só** abre por ação da pessoa; nunca ao abrir o app nem ao trocar de tela.

**Acima do limite (ex.: 12 ativas após importação, ou Pro revogado com 20):**
```
│ 12 de 5 assinaturas ativas — acima do│ limite-contador
│ limite do plano grátis               │
│ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬                  │
│ Tudo continua funcionando. Para      │ 14 texto-2
│ adicionar ou reativar, fique com     │
│ menos de 5 ativas ou conheça o Pro.  │
│ Conhecer o Pro                       │ limite-link-pro (sugerido)
```
Totais, próximas cobranças, editar, pausar, cancelar, excluir e exportar seguem normais e contam todas.

**Importar com 5 ou mais ativas no grátis (US-09.CA12)** — o diálogo da seção 4.7 ganha um parágrafo entre o texto e os botões, com ícone "i":
"Este backup tem 12 assinaturas ativas, acima das 5 do plano grátis. Todas serão importadas. Enquanto houver 5 ou mais ativas, adicionar e reativar ficam indisponíveis." (`data-testid="import-aviso-limite"`, sugerido). Botões iguais: [Voltar] [Substituir dados].

### 9.2 US-11 — Tela "Mensalão Pro"

**Objetivo:** entender o que o Pro oferece e comprar uma vez, ou saber por que não dá para comprar aqui.
**Acesso:** Ajustes > Plano, diálogo de limite, link do contador, botão de qualquer cartão de recurso Pro. Rota `#/pro`. Tela interna: barra de topo com Voltar, **sem** navegação inferior (como os formulários), para a tela ficar focada e não virar uma "aba de vendas".

**Estado: compra disponível (TWA, preço carregado)** — `data-testid="pro-tela"` no contêiner principal:
```
┌──────────────────────────────────────┐
│ ←  Mensalão Pro                      │ h1 na barra de topo
│                                      │
│              (moeda 56)              │ decorativa
│   Pague uma vez, use para sempre.    │ 18/600 centralizado
│   Sem mensalidade e sem anúncios.    │ 16 texto-2
│                                      │
│ O que vem no Pro          (18/600)   │
│ ┌──────────────────────────────────┐ │ <ul> pro-recursos (sugerido)
│ │ ✓ Assinaturas ilimitadas         │ │ ✓ 20 px --cor-primaria · nome 16/500
│ │   O grátis vai até 5 ativas.     │ │ descrição 14 texto-2
│ │ ✓ Lembrete antes da cobrança     │ │
│ │   Aviso de 0 a 7 dias antes.     │ │
│ │ ✓ Backup automático              │ │
│ │   Cópias no aparelho e lembrete  │ │
│ │   para exportar um arquivo.      │ │
│ │ ✓ Exportar planilha CSV          │ │
│ │   Para Excel ou Google Planilhas.│ │
│ │ ✓ Gráficos por categoria         │ │
│ │   Veja onde suas assinaturas     │ │
│ │   mais pesam.                    │ │
│ │ ✓ Temas                          │ │
│ │   Azul-noite, Grafite e Ameixa.  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [   Comprar Pro por R$ 19,99       ] │ pro-btn-comprar (primário, largura total, 56 px)
│ Compra única pela Google Play.       │ 14 texto-2, centralizado
│ Sem renovação e sem cobrança mensal. │
│                                      │
│ [        Restaurar compra          ] │ pro-btn-restaurar (secundário, largura total)
│ Já comprou em outro celular? Use a   │ 14 texto-2
│ mesma conta da Google Play.          │
│                                      │
│ ⓘ O Mensalão grátis continua         │ pro-nota-gratis (sugerido), 14 texto-2
│ funcionando, sem prazo: até 5        │
│ assinaturas ativas, próximas         │
│ cobranças, totais, guia de           │
│ cancelamento e backup em arquivo.    │
└──────────────────────────────────────┘
```
**Hierarquia:** promessa > lista de recursos > botão de compra > restaurar > nota do grátis. O preço aparece só dentro do botão, com o texto vindo do provedor (nunca escrito no código).

**Estados da área de compra** (o restante da tela não muda; a tela nunca fica em branco):

| Estado | O que aparece no lugar do botão de compra | `data-testid` |
| --- | --- | --- |
| Carregando preço | [ Comprar Pro ] desabilitado + indicador 8.9 "Carregando preço…" | `pro-btn-comprar`, `pro-carregando` (sugerido) |
| Falha ao consultar preço | [ Comprar Pro ] desabilitado + texto `--cor-perigo` com ícone "!": "Não foi possível consultar o preço agora. Tente de novo." + [ Tentar de novo ] (secundário) | `pro-erro-preco` (sugerido), `pro-btn-recarregar` |
| Compra em andamento | [ Abrindo a Google Play… ] desabilitado, `aria-busy="true"` | `pro-btn-comprar` |
| Cancelada pela pessoa | Botão volta ao normal + banner neutro (8.11) acima dele: "Compra cancelada. Você não foi cobrado." | `pro-cancelada` (sugerido) |
| Erro na compra | Botão volta ao normal + banner de erro (`role="alert"`): "Não foi possível concluir a compra. Tente novamente." | `pro-erro` |
| Offline (app instalado) | [ Comprar Pro ] desabilitado + "Você está sem conexão. Para comprar, conecte-se à internet." (14, texto-2, ícone "i") | `pro-offline` (sugerido) |
| Navegador comum | Sem botão de compra (ver abaixo) | `pro-indisponivel` |
| Já é Pro / compra concluída | Bloco "Você é Pro" (ver abaixo) | `pro-ativo` |

**Estado: navegador comum (provedor "Indisponível", US-11.CA7 e US-12.CA10):**
```
│ O que vem no Pro  (lista igual)      │
│ ┌ ⓘ ───────────────────────────────┐ │ pro-indisponivel, fundo --cor-primaria-suave
│ │ A compra do Pro está disponível  │ │ 16/500 --cor-texto
│ │ no app do Mensalão na Google Play│ │
│ │ Seus dados continuam funcionando │ │ 14 texto-2
│ │ normalmente aqui.                │ │
│ │ [ Abrir na Google Play ]         │ │ pro-btn-play (sugerido), primário; OCULTO até o app ser publicado
│ └──────────────────────────────────┘ │
│ [        Restaurar compra          ] │ pro-btn-restaurar, desabilitado
│ A compra e a restauração só funcionam│ 14 texto-2, ligado por aria-describedby
│ no app da Google Play.               │
```

**Estado: já é Pro (US-11.CA8) ou logo após comprar (CA4) ou restaurar (US-12.CA2):**
```
│              (moeda 56)              │
│ ┌──────────────────────────────────┐ │ pro-ativo, fundo --cor-primaria-suave, --raio-lg
│ │ ✓ Você é Pro                     │ │ 22/600
│ │ Obrigado por apoiar o Mensalão.  │ │ 16 texto
│ │ Todos os recursos estão liberados│ │
│ │ neste aparelho.                  │ │
│ └──────────────────────────────────┘ │
│ Incluído no seu Pro       (18/600)   │ mesma lista, ✓ em todos
│ ...                                  │
│ [      Voltar ao Mensalão          ] │ pro-btn-voltar-app (sugerido), primário → tela de origem
```
- Sem botão de compra e sem preço. Restaurar não aparece.
- Ao virar Pro, o foco vai para o título "Você é Pro" e um `aria-live` anuncia "Você é Pro". Após restaurar, o banner de sucesso diz "Compra restaurada. Obrigado!" acima do bloco.
- O contador de limite, os cartões de recurso Pro e o tema mudam **sem recarregar** (US-11.CA4).

**Microcopy proibida (CA11):** "oferta", "promoção", "últimas horas", "só hoje", "desbloqueie já", contagens e preços riscados.

### 9.3 US-12 — Restaurar compra e estado Pro

Tudo na tela Pro (9.2), área do botão "Restaurar compra" (`pro-btn-restaurar`):

| Situação | Retorno visual | `data-testid` |
| --- | --- | --- |
| Tocou em Restaurar | Botão desabilitado "Verificando…" com indicador 8.9 | `pro-btn-restaurar` |
| Compra encontrada | Banner de sucesso "Compra restaurada. Obrigado!" + estado "Você é Pro" | `pro-restaurar-msg` (sugerido), `pro-ativo` |
| Sem compra na conta | Banner neutro "Não encontramos compra do Pro nesta conta da Google Play" | `pro-restaurar-msg` |
| Erro/offline | Banner de erro "Não foi possível verificar agora. Tente de novo mais tarde." | `pro-restaurar-msg` |
| Navegador comum | Botão desabilitado + explicação (9.2) | `pro-btn-restaurar` |

Os banners da restauração aparecem logo acima do botão "Restaurar compra" (não no topo da página), para a resposta ficar perto de quem tocou; o foco vai para o banner.

**Verificação ao abrir (US-12.CA5, CA7, CA9):** nenhuma tela de espera e nenhum aviso. A primeira tela aparece com o estado local; se a loja confirmar o Pro depois, a tela atualiza em silêncio (o contador some, os cartões de recurso viram recursos). Falha ou offline: nada é mostrado.

**Revogação (US-12.CA6):** banner neutro (8.11) no topo do conteúdo da primeira tela aberta, uma única vez, com botão "Fechar aviso":
```
│ ┌ ⓘ ───────────────────────────── × ┐│ pro-revogado-aviso, role="status"
│ │ Seu Mensalão Pro não foi         ││
│ │ encontrado na Google Play. Você  ││
│ │ voltou ao plano grátis; seus     ││
│ │ dados continuam todos aqui.      ││
│ └───────────────────────────────────┘│
│ 20 de 5 assinaturas ativas — acima do│ limite-contador (US-09.CA13)
│ limite do plano grátis               │
```
Nada de vermelho: não é erro da pessoa. O tema volta ao verde-cédula, lembretes e cópias param, e os cartões de recurso Pro voltam (US-12.CA13).

### 9.4 US-13 — Lembrete antes da cobrança

**Ajustes > Lembretes — grátis:** cartão 8.3 `lock-lembrete`: título "Lembretes antes da cobrança", texto "Receba um aviso de 0 a 7 dias antes de cada cobrança, para cancelar a tempo." + [Conhecer o Pro].

**Ajustes > Lembretes — Pro:**
```
│ Lembretes antes da cobrança (18/600) │ h2
│ ┌──────────────────────────────────┐ │
│ │ Lembrar antes da cobrança  [●══] │ │ switch lembrete-ativar (linha 56 px)
│ └──────────────────────────────────┘ │
│ Quantos dias antes?                  │ label
│ De 0 a 7. 0 = no dia da cobrança.    │ ajuda
│ [ 1 ______ ] dias                    │ lembrete-dias (inputmode="numeric", 120 px)
│ ! Use um número inteiro de 0 a 7     │ error-lembrete-dias (sugerido)
│ [ Salvar lembrete ]                  │ lembrete-btn-salvar (sugerido), secundário
│                                      │
│ ⓘ Com o app fechado, o aviso depende │ lembrete-limite-texto, 14 texto-2
│ do seu aparelho e pode atrasar. Abra │
│ o app para ver tudo.                 │
│                                      │
│ (uma destas linhas, quando couber:)  │
│ ⓘ Notificações do sistema            │ lembrete-sem-permissao (permissão negada)
│ desativadas. Você verá os avisos ao  │
│ abrir o app.                         │
│ ⓘ Seu aparelho não permite           │ lembrete-sem-suporte (sugerido; sem Notification API)
│ notificações; usaremos o aviso dentro│
│ do app                               │
```
- Campo de dias segue o mesmo padrão do "Avisos" da sprint 1 (campo curto + Salvar), para manter coerência e permitir o erro de valor inválido (US-13.CA2): valor inválido mostra o erro e o valor salvo continua valendo. Salvar válido: banner "Lembrete atualizado: 1 dia antes da cobrança." (0 → "no dia da cobrança"; 2+ → "N dias antes da cobrança").
- O campo de dias fica disponível mesmo com o interruptor desligado (dá para configurar antes de ligar).

**Primeira vez que liga (US-13.CA5)** — diálogo informativo (8.10) **antes** do pedido do sistema:
```
│ (sino) Avisar antes das cobranças?   │ título
│ Para avisar também com o Mensalão    │
│ fechado, o celular vai pedir         │
│ permissão para mostrar notificações. │
│ Se você não permitir, os avisos      │
│ continuam aparecendo quando abrir o  │
│ app.                                 │
│ [ Voltar ]          [ Continuar ]    │ lembrete-btn-continuar (sugerido)
```
"Voltar" deixa o lembrete desligado. "Continuar" liga e chama o pedido do sistema; se negado, liga só com aviso interno e mostra `lembrete-sem-permissao`. Sem suporte a notificação, o diálogo não aparece: liga direto e mostra `lembrete-sem-suporte`.

**Início com lembretes (US-13.CA3, CA8, CA10)** — componente 8.6, logo abaixo do subtítulo/contador e acima da lista:
- Formato de cada linha: "Hoje: Spotify — R$ 21,90", "Amanhã: Netflix — R$ 44,90", "Em 3 dias: Deezer — R$ 22,90" (2 a 7 dias). Teste grátis: "Teste grátis de Max termina amanhã" / "termina hoje" / "termina em 3 dias".
- Ordem: por data e, na mesma data, por nome.
- Sem cobrança na janela, lembrete desligado ou plano grátis: o componente não existe (nenhum espaço vazio).

**Notificação do sistema (CA6):** título "Mensalão"; corpo igual à linha do aviso ("Amanhã: Netflix — R$ 44,90"). Várias no mesmo dia: uma notificação por par (assinatura, data), com o ícone do app. Toque abre o Início.

### 9.5 US-14 — Backup automático local

Fica em **Ajustes > Backup e exportação**, depois do backup manual (que continua grátis e igual à sprint 1).

**Grátis:** cartão 8.3 `lock-backup`: título "Backup automático", texto "O app guarda sozinho até 3 cópias neste aparelho e lembra você de exportar um arquivo. Exportar e importar backup em arquivo continuam grátis, logo acima." + [Conhecer o Pro].

**Pro:**
```
│ Backup automático         (h3 16/600)│
│ ┌──────────────────────────────────┐ │
│ │ Fazer cópias automáticas   [●══] │ │ backup-ativar (sugerido), padrão ligado
│ └──────────────────────────────────┘ │
│ ┌ ⓘ ───────────────────────────────┐ │ backup-aviso-limite, fundo --cor-aviso-suave,
│ │ As cópias automáticas ficam neste│ │ ícone --cor-aviso, texto --cor-texto (texto exato)
│ │ aparelho. Se você limpar os dados│ │
│ │ do navegador, desinstalar o app  │ │
│ │ ou perder o celular, elas se vão.│ │
│ │ Exporte um arquivo e guarde onde │ │
│ │ quiser.                          │ │
│ └──────────────────────────────────┘ │
│ Cópias guardadas                     │ 14/500
│ ┌──────────────────────────────────┐ │ copias-lista
│ │ 18/10/2026 09:12                 │ │
│ │ 7 assinaturas       [Restaurar]  │ │ copia-restaurar
│ ├──────────────────────────────────┤ │
│ │ 17/10/2026 21:40                 │ │
│ │ 6 assinaturas       [Restaurar]  │ │
│ ├──────────────────────────────────┤ │
│ │ 15/10/2026 08:03                 │ │
│ │ 6 assinaturas (! Danificada)     │ │ copia-inutilizavel (sugerido)
│ │ Não pode ser restaurada.         │ │
│ └──────────────────────────────────┘ │
│ Até 3 cópias, no máximo uma por dia, │ 14 texto-2
│ só quando algo mudou.                │
```
- Lista vazia: "Nenhuma cópia ainda. A primeira é criada quando você tiver assinaturas e algo mudar." (`copias-vazia`, sugerido).
- Ordem: mais recente primeiro.

**Restaurar (CA5)** — diálogo de confirmação (seção 3.7, perigo):
```
│ Substituir os dados atuais por esta  │ título (texto exato do backlog)
│ cópia (7 assinaturas)?               │
│ Antes de substituir, o app guarda uma│
│ cópia do estado atual, para você     │
│ poder desfazer.                      │
│ [ Voltar ]     [ Substituir dados ]  │ btn-dialogo-voltar | btn-confirmar (perigo sólido)
```
Sucesso: banner "Cópia de 18/10/2026 09:12 restaurada. A versão anterior ficou guardada nas cópias." Erro de cópia corrompida (CA6): banner de erro "Esta cópia está danificada e não pôde ser restaurada. Seus dados atuais não foram alterados." e o item passa a mostrar o selo "Danificada".

**Sem espaço (CA7):** banner de erro no topo do Início (onde a cópia é tentada ao abrir) ou na tela em que a alteração foi feita: "Não foi possível criar a cópia automática (sem espaço)" + segunda linha "Exporte um arquivo de backup para não ficar sem cópia." (`backup-erro-espaco`, sugerido).

**Lembrete de exportar (CA8)** — no Início, abaixo do aviso de lembretes:
```
│ ┌ ⓘ ───────────────────────────────┐ │ backup-lembrete, banner neutro (8.11), role="status"
│ │ Faz 9 dias que você não exporta  │ │
│ │ um arquivo de backup             │ │
│ │ [ Exportar agora ] [Lembrar depois]│ backup-btn-exportar (sugerido, secundário)
│ └──────────────────────────────────┘ │ backup-btn-depois (sugerido, btn-texto 44 px)
```
Sem botão "×": as duas ações já resolvem. "Exportar agora" usa a exportação da US-07 e mostra o banner de exportação da sprint 1. Em 360 px os dois botões quebram em duas linhas se não couberem.

**Pro revogado (CA11):** o cartão `lock-backup` volta; se houver cópias, ele ganha a linha "Suas 3 cópias continuam guardadas neste aparelho. Restaurar uma cópia faz parte do Pro." e a lista aparece abaixo, **sem** os botões Restaurar. A exportação manual continua acima, grátis.

### 9.6 US-16 — Gráficos por categoria (Totais)

**Posição:** entre o cartão de total (e o "Em teste", quando houver) e "Por forma de pagamento". A lista "Por categoria" continua igual, mais abaixo.

**Grátis:** cartão 8.3 `lock-grafico`: título "Gráfico por categoria", texto "Veja de relance onde suas assinaturas mais pesam. Os totais por categoria em lista continuam grátis, logo abaixo." Prévia decorativa: anel de 64 px em `--cor-superficie-2` dividido em 3 partes por vãos (sem cores e sem números, para não sugerir dados falsos). + [Conhecer o Pro].

**Pro:**
```
┌──────────────────────────────────────┐
│ Totais                               │
│ ┌ cartão de total ─────────────────┐ │
│ │ Por mês  R$ 200,00 ...           │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Gasto mensal por categoria (18/600)  │ grafico-categorias (<section>)
│ ┌──────────────────────────────────┐ │ cartão --cor-superficie, padding 16
│ │            (rosca 176)           │ │
│ │           R$ 200,00              │ │
│ │            por mês               │ │
│ │ ■ Streaming de vídeo R$ 100,00 50,0%│ grafico-item
│ │ ■ Música              R$ 50,00 25,0%│
│ │ ■ Compras             R$ 50,00 25,0%│
│ └──────────────────────────────────┘ │
│ Por forma de pagamento ...           │
│ Por categoria ... (lista completa)   │ total-por-categoria (inalterado)
```
- Mais de 6 categorias: 6 maiores + "Outras categorias" (cinza, sempre por último).
- Vazio: o cartão mostra "Sem dados para o gráfico" (8.8). Na tela de Totais vazia (US-04.CA8), o cartão do gráfico aparece com essa frase logo abaixo do cartão de total e acima do estado vazio.
- Percentuais com 1 casa e vírgula ("50,0%"); a soma exibida fecha 100,0% (regra do backlog).
- Atualiza junto com os totais (CA10); sem animação.

### 9.7 US-15 — Exportar planilha CSV

Em **Ajustes > Backup e exportação**, entre o backup manual e o backup automático.

**Grátis:** cartão 8.3 `lock-csv`: "Exportar planilha CSV" / "Abra suas assinaturas no Excel ou no Google Planilhas." + [Conhecer o Pro].

**Pro:**
```
│ Planilha (h3 16/600)                 │
│ Arquivo CSV para Excel ou Google     │ 14 texto-2
│ Planilhas, com todas as assinaturas  │
│ (ativas, pausadas e canceladas).     │
│ [ Exportar CSV ]                     │ btn-exportar-csv (secundário, largura total, ícone de tabela)
```
- Sucesso: banner "Planilha exportada: mensalao-assinaturas-2026-10-18.csv" (`csv-ok`, sugerido).
- Lista vazia: baixa só o cabeçalho e mostra banner neutro "Você ainda não tem assinaturas; o arquivo contém só o cabeçalho" (`csv-vazio`, sugerido). Não é erro.

### 9.8 US-17 — Temas e a nova tela de Ajustes

**Ajustes (ordem nova; o wireframe mostra o plano grátis e "→" indica como fica no Pro):**
```
┌──────────────────────────────────────┐
│ Ajustes                              │
│                                      │
│ Plano (18/600)                       │ plano-cartao (sugerido)
│ ┌──────────────────────────────────┐ │
│ │ Plano grátis                     │ │ 16/600
│ │ 4 de 5 assinaturas ativas        │ │ 14 texto-2 (só informativo; o testid fica no Início/Assinaturas)
│ │ [ Conhecer o Pro ]               │ │ plano-btn-pro (sugerido), secundário
│ └──────────────────────────────────┘ │
│   → Pro: "(moeda) Mensalão Pro"      │
│     "Compra ativa. Obrigado!"        │
│     [ Ver detalhes ] (btn-texto)     │
│                                      │
│ Avisos              (sprint 1, igual)│
│ Lembretes antes da cobrança  (9.4)   │ lock-lembrete → controles
│ Backup e exportação                  │ h2
│   Backup em arquivo  (sprint 1, igual)│ btn-exportar, btn-importar
│   Planilha           (9.7)           │ lock-csv → btn-exportar-csv
│   Backup automático  (9.5)           │ lock-backup → controles
│ Temas                                │ lock-temas → temas-lista
│ Sobre                                │
│   Mensalão não se conecta a bancos e │
│   não envia seus dados para a        │
│   internet.                          │
│   Política de privacidade            │ link-privacidade (sugerido), link 44 px → privacidade.html
├──────────────────────────────────────┤
│ Início | Assinaturas | Totais | Ajustes│
└──────────────────────────────────────┘
```
Os subtítulos dentro de "Backup e exportação" são `h3` (16/600).

**Temas — grátis (US-17.CA1):** cartão 8.3 `lock-temas`: "Temas de cores" / "Mais 3 temas no Pro: Azul-noite, Grafite e Ameixa, cada um no claro e no escuro. O verde-cédula, com claro e escuro automáticos, continua no grátis." Prévia decorativa: três grupos de bolinhas com as cores dos temas extras. + [Conhecer o Pro].

**Temas — Pro (CA2 a CA5):**
```
│ Temas (18/600)                       │
│ ┌ Tema do app (legend) ────────────┐ │ temas-lista (fieldset)
│ │ (•) ●●●|●●● Verde-cédula (padrão) Em uso│ tema-verde-cedula
│ │ ( ) ●●●|●●● Azul-noite           │ │ tema-azul-noite
│ │ ( ) ●●●|●●● Grafite              │ │ tema-grafite
│ │ ( ) ●●●|●●● Ameixa               │ │ tema-ameixa
│ └──────────────────────────────────┘ │
│ Os temas seguem o modo claro ou      │ 14 texto-2
│ escuro do seu celular.               │
```
- Aplicação imediata ao tocar, em todas as telas, sem recarregar; atualiza a meta `theme-color`. Banner "Tema Azul-noite aplicado." Preferência salva em `mensalao:prefs:v1`.
- Valor desconhecido nas preferências: verde-cédula, sem aviso (CA7).

---

## 10. Navegação (sprint 2)

### 10.1 Mapa (acréscimos ao 5.1)

```
 Início ── Assinaturas ── Totais ── Ajustes            (4 abas, inalteradas; nenhuma aba nova)
   │            │            │          │
   │ contador   │ contador   │ lock-grafico            Ajustes > Plano [Conhecer o Pro]
   │ (5+): link │ (5+): link │ [Conhecer o Pro]        lock-lembrete / lock-csv / lock-backup / lock-temas
   │            │            │          │              [Conhecer o Pro]
   ▼            ▼            ▼          ▼
 [+ Adicionar] / [Reativar] no limite ──▶ diálogo de limite ──[Conhecer o Pro]──▶ ┐
                                              └─[Agora não]──▶ fica onde estava │
                                                                                  ▼
                                                              Tela Pro  #/pro (sem nav inferior)
                                                                ├─ Voltar / Esc do Android ──▶ tela de origem
                                                                ├─ comprar ok / restaurar ok ──▶ "Você é Pro"
                                                                │     └─[Voltar ao Mensalão]──▶ tela de origem
                                                                └─ cancelada / erro ──▶ mesma tela, banner
 Início ── linha do aviso de lembretes ──▶ Detalhe da assinatura
 Início ── backup-lembrete [Exportar agora] ──▶ download + banner (fica no Início)
 Ajustes > Sobre ── Política de privacidade ──▶ privacidade.html (página estática do app, offline)
```

- Rota nova: `#/pro`. `document.title` "Mensalão Pro — Mensalão". Ao entrar, foco no `h1`.
- "Voltar" da tela Pro volta para a tela de origem (histórico). Se a origem foi o diálogo de limite, volta à tela que tinha o botão "Adicionar"/"Reativar", sem reabrir o diálogo.
- **Não** há 5ª aba "Pro" nem botão Pro fixo: o acesso existe onde faz sentido (Plano, limite, recurso). Decisão S2-1.
- `privacidade.html` usa a mesma folha de estilos (tokens) e tem link "Voltar ao Mensalão" no topo.

### 10.2 Manifest e TWA

- Manifest: sem mudança de cores (`theme_color` #0B6B47, `background_color` #F5F8F6) nem de ícone. O ícone da sprint 1 já é próprio para `maskable` (desenho dentro dos 80% centrais); manter as duas entradas `"purpose": "any"` e `"purpose": "maskable"` em 192 e 512 px (E-03).
- TWA (E-01): `themeColor` #0B6B47, `navigationColor` #0B6B47 (barra de navegação do Android), `backgroundColor` #F5F8F6 (tela de abertura), ícone da tela de abertura = ícone 512 px. A cor do tema escolhido muda a barra de status via meta `theme-color` depois que o app abre.
- Ícone do produto Pro no Play Console e gráfico de destaque da loja: fora do escopo deste design (sugestão: reaproveitar a moeda dourada sobre #08573A).

---

## 11. Acessibilidade da sprint 2 (checklist para Dev e QA)

- Todo cartão de recurso Pro é uma `<section>` com título e botão de nome completo; nenhum recurso Pro fica escondido do leitor de tela.
- Diálogo de limite com `role="alertdialog"`, foco inicial em "Agora não", Esc fecha, foco devolvido.
- Mudanças assíncronas da tela Pro (preço carregado, compra concluída, erro) anunciadas por `aria-live="polite"` (sucesso/estado) ou `role="alert"` (erro).
- Interruptores com `role="switch"`; temas como grupo de rádio com `legend`.
- Gráfico: `role="img"` + tabela visível com todos os valores.
- 360 px e zoom 200%: botões de largura total quebram texto; "Comprar Pro por R$ 19,99" cabe em 328 px a 16 px; o banner do lembrete de backup empilha os botões.
- Todos os temas com pares conferidos na seção 7.3.1.

---

## 12. Decisões de UX da sprint 2 (para o Renato confirmar)

1. **S2-1 — Sem aba "Pro".** O Pro entra por Ajustes > Plano (primeira seção), pelo diálogo de limite, pelo link do contador (só a partir de 5 ativas) e pelos cartões de recurso. A tela Pro é interna (`#/pro`), com Voltar e sem navegação inferior.
2. **S2-2 — Limite como diálogo.** Tocar em "Adicionar" ou "Reativar" no limite abre um diálogo (`alertdialog`) com "Agora não" (foco inicial) e "Conhecer o Pro". Os botões continuam visíveis e habilitados, para a explicação aparecer no momento certo, em vez de um botão cinza sem motivo.
3. **S2-3 — Contador discreto e neutro.** Linha de texto + medidor de 5 segmentos abaixo do subtítulo, no Início e em Assinaturas, sem cores de alerta. O link para o Pro só aparece a partir de 5 ativas.
4. **S2-4 — Cartões de recurso Pro sem cadeado.** Borda tracejada + selo "Pro" com moeda + descrição do benefício + botão secundário "Conhecer o Pro". Evita "bloqueado" (US-09.CA11) e pressão (D-11).
5. **S2-5 — Selo "Pro" na barra de topo** do Início quando a pessoa é Pro, como reconhecimento discreto da compra.
6. **S2-6 — Temas: Azul-noite, Grafite e Ameixa**, cada um com claro e escuro automáticos. Troquei o "âmbar" do exemplo por Ameixa porque um tema âmbar confundiria a marca com o selo "vence logo" (a direção pede que alertas se distingam da marca). Se você preferir o âmbar, o selo "vence logo" teria de mudar de cor nesse tema.
7. **S2-7 — Cartão de total na cor do tema.** No verde-cédula continua #0B6B47; nos temas extras usa a primária clara do tema (com texto branco) nos dois modos. O dourado continua só como filete decorativo.
8. **S2-8 — Gráfico de rosca com legenda-tabela**, entre o cartão de total e "Por forma de pagamento". Escolhi rosca (e não barras) porque a lista "Por categoria" já usa barras; a rosca dá a visão de "fatia do todo" e a tabela garante leitura sem depender de cor. Cores do gráfico fixas, independentes do tema.
9. **S2-9 — Lembrete: explicação antes da permissão**, com "Voltar" (deixa desligado) e "Continuar". Dias por campo + "Salvar lembrete", igual ao "Avisos" da sprint 1. Para 2 a 7 dias, o texto é "Em 3 dias: Deezer — R$ 22,90" (o backlog só define "Hoje" e "Amanhã").
10. **S2-10 — Texto de limitação do lembrete em dois lugares:** em Ajustes e dentro do aviso do Início (mesmo texto e mesmo `data-testid`, um por tela), como pede a US-13.CA14 ("as telas de configuração e o aviso"). O aviso do Início não tem botão de fechar (US-13.CA4).
11. **S2-11 — Ajustes reorganizado:** Plano, Avisos, Lembretes, Backup e exportação (arquivo, planilha, automático), Temas, Sobre (com link da política de privacidade). Uma página só, com seções; não criei subtelas.
12. **S2-12 — Lembrete de exportar backup no Início**, abaixo do aviso de lembretes, com "Exportar agora" e "Lembrar depois", sem "×".
13. **S2-13 — Revogação do Pro como aviso neutro** (não vermelho), uma vez, com "Fechar aviso"; o contador "acima do limite" aparece logo abaixo.
14. **S2-14 — Depois de comprar ou restaurar**, a tela Pro vira "Você é Pro" com o botão "Voltar ao Mensalão" (volta à origem). Não reabro o formulário de cadastro automaticamente.
15. **S2-15 — Banners de restauração perto do botão** "Restaurar compra", não no topo, para a resposta ficar perto do toque.
16. **S2-16 — Ponto de atenção de matiz:** Azul-noite fica próximo do índigo de "teste grátis", e Ameixa escuro fica próximo do salmão de "subiu"/erro. O contraste AA está garantido e todo selo tem ícone e texto; confira na prévia se o efeito te agrada.
17. **Sugestões ao Produto (não mudei critérios):**
    - US-13: definir o texto para antecedência de 2 a 7 dias (proposta: "Em N dias: Nome — R$ X").
    - US-09.CA2 cita o botão do estado vazio da lista. Com 5 ativas a lista nunca está vazia; o caso real é o estado vazio de **Totais** quando as 5 ativas estão em teste grátis (não entram nos totais, mas contam no limite, US-09.CA8). Apliquei o mesmo diálogo a todos os botões de adicionar, sem exceção; vale o QA cobrir esse caso.
    - US-14.CA8: definir se "Lembrar depois" também aparece em Ajustes (hoje só no Início).
18. **`data-testid` sugeridos na sprint 2** (o backlog não nomeou): `selo-pro`, `limite-link-pro`, `limite-btn-agora-nao`, `import-aviso-limite`, `lock-btn-pro`, `pro-recursos`, `pro-nota-gratis`, `pro-carregando`, `pro-erro-preco`, `pro-cancelada`, `pro-offline`, `pro-btn-play`, `pro-btn-voltar-app`, `pro-restaurar-msg`, `plano-cartao`, `plano-btn-pro`, `lembrete-item`, `lembrete-btn-salvar`, `error-lembrete-dias`, `lembrete-sem-suporte`, `lembrete-btn-continuar`, `backup-ativar`, `copias-vazia`, `copia-inutilizavel`, `backup-erro-espaco`, `backup-btn-exportar`, `backup-btn-depois`, `csv-ok`, `csv-vazio`, `grafico-item`, `grafico-pct`, `grafico-vazio`, `link-privacidade`.
