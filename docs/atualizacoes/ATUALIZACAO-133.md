# Atualização 133 — Combate automático mais vivo · recuperação · primeiros socorros · botões do mestre

## Desmaio e recuperação no tempo real
- Uma vez por rodada (5 s), quem está **inconsciente** faz um teste de consciência: Resistência, com +5 por PV curado enquanto estava desacordado.
  - NPCs e criaturas rolam sozinhos; as falhas deles não enchem o histórico.
  - O **jogador** vê um balão "💤 está inconsciente · 🎲 Teste de consciência" e rola quando quiser. Se não rolar até o fim da rodada, o teste é feito sozinho.
- Desmaio com tempo marcado (Grito Psíquico, por exemplo) espera o tempo passar.
- O **choque da ferida** ("sem ataques por N oportunidades") vale no tempo real: N rodadas de 5 s sem atacar, inclusive para os jogadores.

## Primeiros socorros no automático
- Quem tem Primeiros Socorros pode preferir socorrer um aliado ferido em vez de atacar. A chance é maior quando o aliado está grave ou desacordado e quando a perícia é alta.
- **Médicos** (perícia alta ou profissão de cura) quase sempre socorrem.
  - Caminham até o ferido, atendem por uma rodada e rolam.
  - Sem ninguém por perto, capricham mais uma rodada (+5).
- Todos **se protegem**: quem está sendo ameaçado de perto não para para curar. Só o médico arrisca, e só para quem está muito grave.

## Jeito de lutar (quem pensa: NPCs e personagens no automático)
- 🎯 **Fica atrás atirando:** quem é melhor à distância mantém uns 4 m e recua quando encostam.
- 🔮 **Fica atrás usando psi:** quem é fraco no corpo a corpo e tem psi. Usa Atordoar ou Medo no alvo, e o Grito Psíquico quando pega dois ou mais.
- 🫥 **Protege-se:** quem não luta bem foge do perigo e só briga se estiver encurralado.
- O painel ⚡ mostra o papel e o 🩹 de cada um.

## Movimento: ninguém mais "estaciona"
- Entre um ataque e outro, cada um se reposiciona:
  - quem luta corpo a corpo **rodeia/flanqueia** o alvo ou recua um passo e volta;
  - atiradores e psíquicos **andam de lado** mantendo a distância;
  - ferido que pensa **recua para trás de um aliado**.
- Quem perde o alcance **persegue**.
- Mortos-vivos e criaturas sem mente continuam avançando direto.
- O Eco da Matilha e os demais cones agora também são usados pela IA no tempo real.

## Botão ♻ Restaurar (só o mestre)
- Fica **verde**.
- Além de vida, munição e fadiga de todos no mapa, ele **restaura o mapa**:
  - apaga o fogo;
  - põe de pé o que foi destruído (meteoros, explosões);
  - devolve as armas caídas ao dono;
  - tira as ilusões e zonas psíquicas.

## Botões só do mestre
- Os jogadores não veem mais: 📍, ✕, ▶, ■, 🎲, 🧹, ♻, ＋ e "Preparar / organizar mesa".
- O botão "Sair do combate" saiu: o mestre decide quando o combate acaba.

## Técnico
- Novo módulo: `js/mesa-tempo-real-tatica.js` (regras puras).
- Arquivos alterados:
  - `mesa-tempo-real.js`;
  - `app.js` (dados de socorro, resistência e psi para o tempo real; ponte de suporte);
  - `nova-direta.js`;
  - `mesa-barra.js`;
  - `index.html` (`46.146-v133-mesa`).
- Teste: `tests/v133-static.test.mjs`.
