# Guia de publicação na Google Play (E-08, US-29.CA10, US-30.CA8) — passo a passo para o Renato

Ordem recomendada. Itens R-xx correspondem à seção 5.2 do backlog. Tudo o que é conta, painel e chave fica com você; nada disso entra no repositório.

> **Regra que não muda:** nunca toque em anúncios reais do Mensalão (nem para "testar"), nem peça a alguém que toque. Clique inválido suspende a conta do AdMob. Para ver anúncios, use o build de teste (IDs de teste do Google) ou um aparelho cadastrado como aparelho de teste (passo 9).

## 1. Conta, pacote e domínio

1. **Id de pacote** `br.com.mensalao.app` (confirmado em 25/10/2026, R-10). Ele não muda depois.
2. **Conta de desenvolvedor da Play** (R-01, taxa única de US$ 25). Contas pessoais novas exigem um teste fechado antes da produção (passo 11).
3. **Domínio** `mensalao.app` apontando para o GitHub Pages (registros A/AAAA do Pages ou CNAME para `vorttechx.github.io`). No repositório: Settings > Pages > Custom domain = `mensalao.app`, "Enforce HTTPS". Na CI, a variável `MENSALAO_DOMINIO=mensalao.app` faz o build do site gravar o `CNAME`. O site publica só a página de apresentação, a política (`/privacidade.html`) e o `app-ads.txt` (US-31).

## 2. App no Play Console e chave de upload

4. **Criar o app no Play Console** (R-04) e ativar o Play App Signing.
5. **Chave de upload** (R-03): `keytool -genkeypair -v -keystore mensalao-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`. Guarde o arquivo e as senhas fora do repositório (gerenciador de senhas). Sem TWA, o `assetlinks.json` e o fingerprint não são mais necessários.
6. **Produto in-app** `mensalao_pro`, não consumível, R$ 19,99 (R-05, D-04). O app usa o Google Play Billing direto pelo plugin nativo, sem servidor.

## 3. AdMob (US-29.CA10)

7. **Conta AdMob** com o mesmo login do Play Console. Em "Pagamentos", preencha os dados fiscais.
8. **Adicionar o app no AdMob** e **vincular à Play** (opção "o app está publicado", ou vincule depois da primeira publicação). Anote o **ID do app** (`ca-app-pub-…~…`).
   - Crie dois **blocos de anúncio**: "Banner" (tipo banner; o app usa o adaptativo ancorado) e "Premiado" (tipo premiado; prêmio: 1, "exportação"). Anote os dois IDs (`ca-app-pub-…/…`).
   - **Bloqueio de categorias** (Proteção da marca > Categorias sensíveis e gerais): bloqueie apostas e jogos de azar, empréstimos e crédito, "ganhe dinheiro rápido", namoro e conteúdo sensível.
   - **Privacidade e mensagens > GDPR (formulário do UMP)**: crie a mensagem de consentimento para EEE, Reino Unido e Suíça, com o link da política `https://mensalao.app/privacidade.html`, e publique. O Brasil (LGPD) não usa mensagem do Google: o app mostra o próprio aviso (D-02). Não ative a mensagem de "regulamentações estaduais dos EUA" sem necessidade.
   - **app-ads.txt**: o AdMob mostra uma linha `google.com, pub-…, DIRECT, f08c47fec0942fa0`. Troque o marcador `pub-XXXXXXXXXXXXXXXX` em `site/app-ads.txt` pelo seu ID de editor, faça o commit e publique o site. Confira em `https://mensalao.app/app-ads.txt` e informe o site (`https://mensalao.app`) na ficha da Play (o AdMob lê o `app-ads.txt` do site do desenvolvedor). A verificação do AdMob pode levar até 24 h.
9. **Aparelhos de teste** (US-30.CA4/CA8): AdMob > Configurações > Aparelhos de teste > Adicionar: nome, plataforma Android e o **ID de publicidade** do aparelho (Configurações do Android > Google > Anúncios). Num aparelho de teste, até o app de produção mostra só anúncios de teste com o rótulo "Test Ad".

