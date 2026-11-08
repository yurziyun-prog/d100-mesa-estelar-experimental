# v184 — Masmorra de treino: labirinto com monstros, armadilhas, paredes que quebram e se reconstroem

Mapa feito para testar tudo com o Kael Teste (e com o controle de videogame): atacar com espada, pistola e carabina laser, usar psi, derrubar paredes e pedras, reconstruí-las, cair em armadilhas e enfrentar monstros no tempo real. Imagem: `docs/imagens/v184-masmorra.png`.

## O mapa (`js/mesa-masmorra.js`, dados puros + instalação)
- **"Masmorra de treino"** (`v184_masmorra`), 42×20 m, chão de masmorra, labirinto gerado com semente fixa (sempre o mesmo).
- **Paredes**: 110 blocos de 2×2 m de "Parede de pedra", cada um destrutível (PV 24, dureza 2). Quebrar um bloco abre uma passagem de 2 m. O ataque é o normal da mesa, com o alvo no objeto (picareta ignora a dureza da pedra e faz +50%).
- **Pedras soltas** (7): bloqueiam corredores, PV 16, dureza 2. Nunca cortam o único caminho: da entrada chega-se a todas as salas sem quebrar nada.
- **Três salas**: a primeira com 2 Rastejantes de Cinzas; a do meio com 2 Cadáveres de trabalhador e um Enxame Mordedor; a do chefe com o Cadáver Chefe e mais um cadáver. Monstros que não existirem no Banco de Criaturas são pulados.
- **Armadilhas** (6, de estacas e de lâminas) em corredores retos, escondidas (laje quase invisível).
- Entrada no canto superior esquerdo (3 m, 3 m).

## Armadilhas (só o navegador do mestre dispara)
- Quem pisa testa **Esquiva** (−10 nas lâminas). Falhou: dano 1d6+1 (estacas) ou 2d4 (lâminas) no local sorteado, com armadura contando. Fiasco (99–100) dobra o dano.
- Depois de disparar, a laje fica visível e rearma em 30 s. Ficar parado em cima não dispara de novo.
- **Percepção** a até 1,6 m de uma laje escondida (um teste por personagem) revela a armadilha antes de pisar.
- Tudo vai para o histórico (🪤 / 🔪 / 👁️).

## Reconstruir (🧱)
- Sobre cada parede, pedra ou objeto destrutível quebrado a até 2,2 m do personagem aparece o botão 🧱.
- Clicar pede um teste da melhor entre **Engenharia, Mecânica e Mineração**: sucesso devolve metade dos PV (e o bloqueio volta), crítico devolve tudo, falha não avança. Intervalo de 2,5 s entre tentativas; no tempo real custa ~2 ações de recarga.
- O jogador pede pela fila `combatesAtivos/mesaMasmorra/acoes` (coberta pela regra genérica de `combatesAtivos/{id}/acoes`); o mestre resolve e grava cena e histórico. Nenhuma mudança em `firestore.rules`.
- **Controle**: o X e a alavanca direita agora também acham o 🧱 (`mesa-controle.js`).

## Kael Teste
- Completado uma vez com o que faltava: Espada Longa, Pistola Laser e Armadura Corporal Leve equipadas; Carabina Laser, Kit de Ferramentas Mecânicas e Kit de Primeiros Socorros na mochila. Nada é duplicado. Perícias e especializações já estavam todas em 50% (psi incluído).

## Botões
- **🏰** (mestre, canto inferior esquerdo, acima do 🧪): "Levar o Kael Teste à masmorra" (põe a miniatura na entrada, grava o local na ficha e abre o mapa) e "Reiniciar a masmorra" (paredes e armadilhas novas, monstros de volta com a saúde zerada, Kael na entrada).
- Na faixa 🧪 "vendo como jogador": **🏰 Recomeçar na masmorra**.
- Para os monstros agirem, ligue o ⚡ tempo real como sempre.

## Testes
- `tests/v184-masmorra.test.mjs`: geração determinística, blocos de parede destrutíveis, 6 armadilhas escondidas, monstros dentro das salas, caminho da entrada até salas/armadilhas/monstros sem quebrar nada, cena publicada com os dados, regras das armadilhas e da reconstrução, inventário do Kael sem duplicar, instalação e seletores do controle.
- `tests/v184-masmorra-browser.cjs` (Chrome sem janela, banco falso): Kael pisa na armadilha (Esquiva, dano no local, histórico, laje revelada, sem repetir); parede quebrada mostra o 🧱 e o clique reconstrói 12/24; **controle falso** aperta X e reconstrói (crítico → inteira); botão 🏰 abre a janela; sem erros de página.
- Suíte completa: 551 testes aprovados. `scripts/preparar-hosting.cjs` confere sintaxe e imports.

## Publicar
Só o site mudou:
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
Na primeira abertura como mestre, o mapa é criado sozinho (aviso 🏰 na tela). Cópia de segurança anterior: `_entregas/backup-antes-v183.tgz` (parte 22 e testes).
