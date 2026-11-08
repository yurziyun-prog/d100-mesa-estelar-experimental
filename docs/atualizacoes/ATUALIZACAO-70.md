# Atualização 70 — correção do olho de inspeção

A v69 criava a inspeção, mas o botão de olho era anexado depois do render por uma microtarefa. O Mapa da Mesa usa um estado visual temporário durante a renderização sincronizada; assim, o callback podia rodar já fora desse contexto e não encontrar a seleção correta.

A v70:

- anexa o olho sincronamente no pipeline visual do mapa;
- reforça a atualização logo após selecionar personagem ou objeto;
- mantém o botão mais próximo da borda da miniatura, reduzindo risco de clipping;
- não altera combate, Psi, movimento, dano ou sincronização da cena.
