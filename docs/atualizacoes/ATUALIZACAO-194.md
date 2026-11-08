# Atualização 194 — acabamento artístico: mapas, miniaturas, animações e temas

## v209 — realismo no mapa: sem grade, sem aura, ações contextuais ao perto (2026-10-18)

O Yuri pediu três correções pontuais de "limpeza" do mapa, seguindo o rumo MMO:

- **▦ Grade de batalha removida da mesa**: o mapa fica limpo, visto de cima como um MMO (o retângulo `url(#novaGrid)` some da camada do mapa). **No editor de mapa a grade volta** (a re-render inclui o estado de edição na chave visual).
- **Sem "aura" nos tokens**: personagens e criaturas viram só a miniatura com sombra de chão — acabou o anel ciano e o fundo escuro permanentes. Borda colorida só para quem está selecionado (amarelo) ou alvejado (laranja). O **nome some** e reaparece ao passar o mouse, ao tocar/selecionar, ou no personagem que você controla.
- **Objetos sem emoji flutuante**: porta, cama, luz e baú não têm mais ícone flutuando o tempo todo — a arte do mapa É o objeto. **Ao chegar perto** (≤ 2,6 m do personagem que você controla) aparece uma **pílula contextual** com a ação: "🚪 Abrir", "🔒 Destrancar", "🛏️ Deitar", "💡 Ligar", "🗄️ Ver dentro (2)". Clicar nela age na hora (ou abre o painel quando precisa de decisão/teste). O **item no chão é só a imagem do item** — sem o brilho dourado pulsante. Os efeitos de estado (porta aberta desliza, luz acesa clareia com poça de luz) continuam valendo para todos os objetos, perto ou longe.
- Mestre: o botão 🚪 **Interativos** continua mostrando ícones de tudo para configurar; o balão de decisão ancora na arte do objeto quando não há ícone.

`nova-direta.js?v=209`, `mesa-objetos.js?v=209`, `app.js 46.209-v209-mesa`. Teste `tests/v209-realismo.test.mjs` (4 testes); pinos de cache do v208 relaxados para regex genérica.

Verificação: 645/645 testes, v190/v191/v196 browser ok, hosting ok (121 módulos).

## v208 — mecânicas MMO vistas de cima: clique para mover, hostilidade liga o combate (2026-10-18)

O Yuri definiu o rumo: **MMO RPG dinâmico, sem iniciativa/turnos**. O motor de tempo real (v111) e o modo diretor (v206/v207) já davam o combate dinâmico — o v208 traz as mecânicas de interação de MMO:

- **🖱️ Clique para mover**: toque no chão (sem arrastar) e o personagem **caminha até o ponto desviando de paredes e portas fechadas** — pathfinding `caminho()`/`montarGrade()` (o mesmo da IA do tempo real), aplicado sobre os objetos da cena. O toque entra na fila de waypoints do próprio loop de movimento (arrastar, gamepad e clique convivem; clicar de novo ou arrastar cancela a rota). Serve para jogadores e para o modo diretor.
- **⚔️ Hostilidade liga o combate**: quando alguém ataca (ou usa psi ofensivo) fora de qualquer combate, o **tempo real liga na hora** — `iniciarRT()` extraída do botão ▶ e exposta na ponte; o processamento do comando de ataque liga e já resolve na mesma jogada. Com combate por turnos ativo, nada muda (o tempo real continua proibido junto). O mestre ainda pode ligar/desligar/pausar pelo ⚙️ como antes.
- **👆 Interação por clique**: 1º clique num token seleciona o alvo; **2º clique no mesmo abre as ações** dele (atacar, conversar, usar) — o mesmo atalho que o botão do controle já usava.

`nova-direta.js?v=208` (importa a IA de caminho), `nova-ataques.js?v=208`, `mesa-tempo-real.js?v=208`, `app.js 46.208-v208-mesa`. Teste `tests/v208-mmo.test.mjs` (4 testes). Regexes de `?v=` dos testes v103/v111/v137 relaxadas.

Verificação: 641/641 testes, v190/v191/v196 browser ok, hosting ok.

## v207 — o diretor luta no combate em tempo real (estilo MMO, sem turnos) (2026-10-18)

O Yuri alinhou o rumo: o jogo caminha para **MMO RPG dinâmico — sem iniciativa nem turnos**. Esse motor já existe (combate em tempo real, v111): todo mundo luta o tempo todo, com recarga por personagem. O que faltava era o **modo diretor (v206) participar dele**:

