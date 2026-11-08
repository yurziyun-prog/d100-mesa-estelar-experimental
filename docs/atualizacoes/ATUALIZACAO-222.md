# Atualização 222 — três abas do mestre

- **“Mapa da Mesa” voltou ao estado anterior** (layout, câmera, barra e miniaturas originais). A aba temporária “Mapas de teste” e o modo 2.5D experimental foram removidos.
- Três abas novas, **só para o mestre**, depois de “Ficha”:
  1. **🏗️ Mapa construtor** — visão de cima; abre as ferramentas de construção existentes. Duplo clique numa casa/porta com interior ligado abre o interior ampliado.
  2. **👑 Mapa do mestre** — visão intermediária; serve para dirigir a sessão, mover objetos e escolher NPCs/criaturas. **Botão direito** numa miniatura abre a terceira aba já naquela perspectiva.
  3. **🎮 Mapa de jogo** — a mesma visão do jogador, seguindo e controlando o personagem/NPC/criatura escolhido. Selecionar uma criatura com IA no mapa do mestre e abrir o jogo desliga a IA daquele corpo (`assumirControle`).
- As três abas usam **o mesmo tabuleiro e o mesmo mapa**, em sincronia. Ao voltar para “Mapa da Mesa”, o tabuleiro volta para o lugar original.
- A câmera de cada aba tem um zoom próprio: construtor 1×, mestre 2×, jogo 4×.

Validação: montagem confere sintaxe/imports; teste de navegador confirma que as três abas aparecem na ordem, movem o mesmo tabuleiro, o botão direito no NPC abre “Mapa de jogo” com ele selecionado, e “Mapa da Mesa” restaura o tabuleiro.

Limites desta primeira versão:
- A casa só abre pelo duplo clique quando existe uma ligação `interiorV164` (criada pelo Marcador ou por outra casa). Ainda não há um botão “criar interior” dentro do construtor.
- O catálogo de construção é o existente (Oficina 3/Editor rápido); não foi criado um catálogo novo de estilos de casa.
- O mapa 2.5D estilo Ragnarok continua pendente: nesta rodada a aba “Mapa da Mesa” foi restaurada como estava e as abas novas usam a visão normal.
