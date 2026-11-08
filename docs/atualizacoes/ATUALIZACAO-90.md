# Atualização 90 — localização dinâmica entre Cenário Atual e Mapa da Mesa

## Localização persistente
- Personagens e NPCs passam a possuir `localizacaoCenarioId`.
- Os vínculos antigos de `personagensCena` são migrados de forma idempotente e continuam sendo mantidos como espelho de compatibilidade.
- Mover uma entidade para outro cenário remove sua presença do anterior e a acrescenta no destino.

## Escudo do Mestre
- Cada cenário ganhou um painel **Localização dinâmica**.
- O mestre pode mover qualquer personagem/NPC para o cenário selecionado.
- Pode mover todos os personagens presentes para outro cenário.
- **Mover + ativar** desloca o grupo e ativa o cenário de destino, usando o vínculo Cenário ↔ Mapa já existente.
- Há sincronização manual do mapa vinculado.

## Jogadores e viagens
- A aba Cenário Atual mostra a localização persistente do personagem selecionado.
- Destinos cadastrados no cenário viram opções de viagem.
- O jogador só pode escolher destinos conectados ao local atual pela interface.
- A localização é salva na própria ficha.
- Se o personagem estiver fora do cenário compartilhado atualmente pela mesa, as interações daquele cenário ficam indisponíveis para ele até a mesa ativar o seu local.

## Presença automática no Mapa da Mesa
- Fora de combate, o mestre pode sincronizar as miniaturas visíveis do cenário com o mapa vinculado.
- Ao abrir/ativar um mapa vinculado, a sincronização é agendada automaticamente.
- Tokens automáticos antigos são removidos quando a entidade muda de local; tokens adicionados manualmente que não pertencem ao sistema de localização são preservados.
- Durante combate a sincronização automática não reorganiza participantes.

## Catálogo público
- Foi criado um catálogo público de cenários com apenas descrição para jogadores, destinos, mapa vinculado e personagens visíveis.
- Dados privados do mestre, segredos e descrição GM não são publicados.

## Compatibilidade
- Combate normal, Psi, Primeiros Socorros, comércio, veículos e naves não foram alterados.