- **Token do diretor vira manual**: ao entrar em tempo real com a aba diretor aberta, o token escolhido deixa de ser dirigido pela IA **em todas as abas** (`auto=false` persistido no estado — a escrita é permitida porque as regras do Firestore veem a conta mestre, não o papel local da aba). Para devolver o token à IA, o mestre marca 🤖 no painel ⚙️ do tempo real, como faz com qualquer personagem.
- **Luta como um PJ, da própria aba diretor**: ataques e psi passam a ser aceitos de quem é o dono do token diretor (`assumir`/`assumirPsi` sem exigir mestre local), com a mesma recarga por personagem. A barra de recarga ⚡ mostra "✅ pronto / recarregando" para ele, e as escolhas de **acerto crítico/especial** e o **teste de consciência** aparecem na aba diretor.
- **Fora de combate** continua como no v206 (exploração com visão de jogador); **combate por turnos continua sendo conduzido na janela do mestre** e não pode estar ativo junto com o tempo real (regra antiga, inalterada).
- Fluxo para o mestre: liga o ⚡ tempo real na janela de mestre → luta livre na aba diretor (move, ataca, usa psi) → pausa/encerra pelo mestre quando quiser.

`mesa-tempo-real.js?v=207`, `app.js 46.207-v207-mesa`. Teste `tests/v207-diretor-tempo-real.test.mjs` (5 testes). Regexes de `?v=` dos testes v111/v113 relaxadas.

Verificação: 637/637 testes, v190/v191/v196 browser ok, hosting ok.

## v206 — modo diretor: o mestre joga como um PJ/NPC/criatura numa aba separada (2026-10-18)

Pedido do Yuri: "uma aba separada faz eu atuar como um jogador que acompanhe eles, reservando a janela do mestre para coisas importantes de controle e criação". A base já existia (v138, `?verComo=jogador` com o Kael Teste) — o v206 generaliza:

- **Botão 🎬 "Modo diretor"** (canto inferior esquerdo, acima do 🧪): abre um painel listando **todos os tokens do mapa atual** (PJs, NPCs, criaturas, drones). Escolha um e clique "Abrir aba ▶" — abre uma nova aba atuando como aquele token.
- **Na aba diretor** a sessão vira de jogador de verdade (`role='jogador'`, `mestreReal`): sem barras de mestre, **névoa e escuridão (v204) aplicadas**, lanterna em cone funciona, câmera segue o token. O ator efetivo (`labAtorEfetivoE6_`) é sempre o token escolhido, e o controle dele é liberado **fora de combate**.
- **Combate não muda**: os turnos continuam sendo conduzidos na janela do mestre (o diretor assiste). Ficha: se o token escolhido for uma ficha que o mestre possui, ela vira a ativa (perícias etc.); NPC/criatura jogam sem ficha de perícias.
- **Faixa identificadora** no topo da aba diretor mostra quem você está atuando, com botão "↩ Voltar a ser mestre". "↺ Recomeçar no Espaço-porto" só aparece no modo Kael Teste.
- O botão 🧪 antigo (Kael Teste, tudo em 50%) continua igual.
- URL direta: `?verComo=<id do token>` (qualquer token do mapa).

`app.js 46.206-v206-mesa`, `mesa-vespera.js?v=206`. Teste `tests/v206-modo-diretor.test.mjs` (5 testes). Regex de cache do v205 relaxada.

Verificação: 632/632 testes, v190/v191/v196 browser ok, hosting ok.

## v205 — autonomia por facção: neutros vivem no território (2026-10-18)

O bloco de autonomia de NPCs aprovado pelo Yuri. Guardas patrulham, aldeões/comerciantes seguem rotina e companheiros seguem o líder **já existiam** (v137 vida no mapa, v127 companheiros) — o que faltava era o comportamento de **neutros**:

- **Neutros (`papelComFaccao`)**: criatura/NPC com facção **Neutros** agora tem vida própria coerente — fica no território (papel `neutro`: deambula devagar num raio de ~2,5 m ao redor de casa, `VELOCIDADE.neutro`), em vez de vagar/caar como inimigo. `parado` (sésseis) e `montaria` continuam como antes, mesmo neutros.
- **Só reagem se atacados**: neutro ferido (`fracaoVida < 100%`) passa a **fugir dos jogadores** por perto (papel `foge`, velocidade de fuga). Em combate em tempo real o revide já existia (neutro atacado virava 'selvagens'); agora a reação existe também fora de combate.
- **Ecologia respeita a facção**: predadores não caçam presas neutras e presas não fogem de predadores neutros.
- **Fonte da facção**: o mapa de facções do estado de tempo real (`combatesAtivos/mesaTempoReal`), que persiste fora do combate — mesma fonte do painel de facções do mestre. Sem registro, tudo continua como era (criatura = inimiga).
- Em combate nada muda: os turnos continuam sendo do mestre.

