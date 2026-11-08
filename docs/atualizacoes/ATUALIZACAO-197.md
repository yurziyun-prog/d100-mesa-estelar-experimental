# Atualização 197 — 🎨 Editor rápido (estilo RPG Map do Deepnight)

Inspirado em https://deepnight.net/tools/rpg-map/ (paleta lateral simples, desenhar arrastando retângulos, modelos prontos, luzes e legendas).

- **Abrir**: botão **🎨 Editor rápido** ao lado da Oficina 3.0, ou no menu do 🧪. A paleta fica **ao lado** do mapa (o mapa encolhe, nada fica por baixo).
- **Paredes**: arrastar retângulo de parede (blocos de 1 m, 6 materiais) · **Cômodo** (contorno de parede + piso por dentro) · **Tirar área** · **Tirar blocos**.
- **Geral**: borracha (apaga tudo na área) · conta-gotas (pega o material do que está no mapa) · Alt+clique pega/move · Ctrl+Alt+clique duplica · **botão direito do mouse desenha paredes livres**.
- **Objetos**: porta e janela (clique numa parede; abre um vão de 1 m) · móveis e objetos do banco (busca e categorias; R ou roda gira) · **💡 Luz** colorida com brilho (7 cores, alcance de 2 a 12 m) · **🔤 Texto** (legenda no mapa).
- **Modelos prontos** (carimba e um Ctrl+Z desfaz o modelo inteiro): Sala sci-fi, Base sci-fi (3 salas e corredor), Taverna, Casa simples, Praça com chafariz, Cripta.
- **Poças** (água, lava, lodo) e **12 pisos** (arrastar). **Zoom** 100/200/300% no painel, Ctrl+roda amplia, Espaço+arrastar (ou botão do meio) move.
- Tudo vai para o **rascunho**: nada é gravado até **💾 Salvar mapa**; ↶/↷ desfazem e refazem gesto por gesto.
- As peças são objetos comuns da mesa (colidem, bloqueiam visão, portas abrem). A luz e o texto são só desenho por enquanto (a luz não ilumina de verdade nem mexe na névoa).
- Também: a câmera e o desenho do mapa descontam a coluna do editor; `nova-direta.js` desenha `textoV197` e `misturaV197`.
- Testes: `tests/v197-editor-rapido.test.mjs` (geometria, modelos, instalação) e `tests/v197-editor-rapido-browser.cjs` (Chrome de verdade, mouse). Imagem: `docs/imagens/v197-editor-rapido.png`.
- Fica para depois: controle de videogame no editor rápido (hoje é mouse e teclado; o 👷 construtor continua com o controle), cor por objeto, redimensionar o mapa pelo editor, luz que ilumina de verdade.

Publicar: `npx firebase-tools deploy --only hosting --project d100-mesa-estelar`

