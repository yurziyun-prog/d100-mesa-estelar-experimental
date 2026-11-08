# Atualização 217 — atalhos, resposta de combate e arrasto

- Espaço pula na direção do personagem; J ataca; clique esquerdo em inimigo ataca; botão direito abre ações. WASD, F, Tab e Q/R continuam. Preferência antiga de Espaço para atacar migra para J. O salto conserva a validação de Atletismo, obstáculos, andares e pausa; não é teleporte livre.
- Ataque rápido usa a arma ativa; clicar outro inimigo usa esse alvo, sem reaproveitar um alvo antigo do balão. A animação começa como intenção; dano e resultado continuam aguardando validação da mesa.
- A aba visível da mesma conta e origem envia sinais para o motor na aba oculta do mestre e notifica IDs de comandos já gravados. Não troca a autoridade de combate nem permite resultados inventados no jogador. O mestre ainda precisa estar conectado com o motor aberto; isto não é um servidor independente, não mantém a partida funcionando com seu computador desligado e não comprova a causa exata da falha da sessão do Yuri.
- Criaturas vivas não podem ser arrastadas. Cadáveres e personagens humanos incapacitados/desacordados continuam elegíveis para socorro. Estar apenas caído não basta.
- Objetos seguem à frente, com prévia local, velocidade reduzida e fator zero preservado quando pesados demais. Quem puxa ou ajuda não ataca nem faz defesa automática. A transação de combate relê os arrastos antes de resolver.
- Sabre energético ganha núcleo claro e brilho na camada da arma, retirando o escurecimento metálico. Não foi remodelado o punho ou criada uma nova geometria nesta rodada.
- Painéis permanentes continuam fora do mapa; o organizador reconhece a faixa externa existente para evitar mudanças contínuas de posição.

As três barras da captura eram PV (vermelho), fadiga (azul) e saciedade (laranja). Isso não significa poder psíquico; a barra de psi é roxa. Não alteramos as fichas para inventar poderes.

Validação: 788 testes unitários; testes Edge de interface MMO, arma/percentuais, IA perseguindo e atacando espontaneamente e painéis 1280/390; sequência de clique/J, carga e Espaço com Firestore simulado. Montagem confere sintaxe e imports. Estes testes não substituem sessão autenticada nem controle físico.

Após publicar: atualizar com Ctrl+F5 a aba do mestre e reabrir Atuar como Kael. Manter a aba do mestre aberta. Conferir ataque e reação na Casa de teste; se a criatura estiver manual, devolver à IA. Relatar eventuais atrasos reais com a mensagem exibida; a latência da rede continua relevante.

Observação da fixture: o cenário simulado de interação gerou duas requisições de imagem para /[object%20Object] (404). A sequência funcional passou e não houve exceção JavaScript; esse detalhe de imagem não foi tratado como validação visual completa da sessão real. Investigar se também ocorrer no site autenticado.
`nPublicação concluída em 28/10/2026 no Firebase Hosting; módulos latido, controles, arrastar e nova-direta conferidos byte a byte por HTTP. Regras do banco não foram modificadas nesta rodada.