`mesa-vida.js?v=205` (importa `faccaoDe`/`fracaoVida` da IA), `app.js 46.205-v205-mesa`. Teste `tests/v205-autonomia-faccao.test.mjs` (5 testes). Regexes de cache do v137/v204 relaxadas para não travar no bump.

Verificação: 627/627 testes, v190/v191/v196 browser ok, hosting ok.

## v204 — iluminação por níveis: penumbra e escuro (2026-10-18)

O botão 🌫️ do mestre deixou de ser liga/desliga e virou um ciclo de iluminação do mapa:

- **Ciclo**: claro → 🌃 Penumbra → 🌑 Escuro → claro. Penumbra e escuro ligam a névoa de guerra (v145) com alcances de visão menores: **penumbra ~10 m**, **escuro ~5 m** (sem lanterna). No claro, tudo como antes (16 m).
- **Lanterna em cone (v202) é a resposta ao escuro**: com fonte de luz equipada/no bolso, o cone projeta **pelo menos 12 m** na direção que o personagem olha, mesmo em mapa escuro. Fora do cone continua valendo a luz de proximidade (2 m no escuro, 3 m na penumbra).
- **Padrão por mapa**: o novo campo `luzV204` do mapa ('penumbra'/'escuro'/'claro') define a iluminação inicial; `nevoaV145` antigo equivale a 'penumbra'. A escolha do mestre pelo botão (salva por mapa em `combatesAtivos/mesaNevoa`) sempre sobrepõe o campo. Chaves booleanas antigas (`true`) viram 'penumbra' — compatibilidade total com o v145.
- `mesa-nevoa.js?v=204` (novo `paramsLuz(modo)`, `modoLuz()`), `app.js 46.204-v204-mesa`.
- Teste unitário `tests/v204-iluminacao.test.mjs` (6 testes: params por nível, alcance em penumbra/escuro, cone mínimo de 12 m no escuro, wiring e ciclo). Regex do `?v=` do v202 atualizado para 204.

Verificação: 622/622 testes, v190/v191/v196 browser ok, hosting ok.

## v203 — zona morta de clique no editor da mesa (2026-10-18)

Reclamação do Yuri: "só de clicar no mapa eu movo estruturas" — e de fato: o `pointerup` do editor (`nova-editor.js`) comitava o arrasto com QUALquer `dx`/`dy` diferente de zero; um clique com 1 px de tremor de mouse já persistia a "movimentação" da estrutura no Firestore (e de tokens/NPCs também, pelo mesmo caminho).

- **Zona morta**: clique em objeto/elemento nativo/token só comita se o arrasto passar de ~0,06 unidades (~6 cm no mapa). Abaixo disso é clique puro: seleciona e devolve o elemento à posição visual original. Arrasto de verdade continua igual.
- `nova-editor.js?v=203` (importado por `nova-direta.js`).
- Teste de regressão `tests/v203-clique-zona-morta.test.mjs` (limiar, restauração visual, ordem antes do commit, arrasto real preservado).
- De quebra: o teste de browser v191 tinha uma corrida pré-existente (lia a opacidade da cena de viagem no meio do fade CSS); agora espera a opacidade chegar a 1 — estável em 3×.
- **Sobre NPCs autônomos por padrão**: a IA de tempo real (`mesa-tempo-real-ia.js`) e as rotinas de vida (`mesa-vida.js`, guardas, comerciantes) já existem; tornar a autonomia o padrão para toda criatura/NPC é mudança de design maior — próxima etapa.

`app.js 46.203-v203`. Verificação: 616/616 testes, v190/v191 (3×)/v196 browser ok, hosting ok.

## Companheiros de teste: já existia (v127) (2026-10-18)

Pedido do Yuri: escolher qualquer NPC/criatura/drone para acompanhar o grupo nos testes.

- **Descoberta**: o módulo `mesa-companheiros.js` (v127) já faz exatamente isso — e o painel do mestre **🐾 Companheiros** já tem "＋ Seguir" (escolhe o token que segue e o líder). O seguidor anda atrás do líder **desviando de paredes** (pathfinding real), troca de mapa junto e foge do perigo se for não-combatente.
- **Uso**: coloque o NPC/criatura no mapa pela barra do mestre → botão 🐾 Companheiros (topo, mostra a contagem) → ＋ Seguir → escolha "quem segue" e "quem lidera" (ex.: o Kael Teste). O vínculo também pode ser automático pelo nome ("Galinha do Sérgio") ou pela lista de companheiros da ficha.
- Incidente de desenvolvimento: uma primeira versão nova do módulo sobrescreveu o arquivo do v127; os testes v127/v143 pegaram na hora e o arquivo foi restaurado intacto da pasta do projeto. Nenhuma mudança de comportamento foi publicada nesta versão — só a constatação acima.

## v202 — lanterna em cone na névoa (2026-10-18)

