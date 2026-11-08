# Atualização 220 — mapa grande, três visões e HUD

- **O mapa voltou a ser grande.** Não encolhe mais para caber na altura: no computador ocupa a largura toda e o mestre rola/arrasta para ver o resto; no celular tem piso de 16 px/m; interior de casa usa 40–90 px/m (visão de perto).
- **Três visões da mesa**, num único botão na linha de cima (fora do mapa) e nos atalhos:
  - **Alt+1 / 👁️ Jogador** — mapa perto do personagem, corpo 3D de lado, HUD de PV, fadiga e magia na borda esquerda.
  - **Alt+2 / 👑 Mestre** — mapa grande e livre, ferramentas de mestre; **duplo clique** numa miniatura assume o NPC/criatura e entra na visão de jogador; **Esc** devolve o comando do mapa.
  - **Alt+3 / 🏗️ Construir** — abre o construtor de cenário (Oficina 3 / Editor rápido) para casas, peças, móveis e desenho.
- **Pessoas em 2.5D:** jogadores e NPCs usam a arte 3D de lado já existente (andar, atacar, costas, frente), com sombra; a pose “parado” deitada foi trocada por corpo em pé.
- **HUD do jogador** na borda: nome, PV, fadiga e psiquismo (quando existe), sem cobrir o centro do mapa.
- O botão **Correr** deixou de ficar solto no fim da página e vai para a borda (não cria mais rolagem vertical).

Validação: 796 testes unitários; teste de navegador das três visões; teste do HUD do jogador em 1280; teste de entrar/sair de casa; combate (v217) continua passando. O teste antigo `v200-app-real-browser.cjs` ainda espera a faixa de ferramentas sempre visível e o arrasto do chão no layout antigo — precisa ser atualizado para a visão em foco.

Limites: o construtor ainda é o editor existente (não foi criado um catálogo novo de casas); a arte 2.5D é a arte 3D de lado já existente, não um redesenho isométrico completo. A validação com duas contas reais e Firebase de verdade continua pendente.
