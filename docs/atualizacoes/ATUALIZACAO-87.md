# Atualização 87 — interface da ficha e nave administrável

## Interface
- A coluna lateral do personagem deixa de usar `position: sticky` no desktop e passa a acompanhar a rolagem natural da página, evitando que as abas inferiores fiquem presas fora da área visível.
- O tamanho-base da aplicação é normalizado em 16 px no desktop para reduzir diferenças de escala entre telas de mestre e jogador quando não houver zoom do navegador.
- Nome, raça e gênero ficam na mesma linha em telas largas.
- Origem, carreira e tipo corporal ficam na linha seguinte.
- A grade se adapta para duas ou uma coluna em telas menores.

## Naves
- Modelos de nave ganham `slotsModulos` e `caracteristicas`.
- Naves possuídas podem ter imagem individual diferente do modelo.
- O mestre pode editar depois da criação:
  - nome individual;
  - estado;
  - imagem;
  - casco, escudo, energia e combustível atuais;
  - personagens vinculados;
  - papel de cada tripulante.
- Postos disponíveis: Dono, Capitão, Piloto, Navegador, Artilheiro, Engenheiro, Sensorista, Tripulante e Passageiro.
- Armas instaladas e módulos instalados passam a ocupar slots próprios da nave e não o porão de carga.
- O porão permanece compartilhado e administrado em Inventário → Nave.

## Preparação para etapas futuras
Esta versão não implementa ainda a localização dinâmica personagem/cenário/mapa nem o combate espacial. A estrutura de nave mantém interior, posição tática e ambiente externo desacoplados para permitir futuramente:
- uma nave grande possuir um mapa de interior próprio;
- a mesma nave aparecer em mapas táticos de espaço, atmosfera, floresta, deserto, oceano etc.;
- personagens/NPCs mudarem de cenário conforme mudam de mapa;
- postos da tripulação acionarem perícias específicas no combate espacial.

## Validação
- 217 testes automatizados aprovados.
