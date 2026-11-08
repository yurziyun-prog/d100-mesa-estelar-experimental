# v185 — Criaturas e NPCs escolhem a atitude no tempo real

Até a v184 só os jogadores escolhiam Defesa total, Ataque total ou Recuo (v183). Agora as criaturas e NPCs automáticos (🤖) também escolhem, no navegador do mestre, como um jogador faria.

## Regras (`escolherAtitude`, em `js/mesa-tempo-real-tatica.js`)
- **Fugindo por moral** (vida abaixo do limite do perfil): entra em **💨 Recuo** em vez de só correr: anda 1,6× mais rápido, defende melhor e não ataca. **Encurralada** (sem para onde correr ou com o inimigo colado) volta ao Normal e luta.
- **Em choque pela ferida** (sem ataques por algumas rodadas): **🛡️ Defesa total**. Quem não tem mente (zumbis, limos, enxames) fica no Normal.
- **Quase morta (≤ 30%) mas destemida** (perfil que nunca foge): chefes, alfas e furiosos partem para o **⚔️ Ataque total** (frenesi); os outros ficam em Defesa total, e saem dela só acima de 40%.
- **Predadores, animais e chefes com vida alta (≥ 70%) e alvo colado**: **⚔️ Ataque total**, mantido até 50% da vida. Inteligentes não partem para o tudo ou nada; imóveis (Cila) não entram em Ataque total.
- O resto fica no Normal. Quem não tem mente só usa Normal (fora o frenesi do chefe).

## Como funciona
- A IA calcula a atitude desejada em cada ciclo e, se mudou, troca pelo mesmo caminho do jogador (transação do módulo de atitudes), com 1,5 s de intervalo por criatura. A troca vale a partir do ciclo seguinte.
- O histórico registra a mudança ("🛡️ Guarda: Defesa total.", "💨 Galinha: Recuo / Fuga."). Voltar ao Normal não polui o histórico.
- Na gaveta ⚡, a linha da criatura mostra a atitude atual ao lado de "fugindo" e do papel tático.
- Nada muda no combate por turnos nem em `firestore.rules`.

## Testes
- `tests/v185-ia-atitudes.test.mjs`: toda escolha é uma atitude válida; sem mente só Normal; fuga/encurralada; choque; frenesi do chefe (inclusive o Cadáver Chefe); Ataque total do predador com histerese; ligação com o módulo de atitudes, intervalo, histórico e gaveta.
- Suíte completa: 556 testes aprovados. `scripts/preparar-hosting.cjs` confere sintaxe e imports.
- Cópia de segurança: `_entregas/backup-antes-v185.tgz`.

## Publicar
Só o site mudou:
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
