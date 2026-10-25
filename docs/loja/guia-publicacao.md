# Guia de publicação na Google Play (E-08) — passo a passo para o Renato

Ordem recomendada. Itens R-xx correspondem à seção 5.2 do backlog.

1. **Id de pacote** `br.com.mensalao.app` (confirmado pelo Renato em 25/10/2026, R-10). Ele não muda depois.
2. **Registrar o domínio próprio** (R-02), ex.: `mensalao.com.br` no Registro.br, se disponível.
   - No DNS, aponte o domínio para o GitHub Pages (registros A/AAAA do Pages ou CNAME para `vorttechx.github.io`).
   - No repositório: Settings > Pages > Custom domain = o domínio; marque "Enforce HTTPS".
   - No CI, defina a variável `MENSALAO_DOMINIO` (o build passa a gravar o arquivo `CNAME`). Com o domínio configurado, `vorttechx.github.io/mensalao/` redireciona para ele.
3. **Criar a conta de desenvolvedor** (R-01, taxa única de US$ 25). Contas pessoais novas podem exigir teste fechado antes da produção.
4. **Criar o app no Play Console** (R-04) e ativar o Play App Signing. Crie uma **chave de upload** (R-03) com `keytool -genkeypair -v -keystore mensalao-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000` e guarde o arquivo e as senhas fora do repositório. Sem TWA, o fingerprint e o `assetlinks.json` não são mais necessários.
5. **Preparar a máquina**: Node 22, JDK 21 e Android Studio (ou as command-line tools com `platforms;android-36` e `build-tools`), com `ANDROID_HOME` definido.
6. **Gerar o app Android (Capacitor)**: o app é o mesmo código web, empacotado em `android/`.
   - Teste: `npm run android:apk` gera `android/app/build/outputs/apk/debug/app-debug.apk` (IDs de teste). Instale com `adb install -r` ou abra a pasta `android/` no Android Studio.
   - Produção: `npm run android:aab` com as variáveis de assinatura definidas (`MENSALAO_KEYSTORE`, `MENSALAO_KEYSTORE_SENHA`, `MENSALAO_KEY_ALIAS`, `MENSALAO_KEY_SENHA`) e `MENSALAO_VERSION_CODE` maior a cada envio. Gera `android/app/build/outputs/bundle/release/app-release.aab`; suba numa faixa de teste interno.
7. **Cadastrar o produto in-app** `mensalao_pro`, não consumível, com o preço confirmado (R-05, D-04).
8. **Preencher a ficha** (R-06) com os textos de `docs/loja/ficha-play.md`, as capturas de `docs/loja/capturas/`, ícone 512 px, gráfico de destaque 1024×500, URL da política (`https://mensalao.app/privacidade.html`), e-mail de contato `contato@mensalao.app`, Segurança dos dados, classificação, público-alvo e "sem anúncios".
9. **Testar a compra real** (R-07) com contas de teste de licença: comprar, reinstalar e restaurar, reembolsar (o Pro deve voltar ao grátis na abertura seguinte com o aviso).
10. **Enviar para revisão** e publicar (R-09). Depois, preencher `URL_FICHA_PLAY` em `src/ui/telas/pro.ts` para mostrar o botão "Abrir na Google Play" no navegador comum.
