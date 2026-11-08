# v168 — Denzel: entrar em Véspera funciona (prioridade)

**O problema.** O pedágio decidia quem estava dentro e quem estava fora da cidade pela posição do portão guardada no mapa. Depois das trocas de imagem, essa posição ficou errada ou sumiu. Por isso:
- o jogo achava que quem estava do lado de fora já estava dentro, e só aparecia "Sair de Véspera";
- o balão fechava sozinho em meio segundo.

**A correção:**
- **Onde fica o portão.** O pedágio procura nesta ordem:
  1. o objeto "Portão de Véspera" na cena;
  2. a posição guardada no mapa, mas só se fizer sentido: o Denzel fica do lado de fora, ao sul do portão;
  3. a posição do próprio Denzel.
  O navegador do mestre usa a cena do mapa em que o jogador está, mesmo que o mestre esteja vendo outro mapa.
- **Balão.** Só fecha se o personagem se afastar de verdade (uns 6 m do Denzel).
- **Conferência ao abrir o site do mestre:**
  - corrige a posição do portão no mapa;
  - refaz o Portão com a imagem nova se ele ainda estiver com a antiga;
  - retira o mapa separado "imagem IA";
  - limpa registros antigos que traziam de volta paredes e fundos.
  O resultado fica em `configuracoes/portaoCheckV167` e aparece num aviso.
- **Paredes que voltavam.** O registro de "o que o mestre arrumou" (mesa-fixos) não mexe mais em paredes, fundos e camadas do Marcador. Antes, ele trazia de volta paredes que tinham sido tiradas.
- **Marcador.** Depois da primeira vez, as marcas mandam: o que você tira não volta. O botão ✅ Aplicar avisa quando há mudanças por aplicar.

Testado como jogador perto do Denzel, tanto com a posição do portão apagada quanto com ela errada:
- o balão mostra o preço, Pagar, Conversar, Pechinchar, Enganar e Intimidar, e continua aberto;
- pagar leva para dentro do portão;
- "Sair de Véspera" leva de volta para fora.
