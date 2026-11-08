# Atualização 73 — NPC comerciante e interações no Cenário Atual

Primeira etapa para transformar **Cenário Atual** em uma central de interações independente do mapa.

## NPC comerciante

O cadastro de NPC agora pode marcar um NPC como **Comerciante** e definir:

- nome do estabelecimento;
- itens que fazem parte do estoque/catálogo;
- percentual cobrado na venda ao jogador;
- percentual pago ao comprar itens do jogador;
- se permite barganha;
- resistência à barganha;
- se compra itens dos jogadores.

O estoque desta versão é um catálogo de disponibilidade, ainda sem quantidades finitas globais. Isso evita introduzir escrita concorrente insegura no banco nesta primeira etapa.

## Cenário Atual

NPCs comerciantes que estejam **visíveis no cenário ativo** são publicados em uma nova área **Interações do cenário**. Isso funciona sem depender do Mapa da Mesa.

O jogador pode abrir o comércio, comprar e vender itens e fazer uma barganha resistida usando Comércio, Influência ou Submundo quando disponíveis. A compra/venda altera apenas a ficha do próprio personagem, mantendo as permissões atuais do Firestore.

As informações publicadas do comerciante contêm apenas dados necessários ao comércio, sem expor a ficha completa do NPC.

## Futuro vínculo mapa ↔ cenário

A estrutura continua usando `cenarioId`, preservando espaço para uma associação opcional futura entre cenário e mapa. Um cenário/mapa continuará podendo existir sem vínculo.
