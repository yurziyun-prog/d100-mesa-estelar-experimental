# Mesa Estelar: continuidade dos três mapas (v230, 2026-11-09)

Este arquivo é o ponto de retomada do trabalho com ChatGPT. Leia-o antes de alterar os mapas, inclusive se a conversa anterior não estiver disponível.

## Repositórios e publicação
- Projeto experimental: `yurziyun-prog/d100-mesa-estelar-experimental`.
- Branch de trabalho: `chatgpt-tres-mapas-correcoes-v224` (apesar do nome, contém as versões posteriores até v230).
- Não alterar `main`, nem a branch de DeepSeek `codigo-tres-mapas-v223` sem autorização.
- Cloudflare Pages publica esta branch em https://d100-mesa-estelar-experimental.pages.dev/
- Publicação: `sh scripts/build-cloudflare-pages.sh`, output `dist`. Este script chama `scripts/preparar-hosting.cjs` e monta `js/app.js` a partir dos módulos. O Cloudflare possui limite de 25 MiB por arquivo, por isso usar o build e NÃO publicar a raiz do repositório diretamente.

## Objetivo da arquitetura
Três interfaces do mestre, para a MESMA cena e objetos, sem abrir automaticamente a aba antiga **Mapa da Mesa**:
1. **Mapa construtor**: câmera 3D orbitável, inclinável, panorâmica e com zoom. Deve evoluir para editar objetos, casas e interiores diretamente. A edição ainda é feita pelo painel 2D/funcional.
2. **Mapa do mestre**: câmera livre para direção da sessão, manipular NPCs/criaturas e cenas. Botão direito numa miniatura deve entrar no Mapa de jogo sob sua perspectiva.
3. **Mapa de jogo**: experiência inspirada em Ragnarök Online clássico, isométrica com norte fixo; câmera segue o ator sem deixar o jogador girar ou aproximar livremente. O controle do ator e a prioridade do mestre ainda precisam ser implementados de verdade.
4. **Mapa da Mesa**: conservar o sistema antigo, separado das três vistas, sem redirecionamentos inesperados.
5. **SOM DE COMBATE**: sons e efeitos só devem existir no mapa dos respectivos participantes, mesmo após mudança de mapa e eventos atrasados.

## Componentes principais
- `js/mesa-tres-mapas.js`: cria as três abas, transfere o contêiner `#sincronizacao-nova` para a aba ativa, mantém as vistas sincronizadas, faz alternância funcional/3D. Desde v230, Construtor inicia em 3D e mantém botão para acessar o mapa funcional; duplo clique em passagem ligada troca mapa pelo controlador sem abrir aba Mesa.
- `js/mesa-lab25d.js`: renderizador ortográfico em Canvas 2D com projeção de geometria espacial, materiais simples e escala em metros. Lê `novaSyncController_.cenaAtual()`, `.dimsAtual()`, `.mapaAtual()`. Suporta orbit, Shift+arrastar/pan e zoom no Construtor/Mestre. Jogo usa ângulo isométrico estável e segue miniatura. v230 enquadra câmera no conteúdo da cena, inclusive quando carrega tardiamente.
- `js/app/05-banco-mapas.js`: `abrirMapaNosVisualizadores_(id)` troca mapa sem navegar para a aba Mesa; `abrirMapaBancoNaMesa_` preserva a aba atual se `mesaTresMapas.aba()` estiver ativa.
- `js/nova-direta.js`: sistema central de cenas, tokens, eventos globais de saúde. `eventoAudivelNesteMapa` filtra sons/efeitos globais de ataques. Na v230 não reproduz eventos antigos sem `mapId`.
- `js/mesa-efeitos.js`: sons de criaturas, golpes, explosões, clima, passos e combate. Filtra `mapId`, silencia durante divergência entre mapa do controlador e tabuleiro e bloqueia eventos antigos sem origem. Alguns sons atrasados já verificam mapa antes de disparar.
- `js/mesa-tempo-real.js`: atribui `mapId` a eventos de combate.
- `js/app/22-mesa-e-modulos.js`: importações com query versionada para evitar cache antigo. Atualizar versões ao alterar módulos.

## Mapas: preservação e limpeza
- Preservar **Ecossistema (teste)** e **Casa de teste (básico)** como referência de elementos 2D, mesmo que não sejam as versões finais.
- Preservar todos os mapas da campanha (incluindo **Cidade Baixa de Véspera**) e todos os personagens/dados.
- Laboratórios ruins v224 (`mesa_laboratorio_v224` e `mesa_laboratorio_v224_interior`) podem ser excluídos somente pelo botão com confirmação explícita no jogo. Não executar exclusão em massa.
- Não criar muitos mapas semelhantes, não apagar mapas de campanha por conta própria.