Pedido do Yuri: lanterna projeta luz em cone (luz não ultrapassa parede etc.). O facing do personagem **já existia** (v120+: arrasta a bolinha dourada no token ou anda; fica salvo em `facing` radianos); o motor de névoa é raycasting. Faltava ligar os dois.

- **`poligonoVisao(grade,p,alcance,raios,direcao,arco,perto)`** (`mesa-nevoa.js`): com `direcao`, raios dentro do arco (~76°) vão até o alcance normal (16 m); fora do arco só até 3 m (luz de proximidade). Sem `direcao`, círculo inteiro como antes.
- **`temLanterna(ficha)`**: fonte de luz em `equipado`/`bolso` (lanterna, tocha, tocheira, farol, holofote, lâmpada) ativa o cone; mochila guardada não ilumina.
- **Wiring**: a névoa recebeu `fichaDe` no dep; `js/app/22` liga `userCharacters` e resolve id do token (raw/decodificado). `mesa-nevoa.js?v=202`.
- Teste unitário `tests/v202-lanterna-cone.test.mjs` (o módulo é puro, importa direto no node): cone longo à frente / só proximidade atrás / parede barra o cone / lanterna detectada nos compartimentos certos. Regex do teste v145 relaxada (`?v=\d+`), senão "202" quebraria o padrão `1[4-9][0-9]`.

`app.js 46.202-v202`. Verificação: 612/612 testes (2× estável), v190/v191/v196 browser ok, hosting ok.

## v201 — portas do kit são portas de verdade (2026-10-18)

Pedido do Yuri: fazer as portas das salas prontas do kit abrirem/fecharem como as portas-objeto do Núcleo v196.

- **Descoberta do probe (pipeline completo no browser)**: a cadeia já funcionava quase toda — `parede_porta` do kit vira um objeto `Porta` na cena, o engine detecta pelo nome, abre/fecha na hora (v192), trancada exige teste de Segurança/Mecanismos/Força Bruta e sobrevive ao roundtrip Oficina→Mesa→Oficina. A janela (`parede_janela`) bloqueia movimento sem bloquear visão e não é interativa.
- **Correção real**: `prepararPublicacaoOficina` e `estadoOficinaMesa` (`nova-oficina.js`) não levavam `bloqueiaVisao` do elemento para o objeto publicado — paredes/portas do kit não barrariam a luz/névoa (o motor de visão lê `o.bloqueVisao===true` em `mesa-nevoa.js`). Agora levam; `nova-oficina.js?v=201` (bump nos 5 consumidores vivos).
- Handle de teste novo `window.gm2State_=()=>gm2.st` no app/17 (o probe publica pelo caminho real com `prepararPublicacaoOficina`). Probe `probe-v201-portas.cjs` (fora do repo): coloca peça → publica → abre/fecha/tranca/destranca com teste → roundtrip. Teste de regressão `tests/v201-portas-kit.test.mjs`.
- **Limitação que deixou de existir**: a ressalva das portas visuais do v200 está resolvida — portas do kit têm PV (125 em material padrão), abrem, fecham, trancam e arrombam pelo engine normal.

`app.js 46.201-v201`. Verificação: 605/605 testes, v190/v191/v196 browser ok, hosting ok.

## v200 — kit do mestre: peças de construção como carimbos (2026-10-18)

Pedido do Yuri: começar a melhorar o jogo no sentido de MMO para o grupo, com o mestre montando cenário — as peças encaixáveis de `mesa-construcao.js` (que o gerador já usava internamente) agora são colocáveis à mão.

- **Onde**: Oficina 2 → ferramenta pincel → Carimbo → grupo **🔨 Construção**. Um clique no mapa coloca a peça encaixada na célula mais próxima.
- **15 peças**: paredes (reta, com porta 🚪, com janela, vão/passagem, mureta, diagonal, curva), chãos (quadrado, redondo), teto, escada e quatro salas prontas (casa pequena, casa média, galpão, torre redonda, casa losango).
- **Salas prontas** saem completas: piso + telhado com `grupoTetoV177` (some quando alguém entra) + paredes com **colisão e PV reais** (vêm de `montarPeca`, mesma função do gerador). A casa pequena gera 20 formas (4 pisos, 4 tetos, 12 paredes), a torre 37.
- **Giro** (0/90/180/270°) e **Material** (pedra-rio, tijolo, metal enferrujado, metal futurista, madeira) escolhidos ao lado do carimbo; a cor/PV/dureza das paredes seguem o material.
- **Blocos invisíveis de colisão** (diagonais, curvas, torre) passam a ser preservados invisíveis na Oficina 2 — antes viriam pretos opacos (`fillOpacity=0` no converter).
- Conversão peça→forma em `gm2pecaParaFormas_` (centro normalizado 0–28 → metros reais do mapa) e colocação em `gm2createPecaDrag`, gancho no `gm2drawPath` para carimbos `peca:*`. Módulo carregado por import dinâmico (`./mesa-construcao.js?v=190`).
- Handle de teste `window.gm2PecaColocar_` + probe de browser `probe-kit-mestre.cjs` (fora do repo de testes). Teste de regressão novo `tests/v200-kit-mestre.test.mjs`.
- **Limitação honesta**: as portas/janelas das salas prontas são formas visuais com PV — ainda não abrem/fecham como as portas-objeto do Núcleo v196 (fazer o v201+ unificar isso).

