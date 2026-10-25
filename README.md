# Mensalão

App Android de controle de assinaturas (Vite + TypeScript, empacotado com **Capacitor**), publicado na Google Play. O plano grátis mostra anúncios do Google AdMob; o Mensalão Pro (compra única pelo Google Play Billing) remove os anúncios. As assinaturas ficam só no aparelho (localStorage da WebView).

O site https://mensalao.app publica só a página de apresentação, a política de privacidade e o `app-ads.txt` (pasta `site/`); o app não roda mais pelo navegador.

> **Atenção (US-30.CA9):** Dev e QA **nunca** trocam os IDs de teste do AdMob por IDs reais e **nunca** tocam em anúncios de produção. Clique inválido suspende a conta do AdMob. Todo build de desenvolvimento, de teste, da CI e o APK de debug usam só os IDs de teste oficiais do Google; os IDs reais existem só nas variáveis de ambiente de quem gera o `.aab` de produção (`npm run android:aab`, ver `docs/loja/guia-publicacao.md`).

## Como rodar

```
npm ci
npm run dev                # servidor de desenvolvimento (navegador, sem anúncios: provedor indisponível)
npm run build              # build web do app em dist/ (IDs de teste), copiado pelo Capacitor para o Android
npm run build:teste        # build de teste em dist-teste/ (provedores falsos de compra, notificação e anúncios)
npm run build:site         # site público em dist-site/
npm test                   # testes unitários (Vitest)
npm run test:e2e           # testes de interface (Playwright, sobre o build de teste)
npm run verificar:bundle   # builds + cap sync + verificação de provedores falsos, IDs, domínios de anúncio e URLs externas
npm run android:sync       # build + npx cap sync android (não precisa do Android SDK)
npm run android:apk        # APK de debug (precisa do JDK 21 e do Android SDK)
npm run android:aab        # .aab de produção (IDs reais e chave de upload por variável de ambiente)
```

## Estrutura

- `src/`: código do app (domínio em módulos puros em `src/domain/`, serviços em `src/servicos/`, UI em `src/ui/`).
- `src/plataforma/`: interfaces de compra, notificação, arquivos e anúncios, com as implementações reais (Capacitor), falsas (build de teste) e indisponíveis; o alias `@ambiente` escolhe o conjunto.
- `android/`: projeto Android do Capacitor (versionado).
- `public/`: manifest, ícones, `privacidade.html` e `pagina.css` (a política vai no pacote do app e no site).
- `site/`: página de apresentação, 404, `app-ads.txt` e o `sw.js` que desliga o PWA antigo.
- `scripts/`: builds do Android e do site e as verificações da CI.
- `tests/`: testes unitários (`tests/unit/`) e de interface (`tests/e2e/`).
- `docs/loja/`: ficha da Play, capturas, política de privacidade e guia de publicação.
- `.github/workflows/`: CI em todo PR e publicação do site no GitHub Pages a cada push na `main`.