## Estado real, limitações e erros observados
- O login Firebase em Cloudflare funcionou após corrigir build do JS principal.
- A geometria 2,5D representa algumas peças reais (chão, paredes, portas, janelas, teto, objetos genéricos), mas não dispõe de texturas ricas, objetos 3D completos, iluminação adequada ou edição 3D verdadeira.
- O personagem é um esboço geométrico temporário; reutilizar sprites já existentes ou desenvolver sprites adequados, com proporções corretas.
- A cena pode parecer vazia quando o controlador ainda não a carregou; agora não cria mais personagens/casas falsas.
- Usuário relatou áudio de golpe de outro mapa ainda na v229 e redirecionamento inesperado à aba Mapa da Mesa. A v230 busca corrigir ambos; **não há validação real de navegador nem teste multijogador ainda**. Não declarar resolvido definitivamente.
- A barra de seleção de mapas havia sido filtrada em excesso. Filtro foi retirado: mostrar opções disponíveis (arquivados podem estar no Banco de Mapas).
- Ainda não há sistema completo de seleção/controle de NPCs, IA suspensa e prioridade de mestre em conflito.
- Controle do jogador e edição direta de objetos no renderizador 3D não estão implementados.
- As mudanças foram verificadas quanto a sintaxe JS, NÃO testadas extensivamente no jogo real.

## Próximas etapas, por prioridade
1. Testar em dois navegadores/mapas: ataques simultâneos em A e B; ao visitar A, ouvir apenas A. Inspecionar qualquer outro caminho de áudio se persistir (inclusive scripts de som legados, `labSomAtaque_`, clima e timers).
2. Confirmar troca de mapa entre Construtor/Mestre/Jogo sem salto para Mapa da Mesa, inclusive ao abrir interior ligado, selecionar na barra e trocar personagem.
3. Integrar edição diretamente no Construtor 3D com picking/raycast ou projeção inversa; salvar na cena existente, usando transações oficiais e respeitando colisões, dimensões e Firestore Rules.
4. Aplicar profundidade/oclusão correta no Canvas (a ordenação por face atual é limitada); portas e janelas com vãos reais.
5. Reutilizar recursos de Blender/sprites já existentes; adicionar telhados, escadas, objetos interativos e iluminação.
6. Fazer o jogador seguir e controlar personagem com perspectiva estável estilo Ragnarök, mantendo o motor de combate e privilégio do mestre.
7. Refinar layout com painel de ferramentas pequeno, não sobreposto ao campo visual.

## Preferências explícitas do usuário
- Prefere que alterações sejam enviadas diretamente ao GitHub e publicadas automaticamente via Cloudflare; não pedir para copiar grandes blocos de código.
- Fazer progresso consistente antes de pedir novas avaliações; evitar vários testes parciais e repetitivos.
- Não encher cartões/painéis de controles centrais ou gigantes; controles discretos, organizados nos cantos e espaços apropriados.
- Priorizar funcionalidade real sobre camadas visuais artificiais.
- Registrar continuamente o que foi feito e o que falta, para migração de conversa.

## Última rodada
v233 (2026-11-09): Após a v232, capturas mostraram "Nenhum mapa selecionado" em Construtor, Mestre e Jogo, com terreno vazio. Criado seletor visível de mapa nas três abas; usa `novaSyncController_.openMap` SOMENTE após escolha explícita (evita alterar mapa compartilhado sem permissão do mestre). Renderizador mostra mensagem quando nenhum mapa está ativo, em vez de simular um campo vazio. Quando o controlador carregar o mapa, as cenas devem reaparecer; pendente teste manual no navegador. Importações versionadas atualizadas. Não houve mudança nos dados Firebase.
v232 (2026-11-09): Separados os pisos horizontais dos volumes para evitar o terreno cobrindo paredes (limitação do painter's algorithm ainda presente em interseções complexas); Construtor inicia com câmera mais elevada; Mapa de jogo recupera a lista de miniaturas diretamente do tabuleiro quando o seletor original está vazio e seleciona a primeira disponível. Sem teste visual automatizado. Validar com usuário, sobretudo áudio entre mapas.
v231 (2026-11-09): Construtor e Mestre agora têm botão discreto **Reenquadrar** dentro do viewport 3D; ângulos padrão separados por modo, menor ampliação máxima automática para evitar terreno cortado; Jogo com perspectiva isométrica estável, zoom aumentado e fallback visual para o primeiro token disponível se não houver seleção. Ainda requer validação manual e correção de rastreamento dos tokens pelo estado oficial do controlador.
v230: Construtor abre com câmera 3D, preservação da aba ativa ao trocar mapa, filtro de sons reforçado em ambos os módulos, enquadramento no conteúdo e cache atualizado. Branch não mesclada. Verificar publicação no Cloudflare antes de pedir testes.
