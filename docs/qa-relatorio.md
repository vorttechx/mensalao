# Mensalão — Relatório de QA (Sprint 1, etapa Q1)

Autor: Agente QA. Data: 17/10/2026. Código testado: branch `claude/sprint1-ux-3qdfc3`, após a aprovação G2.

## Resultados

| Comando | Resultado |
| --- | --- |
| `npm run build` | OK (tsc estrito + vite build, base `./`) |
| `npm test` (Vitest) | 82 passaram, 0 falharam (9 arquivos em `tests/unit/`) |
| `npm run test:e2e` (Playwright, Chromium 360×780, relógio fixo em 30/09/2026) | 64 passaram, 0 falharam (10 arquivos em `tests/e2e/`); 3 execuções seguidas estáveis |

Ajustes feitos nos próprios testes durante a execução (defeitos do teste, não do app): busca "NET" também acha "Internet residencial" (comportamento correto de "contém"); no US-02.CA6 a primeira data válida em 30/09 é 30/09, não 31/10; o checkbox tem 24 px e o alvo de toque de 44 px é o label (como o design 3.2 prevê); esperas após confirmar a exclusão, para não correr contra o diálogo assíncrono.

## Bugs abertos

Nenhum (Alta: 0, Média: 0, Baixa: 0). Ver `docs/bugs.md`.

## Critérios cobertos

Todos os critérios de US-01 a US-08 têm teste unitário e/ou E2E que cita o ID no título. Em `tests/unit/`: datas, dinheiro, validação, próximas, reajuste, operações, totais, catálogo/guia, backup. Em `tests/e2e/`: `us01` a `us08` e `design-conformidade`.

Observações de cobertura dentro dos critérios:
- US-01.CA2: o E2E de salvar do catálogo escolhe `field-pagamento` e preenche `field-proxima`, conforme decisão de UX 6 (catálogo não pré-preenche pagamento).
- US-02.CA3: valores 31, "abc" e -1 verificados mantendo o N salvo.
- US-04.CA9: recalculo verificado após pausar e excluir.
- US-07.CA2: confirmação com quantidade e aviso de substituição; CA3 com 5 tipos de arquivo inválido.
- US-08.CA3: verificado que `index.html` do build não tem caminhos absolutos; não foi servido de um subdiretório real.

## Critérios não cobertos ou só parcialmente

- US-08.CA1 (instalabilidade): validados manifest, nome, `standalone`, ícones 192/512 e tema; o prompt real de instalação do navegador não é automatizável aqui.
- US-08.CA3: sem teste servindo o build em `/apps/mensalao/`.
- US-05.CA3/CA4/CA2: ações testadas por estado e tela; "Reativar" a partir de cancelada coberto só no domínio.
- US-04.CA9: criar, editar, reativar e importar não têm E2E específico de recálculo (o domínio é puro e coberto).
- Acessibilidade: verificados foco no primeiro erro, `aria-describedby`, foco visível e alvos de 44 px nas telas principais. Contraste AA (design 2.2) e uso por leitor de tela não foram medidos.
- Tema escuro (design 2.8) e comportamento na virada do dia com o app aberto (limitação já registrada pelo Dev) não testados.

## Divergências em relação a `docs/design.md`

Nenhuma encontrada nos pontos conferidos (microcopy de erro, banners "Spotify salva." e "Netflix salva. Valor subiu 12,5% (R$ 5,00).", foco no primeiro erro, selects iniciando em "Selecione…", canceladas recolhível, 4 abas). Desvios já declarados pelo Dev em `docs/dev-notes.md` (detalhe sem navegação inferior, título da recuperação fora da caixa vermelha, sem máscara de data) não prejudicam uso nem acessibilidade e não foram abertos como bug.

## Recomendação

Liberar. Build e todos os testes passam, não há bugs abertos e os critérios de aceite verificáveis automaticamente foram cumpridos. Pendências sugeridas para o Renato avaliar manualmente: instalação real no celular e leitura de contraste/tema escuro.
