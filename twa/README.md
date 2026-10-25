# Projeto TWA do Mensalão (Bubblewrap) — E-01

Empacota o PWA publicado no domínio próprio como app Android (Trusted Web Activity) com Google Play Billing.

## Marcadores a preencher antes de gerar o pacote

| Marcador | Onde | Quem fornece |
| --- | --- | --- |
| `mensalao.app` (definido em 24/10/2026) | `twa-manifest.json` (`host`, `iconUrl`, `maskableIconUrl`, `webManifestUrl`, `fullScopeUrl`) | Renato (R-02, D-05) |
| `SHA256_DA_CHAVE_DE_ASSINATURA_A_PREENCHER` | `twa-manifest.json` (`fingerprints`) e `public/.well-known/assetlinks.json` | Renato (R-03): fingerprint SHA-256 da chave de assinatura do Play App Signing (Play Console > Integridade do app) |
| `packageId` `br.com.mensalao.app` | `twa-manifest.json` e `assetlinks.json` | Renato confirma (R-10); não muda depois de publicado |

A chave (`*.keystore`) **nunca** entra no repositório.

## Gerar o `.aab`

```bash
npm i -g @bubblewrap/cli          # requer JDK 17 e Android SDK (o Bubblewrap oferece instalar)
cd twa
bubblewrap update                 # gera o projeto Android a partir deste twa-manifest.json
bubblewrap build                  # gera app-release-bundle.aab (assinado com a chave de upload)
```

O `.aab` vai para o Play Console (R-04). O produto in-app `mensalao_pro` (não consumível) é cadastrado no Play Console (R-05).

## Conferências

- `features.playBilling.enabled: true` liga a Digital Goods API dentro da TWA (sem isso o app mostra "compra indisponível").
- `https://<domínio>/.well-known/assetlinks.json` tem de responder com o pacote e o fingerprint corretos, senão a TWA abre com barra de endereço e a cobrança não funciona.
- Nome, cores e ícones batem com `public/manifest.webmanifest` (nome "Mensalão", tema #FFFFFF, fundo #FFFFFF, ícone 512 px maskable). Sprint 3: barra de status e de navegação na cor do papel (#FFFFFF no claro, #0F1512 no escuro), com ícones escuros no claro; tela de abertura = ícone 512 px centralizado sobre o branco.
