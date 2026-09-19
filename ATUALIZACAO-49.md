# Ataques e destruição de objetos — fase D / versão 49

## Como usar

1. Inicie o combate e selecione quem vai agir.
2. No painel de ações, escolha a perícia e a arma.
3. Em Alvo de cenário, escolha a parede, árvore, caixa ou outro objeto destrutível.
4. Clique Testar. O alcance é medido entre a borda da miniatura e a área retangular girada do objeto.

A seleção pelo painel permite atingir objetos sob/sobre outras camadas sem interferir no clique de movimento. O objeto selecionado recebe contorno no mapa. Fora de combate, atacar objetos fica indisponível.

## Regras implementadas

- Usa a perícia e os modificadores do atacante; objetos imóveis não têm defesa ativa nem partes do corpo.
- Falha gasta uma ação e uma carga de ataque, como contra personagens. Acerto aplica dano rolado; crítico maximiza a expressão de dano.
- Dureza efetiva = máximo entre zero e dureza menos a penetração da arma, usando o cadastro/regra de penetração já existente. Dano = máximo entre zero e bruto menos dureza efetiva.
- O histórico mostra rolagem, valor efetivo, dano bruto, dureza, penetração, dano final e PV restantes.
- PV, munição, ação e histórico são gravados na mesma transação pelo mestre. Reprocessar o mesmo comando não repete o gasto. Alvo inválido, fora de alcance, indestrutível ou já destruído é rejeitado sem gasto.
- Zero PV marca destruído, conserva os restos visuais e desativa bloqueios de movimento/visão. Não remove a instância do mapa. O painel desabilita novos ataques contra os restos.
- Restaurar recompõe PV e os bloqueios originais. A rotação do atacante, sons e efeitos visuais usam o fluxo normal de ataques.
- Eco da Matilha e Grito Psíquico não causam dano estrutural; são rejeitados quando o alvo é objeto. Fogo, ferramentas/mineração e seus efeitos específicos seguem nas próximas fases.

## Dados e atualização

Novo campo opcional na instância: bloqueiosOriginais, para Restaurar recuperar as propriedades anteriores à destruição. Usa a cena persistente da fase B. Sem migração manual e sem alteração nas regras do Firestore.

Arquivos alterados: js/app.js, js/nova-ataques.js, js/nova-direta.js, js/nova-painel.js, index.html. Novo módulo: js/nova-dano-objetos.js. Testes: nova-ataques, nova-resolucao e nova-dano-objetos*. Os CSVs enviados pelo usuário permanecem intactos.

Validação: 80 testes automatizados, incluindo resolver real de ataque, crítico, falha, alcance, dureza, restauração e transação; teste de navegador com mestre/jogador selecionando e destruindo objeto pelo painel, sem janela de defesa.

Após publicar, recarregue ambas as contas com Ctrl+F5. Mantenha o mestre conectado para processar ataques. A próxima fase E é fogo e apagar fogo.
