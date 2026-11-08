# Primeiros Socorros e psiquismo — atualização 46

Na Sincronização nova, **Primeiros Socorros** e **Psiquismo** são painéis separados, abaixo dos PV. Só se recolhem por clique. A seleção do poder é preservada por personagem. Psiquismo aparece apenas com poderes disponíveis na ficha. Levantar fica fora dos dois painéis.

## Atendimento

- Escolha paciente (inclusive você) e parte ferida. Uma única parte é selecionada automaticamente.
- Iniciar exige consciência, sua vez e alcance de 1,5 m entre as bordas das miniaturas. Consome uma carga do kit de bolso/mochila/equipado (cinco quando o item não informa usos) e encerra suas ações da rodada. Casa e veículo não fornecem kits.
- Sem kit, o teste é Difícil: metade da perícia. Com kit é normal.
- Na próxima rodada, escolha Concluir ou Continuar. Cada continuação acrescenta cinco pontos ao teste, até três turnos investidos. Não se rola antes da conclusão.
- Durante o atendimento, movimento, ataques, poderes e testes comuns ficam bloqueados. A defesa recebe −20 pontos, acumulados com os demais modificadores. Concluir também ocupa a rodada.
- Sucesso estabiliza a localização e recupera 1–3 PV pela margem; crítico recupera 4–6 PV, sem ultrapassar o máximo da parte. Infecção não é removida.
- Etapa, paciente, parte, kit e resultado persistem na mesa. A conta do mestre processa os comandos; mantenha-a aberta. Publicar arquivos não modifica uma sessão aberta até recarregar ambas as contas.

## Consciência e Sorte

Inconscientes não podem agir, mover ou defender, mas mantêm uma oportunidade na iniciativa para **Teste de consciência**. Falha encerra essa oportunidade; sucesso permite agir sem gastar uma ação no teste. Só há uma tentativa por rodada. Resultado e modificadores aparecem no histórico. As curas recebidas enquanto inconsciente somam +5 por PV a partir da rodada seguinte; o bônus acumula até despertar, sem ultrapassar 100 no valor efetivo. A duração máxima de inconsciência causada por poderes continua sendo respeitada.

**Usar Sorte** reserva um ponto e garante sucesso comum no próximo teste de perícia, ataque, defesa, poder, primeiros socorros ou consciência. A preparação não acumula. O saldo vem da ficha, pela mesma regra de POD do Mapa Mesa, e o gasto é salvo nela; criaturas temporárias mantêm seu saldo na mesa. Restaurar o combate não devolve pontos de Sorte. Sorte garante sucesso no teste, não vitória automática contra um teste oposto melhor.

Kits são reconhecidos pelos nomes e IDs em português/inglês. Alterações no inventário atualizam automaticamente a ficha e os kits no painel. Usos restantes pertencem à instância do kit e não são repostos ao atualizar o cadastro.

## Psiquismo

Os poderes são lidos do cadastro e filtrados pelo treino/arco da ficha. O mestre valida o poder, gasto e alvo. Os PP gastos persistem no estado da mesa; Restaurar repõe o estado da mesa. Custos e testes aparecem no histórico.

Aplicação automática: cura por localização, proteção Evitar Dano, Intuição no próximo ataque, Agilidade, Reflexos (+1 ação), Aceleração (30 m), Salto/Teletransporte e suas variantes caóticas, Impulso, Mover Objeto, Atordoar, Medo e Grito Psíquico (cone 60°/8 m, sem dano: Esquiva por alvo, −20 no central; atingido cai e testa Resistência contra inconsciência por 1d4 rodadas). A resistência psíquica é automática e registrada. Meditação requer uma hora fora de combate e é limitada a uma vez por dia real.

Ilusão cria uma cópia separada da forma escolhida (personagem, criatura ou objeto), com 0 PV/PA e sem dano. Manutenção de 2 PP por rodada; desaparece se o autor ficar inconsciente, morrer ou não puder pagar. Mimetismo Psi muda a aparência do próprio usuário para a forma escolhida, por um minuto (dez rodadas). Não concede os atributos da forma imitada. Na exploração, a duração é contada em tempo real. Uma rodada equivale a seis segundos; a transição preserva o saldo (três rodadas gastas de um minuto deixam 42 segundos).

Anoitecer, Círculo de Proteção e Defesa Mental desenham áreas no mapa. Defesa Mental acrescenta 20 pontos à resistência mental do beneficiado e Ocultar Mente impede leitura/controle diretos durante o efeito. Anoitecer é preto opaco para terceiros e semitransparente para o autor e o mestre. Essa ocultação é visual; não implementa sigilo dos dados do mapa, colisão ou proteção automática de terceiros.

