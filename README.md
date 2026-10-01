# Squad Mensalão

Projeto do Claude Code com uma squad de três agentes (Produto, Dev, QA) que constrói o Mensalão, um PWA de controle de assinaturas, com aprovação do Renato antes de cada etapa.

## Estrutura

- `CLAUDE.md`: regras da squad, carregadas em toda sessão.
- `.claude/agents/`: os três subagentes (`produto`, `dev`, `qa`).
- `.claude/skills/sprint/SKILL.md`: o comando `/sprint`, que executa uma etapa e para na aprovação.
- `.claude/settings.json`: comandos pré-aprovados (npm, testes, git local) e bloqueios (`git push`).
- `docs/`: backlog, bugs, status, notas do Dev, relatório do QA e painel.

## Uso

1. `/sprint status` mostra onde a squad parou.
2. `/sprint` pede a sua decisão no portão atual e, se você aprovar, roda a próxima etapa.
3. `/sprint ideia: <texto>` começa uma sprint nova.

Estado atual: backlog pronto, aguardando a aprovação de G1 para o Dev começar.
