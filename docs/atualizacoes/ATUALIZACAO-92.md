# Mesa Estelar v92 — localização real por mapa

Esta versão corrige o conflito entre a localização dinâmica da v90/v91 e o antigo conceito de “um único mapa global da mesa”.

## O que mudou

- Cada miniatura passa a registrar também `mapaId`, além do cenário atual da entidade.
- Mover um personagem/NPC para um cenário com mapa vinculado move a miniatura para esse mapa.
- A viagem feita pelo próprio jogador também atualiza cenário + mapa e coloca a miniatura no mapa de destino.
- Abrir/trocar o mapa no painel do mestre passa a ser apenas uma mudança da visão de trabalho do mestre durante exploração. Isso não transporta personagens que estejam em outros mapas.
- Cada jogador acompanha o mapa da miniatura de seu personagem ativo. Se o mestre mover esse personagem, a tela do jogador acompanha automaticamente o novo mapa e o novo Cenário Atual.
- Foi adicionado no painel superior do Mapa da Mesa o botão **📍 Trazer personagens ativos**. Ele usa o `personagemAtivo` de cada usuário e move explicitamente o grupo para o cenário vinculado ao mapa aberto pelo mestre.
- A sincronização de mapa deixa de apagar ou arrastar miniaturas pertencentes a outros mapas.
- Se uma miniatura já está no mapa correto, sincronizar/salvar o cenário preserva sua posição em vez de reposicioná-la no ponto de entrada.
- Uma migração de compatibilidade atribui `mapaId` às miniaturas antigas quando o mestre abre a v92.

## Combate

O combate continua usando um único mapa autoritativo. O comportamento multi-mapa novo é aplicado à exploração, para não alterar o motor de combate já estabilizado.

## Firestore

As regras foram atualizadas para aceitar `mapaId` nas posições. Fora de combate, o jogador só pode mudar sua própria miniatura para o mesmo `localizacaoMapaId` registrado na ficha; o mestre continua podendo reposicionar entidades.

## Testes

- Sintaxe de `js/app.js` e `js/nova-direta.js` validada.
- Testes estáticos v88–v92: 25/25.
- Testes direcionados de mapa/sincronização/Oficina: 37/37.
- Suíte completa `.test.mjs`: 242/242.

A validação local automática do parser das regras do Firebase não foi concluída porque o executável `firebase-tools` não respondeu no ambiente de construção. As alterações de regras foram mantidas pequenas e compatíveis com a sintaxe já usada no arquivo.
