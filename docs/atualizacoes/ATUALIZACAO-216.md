# v216 — Rastejante, arma ativa, percentuais e mapa livre (27/10/2026)

**Publicado em 27/10/2026 no Hosting e nas regras do Firestore.** Compilador remoto aprovou as regras. Nove módulos principais e os cinco atlas do Rastejante foram comparados byte a byte com o site público; todos coincidem. Conferência autenticada pelo Yuri ainda pendente. Testes de regressão de ataque contínuo/pausa e cadeira também aprovados.

## Rastejante de Cinzas

Miniatura específica para `rastejante_de_cinzas`, diferente do Predador Quitinoso: corpo achatado, quitina cinza de basalto, bordas cor de brasa (sem halo/luz emitida), palpos sensoriais e cauda bifurcada. Cinco ações, 64 quadros transparentes e esqueleto articulado. Mesmo identificador `cima_rastejante_de_cinzas`, sem recriar tokens ou alterar os atributos da criatura.

- Fonte editável: `arte-fonte/rastejante-cinzas/rastejante-cinzas.blend`.
- Reproduzir: Blender em segundo plano com `-P scripts/blender/predador_quitinoso.py -- arte-fonte/rastejante-cinzas --cinzas`; depois `node scripts/blender/montar-predador.cjs --cinzas` e `node scripts/escala-fisica.cjs`.
- Preservada a pegada anterior de 1,1 m e colisão de 0,6 m; o quadro é recalculado para a nova câmera, não aumentado artificialmente. A primeira câmera cortou os apêndices: o empacotador recusou a arte e a câmera foi ampliada antes de integrar. Os 64 quadros finais passaram na conferência de margens.

## Percentuais do Kael

Os atributos e perícias não foram alterados. O caso do print foi reproduzido com ficha a 50, Armadura Corporal Leve do banco (-10% em perícias físicas) e Espada de Força. A armadura leva 50 a 45; compatibilidade com a especialização errada acrescenta graus de dificuldade (dois graus levam 45 a 22; um grau leva 45 a 30). Não se deve apagar esses modificadores para forçar todo ataque a 50.

O carregador agora entrega `base`, `valor` e `calculo` de cada perícia/arma, usando a mesma função do resolvedor de combate. O balão apresenta a base da ficha e a sequência dos ajustes junto à chance final. Isso distingue o treino da ficha da chance efetiva daquele ataque.

## Arma ativa na miniatura

### Complemento solicitado pelo Yuri durante esta etapa

- Painel principal simplificado: Atacar, Defender e Psi (Psi oculto quando não há poderes). Testes gerais, cura e corpo continuam acessíveis por seus atalhos, fora da navegação principal do combate.
- Atacar tem um seletor explícito de arma e um botão de execução separado. Selecionar não dispara. Uma arma aparece uma vez, com a perícia própria selecionada automaticamente; alternativas aparecem somente se faltar a especialidade própria. O resolvedor da autoridade também remapeia pedidos antigos para a especialidade adequada, sem confiar só no cliente.
- Defender tem seletor Automática / Priorizar esquiva / Priorizar aparar com arma ativa, além de Normal / Defesa total. A preferência é guardada no token do dono e considerada pela resolução; se aquela defesa não estiver disponível, usa a melhor defesa possível. Não cria defesa impossível nem muda o valor da ficha.
- Psi mantém seletor de poder e botão Usar separados, com custo e alvo.
- O Kael oficial de teste (`teste_jogador_v138`, marcado `testeV138`) recebe somente armas compatíveis quando o mestre o carregar novamente. Armas incompatíveis são guardadas em compartimentos existentes, nunca apagadas. Adiciona exemplos compatíveis do banco onde houver espaço; atributos e treino permanecem iguais. A migração é exclusiva desse ID, transacional e marcada uma vez; não roda em cópia de treino. Outros personagens não recebem inventário novo.

Encontrada uma falha efetiva: o cliente já tentava persistir `activeSkillId`/`activeWeaponId`, mas faltavam tanto a revisão incrementada quanto a permissão nas regras. Além disso, o visual era montado a partir de TODAS as armas equipadas, em vez da selecionada.

