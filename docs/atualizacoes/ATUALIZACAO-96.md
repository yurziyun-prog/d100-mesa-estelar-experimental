# Atualização v96 — aprovação de fichas pelo mestre

## Fluxo novo

- Uma ficha de PJ não é mais bloqueada automaticamente ao distribuir todos os pontos.
- Enquanto estiver em criação, o jogador pode salvar quantas vezes quiser.
- Quando nome, Origem, Carreira e todos os pontos das quatro etapas estiverem completos, a ficha passa para **Aguardando aprovação**.
- Novos salvamentos enquanto ela aguarda aprovação atualizam a mesma ficha que o mestre vê.
- O mestre ganhou o filtro **Aprovação pendente** em Ficha > Personagens.
- Nos cartões dos PJs pendentes aparece **✅ Aprovar**.
- Depois da aprovação, os campos de criação ficam bloqueados para o jogador.
- Nos cartões aprovados aparece **🔓 Abrir edição**; o mestre pode reabrir a ficha a qualquer momento.
- Ao salvar novamente uma ficha completa depois de reaberta, ela retorna automaticamente para a fila de aprovação.
- O mestre continua podendo editar uma ficha aprovada diretamente.
- O investimento de XP concedido pelo mestre continua funcionando em fichas aprovadas.

## Migração das fichas antigas

- Fichas que versões anteriores marcaram automaticamente como `criacaoConcluida` não são tratadas como aprovadas.
- Na primeira carga da v96, essas fichas são convertidas para **Aguardando aprovação** e voltam a ser editáveis pelo jogador.
- Isso corrige especificamente o caso de uma jogadora que salvou antes de terminar e ficou presa numa ficha bloqueada.

## Sincronização

- O jogador recebe em tempo real a aprovação ou reabertura da ficha ativa.
- O mestre recebe em tempo real mudanças de estado e novos salvamentos de fichas pendentes.

## Segurança

- `firestore.rules` agora impede que o dono altere campos estruturais de uma ficha já aprovada.
- Alterações normais de jogo continuam permitidas.
- Perícias/especializações de uma ficha aprovada só passam pelas regras do jogador quando a gravação inclui o consumo de `xpPendentes`.
- O mestre continua com autoridade total sobre as fichas.

## Compatibilidade

- Combate, Psi, Primeiros Socorros, mapas, cenários e localização não foram alterados.
- Suíte completa: 261 testes aprovados, 0 falhas.
