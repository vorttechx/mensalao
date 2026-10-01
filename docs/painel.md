# Painel visual da squad

Link do painel (privado, só o Renato abre): https://claude.ai/artifact/K6k4GAGzmWjYWs9BSaE2kR

O painel lê duas coleções do banco da própria página. Para atualizar (ferramenta ArtifactData, ação `set` ou `update`):

- Coleção `etapas`, um documento por etapa, com os ids: `p1`, `g1`, `d1`, `g2`, `q1`, `g3`, `d2`, `e`.
  Campos: `status` (`pendente`, `andamento`, `concluida`, `falha`, `aguardando`, `aprovada`, `rejeitada`), `summary` (texto curto), `entregas` (lista de textos), `updatedAt` (ISO 8601).
- Coleção `eventos`, um documento por evento (id `e001`, `e002`...). Campos: `ts` (ISO 8601), `etapa`, `text`.

Os estados em `docs/status.md` são a fonte de verdade; o painel só os espelha. Se este painel não estiver acessível na sessão, a squad funciona do mesmo jeito.