- Seleção grava revisão em transação e evita gravações idênticas.
- Regras admitem esses campos como strings limitadas e `activeDefenseId` como enumeração, permitindo ao dono alterar só a seleção e a revisão. Não permitem mudar dano, ficha, dono ou posição nessa operação.
- O resumo visual conserva roupas/acessórios e mostra somente a arma ativa que ainda está equipada. Ataque natural não mostra uma espada. Espada de energia recebe cor própria; espada, pistola e fuzil usam as respectivas camadas existentes.
- Escuta da ficha e seleção do token atualizam o visual; gravações de resumo agora são transacionais.
- Resolução de ataques preserva os campos da arma ativa, em vez de descartá-los ao salvar posições. Também preserva o habitat já existente.

As formas individuais de todas as armas do catálogo ainda não são modelos exclusivos: a representação usa as famílias visuais existentes. Essa etapa não remodela cada machado, adaga ou modelo de pistola.

## Criatura que não atacava

No teste local, um Rastejante sanguinário em automático perseguiu o Kael e atacou espontaneamente, sem ser provocado. O caso exato da sessão autenticada do Yuri NÃO foi reproduzido; não declarar sua causa confirmada.

Uma causa possível já existente é o estado manual persistido por Atuar como/assumir controle (`auto=false`): sanguinária continua significando hostilidade, mas a criatura manual não age por IA. O cartão de comportamento agora avisa isso explicitamente e oferece **Devolver à IA**, com verificação de mestre. Se a criatura estiver sendo controlada nesta aba, o mestre precisa sair de Atuar como antes de devolvê-la.

Corrigido outro problema encontrado no motor: a escolha final de alvo usava a lista inteira do mapa, mesmo depois de filtrar os inimigos percebidos. Agora a seleção e a manutenção de alvo respeitam a lista percebida, sem preferir um alvo invisível enquanto outro está visível. Não houve mudança para obrigar criaturas pacíficas, manuais, pausadas ou sem caminho a atacar.

## Painéis fora do mapa

Regra registrada em `AGENTS.md` por pedido explícito do Yuri. A acomodação central `mesa-paineis-layout.js` cria uma área em fluxo normal depois da janela do mapa. Barras de atitude (Normal/Defesa total/Ataque total/Fuga), postura, legenda de teclas, salto e avisos persistentes de consciência ficam fora da área jogável. Balões temporários fecháveis/recolhíveis continuam permitidos.

Novos painéis devem declarar `data-mapa-painel="permanente"` e usar `acomodarPainelMapa`. A salvaguarda central observa inserções e move painéis assim identificados ou barras permanentes conhecidas para a área externa. Essa marcação é obrigatória para novos módulos; não tenta adivinhar se qualquer elemento de cenário é uma interface.

## Verificação

- 786 testes unitários/contratos aprovados.
- `ataque-por-arma.test.mjs`: perícia automática por arma, fallback e preferência de defesa.
- `mmo-interface-browser.cjs`: navegação Atacar/Defender, Psi oculto sem poderes, arma única sem disparar ao selecionar, alternativas só quando falta especialidade, defesa persistida e migração exclusiva do Kael sem perder itens/perícias.
- `combate-equipamento.test.mjs`: seleção de arma, preservação de acessórios, ataque natural e energia.
- `kael-ia-interface-browser.cjs`: base 50 com cálculo de armadura/compatibilidade; troca espada→pistola altera o token e o visual; ataque recebido preserva seleção; controle manual respeitado, retorno à IA, perseguição e ataque espontâneo; retângulos dos painéis fora do mapa em 1280/390; painel novo de regressão movido automaticamente.
- `ESPECIE=rastejante_de_cinzas node tests/predador-quitinoso-browser.cjs`: nova arte no renderizador real, transparência, escala e cinco ações, incluindo quadro final da morte.
- Testes de navegador usam banco e papéis simulados. Não provam a sessão real do usuário nem permissões com duas contas reais. As regras devem passar pelo compilador remoto na publicação.

## Conferência do Yuri

Atualizar a aba do mestre com Ctrl+F5 e reabrir a visão do Kael. Conferir: novo Rastejante, base e ajustes na lista de ataques, troca de arma na miniatura, barras fora do mapa. Se o Rastejante estiver manual, usar Devolver à IA no cartão do mestre. Manter a aba do mestre aberta para executar o motor.
