# Atualização 221 — aba de testes, barra lateral rolável e topo limpo

- **Nova aba 🧪 Mapas de teste** (ao lado de “Mapa da Mesa”). Ela cria, com um clique, um mapa de 28×14 m com:
  - casa pronta (paredes, porta, janela e telhado);
  - interior de 10×7 m ligado pela porta;
  - Kael, o NPC **Ferreiro** e o **Zumbi de teste**;
  - botões para abrir a casa por dentro, ver como jogador, voltar ao mestre e abrir o construtor.
- **Barra lateral rolável**: os atalhos redondos que ficavam presos em `bottom` (masmorra, controles, ajuda, imagens, correr, sessão…) agora entram numa coluna única com rolagem. Em tela menor, não somem mais embaixo.
- **Topo mais limpo**: no modo mestre a barra fica só com mapa, ◀ ▶, Colocar, Mover tudo, Atuar como, Retirar e o botão **⋯**. O resto (desenho, editar, restaurar, visual, sessão, local…) abre no **⋯**. O status “tudo salvo” e o turno saíram da barra para não esticá-la.
- **Troca de mapa**: se houver edição não salva, o seletor agora avisa em vez de voltar em silêncio. Salve no 💾 (ou descarte) e escolha de novo.
- A câmera centraliza na **moldura visível** também no celular (antes o personagem podia ficar fora da tela quando o tabuleiro era maior que a janela).

Validação: 796 testes unitários; teste de navegador da nova aba (cria mapa, casa, NPC, criatura, interior); teste de HUD do jogador em 1280 e 390; teste das três visões; combate v217.

Limite honesto: a visão 2.5D atual inclina o tabuleiro e usa os corpos 3D de lado, mas o **cenário ainda é a arte vista de cima**. Para ficar igual a Ragnarok seria preciso desenhar o cenário em perspectiva isométrica (paredes e telhados com altura), o que é a próxima etapa.
