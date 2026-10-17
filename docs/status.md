# Status da sprint 1 — Mensalão

Atualizado a cada etapa pelo orquestrador. Estados: pendente, andamento, concluída, aguardando você, aprovada, rejeitada, falhou.

| Etapa | Quem | Estado | Observação |
| --- | --- | --- | --- |
| P1 Escrever backlog | Produto | concluída | 8 histórias (US-01 a US-08) em `docs/backlog.md` |
| G1 Aprovar backlog antes do UX | Renato | aprovada | Aprovado pelo Renato em 17/10/2026 |
| U1 Planejar design | UX | concluída | `docs/design.md` e `docs/design-preview.html` |
| GD Aprovar design antes do Dev | Renato | aprovada | Aprovado pelo Renato em 17/10/2026, com as Decisões de UX |
| D1 Implementar histórias | Dev | concluída | US-01 a US-08, notas em `docs/dev-notes.md` |
| G2 Aprovar código antes do QA | Renato | aprovada | Aprovado pelo Renato em 17/10/2026 |
| Q1 Testar e abrir bugs | QA | andamento | |
| G3 Revisar relatório de QA | Renato | pendente | |
| D2 Corrigir bugs (máx. 3 rodadas) | Dev | pendente | Rodadas usadas: 0 |
| E Entrega | Renato | pendente | |

## Registro

- 17/10/2026: Renato aprovou o backlog (G1). Etapa U1 (UX) iniciada.
- 17/10/2026: UX entregou o design (U1). Portão GD aguardando o Renato; o Dev não começa antes disso.
- 17/10/2026: Renato aprovou o design (GD), incluindo as Decisões de UX. Etapa D1 (Dev) iniciada.
- 17/10/2026: Dev entregou US-01 a US-08 (D1), build sem erros. Portão G2 aguardando o Renato; o QA não começa antes disso.
- 17/10/2026: Renato aprovou o código (G2). Etapa Q1 (QA) iniciada.
- 01/10/2026: entrou o agente de UX. Depois do backlog aprovado (G1), o UX escreve `docs/design.md` e `docs/design-preview.html`, e o Dev só começa após a aprovação do design (GD). Direção visual do Renato para o Mensalão: moderna, minimalista, em tons de verde que remetam a dinheiro.
- O Dev chegou a rodar antes da aprovação do backlog (G1) por falha de orquestração. O rascunho foi guardado na branch `dev/rascunho-sem-aprovacao` e não faz parte da `main`. A decisão de aproveitá-lo ou descartá-lo é do Renato.
