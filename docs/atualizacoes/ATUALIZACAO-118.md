# Mesa Estelar v118 — O Cenário Atual agora fica dentro do mapa

## 📜 Botão "Cenário" no canto do mapa (para todos)
Ele abre uma gaveta lateral, por cima do mapa e sem empurrar nada.

- **Jogadores** veem exatamente o que viam na aba "Cenário Atual":
  - descrição do local, pessoas, clima, hora;
  - os botões de ações e de comércio.

  É o mesmo conteúdo, só que mudou de lugar. Os testes no local continuam pelos **pontos 📍 no mapa** (investigar o sangue, abrir a porta…). O comércio continua **clicando no NPC comerciante** (comprar, vender e barganhar, a até 3 m).
- **Mestre** vê, além disso, um bloco **🔒 Só o mestre**:
  - **📢 Ler para os jogadores**, com 📋 para copiar;
  - 🎯 objetivo e 🕵️ o que está acontecendo;
  - 🤫 segredos;
  - estado inicial, ⚡ eventos e 👾 encontros;
  - 🎭 NPCs da cena;
  - testes sugeridos e 📝 observações.
- **Proteção dos segredos:** esses dados vêm do banco de cenários, que só a conta do mestre consegue ler. Na conta de um jogador o bloco nem é montado.
- **Cenário certo:** a gaveta mostra o cenário ativo ou, se não houver, o cenário ligado ao mapa aberto.

## A aba "Cenário Atual" saiu do topo
- **Nada se perdeu:** o conteúdo dela mora agora na gaveta 📜.
- **Proteção:** se o módulo falhar, a aba e o conteúdo voltam para o lugar antigo sozinhos.

## Próximo (v119)
Carregamento mais rápido do mapa, dos itens e dos personagens.

## Validação
- **Mestre:** a gaveta mostrou "A Última Bateria" com o texto para ler, o objetivo, os segredos, os NPCs e as observações, e a aba sumiu.
- **Jogador:** só o conteúdo público, sem nenhum segredo.
- `node --test tests/*.test.mjs`: 342 de 374. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
