# Ficha da Google Play (E-06, US-29) — rascunho para revisão do Renato

## Nome
Mensalão: controle de assinaturas

## Descrição curta (até 80 caracteres)
Controle assinaturas e cobranças sem conectar ao banco. Dados só no celular.

## Descrição completa
O Mensalão mostra o que vai ser cobrado e quando: Netflix, Spotify, academia, nuvem, delivery e qualquer cobrança recorrente.

• Próximas cobranças com destaque para o que vence logo
• Totais por mês e por ano, por forma de pagamento e por categoria
• Histórico de reajustes de preço
• Guia de onde cancelar cada serviço
• Backup em arquivo e funcionamento offline
• Sem conectar ao banco e sem cadastro: suas assinaturas ficam só no seu celular

O plano grátis cobre até 5 assinaturas ativas e mostra anúncios discretos do Google no rodapé de algumas telas. O Mensalão Pro é uma compra única, sem mensalidade, e libera:
• Assinaturas ilimitadas
• Sem anúncios
• Lembrete antes da cobrança (0 a 7 dias)
• Backup automático no aparelho
• Exportar planilha CSV (Excel e Google Planilhas)
• Gráfico de gastos por categoria
• Temas de cores (Azul-noite, Grafite e Ameixa)

## O que há de novo (primeira versão em Capacitor)
O app foi refeito em Capacitor, com a compra do Pro direto pela Google Play e lembretes como notificações do Android. A versão grátis passa a mostrar anúncios do Google no rodapé do Início, de Assinaturas e de Totais, e você escolhe se eles podem ser personalizados. O Pro continua sem anúncios. Suas assinaturas continuam só no seu celular.

## Contato do desenvolvedor
- E-mail: contato@mensalao.app
- Site: https://mensalao.app
- Política de privacidade: https://mensalao.app/privacidade.html

## Categoria sugerida
Finanças

## Produto in-app
- SKU: `mensalao_pro` (não consumível)
- Título: Mensalão Pro
- Descrição: Compra única: sem anúncios, assinaturas ilimitadas, lembretes, backup automático, planilha CSV, gráficos e temas.
- Preço: R$ 19,99 (D-04, confirmado pelo Renato em 25/10/2026)

## Anúncios
**Contém anúncios: sim.** Banner do Google AdMob no rodapé do Início, de Assinaturas e de Totais (só no plano grátis) e um anúncio premiado opcional, que o usuário escolhe assistir para liberar uma exportação da planilha CSV. O Pro não mostra anúncios.

## Segurança dos dados (respostas sugeridas, US-29.CA5)
O SDK de anúncios (Google Mobile Ads, via AdMob) coleta e compartilha com o Google os dados abaixo, só na versão grátis. O app em si não tem servidor e não envia as assinaturas a ninguém. **O agente Segurança confere esta tabela contra a documentação de divulgação de dados do SDK na versão usada e registra as divergências.**

| Tipo de dado (categoria da Play) | Coletado | Compartilhado | Finalidade |
|---|---|---|---|
| IDs do dispositivo ou outros IDs (ID de publicidade) | sim | sim (Google) | Publicidade ou marketing, análise, prevenção de fraude, segurança e conformidade |
| Atividade no app: interações com o app (com os anúncios) | sim | sim (Google) | Publicidade ou marketing, análise |
| Informações e desempenho do app: registros de falhas, diagnóstico | sim | sim (Google) | Análise, prevenção de fraude, segurança e conformidade |
| Local aproximado (pelo endereço IP) | sim | sim (Google) | Publicidade ou marketing, análise, prevenção de fraude |
| Informações financeiras (assinaturas, valores, bancos, cartões) | **não** | **não** | — |
| Conteúdo do usuário e demais dados cadastrados | **não** | **não** | — |

- Dados criptografados em trânsito? **Sim** (o SDK usa HTTPS).
- A coleta é opcional? **Não** na versão grátis (o usuário pode escolher anúncios não personalizados; o Pro deixa de coletar).
- O usuário pode pedir exclusão? Sim: as assinaturas são apagadas no próprio app ou ao desinstalar; os dados de publicidade, pelo Google (ID de publicidade redefinível nas configurações do Android).
- Pagamentos: processados pela Google Play (dados tratados pelo Google, não pelo app).

## ID de publicidade (Android 13+)
O app declara a permissão `com.google.android.gms.permission.AD_ID`. No formulário "ID de publicidade" do Play Console: **sim, o app usa o ID de publicidade**, para **publicidade ou marketing** e **análise**, pelo SDK do AdMob, só na versão grátis.

## Classificação indicativa
Livre. Sem violência, sem conteúdo sexual, sem jogos de azar, sem compartilhamento de localização, sem interação entre usuários. **Contém anúncios** e compra no app. As categorias sensíveis (apostas, crédito fácil, namoro e similares) ficam bloqueadas no painel do AdMob.

## Público-alvo
18 anos ou mais (controle financeiro pessoal). **Fora do programa Famílias**; o app não é direcionado a crianças e não mostra anúncios para crianças.
