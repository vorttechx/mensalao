# Status da sprint 2 — Mensalão

Atualizado a cada etapa pelo orquestrador. Estados: pendente, andamento, concluída, aguardando você, aprovada, rejeitada, falhou.
Direção: `docs/sprint2-direcao.md`. Documentos da sprint 1 arquivados em `docs/sprint1/`.

| Etapa | Quem | Estado | Observação |
| --- | --- | --- | --- |
| P1 Escrever backlog | Produto | concluída | 8 histórias (US-09, US-11 a US-17) e decisões D-01 a D-12 em `docs/backlog.md` |
| G1 Aprovar backlog antes do UX | Renato | aprovada | Aprovado pelo Renato em 18/10/2026 |
| U1 Planejar design | UX | concluída | Parte 2 em `docs/design.md` e nova `docs/design-preview.html` |
| GD Aprovar design antes do Dev | Renato | aprovada | Aprovado pelo Renato em 18/10/2026 |
| D1 Implementar histórias | Dev | concluída | US-09, US-11 a US-17 e empacotamento; notas em `docs/dev-notes.md` |
| G2 Aprovar código antes do QA | Renato | aprovada | Aprovado pelo Renato em 18/10/2026, após a correção da máscara de data |
| Q1 Testar e abrir bugs | QA | concluída | 178 unitários e 191 de 193 E2E passando; BUG-01 (média) e BUG-02 (baixa) abertos |
| G3 Revisar relatório de QA | Renato | aprovada | Renato escolheu corrigir os 2 bugs antes de entregar |
| D2 Corrigir bugs (máx. 3 rodadas) | Dev | andamento | Rodada 1: BUG-01 e BUG-02 |
| E Entrega | Renato | pendente | |

## Registro

- 18/10/2026: Renato iniciou a sprint 2. Documentos da sprint 1 movidos para `docs/sprint1/`. Etapa P1 (Produto) iniciada.
- 18/10/2026: Produto entregou o backlog da sprint 2 (P1). Portão G1 aguardando o Renato; o UX não começa antes disso.
- 18/10/2026: Renato pediu uma versão de teste com Pro liberado sem pagamento. Produto incluiu a US-18 e ajustou D-06 e D-10. Portão G1 continua aguardando o Renato.
- 18/10/2026: Renato perguntou sobre o domínio. Produto registrou na D-05 o domínio próprio como recomendação (registro pelo Renato nesta sprint, pré-requisito só da publicação). Portão G1 continua aguardando o Renato.
- 18/10/2026: a pedido do Renato, a US-10 (proteção de quem já tinha mais de 5 ativas) saiu do backlog, porque nenhuma versão foi para produção. Portão G1 continua aguardando o Renato.
- 18/10/2026: a pedido do Renato, a US-18 (versão de teste com Pro liberado) saiu do backlog. Portão G1 continua aguardando o Renato.
- 18/10/2026: Renato escolheu domínio próprio para a produção (D-05), registrado por ele nesta sprint.
- 18/10/2026: Renato aprovou o backlog (G1). Etapa U1 (UX) iniciada.
- 18/10/2026: UX entregou o design da sprint 2 (U1). Portão GD aguardando o Renato; o Dev não começa antes disso.
- 18/10/2026: Renato aprovou o design (GD), incluindo as Decisões de UX. Etapa D1 (Dev) iniciada.
- 18/10/2026: Dev entregou a sprint 2 (D1): build sem erros, 82 unitários e 64 E2E da sprint 1 passando, verificação do bundle OK. Portão G2 aguardando o Renato; o QA não começa antes disso.
- 18/10/2026: Renato pediu a barra automática no campo de data (teclado numérico no celular); Dev corrigiu com máscara.
- 18/10/2026: Renato aprovou o código (G2). Etapa Q1 (QA) iniciada.
- 18/10/2026: QA entregou o relatório (Q1): 178 unitários e 191 de 193 E2E passando; BUG-01 (média) e BUG-02 (baixa) abertos. Portão G3 aguardando o Renato.
- 18/10/2026: Renato revisou o relatório de QA (G3) e escolheu corrigir. Etapa D2 (Dev, rodada 1) iniciada.
