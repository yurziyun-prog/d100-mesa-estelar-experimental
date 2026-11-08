# Atualização 200 — Atitudes das criaturas e vida simples

## O que mudou
- **🧭 Diretor → aba 👾 Criaturas**: escolha criatura ou NPC, quantidade, atitude e personalidade e clique em "Colocar no mapa".
  - 🩸 **Sanguinária**: sai para atacar qualquer um.
  - ⚔️ **Agressiva**: só ataca quem entra no seu território (raio em metros, padrão 7 m).
  - 🛡️ **Defensiva**: só ataca se for atacada.
  - 🤝 **Aliada**: faz parte de um grupo e nunca ataca os aliados do grupo, mesmo atacada.
- **Padrão por espécie**: a primeira classificação de uma espécie vira o padrão de todas as outras dela; dá para trocar uma miniatura só pela lista "No mapa" (↺ volta ao padrão).
- **NPC que não é criatura**: defensivo por padrão (só ataca se atacado).
- **Personalidades** que mudam o jeito de lutar: covarde (foge cedo), teimosa, furiosa (nunca foge).
- **Vida simples** (ligada por padrão, botão ❤️ no painel ⚡): uma barra de PV, fadiga e psiquismo (só para quem tem poder psíquico), sem dano por partes do corpo. Cansado (fadiga < 20%) ataca mais devagar. Desligando, volta o sistema por partes do corpo.
- O combate em tempo real liga sozinho quando uma criatura agressiva/sanguinária enxerga alguém.
- Corrigido: tokens com arte nova (v199) seriam recusados pelas regras do banco.

## Fase 2 — personalidades de passeio (fora do combate)
Escolha em 👾 Criaturas → personalidade:
- 🧭 **Exploradora**: anda longe, procura portas fechadas (não trancadas), vai até elas, **abre** e passa para o outro lado.
- 🏃 **Covarde**: com perigo por perto (jogador, criatura sanguinária/agressiva) corre para a própria toca, ou para trás de pedra/árvore/construção, ou foge.
- 🕳️ **Construtora**: junta 3 pedras/árvores (elas somem e voltam depois, como na mineração), volta para o seu canto e **constrói uma toca** no mapa; passa a viver ao redor e corre para ela no perigo. A toca vira a "casa" do território.
- As miniaturas artísticas agora **viram** para onde andam/atacam (arte original olha para a esquerda; andando para a direita espelha), ficam mais escuras **de costas** ao subir e brilham ao golpear.

## Fase 3 — atributos no estilo Skyrim, abrigo, fome e fadiga
No painel 👾 Criaturas (e na lista "No mapa"):
- **Agressão**: além das 4 atitudes, nova **🕊️ Pacífica** (nunca ataca, nem revidando).
- **Confiança**: Covarde · Cautelosa (padrão) · Corajosa · Destemida. Muda o jeito de lutar e de fugir (e Covarde também se esconde fora do combate).
- **Ajuda**: Ninguém · Mesma espécie · Espécie e grupo — quem ela socorre quando um do bando é atacado.
- **Alimentação**: Não precisa · 🍖 Caçadora · 🍎 Frugívora · 🍽️ Onívora. Faminta (barra laranja), a caçadora persegue uma presa menor, **mata e come**; a frugívora come frutos nas árvores; a onívora prefere frutos e só caça muito faminta. Fica satisfeita e volta à rotina.
- A primeira classificação de uma espécie vira o padrão (inclui Confiança, Ajuda e Alimentação); dá para trocar bicho a bicho.
- **Abrigo**: a criatura com toca **entra nela** (fica esmaecida; some para os jogadores) até a ameaça passar. NPCs e exploradoras sem toca **abrem a porta de uma casa, entram, fecham e esperam**; saem abrindo a porta quando o perigo passa.
- **Fadiga**: correr, fugir, caçar e lutar gasta fadiga; cansado anda mais devagar (barra azul).
- **Animação**: a miniatura gira ao virar e, de costas, fica mais escura. Já existe suporte a **folhas de andar** (quadros de perna/braço por direção): ponha `arte/miniaturas/<id>_andar_lado|costas|frente.webp` (quadros lado a lado) e registre em `FOLHAS` de `js/mesa-sprites-npc.js`. Sem a arte, só vale o balanço atual.

