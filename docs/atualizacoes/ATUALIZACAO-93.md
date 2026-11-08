# Atualização v93 — correção do multi-mapa por localização

A v93 corrige três problemas observados em teste real da v92.

## 1. Trocar o mapa do mestre não transporta mais miniaturas

Na v92 ainda existia um fallback legado: se uma miniatura não tivesse `mapaId`, ela era tratada como pertencente ao mapa global aberto pelo mestre. Isso fazia personagens antigos parecerem viajar junto com a troca de mapa.

Na v93:

- em exploração, uma miniatura sem `mapaId` não herda o mapa do mestre;
- o mapa global só volta a ser autoritativo durante combate;
- a migração de personagens e NPCs usa o mapa vinculado ao cenário da entidade;
- o mapa atualmente aberto pelo mestre só é usado para entidades legadas sem ficha de localização, como alguns tokens técnicos antigos;
- se um cenário ganhou ou trocou de mapa vinculado, a miniatura de quem realmente está nesse cenário é reconciliada com esse mapa.

## 2. Jogador segue a própria ficha

A fonte de verdade da visualização do jogador passa a ser:

`personagem ativo → localizacaoMapaId → mapa`

A miniatura é consequência dessa localização, não sua autoridade. Quando o mestre move a ficha ou o jogador viaja, o cliente recebe o novo `localizacaoMapaId` e força o recarregamento do mapa correspondente.

Isso corrige o caso em que o jogador ficava com `0 no mapa` e uma área vazia depois de o mestre navegar para outro mapa.

## 3. Botão “Trazer personagens ativos”

O botão podia permanecer `disabled` depois que a mesma sessão de navegador havia passado pelo modo jogador. A v93 reavalia explicitamente o botão em cada atualização da Mesa:

- mestre + exploração: habilitado;
- jogador: desabilitado;
- combate ativo: desabilitado.

Ele também recebe o estilo visual de ação principal.

## 4. Mapa e cenário do mestre desacoplados por padrão

O vínculo automático antigo `mapa → cenário ativo` agora nasce desligado. Abrir outro mapa deve ser apenas navegação do mestre. A opção continua disponível caso o mestre a ligue explicitamente.

Mover o grupo continua sendo uma ação deliberada por meio de **📍 Trazer personagens ativos** ou dos controles de localização.

## Compatibilidade

Não foram alterados os motores de combate, Psi ou Primeiros Socorros. O combate continua usando um único mapa autoritativo enquanto estiver ativo.
