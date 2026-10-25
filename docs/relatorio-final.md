# Mensalão — Relatório final da sprint 2

Entrega aprovada pelo Renato em 18/10/2026 (portão G3). O relatório da sprint 1 está em `docs/sprint1/relatorio-final.md`.

## O que foi construído

Modelo freemium com compra única "Mensalão Pro" e o app preparado para a Google Play (TWA). O grátis permite até 5 assinaturas ativas; o Pro libera assinaturas ilimitadas e os recursos abaixo. A compra é feita pela Google Play (Digital Goods API + Payment Request); fora do app instalado, a tela Pro informa que a compra só existe pela Play. O build de produção não contém o provedor de compra falso (`npm run verificar:bundle`); o build de teste (`npm run build:teste`) tem o provedor falso para simular compra, restauração e reembolso.

| História | Entregue |
| --- | --- |
| US-09 Limite de 5 ativas no grátis | contador, diálogo de limite acessível, pausar/cancelar/excluir sempre livres, importação acima do limite preservada |
| US-11 Tela Pro e compra única | oferta, preço vindo da loja, estados de carregando/erro/cancelada/offline, proteção contra toque duplo |
| US-12 Restaurar e estado Pro persistido | verificação ao abrir sem bloquear a tela, restaurar compra, reinstalação, reembolso com aviso único |
| US-13 Lembrete antes da cobrança | 0 a 7 dias de antecedência, explicação antes de pedir permissão, notificação uma vez por cobrança |
| US-14 Backup automático local | até 3 cópias diárias no aparelho, restaurar com confirmação, lembrete de exportar a cada 7 dias |
| US-15 Exportar CSV | arquivo compatível com Excel e Planilhas (BOM, `;`, proteção contra fórmula) |
| US-16 Gráfico por categoria | rosca em SVG com legenda e "Outras categorias", acessível |
| US-17 Temas de cor | 4 temas com prévia, aplicação imediata, contraste AA |
| Ajuste do G2 | máscara de data: a barra entra sozinha com o teclado numérico do celular |
| Empacotamento (5.1) | projeto TWA em `twa/`, `assetlinks.json`, manifest com id e ícones maskable, política de privacidade, ficha, capturas e guia de publicação em `docs/loja/`, CNAME por variável no CI |

US-10 e US-18 saíram do backlog a pedido do Renato.

## Como rodar

```bash
npm install
npm run dev               # desenvolvimento
npm run build             # produção em dist/
npm run build:teste       # build de teste (provedor falso) em dist-teste/
npm run verificar:bundle  # confere que a produção não tem o provedor falso
npm test                  # unitários (Vitest)
npm run test:e2e          # interface (Playwright), builds de teste e de produção
```

Na versão de teste, para começar já com o Pro, gravar `mensalao:teste:provedor` com `{"compras":["mensalao_pro"]}` no `localStorage` e recarregar.

## Resultados de teste

- Build sem erros; verificação do bundle OK.
- 178 testes unitários e 196 de interface (360×780) passando, após uma rodada de correções.
- Bugs: BUG-01 (média, diálogo sobre a nova tela ao mudar a rota) e BUG-02 (baixa, lista de cópias desatualizada) corrigidos e retestados. Nenhum aberto.

## Limitações

- Compra real, acknowledge, restauração após reinstalar e reembolso pela Play não foram exercitados (dependem da conta e do app na Play).
- Lembretes só disparam ao abrir ou voltar ao app; não há aviso com o app fechado.
- Notificação real do sistema, leitor de tela real, abertura do CSV no Excel e arte maskable na zona segura não foram verificados.
- Dentro da TWA, quem adulterar o `localStorage` fica Pro até a loja responder (risco aceito na D-06).
- Capturas da loja em 1080×1920, porque 360×780 passa da proporção máxima da Play.
- Desvios do design aceitos: banner de revogação em qualquer tela, selo "Danificada" com ícone de alerta, selo Pro ao lado de "Plano" em Ajustes, vãos do gráfico feitos encurtando os arcos.

## Bugs conhecidos

Nenhum.

## Próximos passos (dependem do Renato)

Lista com caixas de marcar: https://claude.ai/artifact/KaS3458HW36sX2pHHvGkYm

- Publicar o código da sprint 2 na main (PR) para atualizar o GitHub Pages.
- Preço do Pro confirmado em R$ 19,99 (25/10/2026). Confirmar o id do pacote `br.com.mensalao.app`.
- Registrar o domínio, apontar o DNS e definir `MENSALAO_DOMINIO`.
- Conta na Play, chave de assinatura (fingerprint SHA-256), `.aab`, produto `mensalao_pro`, ficha, testadores de licença, teste de compra real, link da ficha (`URL_FICHA_PLAY`) e envio para revisão.