`app.js 46.200-v200` (regex dos testes de cache relaxado para `46.\d+-v\d+`, senão "200" quebraria o padrão `1\d\d`). Verificação: 601/601 testes, v190/v191/v196 browser ok, hosting ok.

## v199 — imagem importada como FUNDO do mapa (2026-10-18)

Pedido do Yuri: preparar o jogo para importar imagens e usá-las na construção de mapas (estilo battlemap dos geradores profissionais), lembrando que já existiam rochas/árvores (carimbos).

- **O que já existia e continua valendo**: 🖼️ Importar (imagem vira elemento posicionável/redimensionável, também por Ctrl+V) e **Carimbos** (montanha, árvore, rocha, casa, ruína) na ferramenta pincel da Oficina.
- **Novo — imagem de FUNDO do mapa**: botão 🏞️ na Oficina 2, ao lado da cor de fundo. A imagem (comprimida para webp ≤ 2000 px) vira o chão do mapa inteiro — renderizada no editor, no tabuleiro da Mesa e no mapa compartilhado (todas as vias passam por `gm2staticMesaSvg_`), com `preserveAspectRatio slice`. No salvamento por referência, a data URL sobe para o Firebase Storage (`mapas/<uid>/<mapa>/…`) e o documento do mapa ganha o campo `fundoImagem` (a cena não incha). Publicar na Mesa leva o campo no `labEstado_`.
- **Cenário de uso**: baixar/gerar um battlemap pronto, 🏞️ na Oficina, ajustar tamanho do mapa ao da imagem, desenhar paredes/portas por cima com as ferramentas normais → masmorra profissional com a mecânica do jogo (luz, névoa, colisão, portas).
- Teste de regressão novo `tests/v199-imagem-fundo.test.mjs` (estado, render nos dois caminhos, upload, `fundoImagem`, UI) e probe de render (`probe-bgimage.cjs`, fora do repo de testes).

`app.js 46.199-v199`. Verificação: 598/598 testes, v190/v191/v196 browser ok, hosting ok.

**Kit do mestre (próximo bloco → entregue em v200)**: peças encaixáveis de construção (`mesa-construcao.js`) expostas na UI como carimbos de sala (o gerador já usa `montarPeca` internamente).

---

## v197 — motor de realismo no pintor (2026-10-18)

Resposta direta ao Yuri: o mapa ainda parecia o do Claude porque **o pintor do motor é o mesmo** — padrões vetoriais planos. A v196 mudou a planta e o conteúdo, mas a gramática visual era a herdada. A v197 muda o pintor em si (`formaRealista`, `js/mesa-mapa-arte.js`):

- **Sombras suaves**: as sombras de parede (contato + projetada no piso) passam por `feGaussianBlur` em vez de cópias pretas duras.
- **Volume de luz**: gradiente diagonal (claro em NW → escuro em SE) sobre cada forma pintada.
- **Grão de textura**: `feTurbulence` (ruído fractal) por cima do material — pisos e paredes saem do visual "vetor plano" sem mudar um byte dos dados dos mapas.

**Rochas orgânicas (v197b)**: as rochas da caverna eram elipses marrons ("pareciam pizzas") — agora são **polígonos irregulares de 8–12 vértices com jitter**, em duas camadas (base escura maior deslocada para SE + topo com tom de pedra), desenhados pelo novo tipo de forma `poligono` (campo `pontos` em metros) adicionado ao renderizador `gm2shapeInner` (app/17). O pintor aplica material, grão e relevo nelas como nas outras formas.

**Teste funcional novo**: `tests/v196-browser.cjs` — monta o módulo real de posições com a cena do Núcleo e prova: Kael anda nas Docas, a parede de blindagem o segura, **porta fechada bloqueia** passagem, trecho sem porta libera; e os dados da cena (6 armadilhas, 2 portas trancadas — reator e contenção —, 12 criaturas com facção incluindo neutros, telhado do chefe).

Módulos em `?v=197` (`mesa-mapa-arte`, `mesa-gerador-mapas`, `mesa-masmorra`); `app.js 46.198-v198`. Verificação: 596/596 testes, v190/v191/v196 browser ok, hosting ok, prévia conferida em 1280 px sem erro de console.

