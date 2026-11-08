# Atualização v94 — movimento independente entre mapas

A v94 corrige o recuo da miniatura observado quando um jogador movimentava o próprio personagem em um mapa diferente daquele aberto pelo mestre.

## Causa

A v93 já separava corretamente a visualização dos mapas, mas o salvamento do movimento ainda consultava o documento global da Mesa para obter o mapa e a cena usados na validação. Assim, a prévia do jogador era calculada no mapa correto, enquanto a confirmação podia ser calculada com dimensões, obstáculos ou estado de combate do mapa que o mestre estava observando. Quando a confirmação divergia ou era recusada, o snapshot do Firestore reaplicava a posição antiga, produzindo o efeito de a miniatura andar e voltar para trás.

As regras do Firestore também tratavam um combate ativo como global para todas as miniaturas, inclusive personagens localizados em outros mapas.

## Correções

- O movimento em exploração agora captura o `mapaId` da visualização do próprio jogador e usa esse mapa durante toda a gravação.
- Se o mapa do jogador não é o mapa global do mestre, são usados as dimensões e o cenário arquivado desse mapa para colisão e persistência.
- O combate global só controla movimento quando a miniatura realmente está no mesmo mapa do combate.
- Um mapa remoto carregado por um jogador não herda o estado de combate do mapa observado pelo mestre.
- As regras do Firestore foram ajustadas para que um combate em um mapa não bloqueie jogadores que estejam explorando outro mapa.

## Compatibilidade

A v94 não altera as regras de combate quando personagem e combate estão no mesmo mapa. Psi, Primeiros Socorros, inventários, veículos, naves e o sistema de localização continuam inalterados.
