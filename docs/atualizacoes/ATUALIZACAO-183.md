# v183 — Atitudes de combate no tempo real (Defesa total, Ataque total, Recuo)

Conclui o pedido iniciado com o GPT: no combate em tempo real, o jogador escolhe uma **atitude** para o personagem, na barra do canto inferior esquerdo do mapa (aparece só com o tempo real ligado e o próprio personagem selecionado). O combate por turnos não muda nada: lá a atitude é sempre Normal.

## As quatro atitudes (`js/mesa-atitudes-dados.js`)
| Atitude | Ataque | Defesa | Velocidade | Ataques | Defesas por rodada |
|---|---|---|---|---|---|
| ⚖️ Normal | — | — | ×1 | normais | normais |
| 🛡️ Defesa total | não ataca | **+40** | ×0,6 | bloqueados (psi ofensivo também) | o dobro |
| ⚔️ Ataque total | **+15** | **−25** | ×1 | recarga ×0,65 (mais rápidos) | normais |
| 💨 Recuo / Fuga | não ataca | **+15** | **×1,6** | bloqueados | ×1,5 |

Equivalência com os turnos: Defesa total = gastar todas as ações defendendo; Ataque total = tudo no ataque; Recuo = correr e esquivar sem atacar. Cura psi e outros poderes não ofensivos continuam livres em qualquer atitude.

## Como funciona
- O jogador pede pela fila `combatesAtivos/mesaAtitudes/acoes` (as regras genéricas de `combatesAtivos/{id}/acoes` já cobrem: só o dono do personagem cria o pedido e só o mestre resolve). O mestre grava `modoRT` na saúde do personagem; a atitude vale só para a sessão de tempo real em andamento (ao encerrar e iniciar outro, volta a Normal).
- Troca de atitude: 1 s de espera entre trocas; só consciente; não com o combate pausado.
- Animação: anel colorido em volta da miniatura (azul pulsando = Defesa total; vermelho tracejado girando = Ataque total; verde "correndo" = Recuo), com o ícone da atitude em cima. Respeita `prefers-reduced-motion`.
- A velocidade da atitude entra no arrasto do jogador (`nova-direta.js`) e no passo da IA; a recarga dos ataques e a reserva de defesas entram em `mesa-tempo-real.js`.

## O que estava faltando (arrumado agora)
- **O bônus de defesa não era aplicado**: o resolvedor da mesa (`js/app/22-mesa-e-modulos.js`) calculava a atitude do defensor e não a usava. Agora toda opção de defesa (Esquiva, Aparar, Aparar com cauda) recebe o modificador e o histórico mostra "+40 Defesa total", "−25 Ataque total" ou "+15 Recuo / Fuga".
- O bônus de ataque (+15) já valia, mas não aparecia no texto do teste; agora aparece.
- **Postura (v140) só aparecia no texto**: "+10 agachado" e "+20 rastejando (alvo baixo)" contra tiros, e "−20 rastejando" corpo a corpo, não mudavam o número da defesa (o histórico compensava com "outros modificadores"). Agora valem de verdade.
- `tests/nova-resolucao.test.mjs` quebrava (10 testes) porque o trecho avaliado não conhecia as funções importadas no topo da parte 22. Corrigido no próprio teste, que ganhou um caso para postura e atitudes.
- Ajuda da gaveta ⚡ explica as atitudes.

## Testes
- Novo `tests/v183-atitudes.test.mjs`.
- Suíte completa: 544 testes aprovados. `scripts/preparar-hosting.cjs` confere sintaxe e imports.
- Verificação no Chrome (barra de atitudes + barra de posturas, 1280 e 390 px): sem erros no console, sem rolagem lateral, sem sobreposição; pedido → saúde → anel na miniatura funcionando.

## Publicar
Só o site mudou (nenhuma alteração em `firestore.rules`):
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
Cópia de segurança: `_entregas/backup-antes-v183.tgz`.