## Complemento (v197/v198) — paredes finas, mapa do zero, texturas e limpeza do painel
- **Paredes são linhas finas** de espessura fixa (Fina/Média/Grossa/Muralha); porta e janela têm a espessura da parede. **Mapa do zero**: botão "Novo mapa" no painel. NPCs respeitam as paredes do rascunho; o "zzZ" fantasma sumiu.
- **Editores antigos escondidos** do painel do mapa (Oficina 3.0, marcador 🖌️, gerador 🗺️, 🛠️ lápis/formas). **Nada foi apagado**: o botão **🧰 Antigos** (ao lado do 🎨 Editor rápido) mostra de novo pincéis, carimbos e formas até serem integrados.
- **Texturas** (scripts/gerar-texturas-v197.cjs e v198.cjs): metal enferrujado, cromado, mármores (cada bloco com veios próprios), ouro, jade, aço escovado, chapa xadrez, painel sci-fi · águas (rasa, profunda, pântano, turva), areias (clara, escura, deserto), terras (rachada, lama, batida), cascalho, rochas soltas, gramas (curta, alta, seca), flores, sucata, lixo, lava, lava fluida, rocha vulcânica, solo nevado, gelo, parede/paredão de gelo, florestas (oásis, densa, outono, sombria, nevada, conífera, conífera nevada, tropical, palmeiral) e arbustos. As variações de água/areia/terra/grama/sucata/rochas/florestas partem da **arte do GPT** (os originais das básicas foram mantidos; cópia em `arte/texturas/originais-v196`). A `metal.webp` não foi mexida.
- **Copas de árvores** (`copa_*`, fundo transparente): ficam **por cima** das peças (camada 5), **não bloqueiam** o passo e não tapam a visão — dá para passar por baixo. Há **chãos de floresta** separados (`chao_floresta*`, `chao_conifera`, `chao_tropical`) para não confundir chão com árvore. Na paleta: seção "Copas de árvores".
- Poças: água rasa/funda/pântano/turva, lava, lava fluida, lodo.
- Testes: unitários 660 ok; navegador: editor rápido (inclui esconder/mostrar antigos e copas), construtor, rascunho, desempenho, escala.
- As florestas "completas" (chão + árvores no mesmo piso) foram retiradas: árvore não fica no nível do solo; só existe copa (por cima) e chão (embaixo).
- **Trocar o chão do mapa**: escolha um piso na paleta e clique em **🪣 Usar como chão do mapa** (troca só a textura do "Chão do mapa", sem criar peças; desfaz com Ctrl+Z).
- **Paredes fundidas**: paredes novas do Editor rápido não têm borda própria e a textura (tijolo etc.) é alinhada ao mapa, então nos cantos e emendas os tijolos continuam sem risco. Paredes já salvas antes não mudam (é só redesenhar).
- **Telhado e copas** ficaram numa ferramenta própria (🛖), ao lado de Parede e Piso; copa não aparece mais como material de parede. A copa tem **fundo transparente** (os vãos mostram o chão). Copas em 512 px: árvores de folha larga em quadros de 8 m e coníferas em quadros de 16 m (copas de 3 a 6 m).
- **Novas ferramentas** junto de porta/janela: **Escada** (liga andares se houver), **Rampa** (chão inclinado com degradê), **Poço** (pedra + água) e **Móveis**.
- **Cômodo** mostra a combinação "paredes + chão" escolhida. **Andares**: seletor 1–4; ao escolher o andar 2–4, o cômodo vira andar de cima (`andarV144`, o chão dele marca `pisoAndarV144`), sem cortar o de baixo. Só vai para o andar de cima quando você escolhe o andar 2–4 (sem escolher, cômodos sobrepostos se fundem). Os andares só valem para quem vê a cena **salva** (use o 🏢 para alternar o que você vê).
- **Caverna** = estilo de PAREDE (como no RPG Map: "special walls — cavern walls, slopes"): rocha em blocos de 1 m, **sem linha entre blocos**, contorno só nos lados de fora e cantos de fora arredondados. As paredes comuns também ganham contorno só nos lados expostos (`bordasV198`).
- **Caverna** agora tem contorno irregular em SVG (rocha de verdade), emendando entre blocos. Botão **Chão do mapa** à vista logo abaixo do Salvar.
- **Andares no editor**: ao construir, o mestre vê o andar escolhido (1–4) — o chão do andar de cima cobre o de baixo, e o de baixo só aparece escolhendo o andar 1. Jogadores veem só o andar em que estão (regra do módulo de andares, que agora lê também o rascunho).
- **Escada e rampa** levam ao andar de cima (`escadaAndarV144`, `andarAmbosV144`, `andarBaseV198`; o 🪜 aparece perto delas) e são desenhadas de cima: degraus com quina e sombra, corrimãos e, na rampa, plano inclinado com setas.
- **Tamanhos**: barraca de feira 2,4 m; mesa 1,7–1,8 m; barril 0,7 m; caixas, bancos, balcões, toldos, estátua, rochas, sucata etc. reduzidos a escala de gente (1 quadrado = 1 m). Mapas já salvos não mudam; só o que for posto daqui para frente.
- **A paleta não pula mais**: a rolagem da paleta é guardada e devolvida a cada escolha.
- **Paleta reorganizada (do menor para o maior)**: Andares → Construir (Chão do mapa, Piso, Parede, Diagonal, Cerca, Caverna, Cômodo, Escada, Rampa, Telhado, Copas) → **Material** (uma única grade; qualquer material serve para parede, piso, chão, teto, caverna, cerca, escada e rampa) → Apagar → Objetos (porta, janela, poço, móveis, luz, texto) → Geral. Cômodo mostra dois campos, Paredes e Chão. **Chão do mapa**: escolher a ferramenta e tocar num material troca o chão de todo o mapa na hora (andar 0, vale em todos os andares).
- **Copas** têm camada própria (5,5: acima do telhado, que é 5), só aparecem na ferramenta Copas e não servem de material para as outras.
- **Cômodos**: um cômodo desenhado por cima de outro (mesmo andar) vira uma sala só, sem parede no meio (portas e janelas que ficam no meio saem); um cômodo ao lado mantém a parede entre eles, com as paredes emendadas. Pisos e poças agora têm textura alinhada ao mapa (sem emenda entre peças).
- **Andar automático**: parede (ou caverna) desenhada por cima de outra parede ou de um telhado (metade ou mais da área) vai para o andar de cima; cômodo por cima de telhado também. Piso em andar 2+ marca `pisoAndarV144` e cobre o de baixo. Copas seguem o andar escolhido (não são fixas).
- **Zoom livre** (`mesa-camera.js`): roda do mouse (sem Ctrl) e pinça de dois dedos ampliam/afastam ao redor do ponteiro. Mestre: 1× a 8×; jogador: 1× a 3× (nunca vê além do mapa/escala atuais). Com a ferramenta Móveis, a roda continua girando o móvel; os painéis rolam normalmente.
- **Poças** são manchas arredondadas e irregulares (SVG com a textura do mapa) e ficam POR CIMA do piso, sem cortá-lo (antes surgiam linhas no chão).
- **Chão do mapa** nunca é cortado por pisos/poças; escolher outro material troca o chão inteiro (junta pedaços de mapas antigos em uma peça só).
- **Copas** agora são ÁRVORES INTEIRAS (arte/copas/*.webp, geradas por `scripts/gerar-copas-v198.cjs`): arrastar um retângulo espalha árvores completas dentro dele, cada uma um objeto da camada de cima (5,5), com giro e tamanho variados (copas de 3 a 6 m; arbustos 1,5 a 2,4 m). A borracha tira a árvore inteira que tocar.
