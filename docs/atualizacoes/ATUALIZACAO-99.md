# Atualização v99 — Sorte como rerrolagem

## Regra nova

Sorte não prepara mais um sucesso automático para o próximo teste.

No Mapa da Mesa, depois de um teste elegível, o personagem pode gastar 1 Ponto de Sorte para rerrolar imediatamente esse teste. A nova rolagem substitui a anterior, inclusive suas consequências.

A janela de rerrolagem termina quando outro evento de jogo relevante acontece, e o mesmo teste não pode receber uma segunda rerrolagem de Sorte.

## Testes cobertos

- ataque;
- defesa;
- ataque e defesa em área/cone;
- teste geral de perícia;
- teste de consciência;
- teste de Psiquismo;
- teste final de Primeiros Socorros.

A Sorte rerrola o teste d100. Ela não rerrola separadamente os dados de dano.

## Substituição real do resultado

Antes de rerrolar, o motor guarda um checkpoint imediato do teste. Ao gastar Sorte, ele restaura o estado anterior e repete o mesmo teste com uma nova semente aleatória. Assim a rerrolagem não cobra novamente Ação, munição, PP, kit médico ou outros recursos, e também não acumula dano com o resultado substituído.

O histórico mantém somente a resolução válida e identifica o novo resultado como `Rerrolagem de Sorte`.

## Compatibilidade

- A rerrolagem de Sorte das Interações de Cenário continua funcionando.
- O antigo mecanismo `sortePreparadaLab`, que transformava o próximo teste em sucesso normal, foi neutralizado.
- O painel de combate antigo informa que a regra atual de Sorte deve ser usada pelo Mapa da Mesa, evitando que o sistema legado conceda sucesso automático.
- Não há alteração de `firestore.rules` nesta versão.

## Testes

Suíte completa: 271 testes aprovados.
