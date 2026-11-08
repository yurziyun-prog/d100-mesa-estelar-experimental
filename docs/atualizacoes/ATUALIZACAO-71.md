# Atualização 71 — inspeção embutida nas miniaturas

A v69/v70 tentava inserir o botão de inspeção depois da renderização do mapa. Nesta versão o botão nasce dentro do próprio HTML do token/objeto, no mesmo passo em que a miniatura é desenhada.

- O olho aparece ao passar o mouse sobre uma miniatura ou objeto.
- Depois que o elemento está selecionado, o olho permanece visível.
- Em telas sem hover, a seleção mantém o botão visível.
- O botão bloqueia pointerdown/click do elemento abaixo para não iniciar arraste ou ataque por acidente.
- O modal e as regras de informação pública/mestre da v69 são preservados.
- Combate, Psi, dano e movimento não foram alterados.
