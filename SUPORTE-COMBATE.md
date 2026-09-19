# Primeiros Socorros e psiquismo — atualização 42

Na Sincronização nova, **Primeiros Socorros** e **Psiquismo** são painéis separados, abaixo dos PV. Só se recolhem por clique. A seleção do poder é preservada por personagem. Psiquismo aparece apenas com poderes disponíveis na ficha. Levantar fica fora dos dois painéis.

## Atendimento

- Escolha paciente (inclusive você) e parte ferida. Uma única parte é selecionada automaticamente.
- Iniciar exige consciência, sua vez e alcance de 1,5 m. Consome uma carga do kit de bolso/mochila/equipado (cinco quando o item não informa usos) e encerra suas ações da rodada. Casa e veículo não fornecem kits.
- Sem kit, o teste é Difícil: metade da perícia. Com kit é normal.
- Na próxima rodada, escolha Concluir ou Continuar. Cada continuação acrescenta cinco pontos ao teste, até três turnos investidos. Não se rola antes da conclusão.
- Durante o atendimento, movimento, ataques, poderes e testes comuns ficam bloqueados. A defesa recebe −20 pontos, acumulados com os demais modificadores. Concluir também ocupa a rodada.
- Sucesso estabiliza a localização, recupera consciência e 1–3 PV pela margem; crítico recupera 4–6 PV, sem ultrapassar o máximo da parte. Infecção não é removida.
- Etapa, paciente, parte, kit e resultado persistem na mesa. A conta do mestre processa os comandos; mantenha-a aberta. Publicar arquivos não modifica uma sessão aberta até recarregar ambas as contas.

## Psiquismo

Os poderes são lidos do cadastro e filtrados pelo treino/arco da ficha. O mestre valida o poder, gasto e alvo. Os PP gastos persistem no estado da mesa; Restaurar repõe o estado da mesa. Custos e testes aparecem no histórico.

Aplicação automática: cura por localização, proteção Evitar Dano, Intuição no próximo ataque, Agilidade, Reflexos (+1 ação), Aceleração (30 m), Salto/Teletransporte e suas variantes caóticas, Impulso, Mover Objeto, Atordoar, Medo e Grito Psíquico (cone 60°/20 m com teste de Vontade por alvo). A resistência psíquica é automática e registrada. Meditação requer uma hora fora de combate e é limitada a uma vez por dia real.

Ilusão cria uma cópia separada da forma escolhida (personagem, criatura ou objeto), com 0 PV/PA e sem dano. Manutenção de 2 PP por rodada; desaparece se o autor ficar inconsciente, morrer ou não puder pagar. Mimetismo Psi muda a aparência do próprio usuário para a forma escolhida, por dez rodadas, com renovação automática de 1 PP. Não concede os atributos da forma imitada. Na exploração, estes efeitos aguardam a progressão das rodadas; ainda não há relógio de tempo ficcional.

Anoitecer, Círculo de Proteção e Defesa Mental desenham áreas no mapa. Defesa Mental acrescenta 20 pontos à resistência mental do beneficiado e Ocultar Mente impede leitura/controle diretos durante o efeito. As áreas são marcadores; não implementam ocultação secreta, colisão nem proteção automática de terceiros dentro delas.

Telepatia, informação (Detectar, Psicometria, Visão Distante, Ler Mente), sugestões/controle mental e efeitos dependentes de interpretação geram solicitações em uma janela flutuante do mestre. A resposta aparece para o jogador e no histórico. Doador da Vida e poderes novos de cadastro ainda dependem de adjudicação. Fluxo Marcial/Guerreiro Zen resolve automaticamente: devolve a ação de ativação e concede 1/2/3 ações extras com margem de pelo menos 5/10/15; crítico concede outra. Uma tentativa por rodada. Falhas consomem ação e PP.

Os efeitos temporários expiram por rodada. Aceleração custa 4 PP e permite 30 m na rodada, sem alterar o deslocamento base. Movimento psíquico valida escala, limites do mapa e ocupação por miniaturas; a colisão com cenário ainda segue revisão do mestre. Destinos são informados como coluna:linha, começando em 1:1 no canto superior esquerdo; o destino fica no centro da casa. Teletransporte Caótico usa o próprio personagem e não mostra seletor de objetos ou destino.

## Publicação

Além de publicar os arquivos do site, publique as regras usando o projeto já configurado no aplicativo:

```powershell
npx firebase-tools deploy --only firestore:rules --project d100-mesa-estelar --config firebase.rules.json
```

Se a ferramenta solicitar autenticação, execute `npx firebase-tools login`. Depois recarregue as contas do mestre e do jogador. Enviar ao GitHub não publica as regras do Firestore. Esta atualização não foi publicada no banco remoto durante os testes.

## Verificação

Testes de regras, comando entre mestre/jogador, rejeição de controle indevido, repetição sem gasto duplicado, etapas entre rodadas, kit, cura/PP e um teste de navegador clicando nos controles. O banco remoto real não foi usado nos testes.