Observação técnica: o combate em tempo real apagava as marcas de atitude/personalidade ao atacar; corrigido (`CHAVES_POS`). Portas a partir de ~1 m passam (a vida usa uma grade mais fina quando o caminho normal não chega).

## Fase 4 — pedidos do mestre (chão, mercado, Sorte, comportamento visível, tamanhos)
- **Chão não se arrasta**: piso/"Chão do mapa"/calçada etc. Arrastar o chão **move a tela** (mesma câmera do botão do meio); todo o resto continua arrastável. (js/mesa-chao.js, nova-editor.js, Editor rápido: Alt+arrastar também ignora o chão.)
- **Mercado**: "Itens médicos" e "Itens Médicos" (ou com espaços/acentos diferentes) viram **uma categoria só**.
- **Sorte (novo sistema)**: gasta 1 ponto e dá **+50% do valor da perícia no próximo teste** (ataque, defesa, teste de perícia, consciência, socorros, psiquismo). Depois some. Não rerrola mais. Botão: "🍀 Sorte (n)" → "🍀 Sorte ativa · +50%".
- **Seletor de comportamento onde o mestre vê**: faixa "Ferramentas do mestre" acima do mapa (👾 Criaturas e comportamento · 🎲 Gerar NPC/criatura · 🗺️ Gerar mapa · 📏 Ajustar tamanhos) e um **cartão** que abre sozinho ao **selecionar** uma criatura/NPC e quando entra uma **criatura nova** (por qualquer caminho). Campos: Agressão, Personalidade, Confiança, Ajuda, Alimentação; a 1ª escolha vira o padrão da espécie.
- **Tamanho das miniaturas**: o cartão e a aba 👾 comparam com o bestiário (ex.: Cavalgante Prismático, 2,40 m, tinha 1 m no mapa; agora 2,28 m, maior que o Carniçal Dominante, 1,95 m) e ajustam com um clique.

## Fase 5 — correções do mestre (barras, bando, saúde nova, mapas, ficha rápida, sons)
- **Barras**: uma barra de vida só, junta com a fadiga (e psiquismo só para quem tem poder psíquico; fome só com Alimentação), dentro da miniatura. A barra antiga do pé some.
- **Mesma espécie**: com **Ajuda** ligada, criaturas da mesma espécie **não se atacam e se juntam** (anda junto). Espécie = campo "espécie" do bestiário (todos os "Humanoide parasitado" — zumbi, cadáver chefe, carniçal — são um bando só).
- **Criatura nova começa do zero**: ao colocar uma criatura comum no mapa, a saúde/morte e os atributos sorteados de uma anterior com o mesmo id são apagados (antes, o zumbi morto "voltava" morto num mapa novo).
- **Mapas gerados**: as paredes não cruzam mais o vão das portas (antes 60% das portas davam para uma parede: a sala ficava trancada mesmo com a porta aberta); ao pôr no mapa atual (menor que o gerado), recorta sem perder as paredes e fecha a borda com parede. **Materialidade**: portas de madeira, reforçadas, de grade (portão), de aço ou de painel conforme o estilo, cada uma com material, vida (PV), dureza e aparência; paredes com PV por material (pedra 500, metal 420, madeira 160, palha 60).
- **Balão da criatura**: clicou na criatura → cartão com comportamento (vale só para ela) e **📋 Ficha rápida**: nome, vida máxima (mantém a proporção), curar tudo, bônus de ataque e de defesa (−60 a +60 pontos %). *Equipar* ainda não.
- **Sons**: ataque sonoro (Eco da Matilha, grito, ulular…) = **grito ensurdecedor** + tremor da tela; zumbis **rosnam** ao atacar e de vez em quando ao andar (gemem ao morrer/apanhar).
- **permission-denied**: ao mudar o comportamento de uma criatura que estava andando, a gravação usava a "revisão" velha do token e o banco recusava. Agora lê a revisão atual e tenta de novo.

