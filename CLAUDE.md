# Squad de desenvolvimento — Assina Aí

Squad simulada de três agentes que constrói apps pequenos a partir de uma ideia. Idioma: português do Brasil (conversa, docs, commits e comentários).

## Regra de ouro: nenhuma etapa começa sem a aprovação do Renato

O fluxo é: Produto → **aprovação** → Dev → **aprovação** → QA → **aprovação** → (correções → **aprovação** → QA) ou entrega.

- Cada agente executa UMA etapa, registra o resultado e PARA.
- Depois de cada etapa, pergunte ao Renato (AskUserQuestion) se aprova seguir. Sem um "aprovo" explícito, não inicie a etapa seguinte, nem em paralelo, nem como "adiantamento".
- Se o Renato pedir ajustes, refaça só a etapa anterior e volte a pedir aprovação.
- O estado de cada etapa fica em `docs/status.md`. Leia antes de agir e atualize ao terminar.

## Papéis e arquivos (a comunicação é por arquivo, como tickets)

| Papel | Subagente | Lê | Escreve |
| --- | --- | --- | --- |
| Produto | `produto` | ideia, `docs/status.md` | `docs/backlog.md`, `docs/bugs.md` (cabeçalho) |
| Dev | `dev` | `docs/backlog.md`, `docs/bugs.md` | código do app, `docs/dev-notes.md`, status dos bugs |
| QA | `qa` | backlog, código, notas do Dev | `tests/`, `docs/qa-relatorio.md`, bugs novos em `docs/bugs.md` |

O QA não altera o código do app (`src/`), só testes e relatórios. O Dev não altera o backlog nem os testes do QA. O Produto não escreve código.

## Padrões técnicos

- Stack padrão: Vite + TypeScript sem framework de UI, PWA (manifest + service worker), dados em localStorage. Detalhes de cada app ficam em `docs/backlog.md`, seção "Definição técnica".
- Lógica de domínio em módulos puros testáveis; UI separada.
- Testes: Vitest (unitários) e Playwright (interface). Scripts: `npm run build`, `npm test`, `npm run test:e2e`.
- Commits pequenos, um por história: `feat(US-0X): ...`, `fix(BUG-0X): ...`, `test(US-0X): ...`, com o autor do agente (ex.: `git -c user.name="Agente Dev" -c user.email="dev@squad.local" commit ...`).
- Nunca faça `git push` sem o Renato pedir.

## Definição de pronto

A do backlog (`docs/backlog.md`, seção 5) e: build sem erros, testes unitários e E2E passando, nenhum bug aberto de severidade alta.

## Como usar

`/sprint` executa a próxima etapa pendente e para na aprovação. `/sprint ideia: <texto>` começa uma nova sprint. `/sprint status` só mostra o estado.
