# v191 — Viagem visível para todos, masmorra jogável (Kael anda e chega aos monstros)

Pedidos do Yuri depois de testar o site. Imagem da masmorra: `docs/imagens/v191-masmorra.png`.

## 1. Viagem 🚀 — "ativar e todos vermos o vídeo"
- **Causa**: o botão **Embarcar** ficava desabilitado, sem aviso, quando não havia personagem de jogador no mapa de partida; o mestre clicava em 🚀 Viagem e nada acontecia.
- **Agora** (`js/mesa-viagem.js`): a tela de preparação tem dois botões: **▶ Iniciar viagem agora** (começa já, a cena abre em tela cheia para o mestre e todos os jogadores ao mesmo tempo; quem não escolheu posto vai de passageiro) e **🧳 Embarcar (escolher postos)** (o fluxo antigo, depois 🛫 Decolar). A tripulação é a dos jogadores do mapa de partida; se não há ninguém ali, vão todos os personagens de jogador do jogo (com aviso). Nunca fica travado, mesmo sem jogadores (só o mestre vê).
- O botão do mestre ganhou posição fixa no canto superior esquerdo do mapa e mostra "🚀 Viagem em andamento" enquanto houver viagem; clicar reabre a cena.

## 2. Masmorra: Kael anda e chega aos monstros
- **Achado ao simular com a colisão real do jogo**: na versão anterior (corredores de 1,5 m) muita coisa não dava para alcançar de verdade; barris tapavam a porta do Depósito; o Kael nascia num poço de escada de 1,2 m de largura, ao lado de parede e abismo, e os carrapatos ficavam atrás de uma parede.
- **Corrigido** (`js/mesa-masmorra.js`): quadros de **2 m** (mapa de 60×36 m, corredores de 2 m), portas que vedam o vão inteiro, barris tirados da porta do Depósito, rochas proporcionais. Pela colisão real, do Quarto chegam-se a todas as salas e monstros (portas abertas); só arsenal e cripta (trancados de propósito) e as celas ficam fechados até serem abertos.
- **Sala inicial = Quarto**: o Kael nasce nele, **sozinho**. Os **carrapatos saíram** (foram para a caverna do sul) e nenhum monstro fica no Quarto, no Altar ou no Depósito.
- **Itens no chão do Quarto** (pegar pelo ícone no mapa): **Pistola Laser**, **Sabre de energia (Espada de Força)**, Célula de Lâmina, Bateria, Armadura Corporal Leve e Kit Médico Básico. O Kael não nasce mais armado: o kit inicial é só ferramentas mecânicas e primeiros socorros. O botão 🏰 → "Levar o Kael à masmorra" o coloca no Quarto.
- Quem já tinha a masmorra recebe a nova sozinho na primeira abertura como mestre (aviso 🏰); monstros voltam e o Kael vai para o Quarto.

## Testes
- `tests/v191.test.mjs`: Kael sozinho no Quarto; itens (pistola laser e sabre) no Quarto, fora de móveis; **caminhada com a colisão real** (`destinoSemColisao`) a todas as salas e monstros; portas vedadas; tripulação e horas da viagem.
- `tests/v191-browser.cjs`: módulo real de posições com a cena da masmorra (Kael anda para todos os lados, a parede o segura, continua livre) e módulo real de viagem (Embarcar sempre liberado, "Iniciar viagem agora" abre a cena para todos).
- Suíte completa: 579 testes aprovados. Montagem confere sintaxe e imports. Cópia de segurança: `_entregas/backup-antes-v191.tgz`. Nada muda em `firestore.rules`.

## Publicar
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
