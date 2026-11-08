# v189 — Masmorra copiada de um mapa de batalha, com personagem de teste automatizado

O Yuri mandou um mapa de masmorra clássico de RPG e pediu para reconstruí-lo com as ferramentas do site, buscando o máximo de semelhança, e depois pôr monstros, armadilhas, alavancas, portas, luzes e camadas, testar tudo com um personagem e corrigir o que falhasse. Imagem: `docs/imagens/v189-masmorra.png`.

## Como o mapa foi copiado
- A imagem foi aberta no Chrome, clareada e dividida numa grade numerada de 36 px (o quadro do mapa, 1,5 m). A planta foi transcrita quadro a quadro para `MAPA` em `js/mesa-masmorra.js` (30 × 18 quadros = 45 × 27 m): `.` sala/corredor, `,` caverna, `~` abismo, `=` ponte, `S` escada, `#` rocha. A tentativa de classificar os pixels sozinho falhou (mapa escuro demais), então a transcrição é manual e conferida pelos testes.
- `LINHAS` são as paredes internas entre dois quadros de chão (quarto/altar, escadaria, depósito/caverna, arsenal/cripta, cripta/corredor, torre/corredor, caverna/cripta, dormitório, poço/anfiteatro, refeitório, quartel). `PORTAS` ficam nos vãos (12, duas trancadas: arsenal e cripta). As paredes com a rocha saem sozinhas dos limites do chão; na caverna, viram rochas.
- Estrutura em formas da Oficina (arte v110): paredes claras de pedra como na referência, pisos de lajota nas salas e corredores, chão de pedra escura na caverna, pontes de madeira, abismo preto, poço de água, desgaste no chão.
- Mobília do Banco nos mesmos lugares da referência: altar iluminado, escrivaninha e cama no quarto, barris e caixotes no depósito, mesa redonda com cadeiras e bancos no refeitório, camas no quartel e no dormitório, sarcófagos e estandarte na cripta, trono e mesa de pedra na torre, poço com barris, degraus no anfiteatro, escada da entrada e de saída.

## Monstros, armadilhas, alavancas, portas, luzes e camadas
- 16 monstros em 6 facções, espalhados pelas salas e pela caverna; dois presos em celas (arsenal e anfiteatro). A cela do arsenal abre por uma **alavanca emperrada** (precisa de Força Bruta ou Mecanismos); a do anfiteatro abre pela armadilha do corredor.
- 6 armadilhas nos corredores. Novidade: quem **já percebeu** a armadilha (Percepção) tenta **saltar por cima** (Atletismo); se conseguir, não dispara.
- 12 portas de pedra interativas (abrir/fechar, trancar, teste de Mecanismos/Segurança/Força Bruta); as da cripta e do arsenal começam trancadas.
- Luzes: 22 arandelas (luminárias de parede, acendem de noite) com poças de luz discretas, mais três braseiros.
- Camadas: tapete e pisos na camada 1, cadeiras na 2, móveis na 3, estandarte e arandelas na 4 e um **telhado** sobre o quarto na camada 5, que some quando alguém entra (módulo de telhados).

## Personagem de teste automatizado
`tests/v189-personagem-teste-browser.cjs` roda o Kael Teste no Chrome, com banco falso, pelas regras reais dos módulos:
1. percebe uma armadilha (Percepção) e salta por cima (Atletismo); depois falha o salto, cai nela e leva o dano no local;
2. força a alavanca emperrada: Força Bruta falha, depois destrava e a cela do arsenal se abre;
3. abre o baú e tenta a porta trancada da cripta: Mecanismos falha, Força Bruta arromba (regras de `mesa-objetos`);
4. foge de monstro entrando em Recuo (1,6× mais rápido, +15 na defesa, sem ataques) e volta ao Normal;
5. reconstrói uma parede quebrada pelo 🧱 e pelo X do controle;
6. a armadilha do corredor liberta a cela do anfiteatro.

## O que os testes acharam e foi corrigido
- Rochas da beira da caverna estavam deslocadas para o lado do chão (sinal invertido) e tapavam passagens.
- A cripta ficava aberta para a caverna pelo lado oeste; ganhou parede.
- Dormitório e anfiteatro estavam marcados sobre quadros de rocha; linhas e portas fora de quadros de chão; "Porta do corredor" não era reconhecida como porta (a palavra "corredor" exclui); arandela não contava como luz pelo nome; sarcófago caía no corredor.
- `tests/v189-masmorra.test.mjs` confere a transcrição (portas e linhas sempre entre dois quadros de chão), materiais, celas, luzes, camadas, mobília por sala, facções, e o caminho da entrada até todas as salas destrancadas pela caverna e pelas pontes (arsenal e cripta só depois de abrir as portas; celas só depois de abertas).
- Suíte completa: 561 testes aprovados. `scripts/preparar-hosting.cjs` confere sintaxe e imports.
- Quem já tinha a masmorra recebe a nova sozinho na primeira abertura como mestre. Cópia de segurança: `_entregas/backup-antes-v189.tgz`. Nada muda em `firestore.rules`.

## Publicar
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