**Ferramentas de edição novas para o mestre** (proposta, ainda não implementada): pincel de terreno (retinta piso/parede em mapa existente), carimbo de luzes/escuridão, e "kit de construção" de masmorra (peças encaixáveis já existem em `mesa-construcao.js` — dá para expor no menu do mestre). Escopo grande; merece entrega própria.

---

## v196 — mapa novo autoral: Núcleo Subterrâneo (2026-10-18)

Pedido do Yuri: tirar a **grade de batalha** e a **"aura"** em volta de tokens/itens/criaturas, e gerar um **mapa de masmorra novo do zero** (sem herdar a planta do Claude), retrô-futurista (No Man's Sky / Fallout / Ultima Online), realista, visto de cima — e funcional.

- **Grade de batalha removida**: a masmorra e o mapa novo salvam `showGrid:false` (`gradeVisivel:false`) — o mapa fica limpo, com a textura do piso dando a régua visual.
- **"Aura" removida** (`js/app/06-batalha.js`): o anel azul-ciano fixo em volta de todo token virou contorno discreto escuro (`2px solid rgba(9,12,20,.55)`) + sombra de contato. Anéis de turno/alvo/seleção continuam existindo (só aparecem quando relevantes).
- **Mapa novo: "Núcleo Subterrâneo v196"** (`js/mesa-masmorra.js`, `gerarComplexo196`): complexo de 60×36 m com **7 salas** (Docas de pouso, Laboratório, Sala do reator, Cantina, Depósito, Arquivo morto, Contenção), caverna natural com **fosso** e passarela de metal, e **8 portas** — a *Porta do reator* e a *Porta da contenção* vêm **trancadas** (abrem só com teste ou por força). Publicado como **mapa separado** (não toca a Masmorra de treino); `instalarMasmorra` publica sozinho uma vez (marca `configuracoes/mapa196Publicado`) e o painel 🏰 mostra o status.
  - **Funcional de verdade**: paredes bloqueiam movimento e visão; **6 armadilhas** (estacas/lâminas, uma liberta a jaula); **jaula de contenção** com alavanca emperrada no Depósito; **2 escadas**; baús/cofres; 12 criaturas com **facção** (inimigas atacam, neutras só revidam se atacadas — comportamento nativo do motor, aqui usado de propósito); a **sala do chefe fica escondida sob telhado** (só aparece quando alguém entra); **escuridão + névoa ligadas** no mapa (doc `mesaVisual`), com luz das arandelas, do núcleo do reator e dos cristais — e luz não atravessa parede.
  - **Materiais novos** (`js/mesa-mapa-arte.js`): `blindagem` (parede: placas com rebites + marca de alerta) e `painel` (piso: placas de deck com emenda luminosa ciano). Paredes com espessura, relevo e sombra projetada; fosso com sombra de borda nos 4 lados; caverna com chão de terra, rochas e musgo; manchas de óleo/sangue; luzes em poça (arandelas quentes, núcleo ciano, cristais azuis).
  - Cena sem Banco: **644.709 bytes** (limite 650.000); 385 objetos normalizam sem erro; planta validada por flood fill (7 salas alcançáveis da entrada).
- **Correção na prévia local**: as prévias `previa-v*.cjs` precisam de `window.hidratarReferenciasOficina` (export de `nova-oficina.js`) — sem ela todo objeto da Oficina caía no "fallback visual" e a arte do mapa sumia. Não era bug do site (lá todos os módulos carregam), só do harness de prévia.
- **Telhado da contenção**: `matDe('metal')` caía no fallback azul-claro (`metal-limpo`); trocado para `metal-ferrugem`, que ainda por cima tem textura própria em `arte/materiais/`.

Verificação: `node scripts/preparar-hosting.cjs`, `node --test tests/*.test.mjs` (596 passam), `node tests/v191-browser.cjs`, `node tests/v190-browser.cjs`; prévias renderizadas conferidas em 1280 px e 390 px sem erro de console.

Limitação honesta: a **lanterna é luz radial** (raio de metros ao redor do personagem), não um cone direcional — cone de luz seria mecânica nova, ficou fora desta entrega.

Publicar: `npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar`

---

## v195 — repintura da masmorra no estilo da referência (2026-10-18)

Inspirada diretamente na imagem de referência enviada pelo Yuri (battlemap clássico: salas de lajota claras, paredes grossas de pedra clara com sombra, abismo central escuro com bordas irregulares, vinheta nas bordas):

- **Fundo** (`mesa-mapa-arte.js`, textura `masmorra`): quase preto, com **vinheta baked-in** (radial que escurece as bordas do mapa) e manchas quentes sutis.
- **Pisos**: material `lajota` repintado — padrão de 4×4 lajotas com **variação de tom por tile** e rejunte escuro + fio de luz; preenchimentos mais quentes (`#7d7462` salas, `#6b6355` corredores). **Grade métrica desligada** (`showGrid:false`) — o rejunte das lajotas vira o grid visual, como na referência.
- **Paredes** (`mesa-masmorra.js` + `formaRealista`): pedra mais clara (`#b5b1a4`), padrão de pedra com pedras maiores e mais claras, **sombra projetada no piso** (forma fina que bloqueia ganha uma segunda sombra mais larga), relevo reforçado.
- **Caverna e abismo**: chão da caverna bem mais escuro (`#1d1a16`), rochas da borda mais escuras com relevo mais forte.
- **Luzes**: poças de luz das arandelas/braziers/cristal mais discretas (.08–.14) para não parecerem manchas planas.
- **Grade do app** suavizada (`#2c2823`) para quando estiver ligada em outros mapas.
- **Regeneração**: marca `configuracoes/masmorraV184` com `versao<195` **refaz a Masmorra de treino sozinha uma vez**; a prévia `configuracoes/masmorraV194Previa` com `versao<195` **recria o mapa "Masmorra v194 (arte nova)"** com a arte nova (o id do mapa não muda — ele é atualizado no lugar). Módulos em `?v=195/197`.
- **Correção de bug antigo (salvar mapa grande)**: o plano B do `salvar` de mapas ("cena grande demais; salvando só o desenho") quebrava sempre com `map803EstadoSlim_ is not defined`. Causa: `js/app/17-oficina2-texturas-referencias.js` inteiro vive dentro de uma IIFE, então `map803EstadoSlim_`, `map803LegacyRefs_` e `MAP803_REF_VERSION_` não existiam fora dela — e `app.js` é `<script type="module">`, onde nome bare não enxerga `window`. Mapas pequenos salvam pela cena completa, então o plano B nunca era usado e o bug ficou escondido; a prévia (cena ~646 KB, no limite) foi a primeira a cair nele. Correção: o arquivo 17 exporta as três funções para `window` e o `salvar` (js/app/22) passa a chamá-las como `window.*`. Mesmo padrão existe em `labSalvarCenaLiveE8_` (js/app/20, "Mesa ao vivo"), que além disso depende do `gm2` também privado — é legado sem uso confirmado; reportado ao Yuri, propositalmente não mexido.
- Ferramenta nova de trabalho (não vai pro site): `previa-v195.cjs` renderiza a masmorra **pelo mesmo caminho de arte do site** (inclui `instalarArteMapa`, que a prévia v193 não instalava — por isso a prévia antiga mostrava tijolo cinza no fundo, artefato do harness).

Verificação: `node scripts/preparar-hosting.cjs`, `node --test tests/*.test.mjs` (596 passam), `node tests/v191-browser.cjs`, `node tests/v190-browser.cjs`; prévias renderizadas conferidas em 1280 px e 390 px sem erro de console.

Publicar: `npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar`

---

## v194 — entrega original (arte, animações, temas, regeneração)

Foco só em estética e animação; a lógica do jogo não mudou. Backup antes de editar: `_entregas/backup-antes-v193.tgz`.

- **Mapas** (`js/mesa-mapa-arte.js`, `js/mesa-masmorra.js`):
  - Piso com textura: materiais repintados (pedra com blocos e luz de topo, lajota com rejunte claro, rocha com fissuras, madeira, água, metal, trilha, piso escuro, grama) e **nova textura `masmorra`** (rocha escura com manchas e pedrinhas) — vira opção no seletor do 🎨 Visual e é a base da masmorra de treino.
  - Paredes com espessura e relevo: `formaRealista` agora desenha face clara para noroeste e sombra para sudeste (a rocha também ganha relevo). Mesmos ids de padrão (`mv110-*`), nada muda nos dados salvos.
  - Masmorra repintada inspirada no mapa de referência: pisos de lajota em tom quente (`#6e685a`), corredores `#5b564a`, caverna bem escura (`#2e2b26`), desgaste mais discreto.
  - Luzes: poças de luz quente das arandelas e braseiros; **luz azulada (`#8fd0ff`) no altar** (arandelas da sala + poça fixa "Luz do cristal" junto ao cristal azul). Manchas de sangue na cripta, musgo e poças escolhidos por rng determinístico.
  - Cena sem Banco: 645.855 bytes (limite 650.000).
- **Miniaturas de personagens/criaturas** (`js/mesa-miniaturas.js`): contorno fixo `#15110d` (o mesmo dos itens, no lugar do contorno derivado da cor), sombra mais nítida (desvio 2.2, opacidade .42) e traço de contorno um pouco mais forte.
- **Animações de combate e deslocamento** (`js/mesa-efeitos.js`):
  - **Golpe**: o atacante investe na direção do alvo; **impacto**: o alvo estremece com clarão; **recuo**: dano ≥ 8 empurra o alvo para longe; **esquiva**: ataque que falha faz o alvo se esquivar para o lado.
  - **Passos**: quem se desloca no mapa balança a miniatura enquanto anda (detecção por posição, com intervalo mínimo por token).
  - Tudo respeita `prefers-reduced-motion` (sistema ou navegador em "reduzir movimento" desliga as animações).
- **Temas** (`index.html`): Retrô-futurista ganhou cores mais vivas e leitura melhor do texto (texto secundário `#cdbdf0`, linhas douradas mais presentes, brilho rosa nos secundários/hover, placeholder legível, subtítulos com brilho dourado). Modo Tático: contraste de texto e linhas levemente elevados. Clássico inalterado.
- **Miniaturas de itens** (`js/mesa-itens-mini.js`): desenhos principais refinados com sombreamento e detalhes a mais (cano e empunhadura das armas, reflexo nas lâminas, respiro no sabre de energia, tela e antena do comunicador, alças e presilha da mochila, vagões/ventoinha no gerador, cinta da caixa, vapor no café, raios de luz na lanterna etc.). Mesmos tipos (`TIPOS_MINI`), mesmo contorno `#15110d`, mesma sombra.

Verificação: `node scripts/preparar-hosting.cjs`, `node --test tests/*.test.mjs` (596 passam), `node tests/v191-browser.cjs`, `node tests/v190-browser.cjs`; conferido em 1280 px e 390 px sem erro de console e sem rolagem lateral (prévias renderizadas conferidas nesta revisão).

- **Regeneração**: a masmorra salva no Firebase é gerada uma vez só; quem já tinha o mapa antigo continuava vendo ele. Agora a marca `configuracoes/masmorraV184` com versão < 194 **refaz a masmorra sozinha uma vez** (mesmo esquema da v191), com toast avisando; o mestre também pode refazer quando quiser em 🏰 → ↺ Reiniciar a masmorra.
- **Mapa separado de comparação**: o mestre ganha automaticamente (uma vez, marca `configuracoes/masmorraV194Previa`) o mapa **"Masmorra v194 (arte nova)"** na lista de Mapas — dá para comparar lado a lado com a de treino e apagar se não quiser manter. Se a publicação falhar (rede, Firestore fora do ar), a marca fica com `erro` e a próxima visita **tenta de novo** em vez de desistir para sempre. O módulo subiu para `?v=196` e agora mostra o **status da prévia na tela** (sem precisar de console): aviso 🗺️ em cada etapa, a dica do botão 🏰 passa a trazer o status e o painel do 🏰 ganha uma linha "Prévia v194: …" com o resultado exato (ok / criando… / falhou: <motivo>).
- **Correção de bug antigo (salvar mapa grande)**: o plano B do `salvar` de mapas ("cena grande demais; salvando só o desenho") quebrava sempre com `map803EstadoSlim_ is not defined`. Causa: `js/app/17-oficina2-texturas-referencias.js` inteiro vive dentro de uma IIFE, então `map803EstadoSlim_`, `map803LegacyRefs_` e `MAP803_REF_VERSION_` não existiam fora dela — e `app.js` é `<script type="module">`, onde nome bare não enxerga `window`. Como mapas pequenos salvam pela cena completa, o plano B nunca era usado e o bug ficou escondido; a prévia v194 (cena ~646 KB, no limite) foi a primeira a cair nele. Correção: o arquivo 17 exporta as três funções para `window` e o `salvar` (js/app/22) passa a chamá-las como `window.*`. Mesmo padrão de bug existe em `labSalvarCenaLiveE8_` (js/app/20, "Mesa ao vivo"), que além disso depende do `gm2` também privado — reportado ao Yuri, ainda não mexido de propósito.
- **Cache de versão**: os módulos são carregados com `?v=` fixo na URL (`mesa-mapa-arte ?v=110`, `mesa-masmorra ?v=184`, `mesa-efeitos ?v=132`, `mesa-itens-mini ?v=192`, `mesa-miniaturas ?v=108/117`, `app.js ?v=46.171…`). Quem já tinha aberto o site recebia os arquivos **antigos do cache** mesmo depois do deploy. Todos subiram para `?v=194` (e `app.js` para `?v=46.194-v194-mesa`) — a partir de agora, a cada atualização é preciso subir esse número junto. (As partes de `js/app/` não precisam: o build já gera endereço novo por conteúdo, `?h=`.)

Publicar: `npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar`