## Fase 6 — miniaturas 3D animadas (pacotes Quaternius, domínio público)
- Pipeline: `scripts/gerar-sprites-3d.cjs` (three.js) lê os GLB dos zips (pasta do Codex) e gera folhas de quadros em `arte/miniaturas3d/<modelo>_<acao>_<direcao>.webp`: **andar** (lado, costas, frente), **atacar** (idem), **golpe**, **morrer**, **parado**. Estilo do jogo: contorno escuro, luz quente de cima/esquerda, cores dessaturadas, enquadramento fixo (sem cortar em nenhum quadro).
- Jogo: `js/mesa-arte3d.js` toca a folha certa pelo movimento (espelha para a direita), pelo ataque (`ef-golpe`, vira para o alvo), pelo golpe (`ef-impacto`) e pela morte (saúde). Escolha no balão da criatura: "🎬 3D · …" (campo `arte3dV200`, nas regras).
- Para gerar mais modelos: `TODOS=1 TAM=160 node scripts/gerar-sprites-3d.cjs` (precisa de `npm install three` numa pasta e dos zips).
- Próximos: peças de mapa (dungeon, mobília, sci-fi) e ícones de itens renderizados do mesmo jeito.

## Limites (ser honesto)
- Não consigo pintar arte nova: as espécies sem miniatura continuam com a arte antiga. A arte **de costas** é aceita: ponha `arte/miniaturas/<id>_costas.webp` e liste o id (`<id>_costas`) em `VARIANTES` de `js/mesa-sprites-npc.js`; sem o arquivo, a miniatura só escurece.
- A vida só roda no navegador do mestre (mapa aberto); as personalidades só valem fora do combate em tempo real.

## Publicar (inclui regras!)
```
npx firebase-tools deploy --only firestore:rules,hosting --project d100-mesa-estelar
```
Depois, Ctrl+F5.

## Fase 7 — Peças de mapa 3D
Renderização top-down dos pacotes GLB (domínio público) em `arte/pecas3d/` (370 webp, 1,9 MB), dados em `js/mesa-pecas3d-dados.js`, mescladas em `js/mesa-pecas.js` (`PECAS=[...PECAS_IA,...PECAS_3D]`). Gerador: `node scripts/gerar-pecas-3d.cjs`. Teste: `tests/v200-app-real-browser.cjs` (seção 3b).

## Fase 8 — Ícones de itens 3D e equipar criatura
- 84 ícones 3D (armas, armaduras, escudos, poções, comida, tesouros) em `arte/itens3d/`, gerados por `node scripts/gerar-icones-itens.cjs`.
- `js/mesa-icones-itens.js`: item sem imagem própria usa o ícone pelo nome em português (ex.: "Espada longa", "Poções de cura"); a mochila/equipamento (`mesa-equipar.js`) já usa isso.
- Balão da criatura → Ficha rápida: **⚔️ Arma** e **🛡️ Proteção** preenchem o bônus de ataque/defesa e mostram o ícone.

## Fase 9 — Novos pacotes 3D (Poly Pizza) e créditos
- 12 pacotes novos (Quaternius, CC0): Monstros, Inimigos Animados, Pós-Apocalipse, Cyberpunk, Fantasy RTS, Piratas, Fazenda (animais e construções), Peixes, Homens/Mulheres animados, Armas de fogo.
- 55 miniaturas 3D novas (monstros, inimigos, zumbis, sobreviventes, cães, animais de fazenda); seletor 3D agrupado por tipo. Correção no gerador: a pose da animação anterior vazava para a "parado".
- Peças de mapa: 550 no total (fazenda, fantasia, piratas, cyberpunk, pós-apocalipse), nomes em português (`scripts/traduzir-nomes-pecas3d*.cjs`).
- Créditos: `scripts/gerar-creditos.cjs` → `js/mesa-creditos-dados.js` (36 pacotes, criadores, licenças e modelos CC-BY que exigem citação). Página "Sobre o Jogo" ainda a combinar com o Yuri.

