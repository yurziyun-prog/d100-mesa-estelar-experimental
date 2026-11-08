# Mesa Estelar v109 — O mapa como centro do jogo (etapa 1)

## 🎲 Onde surgem os encontros
No **🧭 Diretor de cena → Encontros**, cada proposta agora tem o campo **Surgem**:
- **🎲 Borda/canto aleatório** (padrão): as miniaturas entram por uma borda ou canto do mapa, longe do grupo e fora de paredes e objetos.
- **📍 Eu escolho no mapa**: ao aprovar, a gaveta sai da frente, você clica no ponto e o encontro surge ali. Esc cancela.
- **👥 Perto do grupo**: o comportamento antigo.

A escolha fica salva por mapa. Objetos do encontro (caixotes, pedras…) aparecem junto do ponto de surgimento.

## 🔎 Ações neste local — investigar e comprar direto no mapa
Há um botão novo **🔎** nas ferramentas do mapa, para todos.
- **Ações do cenário** (investigar, examinar, abrir…):
  - O mestre fixa cada ação num ponto do mapa (📍).
  - O jogador clica no ícone, escolhe a perícia e usa **🎲 Tentar** ali mesmo. O resultado aparece flutuando sobre o ponto.
  - O ponto fica com ✓ quando alguém descobre algo.
  - É preciso estar a até 3 m do ponto. O mestre pode mudar esse alcance em cada ponto.
- **Nova ação num ponto do mapa** (mestre): escreva título, perícias, o que todos percebem, o sucesso e a falha. A ação é gravada no cenário ligado ao mapa e já vira um ponto.
- **Comércio e serviços**:
  - Clique na miniatura de um NPC comerciante para abrir a loja dele (precisa estar a até 3 m).
  - A lista de comerciantes também fica no painel 🔎.
- As regras são as mesmas do Cenário Atual: uma tentativa por perícia por dia, ⭐ Sorte para rerrolar, barganha e preços.

## 🧍 Miniaturas sem a bolinha amarela
Nas miniaturas realistas, a bolinha de direção ficou invisível, porque a figura já mostra frente e costas.
- A miniatura continua virando sozinha para onde anda.
- Para girar parada, passe o mouse na borda da figura: aparece um contorno tracejado, e é só segurar e girar.

## Próximas etapas
- **v110**: gerador de mapas aleatórios e melhoria dos mapas existentes.
- **v111**: combate em tempo real.
  - Criaturas e personagens agem sozinhos, e mais ações por turno significam agir mais rápido.
  - Botão ⏸️ pausar.
  - Facções, para criaturas lutarem entre si.

## Técnico
- Novos arquivos: `js/mesa-interacoes.js` e `tests/v109-interacoes.test.mjs`.
- Pontos do mapa ficam em `combatesAtivos/mesaPontos_<mapa>`. As regras atuais já cobrem esse caminho: o mestre grava e todos leem.
- `js/app.js` ganhou a ponte `mesaInteracoesMapaV109_`, que reaproveita as funções do Cenário Atual, e carrega o módulo à parte. Se ele faltar, nada muda.
- `js/mesa-diretor.js`: surgimento na borda, em ponto escolhido ou perto do grupo, desviando de obstáculos.
- `js/mesa-visual.js`: esconde a bolinha nas miniaturas realistas.
- `js/nova-direta.js`: só a versão do import do visual mudou.

## Validação
- Navegador de teste:
  - Encontro na borda nasceu no canto oposto ao grupo.
  - Encontro em ponto escolhido nasceu em volta do clique.
  - O mestre fixou uma ação e criou outra pelo mapa.
  - O jogador abriu o ponto e testou Percepção (resultado e Sorte certos).
  - O ponto longe pediu para se aproximar.
  - O clique no comerciante pediu para chegar perto e, depois, abriu a loja.
- `node --test tests/*.test.mjs`: 305 de 337. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
