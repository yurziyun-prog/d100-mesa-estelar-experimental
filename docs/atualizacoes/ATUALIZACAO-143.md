# Atualização 143 — o que o mestre arruma fica arrumado · noite no mapa

## Objetos do mestre
- Tudo que o mestre move, gira, retira ou acrescenta (na mesa ou na Oficina) entra num registro por mapa (`combatesAtivos/mesaObjetosMestre`).
- Quando um mapa é refeito/republicado (gerador, remodelagem, recheio), o registro é reaplicado: o objeto volta para onde o mestre deixou, mesmo com outro id (casa pelo nome perto da posição original).
- Ao abrir um mapa, se algum salvamento antigo “puxou de volta” um objeto, ele é reposto. Arrastes feitos em jogo não são desfeitos.
- Editor da mesa: um segundo arraste durante a sincronização do primeiro entra na fila (antes era descartado e o objeto voltava).
- Arrumação (uma vez, só nos mapas gerados): móveis um em cima do outro (mesa sobre cápsula) são afastados; armários/estantes soltos no caminho vão para a parede mais próxima. O recheio passou a encostar armários só em paredes de verdade.

## Combate por turnos
- Os botões ▶/■ de turnos saíram da barra. O combate por turnos virou opção secundária dentro do balão ⚡ do tempo real (“🎲 Combate por turnos (opcional)”).

## Mapas
- Mudador de mapa do mestre: rosa de setas (canto inferior direito do mapa). ↑ abre o mapa de cima, → o da direita etc.; ⊙ = portas internas. Com mais de um destino no mesmo lado, abre uma listinha.
- Saídas aparecem como 🚪; o nome do próximo mapa só aparece quando o personagem chega perto (3,5 m, só para ele) ou ao clicar.
- Pontos de teste/interação (🔎) só aparecem para o jogador quando ele chega perto.

## Vida e noite
- A vida no mapa (NPCs e criaturas andando) roda em todos os mapas onde há jogadores, não só no que o mestre está olhando (até 5 ao mesmo tempo). Companheiros seguem o dono em qualquer mapa.
- Com o relógio ligado: à noite (22h–6h) NPCs e criaturas dormem (💤); comerciantes saem da banca das 20h às 7h (somem para os jogadores); criaturas selvagens em mapas de natureza vão para a toca (somem) ou dormem; guardas dormem encostados no muro, e com dois ou mais um fica de vigia (👁️, turnos de 2 h); robôs recarregam 2 h por dia (🔋); criaturas noturnas dormem de dia.
- Barulho: quem dorme perto do grupo pode acordar (❗, registrado no histórico). Pesa tamanho do grupo, quem anda, distância, armaduras e tiros/brigas/berros no mapa. Botão 🤫 “Andar em silêncio” (só aparece se há alguém dormindo): cada passo perto de quem dorme testa Furtividade.

## Arquivos
Novos: js/mesa-fixos.js, js/mesa-noite.js, tests/v143-static.test.mjs. Alterados: index.html, js/app.js, nova-direta, nova-editor, mesa-vida, mesa-companheiros, mesa-ligacoes, mesa-interacoes, mesa-tempo-real, mesa-recheio (+ versões em mesa-elenco, mesa-remodelagem, mesa-sessao, mesa-tetos, mesa-vespera).
Testes: 419 ok, 32 falhas antigas (as mesmas de antes).
