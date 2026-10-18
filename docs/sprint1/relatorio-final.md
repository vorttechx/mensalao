# Mensalão — Relatório final da sprint 1

Entrega aprovada pelo Renato em 17/10/2026 (portão G3).

## O que foi construído

App web instalável (PWA) para controlar assinaturas e cobranças recorrentes, sem conectar ao banco. Os dados ficam só no aparelho (localStorage). Stack: Vite + TypeScript sem framework, domínio puro em `src/domain/` e interface em `src/ui/`, seguindo o `docs/design.md` aprovado (verde-cédula, mobile-first a partir de 360 px, tema escuro automático).

| História | Entregue |
| --- | --- |
| US-01 Cadastrar pelo catálogo ou livremente | catálogo de 18 serviços com busca sem acentos, formulário validado |
| US-02 Próximas cobranças e testes grátis | lista por data com selos "hoje / amanhã / em X dias", aviso de fim de teste, estado vazio, N dias configurável |
| US-03 Alerta de reajuste | histórico de preços e selos "subiu" / "caiu" |
| US-04 Totais mensal e anual | totais por forma de pagamento e por categoria, testes grátis à parte |
| US-05 Editar, pausar, cancelar, excluir | ações no detalhe, canceladas em seção recolhível, exclusão com confirmação |
| US-06 Guia "onde cancelar" | guia por serviço, por loja de apps e por Pix |
| US-07 Backup JSON | exportação versionada e importação validada com confirmação |
| US-08 Instalar e usar offline | manifest, ícones 192/512, service worker, tela de recuperação de dados corrompidos |

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # build de produção em dist/
npm run preview    # serve dist/ em http://localhost:4173/ (com service worker)
npm test           # testes unitários (Vitest)
npm run test:e2e   # testes de interface (Playwright)
```

Para instalar no celular, `dist/` precisa ser hospedado num endereço HTTPS (por exemplo, GitHub Pages); no Chrome do Android, "Instalar app". Uma versão de teste, sem instalação nem modo offline, foi publicada num link privado do Claude.

## Resultados de teste

- Build sem erros de TypeScript.
- 82 testes unitários e 64 testes de interface (360×780) passando, conferidos de novo pelo orquestrador em 17/10/2026. Cada teste cita o critério de aceite que cobre.
- Bugs: nenhum aberto (alta 0, média 0, baixa 0). Nenhuma rodada de correção foi necessária.

## Limitações

- Não testados automaticamente: o prompt real de instalação, o build servido em subdiretório, a medição de contraste no app (os pares de cor foram conferidos no design), o tema escuro e o uso por leitor de tela.
- Modo offline só no build e a partir do segundo carregamento.
- Com o app aberto na virada do dia, as datas só se atualizam na próxima ação.
- O aviso "Teste terminou…" não tem prazo definido pelo Produto.
- O banner "Backup exportado" não confirma que o navegador salvou o arquivo.
- Em 360 px, valores a partir de R$ 1.000,00 quebram em duas linhas no histórico de preços.
- Desvios do design aceitos: o detalhe esconde a navegação inferior; na recuperação, o título fica fora da caixa vermelha; o campo de data não tem máscara.

## Bugs conhecidos

Nenhum.

## Próximos passos

- Hospedar o app (precisa de `git push`, ainda não autorizado) e conferir a instalação no celular.
- Sprint 2: monetização freemium com compra única Pro e publicação nas lojas (`docs/sprint2-direcao.md`).
- Decidir o destino da branch `dev/rascunho-sem-aprovacao`.
