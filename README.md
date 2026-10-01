# Squad Mensalão

Projeto do Claude Code com uma squad de quatro agentes (Produto, UX, Dev, QA) que constrói o Mensalão, um PWA de controle de assinaturas, com aprovação do Renato antes de cada etapa.

## Estrutura

- `CLAUDE.md`: regras da squad, carregadas em toda sessão.
- `.claude/agents/`: os quatro subagentes (`produto`, `ux`, `dev`, `qa`).
- `.claude/skills/sprint/SKILL.md`: o comando `/sprint`, que executa uma etapa e para na aprovação.
- `.claude/settings.json`: comandos pré-aprovados (npm, testes, git local) e bloqueios (`git push`).
- `docs/`: backlog, direção e design (`design-direcao.md`, `design.md`, `design-preview.html`), bugs, status, notas do Dev, relatório do QA e painel.

## Uso

1. `/sprint status` mostra onde a squad parou.
2. `/sprint` pede a sua decisão no portão atual e, se você aprovar, roda a próxima etapa.
3. `/sprint ideia: <texto>` começa uma sprint nova.

Fluxo: backlog (Produto) → G1 → design (UX) → GD → código (Dev) → G2 → testes (QA) → G3 → correções ou entrega.

Estado atual: backlog pronto, aguardando a aprovação de G1 para o UX planejar o design.
