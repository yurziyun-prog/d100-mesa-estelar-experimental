# Mesa Estelar v116 — Mapa mais direto para o mestre

## ＋ é o jeito padrão de colocar no mapa
- **Fantasma no mouse:** escolha uma criatura, NPC, personagem ou objeto no **＋**. Uma imagem semitransparente dele, já no tamanho real, acompanha o mouse; clique onde ele deve ficar.
  - **Shift** continua colocando o mesmo item.
  - **Esc** cancela.
- **Sem catálogo antigo:** o "Adicionar ao mapa" lá de baixo não aparece mais para o mestre.

## 🎭 Atuar como (ao lado da ✋)
- **Assumir uma miniatura:** clique no 🎭 e depois na miniatura (NPC, monstro ou personagem). A partir daí você move, ataca e age como ela.
- **Quem você está controlando:** aparece na barra (ex.: "🎭 Besta Ululante"). O **✕** volta para o modo mestre (✋).
- **Tempo real:** se a criatura estava no automático, ela sai do automático e passa a ser sua.
- **Fim do seletor antigo:** o "Atuar como" sumiu da tela, porque o 🎭 o substitui.

## 🛠️ Editar o mapa sem painel
- **Ferramentas na lateral:** o 🛠️ mostra uma coluna de ferramentas na lateral esquerda do próprio mapa:
  - ↖ selecionar e mover;
  - ▭ parede, ◻ quadrado, ◯ círculo, ⬭ elipse e △ triângulo;
  - ✎ lápis e cor;
  - 🧱 "bloqueia passagem" (ligado para fazer paredes);
  - ⧉ duplicar, 🗑️ apagar, ↶ desfazer e ↷ refazer.
- **Objeto selecionado:** um quadrinho no canto direito do mapa permite trocar nome, largura, altura, giro, camada e opacidade.
- **Salvamento automático:** tudo se salva sozinho (✔ tudo salvo).
- **Oficina completa:** o painel grande "Editar mapa · Oficina 2" não fica mais embaixo do mapa. Ele abre pelo último botão da coluna (🛠️), só quando você quiser chão e texturas.

## Próximo (v117)
- PDMs viram NPCs com ficha avançada, e a Dra. Ilya Nemer fica única.
- O Escudo do Mestre passa a ser a primeira aba e a Ficha a última, com acesso a todas as fichas.
- Os cenários reais da sua pasta viram testes e pontos de verdade.

## Validação
- **Navegador de teste com a mesa completa:**
  - o fantasma da Besta seguiu o mouse e ela foi colocada no clique;
  - o 🎭 assumiu a Besta;
  - a parede desenhada pela lateral foi salva sozinha;
  - o quadro do objeto apareceu ao selecionar um caixote;
  - o catálogo antigo e a Oficina saíram da frente;
  - nenhum erro.
- `node --test tests/*.test.mjs`: 336 de 368. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