## 4. Gerar o app Android

10. **Máquina**: Node 22, JDK 21 e Android Studio (ou as command-line tools com `platforms;android-36` e `build-tools;36.0.0`), com `ANDROID_HOME` definido.
   - **Teste**: `npm run android:apk` gera `android/app/build/outputs/apk/debug/app-debug.apk` com os **IDs de teste do Google** (o `.apk` de debug nunca usa IDs reais). Instale com `adb install -r app-debug.apk`.
   - Formulário do Google simulado como EEE no aparelho: `MENSALAO_UMP_DEPURACAO=EEA npm run android:apk` (só no build de teste).
   - **Produção**: defina as variáveis e rode `npm run android:aab`:

     | Variável | O que é |
     | --- | --- |
     | `MENSALAO_ADMOB_APP_ID` | ID do app no AdMob (`ca-app-pub-…~…`) |
     | `MENSALAO_ADMOB_BANNER_ID` | ID do bloco Banner (`ca-app-pub-…/…`) |
     | `MENSALAO_ADMOB_PREMIADO_ID` | ID do bloco Premiado (`ca-app-pub-…/…`) |
     | `MENSALAO_KEYSTORE`, `MENSALAO_KEYSTORE_SENHA`, `MENSALAO_KEY_ALIAS`, `MENSALAO_KEY_SENHA` | chave de upload |
     | `MENSALAO_VERSION_CODE`, `MENSALAO_VERSION_NAME` | versão (o código sobe a cada envio) |

     O script recusa IDs ausentes, mal formados ou de teste, confere o pacote web (`scripts/verificar-anuncios.mjs --producao`) e gera `android/app/build/outputs/bundle/release/app-release.aab`. Os IDs reais ficam só nas variáveis da sua máquina (ou nos segredos da CI, se um dia o `.aab` for gerado lá), nunca em arquivo do repositório.

## 5. Ficha e formulários da Play

11. **Ficha** (R-06) com os textos de `docs/loja/ficha-play.md`, as capturas de `docs/loja/capturas/` (refaça as capturas com o banner de teste, se quiser mostrá-lo), ícone 512 px, gráfico de destaque 1024×500, política `https://mensalao.app/privacidade.html`, e-mail `contato@mensalao.app` e site `https://mensalao.app`.
12. **Conteúdo do app** (Play Console > Política > Conteúdo do app):
   - **Anúncios**: "Sim, meu app contém anúncios".
   - **ID de publicidade**: sim, usado para publicidade e análise (SDK do AdMob).
   - **Segurança dos dados**: a tabela da ficha (depois da conferência do agente Segurança).
   - **Público-alvo**: 18 anos ou mais; fora do programa Famílias.
   - **Classificação indicativa**: refaça o questionário marcando que há anúncios e compra no app (resultado esperado: Livre).
   - **Política de privacidade**: a URL pública.

## 6. Teste fechado, compra e publicação

13. **Teste fechado** (exigido para contas pessoais novas): suba o `.aab` na faixa de teste fechado, cadastre os testadores (no mínimo o que a Play pedir na época) e mantenha o teste pelo prazo exigido.
14. **Contas de teste de licença** (R-07): Play Console > Configurações > Teste de licença, adicione os e-mails. Com elas: comprar o Pro (o banner some na hora), reinstalar e restaurar, reembolsar/revogar (os anúncios voltam na abertura seguinte com o aviso).
15. **Roteiro manual em aparelho** (US-30.CA5): o QA segue o roteiro do `dev-notes.md` da sprint 4 e registra em `qa-relatorio.md`. Sempre com IDs de teste ou aparelho cadastrado.
16. **Enviar para revisão** e publicar (R-09). Depois da publicação, defina `MENSALAO_URL_PLAY` na CI do site para o botão "Baixar na Google Play" aparecer em `mensalao.app` (antes disso a página mostra "Em breve na Google Play").
