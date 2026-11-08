# Atualização 101 — comércio com NPCs e Avaliação

## O que muda

- `Avaliação` passa a participar das perícias de negociação junto com `Comércio`, `Influência` e `Submundo`.
- Em comerciantes NPC do Cenário Atual, a negociação agora escolhe um objetivo:
  - **Comprar mais barato**;
  - **Vender mais caro** (quando o comerciante compra itens dos personagens).
- Sucesso na negociação concede 10% de vantagem no objetivo escolhido; crítico concede 20%.
- O resultado de uma negociação é persistido no registro diário do personagem, portanto recarregar a página não perde o desconto/aumento já obtido.
- Continua valendo o limite de uma tentativa por perícia, por comerciante e por dia de campanha.
- Falha crítica mantém a regra já existente: encerra novas barganhas com aquele comerciante naquele dia e deixa os preços desfavoráveis até o dia seguinte.
- Mercado Local também passa a aceitar `Avaliação`, preservando seus botões separados de negociar compra e negociar venda.

## Não alterado

- Nenhuma mudança em Firestore Rules.
- Nenhuma mudança em combate, Psi, Primeiros Socorros, mapas ou localização.
