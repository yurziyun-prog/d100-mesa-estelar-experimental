# Atualização 91 — localização e viagens robustas

## Movimento do mestre
- O painel de Localização dinâmica passou a permitir seleção explícita de qualquer entidade presente, incluindo NPCs e personagens.
- `Mover selecionados` e `Mover + ativar` movem somente os cartões marcados.
- Botões `Todos` e `Nenhum` facilitam mover grupos inteiros.
- Isso corrige o comportamento da v90 em que o movimento em grupo filtrava apenas personagens e deixava NPCs para trás.

## Destinos inválidos
- Destinos apontados por um cenário mas inexistentes no Banco de Cenários deixam de ser publicados aos jogadores.
- O mestre recebe um aviso no próprio painel indicando os IDs faltantes.
- O jogador não pode mais cair em um destino inexistente e ficar preso.

## Viagem do jogador
- Cada personagem mantém histórico curto de localização e cenário anterior.
- A aba Cenário Atual oferece `Voltar` para o último cenário válido visitado.
- Ao viajar para um cenário diferente do cenário compartilhado pela Mesa, a página passa a renderizar os dados públicos completos da localização real do personagem, em vez de trocar apenas o nome.
- Descrição pública, presença visível, destinos e interações passam a vir do cenário em que o personagem realmente está.

## Catálogo público
- O catálogo público de cenários agora inclui também as interações públicas e comerciantes presentes naquele local.
- Continua sem publicar descrição GM ou segredos.

## Compatibilidade
- Combate, Psi, Primeiros Socorros, inventários compartilhados, veículos e naves não foram alterados.