## Fase 10 — Terreno natural, seta de mover, espessura livre e criaturas só com corpo
- **Criaturas**: saíram as 22 miniaturas 3D "só cabeça" (blobs, gato, galinha, pombo…); entraram versões de corpo inteiro (alienígena, cactoro, ninja, yeti, homem-peixe, demônio guerreiro). Vespa removida (saiu em branco).
- **Editor rápido**:
  - **↖️ Selecionar e mover** (1ª ferramenta): clique numa peça e arraste (Ctrl duplica); contorno da peça sob a seta; cursor de mãozinha.
  - **Espessura**: Fina/Média/Grossa/Muralha/**Fortaleza (2 m)** + campo livre 0,1–6 m (padrão 0,3). Oficina 3.0: opções até 3 m.
  - **⛰️ Cordilheira**: beiradas irregulares; sem "Pontiaguda" = **planalto** (topo plano elevado no andar de cima, paredão de rocha, 0–3 rampas); "Pontiaguda" com Pontas ≥ 70% = **colinas escarpadas** (rocha recortada com fendas e **picos 3D virados para cima**, de montanhas do Ultimate Fantasy RTS). Pontas abaixo de 70% = planalto com pedras em pé no paredão.
  - **🕳️ Caverna natural**: autômato celular (salas e passagens sempre ligadas), entradas, chão à escolha. Pincel de rocha com tamanho de 1 a 6 m.
  - Desenho em **massa orgânica** (contorno suave com sombra e relevo, `mesa-terreno-natural.js` + `macicoSvgV201` em `nova-direta.js`), com blocos invisíveis que barram passo e visão; "Tirar área/blocos" e borracha cortam a massa; a seta move o terreno inteiro.
- **Gerador de mapas**: tipo **Caverna**; seletor **Grossura das paredes** (padrão 0,45 m; Fina a Fortaleza; "Outra…").
- Sprites 3D de relevo: `scripts/gerar-relevo-3d.cjs` → `arte/relevo/`.
- **Poças (água, lava, pântano…)** com opção **Forma irregular** (marcada por padrão; controle de irregularidade): lago orgânico com contorno suave dentro do retângulo arrastado. Desmarcando, sai a forma de antes.

## Baixados para a próxima rodada (KayKit, Kay Lousberg, CC0 — créditos a incluir)
`KayKit_Adventurers_2.0_FREE.zip`, `KayKit_Skeletons_1.1_FREE.zip`, `KayKit_Character_Animations_1.1.zip` (em `Documents\Codex\2026-09-09\`). Personagens com corpo, armas e animações (mesma rig: dá para reaproveitar as animações). Ainda NÃO integrados ao jogo; falta adicionar em `scripts/gerar-creditos.cjs`.

## Fase 11 — Balão com Salvar, sanguinária que caça, sem anel/bolinha, sem sobreposição
- **Balão de comportamento**: agora as escolhas (atitude, personalidade, confiança, ajuda, alimentação) só são PREPARADAS; o botão **💾 Salvar comportamento** pergunta **"Alterar só este personagem"** ou **"Alterar toda a espécie"** (esta vira o padrão da espécie, apaga as exceções individuais e vale para todos). Padrão da espécie agora guarda também a personalidade. Linha "Agora: …" mostra atitude em vigor, tempo real e alvos hostis. Campo **Tamanho (m)** em qualquer criatura/NPC.
- **Sanguinária** continua com ÁREA DE VISÃO de 14 m (sem parede no meio), mas agora ataca QUALQUER um que esteja nela, inclusive NPCs defensivos/neutros (antes a facção neutra os protegia e ela ficava parada ao lado). Liga o tempo real sozinha.
- **Miniaturas**: sem círculo colorido em volta e sem a bolinha amarela de frente; o mestre afasta quem ficou por cima de outro (com a revisão certa do servidor); gente (jogadores e NPCs) é DESENHADA com pelo menos 1,25 m (a colisão/portas não mudam).
- **Ataques**: som (ulular, rugido, grito) e sopro (baforada) ganham **cone visual** além do som.
- 3D continua opcional (não ficou automático): o Yuri achou o estilo destoante; o T-Rex 3D tem defeito.

## Fase 12 — Editor rápido, Combate, Galeria 3D
- **Barra "⚡ Tempo real"** some para o mestre (é o padrão do combate); as opções (pausar, velocidade, facções) ficam no botão **⚡ Combate** em "Ferramentas do mestre". Jogadores continuam vendo a barra de recarga.
- **Oficina 3.0 removida** (botão e painel); só o Editor rápido.
- **Editor rápido**: clicar numa miniatura (criatura, NPC, jogador) continua selecionando (balão de comportamento) e arrastando, mesmo com ferramenta ativa; **🗑️ Apagar peça** (um clique); a ferramenta **Caverna** agora desenha massa orgânica (contorno suave, cantos arredondados, massas vizinhas se fundem); **rampa da cordilheira** é de rocha orgânica, mesma textura, com setas.
- **Balão da criatura**: linha "Agora: … motor: …" mostra por que ela age ou não (age sozinha? dados da ficha? alvos?).
- **🎞️ Galeria 3D** (Ferramentas do mestre): vê todas as miniaturas 3D animadas, marca 👍/👎, escolhe no lugar de quais criaturas entram e exporta a lista (salvo em `configuracoes/galeria3dV201`).
- Baixados e ainda não usados: KayKit Adventurers/Skeletons/Animations (CC0).

## Fase 13 — Miniaturas de cima (Blender), editor de visual, personagem pintável, Mapa de teste
- **Padrão novo: miniaturas vistas de cima**, feitas no Blender por script (`scripts/blender/`): `criaturas_cima.py` (36 criaturas do bestiário com andar, atacar, golpe, morrer, parado), `criatura_dragao_trombeta.py` (dragão corredor com boca de tentáculos ligados por pele, que abre e fecha), `pessoa_cima.py` (pessoa em camadas pintáveis) e `montar-cima.cjs` / `montar-pessoa.cjs` (montam as folhas em `arte/miniaturas3d/` e registram em `js/mesa-sprites-3d-dados.js`). Autoria dos modelos: feitos aqui no Blender (sem pacotes de terceiros).
- A miniatura de cima **gira para onde anda ou ataca** (sem espelhar). Criatura do bestiário sem escolha explícita já nasce com a dela (`cima_<id>`).
- **Editor de visual da criatura** (cartão da criatura → 🎨 Ajustar visual): cor, saturação, brilho, tamanho e giro, ao vivo; salvar só nesse personagem ou na espécie (campo `arte3dAjusteV203`).
- **Personagem de jogadores e NPCs** (`cima_pessoa`): pele, roupa, detalhes, cabelo (curto, longo, careca) e **capa opcional**, que só se agita quando o personagem anda (e abre no ataque). Botão **🧑 Editar personagem** (jogador: só o dele; mestre: qualquer pessoa selecionada). Campo `visualV203`; regra nova do Firestore deixa o dono mudar só `visualV203` e `arte3dV200`.
- **A vida (rotina, caça, comida, fuga, abrigo) passa a rodar junto do tempo real** nos bichos que não estão em luta (antes parava no mapa com tempo real ligado). `mesa-tempo-real.js` expõe `ocupado(id)`.
- **🌿 Mapa de teste** (Ferramentas do mestre): cria o mapa novo "Ecossistema (teste)" 80 × 50 m com floresta (101 árvores), lagos, pântano, lava, cordilheira, caverna, ruínas com portas, acampamento com fogueira, 10 armadilhas, ~43 criaturas (presas, predadores, sanguinários) e 3 NPCs (o primeiro é seu). `js/mesa-ecossistema.js`.
- Testes: `tests/v203-ecossistema-browser.cjs` (cria o mapa, conta miniaturas, simula 60–90 s) e novas verificações em `tests/v200-app-real-browser.cjs`.

### Fase 14 — personagem de cima (cabelos, capa) e dragão-trombeta
- Pessoa de cima refeita: proporções mais naturais, contornos finos, cabelo em calota lisa (sem "bloquinhos", careca ou bolinha). A bolinha preta ao lado do braço era a ponta do rabo de cavalo: removida do cabelo longo.
- **Editor de personagem**: 7 cortes (curto, longo, rabo de cavalo, coque, moicano, volumoso, careca), cor do cabelo, **cor e desenho da capa** (lisa, debrum, faixa, losango, combinações). Jogador edita o dele; o mestre edita qualquer NPC. O texto salvo (`visualV203`) agora pode ter até 160 caracteres (`firestore.rules`).
- **Dragão-trombeta** (4 variações): corpo de dragão visto de cima — rabo bem mais longo e esticado, fileira de espinhos do pescoço à ponta do rabo; só a cabeça (trombeta) continua diferente.
- **Mais personagem**: orelhas (normais, pontudas, grandes, de gato), acessórios com cor própria (chapéu, coroa, faixa, chifres, ombreiras, mochila), rosto (olhos, sobrancelhas, boca) e prévia **de cima e de frente** no editor.
- **Cores mais realistas**: as paletas deixaram de ser amarelo/azul de desenho animado (aço, cromado, preto, bronze, champanhe, vinho, couro…) e há 6 "estilos prontos": Soldado metálico, Preto cromado, Retrofuturista elegante, Retrofuturista dark, Viajante (couro), Nobre gótico.
- Dragão-trombeta: emendas orgânicas entre pescoço, crânio, focinho e raiz do rabo.
- **Montar em dragão-trombeta domesticado** (alado e corredor): botão "Montar" perto dele; o cavaleiro conduz e, se for o **alado**, **voa** (passa por cima de muros e objetos, velocidade ×2,6, sombra afastada). Selvagem não pode ser montado. No Mapa de teste há um de cada no acampamento.

### Fase 15 — esqueleto real (guia de Blender do Yuri, 23/10/2026)
- **Pessoa com esqueleto**: `scripts/blender/pessoa_rig.py` usa o "Adventurer" (Quaternius, Ultimate Modular Men Pack, **CC0**; base em `arte-fonte/pessoa-base/Adventurer.glb`) com 62 ossos, pesos e as animações reais do pacote (Idle, Walk, Punch, HitRecieve, Death). Os bonecos de esferas ficam no catálogo como `cima_pessoa_v1` (scripts antigos em `pessoa_cima.py`).
- Camadas pintáveis (roupa, calça, detalhes, pele, rosto, cabelos, orelhas, acessórios, capa) com oclusão certa: as camadas-base se recortam entre si (holdout) e as opcionais só são recortadas pelas bases; trocar/tirar chapéu ou cabelo não deixa buraco. Cabelos, chapéu, capacete, chifres e ombreiras acompanham os ossos da cabeça/braço.
- **Vistas do editor**: de cima, frente, lado e costas, com movimento. De costas a **capa e a mochila ficam por cima do corpo**; nas outras vistas, atrás.
- **O que o personagem equipa aparece na miniatura**: mochila, capacete, chapéu, coroa, capa e armadura da ficha (`js/mesa-equip-visual.js`; o dono/mestre resume em `visualV203` → `z=…`, sem expor a ficha).
- **Criatura**: `scripts/blender/criatura_rig.py` (lobo do Animated Animal Pack, CC0) com marcha real; no Mapa de teste há um "cão" com o lobo (`cima_lobo`).
- **Sala pequena**: `scripts/blender/sala_pecas.py` — paredes com espessura e topo chanfrado, porta, janela, estante, escrivaninha e tapete (peças `sl_*` no Banco de Objetos) + cena de demonstração.
- Demonstração: `docs/demo-pessoa-rig.html` (servir com `node scripts/demo-pessoa.cjs`) e `docs/demo-rig/`.
- Créditos: Quaternius (quaternius.com), licença CC0.
