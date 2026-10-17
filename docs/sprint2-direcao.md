# Mensalão — Direção da sprint 2

Definida pelo Renato em 17/10/2026. É entrada do agente de Produto (`produto`) para escrever o backlog da sprint 2. O Produto detalha histórias e critérios de aceite; este arquivo só fixa a direção.

## Monetização: freemium com compra única "Pro"

- **Modelo:** app grátis com limite, e uma compra única (vitalícia) libera a versão Pro. Sem assinatura mensal (contraditório num app que ajuda a cortar assinaturas) e sem anúncios (poluem o design e quebram a promessa de privacidade).
- **Grátis:** até 5 assinaturas ativas, próximas cobranças e totais.
- **Pro:** assinaturas ilimitadas, lembrete por notificação antes da cobrança, backup automático, exportação para planilha (CSV), gráficos por categoria e temas.
- **Preço sugerido:** R$ 14,90 a R$ 19,90, vitalício. Preço final a confirmar pelo Renato.
- **Cobrança:** pelo sistema de cada loja (Google Play Billing no Android, compra dentro do app na Apple), sem servidor nem cadastro. A loja retém 15% no primeiro US$ 1 milhão/ano.
- **Dependência:** a compra só funciona com o app empacotado e publicado nas lojas (Android via TWA/Bubblewrap; iOS a definir), com o PWA hospedado em HTTPS. Isso entra na mesma sprint ou antes.
- **Para depois (fora da sprint 2):** indicação paga no guia "Como cancelar" (planos mais baratos), avaliada com cuidado por risco à confiança do usuário.
