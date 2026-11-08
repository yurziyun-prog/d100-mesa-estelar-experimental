# Atualização 85 — vínculos responsivos e carga compartilhada no Inventário

Esta versão corrige a apresentação lateral de companheiros/veículos e move a administração da carga do veículo para a aba Inventário.

## Interface
- O botão de fechar dos modais de Companheiros e Veículos agora é um quadrado vermelho com X branco no canto superior direito.
- Companheiros e veículos na coluna lateral passam a quebrar nome e metadados em várias linhas, sem invadir a ficha.
- Veículos deixam de usar o botão branco padrão e usam o mesmo visual do restante do painel lateral.

## Vínculos de veículos
- `veiculosPossuidos` passa a ser acompanhado em tempo real por `onSnapshot`.
- Um veículo criado ou alterado pelo mestre aparece automaticamente nas contas dos demais personagens vinculados, sem precisar recarregar a página.
- A resolução do proprietário aceita campos legados e atuais (`dono`, `donoUid`, `usuarioUid`, `ownerUid` etc.).
- Veículos antigos têm seus vínculos e UIDs reconciliados pelo mestre quando necessário.

## Inventário compartilhado
- O antigo bloco híbrido "Veículo/Nave" foi separado.
- O bloco `Veículo` só aparece para personagens vinculados a ao menos um veículo.
- Se houver mais de um veículo, há um seletor para escolher qual carga visualizar.
- A carga é o documento compartilhado do veículo, portanto todos os personagens vinculados veem os mesmos itens.
- Itens podem ser arrastados entre Equipado/Bolso/Mochila e a carga do veículo e também reorganizados dentro do veículo.
- Trocas atualizam inventário pessoal e carga do veículo no mesmo batch do Firestore.
- A capacidade em kg do veículo continua sendo respeitada.
- Em combate, retirar/guardar itens no veículo continua bloqueado para preservar as regras já estabilizadas.
- Um bloco separado de Nave já existe no HTML, mas permanece oculto até a implementação de naves.

## Ficha de veículo
- A ficha do veículo fica enxuta e mostra dados, tripulação e resumo da carga.
- A movimentação de itens é feita em Inventário → Veículo, conforme o fluxo visual normal de arrastar itens.

## Testes
- 202 testes automatizados aprovados.
