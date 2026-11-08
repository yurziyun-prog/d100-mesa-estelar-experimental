# Atualização 84 — correção de modais e carga compartilhada de veículos

## Correção confirmada dos botões de Companheiros

Os modais criados pelas versões 82/83 estavam usando a classe `modal`, mas o CSS real do site controla `modal-overlay` / `modal-overlay.active`. Por isso Editar, Vincular e outros comandos chegavam a criar conteúdo, porém ele era anexado ao final da página em vez de abrir como janela. Isso também criava o grande espaço vazio no rodapé.

A v84:
- converte os modais de Companheiros e Veículos para `modal-overlay`;
- remove o espaço vazio produzido pelos pseudo-modais no fluxo normal da página;
- força a lista de Companheiros a usar os quatro comandos: Editar, Duplicar, Vincular e Remover;
- registra os cliques com listeners explícitos.

## Carga compartilhada de veículos

A ficha de um veículo possuído passa a ter um setor próprio `Carga compartilhada do veículo`.

- todos os personagens vinculados enxergam a mesma carga;
- um personagem vinculado pode guardar itens de Equipado, Bolso ou Mochila;
- pode retirar itens de volta para sua Mochila;
- o limite em kg do modelo do veículo é respeitado;
- a transferência grava o veículo e a ficha do personagem em um único batch;
- jogadores só podem alterar os campos de carga de veículos aos quais seu usuário está vinculado;
- veículos antigos podem ter suas permissões enriquecidas automaticamente pelo mestre ao serem abertos.

O antigo compartimento pessoal `Veículo/Nave` é ocultado da aba Inventário. Seus dados legados não são apagados. Veículos e, futuramente, naves terão inventários próprios e separados.

## Testes

195 testes automatizados aprovados.
