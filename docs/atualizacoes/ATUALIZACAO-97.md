# Atualização 97 — aprovação legada e cartões compactos

## Correções

- O mestre agora vê **Aprovar** em todo PJ ainda não aprovado, inclusive fichas antigas que o sistema classifica como **Em criação**.
- Ao tentar aprovar uma ficha que o sistema considera incompleta, a v97 mostra o que está faltando e pede confirmação. Isso resolve fichas legadas cujos pontos de perícia não guardavam a origem/carreira/hobby separadamente.
- Aprovação forçada pelo mestre fica registrada em `fichaAprovacaoForcada`.
- O fluxo normal permanece igual: fichas novas completas entram como **Aguardando aprovação** e continuam editáveis até aprovação.

## Interface

- Nos cartões de PJ do mestre, Selecionar e Aprovar/Abrir edição ficam em uma linha compacta.
- Deletar fica centralizado numa segunda linha.
- Os botões dessa área ficaram menores para não ultrapassar o card.

## Compatibilidade

- Base cumulativa da v96, portanto mantém tudo da v95 e v96.
- Sem alteração nova em regras do Firestore nesta versão.