Telepatia, informação (Detectar, Psicometria, Visão Distante, Ler Mente), sugestões/controle mental e efeitos dependentes de interpretação geram solicitações em uma janela flutuante do mestre. A resposta aparece para o jogador e no histórico. Doador da Vida e poderes novos de cadastro ainda dependem de adjudicação. Fluxo Marcial/Guerreiro Zen resolve automaticamente: devolve a ação de ativação e concede 1/2/3 ações extras com margem de pelo menos 5/10/15; crítico concede outra. Uma tentativa por rodada. Falhas consomem ação e PP.

Os efeitos temporários têm cronômetros, congelados entre avanços de rodada durante combate. Aceleração custa 4 PP e permite 30 m na rodada, sem alterar o deslocamento base. Movimento psíquico valida escala, limites do mapa e ocupação por miniaturas; a colisão com cenário ainda segue revisão do mestre. Destinos são informados como coluna:linha, começando em 1:1 no canto superior esquerdo; o destino fica no centro da casa. Teletransporte Caótico usa o próprio personagem e não mostra seletor de objetos ou destino.

## Críticos e efeitos especiais

Crítico exige dado estritamente menor que 10% da perícia efetiva e permite defesa. Quando atinge, maximiza o dano; armadura continua valendo. Efeitos e escolha de localização são apresentados antes da resolução, somente sem defesa ou quando o teste defensivo falha. Sucesso defensivo superado não libera efeitos. Corpo a corpo permite escolher localização nesse caso; à distância, somente em crítico. Partes com PV menor ou igual ao negativo do máximo deixam de ser sorteadas/escolhidas. Aparar, inclusive com cauda, é exclusivo de corpo a corpo. Históricos separam base, modificadores, efetiva e dado.

## Publicação

Esta atualização não altera as regras. Se as regras da atualização anterior ainda não foram publicadas, use:

```powershell
npx firebase-tools deploy --only firestore:rules --project d100-mesa-estelar --config firebase.rules.json
```

Se a ferramenta solicitar autenticação, execute `npx firebase-tools login`. Depois recarregue as contas do mestre e do jogador. Enviar ao GitHub não publica as regras do Firestore. Esta atualização não foi publicada no banco remoto durante os testes.

## Verificação

Testes de regras, comando entre mestre/jogador, rejeição de controle indevido, repetição sem gasto duplicado, etapas entre rodadas, kit, cura/PP e um teste de navegador clicando nos controles. O banco remoto real não foi usado nos testes.

## Criaturas, inventário e painel — versão 46

Ataques naturais usam a perícia vinculada, com Combate Desarmado como padrão. O vínculo antigo Eco da Matilha → Vontade da Besta Ululante é corrigido para Combate Desarmado. O cadastro separa Base, Treino e Total; os números legados são migrados como totais, evitando somar a base duas vezes. Com os atributos de referência da Besta, Combate Desarmado fica 44 + 25 = 69. Se gerar atributos por indivíduo estiver ativo, o total varia com os atributos sorteados uma única vez para aquela miniatura.

Campos de cadastro novos: periciasSchema, periciasTreino, especializacoesTreino e legadoPericias. A gravação ocorre ao salvar/importar o cadastro; a leitura já aceita os modelos antigos. Atributos individuais persistem em combatesAtivos/mapaMesaSyncCriaturas. Remover a miniatura apaga sua instância; restaurar não sorteia atributos novamente. A conta do mestre inicializa as instâncias.

O histórico de defesa usa a base real de Esquiva mesmo que ela não esteja na lista de ataques. Isso elimina o +20 fictício do texto de modificadores; a penalidade central do cone continua −20. Sorte fica ao lado de Testar.

Durante combate, compras são bloqueadas para participantes. Transferir entre Equipado e Bolso/Mochila custa uma ação; reorganizar dentro do compartimento não custa. Casa/Veículo não podem ser usados. Exige sua vez, ações disponíveis e não estar inconsciente ou prestando socorros. Inventário e ação são salvos juntos, mantendo os usos de cada kit.

Os CSVs originais foram preservados. A cópia banco_criaturas_2026-09-19_corrigido.csv altera apenas o vínculo antigo do Eco. A importação preserva as fórmulas existentes quando o CSV antigo não traz essas colunas; a exportação nova inclui fórmulas e treino estruturado. O banco de NPCs não foi alterado.

Esta fase não altera regras do Firestore e não exige publicar regras. Publicar os arquivos e recarregar mestre/jogadores. Objetos, fogo, mineração, camadas e os controles CSV dos demais bancos ficam nas próximas fases do roteiro DIRECAO-MESA-EXPERIMENTAL.md.
