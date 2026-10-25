# Mensalão

PWA de controle de assinaturas, publicado em https://mensalao.app e empacotado como TWA para o Google Play.

## Como rodar

```
npm ci
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção em dist/
npm test             # testes unitários (Vitest)
npm run test:e2e     # testes de interface (Playwright)
```

## Estrutura

- `src/`: código do app (domínio em módulos puros, UI separada).
- `public/`: manifest, ícones e `assetlinks.json` da TWA.
- `tests/`: testes unitários (`tests/unit/`) e de interface (`tests/e2e/`).
- `twa/`: configuração do empacotamento Android.
- `docs/loja/`: ficha da Play, capturas, política de privacidade e guia de publicação.
- `.github/workflows/`: CI em todo PR e publicação no GitHub Pages a cada push na `main`.
