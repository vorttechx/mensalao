# Mensalão — Design (Sprint 1)

Autor: Agente UX. Entrada: `docs/backlog.md` (aprovado em 17/10/2026, G1), `docs/design-direcao.md` (Renato, 01/10/2026).
Referência visual: `docs/design-preview.html` (abrir no navegador; material de referência, não é o app).

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
