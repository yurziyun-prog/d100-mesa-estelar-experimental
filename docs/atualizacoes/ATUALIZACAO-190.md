# v190 — Tema visual "Modo Tático" (estética futurista)

O Yuri mandou uma imagem de referência (mapa de batalha escuro, visto de cima) e pediu para deixar a estética do site mais parecida com ela, com um toque mais futurista por causa do cenário sci-fi. Só a aparência mudou — nenhuma lógica de jogo foi tocada.

## O que mudou no visual (`index.html`)
- Novo bloco de estilos `v190-tema-modo-tatico` (camada final de CSS, só reaparência):
  - **Fundo espacial escuro**: nebulosas azul-petróleo e índigo bem sutis (antes rosa/roxo/arco-íris), com **grade tática** discreta ao fundo (eco do mapa de referência) e vinheta escurecendo as bordas.
  - **Tela de login em estilo HUD**: painel grafite com cantoneiras luminosas nos cantos, título em caixa-alta com gradiente ciano, campos escuros com brilho no foco.
  - **Botões**: escuros com borda ciano e brilho no hover; secundários discretos; "Sair" em vermelho sóbrio.
  - **Abas** em estilo console de comando: ativa com borda inferior ciano e brilho.
  - **Seções e cartões** (Ficha, Mercado, personagens): painéis grafite com borda sutil, hover com elevação e brilho ciano.
  - **Barras de rolagem** escuras com poleg ciano; `theme-color` do navegador acompanha o novo fundo.
- Paleta centralizada em variáveis CSS (`--mt-*`): ciano `#54e6ec` como acento, âmbar reservado para alertas.

## Pré-visualização local
- `npm run dev` sobe um servidor local (padrão `http://localhost:7100/`) que monta o `js/app.js` na hora a partir de `js/app/` — sem criar o arquivo solto, que faria a publicação parar. Scripts: `scripts/dev-server.cjs` e `package.json` (não vão para o deploy; o Firebase publica só `.firebase-public`).
- Capturas do novo visual: `docs/imagens/v190-tema-login-desktop.png`, `v190-tema-app-desktop.png`, `v190-tema-login-mobile.png` (sem rolagem lateral a 390 px).

## Verificação
- `node --test tests/*.test.mjs` → 561/561 passando.
- `node scripts/preparar-hosting.cjs` → sintaxe e imports conferidos, app.js montado de `js/app/`.
- Chrome sem janela (Playwright) a 1280 px e 390 px: tela de login e abas renderizando com o novo tema, sem erro de página.

## Para publicar (comando do Yuri)
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
