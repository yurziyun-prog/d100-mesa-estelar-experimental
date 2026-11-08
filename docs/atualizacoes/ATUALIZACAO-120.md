# Mesa Estelar v120 — Movimento sem prender, barra única, histórico e descrição para os jogadores

## 🚶 A miniatura não prende mais nas quinas
- **Corpo um pouco menor que a base:** o corpo que bate em paredes e objetos agora tem 80% da base desenhada. Uma pessoa (1 m) passa folgada por um vão de 1 m entre uma parede e um móvel; antes ela prendia na quina.
- **Desliza na parede:** ao encostar em parede ou objeto andando na diagonal, a miniatura desliza ao longo dele em vez de travar.
- **Paredes continuam paredes:** não dá para atravessá-las.

## 🪑 Cadeiras de adulto
- **Tamanho:** cadeiras voltam a ter 0,9 m (estavam com 0,65 m e pareciam de criança).
- **Correção sozinha:** no banco e nos mapas, o ajuste acontece quando você abre o mapa.

## 🧭 Tudo numa linha só
- **Uma barra:** a linha de cima (▶ iniciar combate, ■ encerrar, 📍 trazer personagens ativos, 🎲 posições aleatórias, 🧹 limpar, ♻ restaurar e a situação do turno) foi para a mesma barra do seletor de mapa, ✋ e 🎭.
- **Sem repetidos:** o segundo seletor de mapa, o ✕, a busca rápida e o 👥 saíram. O 📍 faz a mesma coisa que o 👥 fazia.

## 📜 Histórico de combate de volta
- **Sempre visível:** o histórico embaixo do mapa voltou a aparecer. Ele tinha ficado escondido para quem um dia clicou em "ocultar", porque o botão de mostrar tinha sumido numa versão antiga.
- **Exceção:** só o modo ⛶ (foco no mapa) ainda o esconde.

## 📖 "Ler para os jogadores" visível para eles, se você quiser
- **Ligar:** na gaveta 📜 Cenário, ao lado do texto para ler, o botão **🙈 oculto / 👁️ visível** mostra esse texto aos jogadores.
- **O que eles veem:** um selo **📖 nome do local** no canto inferior esquerdo do mapa; passar o mouse ou clicar mostra a descrição.
- **Por mapa:** cada mapa guarda o seu; você liga e desliga quando quiser.

## Próximo (v121)
- Oficina avançada compacta, organizada e recolhível.
- Mini-ficha dos jogadores embaixo do mapa.

## Validação
- **Navegador de teste:**
  - a miniatura atravessou um vão de 1 m entre uma parede e um caixote e deslizou na parede ao ir na diagonal;
  - os botões ▶ ■ 📍 🎲 🧹 ♻ e a situação do turno ficaram na barra;
  - as linhas antigas sumiram;
  - o histórico ficou visível;
  - a descrição apareceu para os jogadores ao ligar.
- `node --test tests/*.test.mjs`: 347 de 379. Só falham os 31 testes antigos e o teste de cache da v102. Os testes de colisão foram atualizados para o corpo de 80%.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
