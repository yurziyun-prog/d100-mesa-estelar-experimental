# Atualização 134 — Coma × desmaio · aluguel de cápsulas com chave · mapas panorâmicos · bilhetes · armários maiores

## Desmaio, coma e morte
- **💤 Desmaiado:** faz o teste de consciência a cada rodada (Resistência + 5 por PV curado). Pode acordar sozinho ou ser socorrido.
- **🛌 Em coma:** desacordado com ferida grave num local vital (cabeça, peito ou abdômen) ainda sem tratamento.
  - Não há teste: só acorda depois de Primeiros Socorros (que estabilizam o ferimento) ou de cura nesse local.
  - Depois disso vira desmaio e volta a testar.
  - Aparece 🛌 na miniatura, na mini-ficha e no painel. O jogador vê o aviso no lugar do botão de teste.
  - Médicos no automático dão prioridade a quem está em coma e tratam primeiro o ferimento vital.
- **💀 Morto:** nada mais funciona.

## Alugar um quarto na Última Bateria
- O **UR-17 virou comerciante:** "Balcão da Última Bateria". Clique nele no mapa (🛒) para comprar:
  - **Chave da cápsula 1 a 6**: 20 recursos, ou 28 as cápsulas pares, que têm chuveiro sônico;
  - **Dose de combustível**: 3 recursos.
- Todas as portas das cápsulas ficam **trancadas**.
- Quem tem a chave certa no inventário vê **🔑 Usar a chave** no balão da porta. A porta destranca e abre, e isso fica no histórico.
- A mesa confere a chave na ficha. Arrombar ou abrir com perícia continua possível, e a dificuldade das portas das cápsulas é Difícil.
- As chaves também funcionam pelo campo "abre" de qualquer item do banco, ou pelo nome: "Chave da X" abre "Porta da X".

## Mapas panorâmicos
- Mapas com mais de 28 m agora **cabem na tela**: menos pixels por metro e miniaturas menores.
- **🔭 Panorâmico** (barra do mapa, só o mestre) amplia o lugar ×1,5, ×2 ou ×3:
  - o chão, as paredes e as ruas crescem;
  - os móveis mantêm o tamanho real e só se afastam;
  - dá para desfazer (fica uma cópia de segurança).
- O **Pátio das Sete Rodas** foi ampliado sozinho (×2, 56 × 28 m). O 🔭 sugere outros mapas amplos (feiras, mercados, praças, porto, serra…).
- Os mapas novos a céu aberto (rua/cidade, floresta, ermos) e os mapas intermediários entre cenários já saem com 56 × 28 m. O gerador ganhou o tamanho 56 × 28 m.

## Bilhetes
- Os bilhetes deixados nos armários e no chão **não usam mais as notas do mestre** (segredos, eventos, objetivo).
- Agora são recados do mundo do jogo, escolhidos pelo estilo do lugar: registros, recortes de jornal, pergaminhos, listas…
- Os bilhetes antigos nas cenas foram reescritos uma vez, automaticamente.
- Bilhetes que algum jogador já pegou continuam na ficha dele.

## Estética
- Armário de metal: 2,7 × 0,9 m (era 1,8 × 0,6). Baú brasonado: 1,7 × 1,05 m (era 1,2 × 0,75).
- O banco e os móveis já colocados são corrigidos ao abrir cada mapa. Se você ajustou um tamanho à mão, ele é mantido.

## Técnico
- Novo: `js/nova-coma.js`.
- Arquivos alterados:
  - `mesa-elenco.js` (aluguel, bilhetes, panorâmico);
  - `mesa-objetos.js` (chaves);
  - `mesa-recheio.js`;
  - `mesa-tempo-real*.js`;
  - `nova-direta.js`;
  - `nova-painel.js`;
  - `mesa-acoes-mapa.js`;
  - `mesa-tamanhos.js`;
  - `mesa-arte-*.js`;
  - `mesa-gerador-mapas.js`;
  - `mesa-ligacoes.js`;
  - `mesa-sessao.js`;
  - `mesa-mapas-ui.js`;
  - `mesa-barra.js`;
  - `mesa-diretor.js`;
  - `app.js`;
  - `index.html` (`46.147-v134-mesa`).
