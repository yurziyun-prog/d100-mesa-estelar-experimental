# Atualização 205 — escala, espaço, subsolo, luz, água, lava e ecossistema (3ª etapa do mapa de testes)

Guia seguido: `instrucoes-claude-ambientes-transicoes.md`. Tudo vale para o mapa **🌿 Ecossistema (teste)**; os padrões globais das espécies não mudaram.
**Quem aplica no mapa SALVO é o Yuri** (🛠️ Reformar mapa de teste, versão 3; faz backup antes em `backupsMapa`). Publicar o site sozinho **não** atualiza mapas salvos.

## O que mudou
1. **Escala física**: cada atlas mede o que mede no mundo (`js/mesa-escala-fisica.js`, gerado por `scripts/escala-fisica.cjs`); colisão separada da pegada visual. Medidas marcadas **P** são propostas.
2. **Sem discos/auras** atrás das miniaturas (origem: sombra redonda e fundo azul do token).
3. **Giros indevidos**: o movimento vem da posição lógica, não do retângulo da tela.
4. **Espaço**: altitude dos pés × altura do corpo (`js/mesa-espaco.js`): voador alto passa por cima; ordem de desenho por altitude.
5. **Interações sem balões**: clique no objeto, F e controle agem; escada/rampa começam ao andar para dentro.
6. **Cachoeira animada** (`js/mesa-cachoeira.js`); peça Blender só com o leito.
7. **Cavernas cobertas** (teto de rocha, abre só para quem está dentro, no mesmo nível, nesta sessão) e **subsolo real** (nível 9, −3 m, alçapão e rampa da boca, volta).
8. **Escuridão** (`js/mesa-escuridao.js`): subsolo preto; lanterna/tocha/espada de energia empunhadas e lâmpadas acesas iluminam; luz cortada por paredes e rocha.
9. **Água visual** (`js/mesa-agua-visual.js`): sem rolagem, dano ou afogamento.
10. **Lava** (`js/mesa-lava.js` + `mesa-masmorra.js`): queimadura por contato (mestre online, 1×/3 s), núcleo, calor da borda, ponte firme, voo alto isento.
11. **Ecossistema** (`js/mesa-nichos.js`): habitat gravado no token, sede e água, atividades visíveis, diagnóstico do mestre.
12. **Identidade das espécies**: insetoides (bípedes de 4 braços) × artrópodes alienígenas; nomes de exibição sem mudar IDs (`js/mesa-especies-mapa.js`).
13. Regras do Firestore: campo `habitatV205` (mapa) permitido nas posições. Backup: `arte-fonte/backup-catalogo/firestore.rules.pre-v205`.

## Como publicar (Yuri)
```powershell
cd "C:\Users\yurzi\Documents\Codex\2026-09-09\referenced-chatgpt-conversation-this-is-an\work\mesa-sync"; npx firebase-tools deploy --only firestore:rules,hosting --project d100-mesa-estelar
```
(site **e** regras: a regra de `habitatV205` precisa estar publicada antes de aplicar a reforma, ou a gravação do habitat é recusada).

## Como testar
Mestre → abrir o mapa de teste → 🛠️ **Reformar mapa de teste** → inventário → aplicar (backup automático). Depois, como jogador: andar para o alçapão ao lado da trilha da caverna; dentro do subsolo, tudo é preto fora da abertura — equipe uma lanterna/tocha. A lava fica a sudeste (ponte de crosta firme cruza o lado sul).

## O que foi provado e o que não foi
Ver `docs/pendencias-mapa-testes.md` e `docs/dificuldades-para-gpt.md`. Resumo honesto: tudo passou em **harness local** (papel de jogador e mestre SIMULADOS, Firestore falso); **não** houve sessão autenticada, duas sessões independentes, ataque/equipar pela ficha real nem controle físico.

## Adendo — revisão água e criaturas (24/10/2026)
- **Água integrada**: `js/mesa-agua-ambiente.js` (superfície ambiente: lagoa ondula sozinha, canal corre a jusante, anéis na foz, tudo recortado pelas poças salvas, relógio compartilhado com `mesa-cachoeira.js`). Gerador: riacho desce até dentro da lagoa, sem areia no canal, poças de água sem contorno (sem linha na foz), fluxo marcado em `fluxoV205`. Cores da queda ajustadas ao canal; bordas orgânicas.
- **Galeria de espécies**: `docs/galeria-criaturas.html/.png` (revisão, mesma escala) e `docs/galeria-mapa/` (26 de 27 espécies NO mapa: parado, andando, atacando, morta). `cao_de_sucata` sem token (bestiário local).
- **Arte aprovada** do dragão-trombeta corredor preservada por teste (`tests/v205-arte-aprovada.test.mjs`).
- **Pendências reais**: `docs/NAO-VALIDADO.md`.
- **Depois de publicar**: reaplicar a reforma (versão 3) no mapa salvo para ganhar o canal/lagoa novos (os mapas salvos não mudam sozinhos).
- **Transições orgânicas** (`js/nova-direta.js`, `suavizacaoV205`): grama, areia, terra, pântano e todas as águas esmaecem para dentro da própria borda (água funda 1,3 m e um pouco mais transparente, rasa/lagoa 0,7 m, grama 0,9 m, areia 0,7 m…); rocha e lava ficam nítidas. Vale para QUALQUER mapa com esses terrenos (é só desenho; não muda dados). Fotos: `docs/antes-depois/terreno-depois-*.png`.
- **Margem da lagoa**: areia sempre (sem terra marrom encostada), areia molhada em volta, pedras do Blender nos barrancos do canal, vitórias-régias, juncos e pedras (`sl_lirio_agua`, `sl_junco_agua`, `sl_pedra_margem_a/b`). Tons de água ajustados à referência do Yuri (teal profundo e dessaturado).
- **Nado**: água funda → miniatura boia e bate braços (a animação continua); qualquer água → ondulação ao andar; pântano é lama (vadear).
- **🧪 Testar o mapa com um personagem**: botão do Diretor (`js/mesa-teste-personagem.js`); guia em `docs/COMO-TESTAR-O-MAPA.md`.

## Adendo — cursor, Kael, névoa automática, topo de caverna (24/10/2026, noite)
- **Seta do mouse por modo** (`js/mesa-cursor-modos.js`): ✋ câmera, ✥ mover peças, ✛ construir, 🗑️ apagar, ⊕ colocar, 🖌️ pincel; etiqueta discreta com o modo. Só desenho.
- **Movimento "arrastando"** (hipótese confirmada em parte): a animação do boneco lia a posição SALVA (chega em blocos pela rede) enquanto o corpo se movia pela prévia local. Agora lê a posição mostrada (`tokenVisual`). No harness não aparece (Firestore instantâneo); com atraso simulado de 700 ms a animação segue o corpo. **Não** foi testado na rede real.
- **🧪 Testar o mapa**: "Trazer" um personagem que está em OUTRO mapa (ex.: Kael) para o mapa aberto e criar a saída 🚪➜ entre os dois mapas (`mesaLigacoes.ligar`). O mapa do personagem de teste do mestre abre por padrão (só se ninguém joga no mapa aberto).
- **Névoa automática** (`js/mesa-nevoa.js`, `js/mesa-visual.js`): só em lugar escuro, de noite ou com neblina; de dia em lugar claro NÃO existe. Escolhas antigas do botão 🌫️ são ignoradas (nova escolha vale como `{m,v:2}`; ciclo 🅰️ automático → claro → penumbra → escuro). Borda exata (bisseção na grade, 360 raios) e gradiente: sem luz fica um pouco escurecido em volta; com lanterna/tocha fica iluminado e esmaece no alcance. Em claro não há cone de visão (obstáculos que escondem o que está atrás: não implementado, só descrito).
- **Topo de caverna/gruta** (`reliefRochaV205`): massa de rocha com borda irregular, blocos facetados, rachaduras e musgo; continua abrindo para quem está dentro. Sombra das massas de rocha mais longa e suave. Grama em células de 1 m. Sombra das copas.
- **Reaplicar a reforma (🛠️)** no mapa salvo para receber topo de caverna, grama e sombras.
- Troncos, raízes e plantas aquáticas: removidos (arte reprovada) → `docs/PROBLEMAS-NAO-RESOLVIDOS.md`.

## Complemento (24/10): vegetação refeita no pântano e na lagoa
Troncos, raízes e plantas reprovados foram refeitos no Blender (`scripts/blender/vegetacao_pantano.py`: tronco quebrado semienterrado, raiz assimétrica, touceira de junco e planta de folhas largas sobrepostas) e voltaram ao Ecossistema em baixa densidade, só como desenho (sem bloqueio). Detalhes, imagens e pendências em `docs/PROBLEMAS-NAO-RESOLVIDOS.md`. Vale para mapas **gerados/reformados depois** desta versão (🛠️ Reformar mapa de teste).
**Publicar:** `npx firebase-tools deploy --only hosting --project d100-mesa-estelar`
Variantes (tronco curvo, bifurcado, oco e raiz em arco) também integradas no pântano e na lagoa.

## Adendo — duelo jogável (combate de ponta a ponta) — 24/10/2026
**Causa confirmada do "Enviando teste… e nada acontece"** (reproduzida no harness com ficha criada pela fábrica real):
1. **Sem combate por turnos e com o tempo real desligado**, o botão do painel (🎲 *Testar*) NÃO enviava ataque: caía no ramo `direct-test` (teste da perícia no próprio personagem). Por isso nada acontecia no alvo. Correção (`js/nova-painel.js`): com alvo + arma o botão vira **⚔️ Atacar** e envia o ataque sempre.
2. **O tempo real nunca ligava sozinho** (`js/nova-ataques.js`: o `iniciar()` estava depois de `ativo()&&(ativo()||iniciar())`, inalcançável). Agora o primeiro ataque liga o tempo real (só contra criaturas; objeto e psi seguem o fluxo antigo); a criatura reage sozinha.
3. **Caixa de "acerto especial/crítico" invisível**: ficava dentro do mapa grande (`position:absolute` no tabuleiro) e podia estar fora da tela, pausando o combate por 10 s. Agora é fixa no alto da tela (`js/mesa-tempo-real.js`).
4. **Mensagens úteis** (em vez de falhar calado): sem ficha carregada, sem controle do personagem, sem perícia de ataque, sem arma, sem munição (`0/50`), fora de alcance (`Fora de alcance: 5,1 m; alcance 1,8 m`), linha de tiro bloqueada, recarregando; e, após 7 s sem resposta, diz **por que** está esperando (escolha de acerto especial pendente / tempo real pausado / conta do mestre fechada). Avisos ficam 7 s por cima do último evento da mesa.

**⚔️ Duelo de treino** (🧪 no Diretor → `js/mesa-teste-personagem.js`): escolhe uma criatura (as que andam e atacam; "zumbi parado" só bate de perto), coloca perto do personagem de "Atuar como" (ou do Kael de teste), **🔄 Reiniciar** (restaura saúde/munição pelo 🔄 Restaurar da mesa, destrava o tempo real e devolve a ficha) e **🚪 Sair**. O motor grava ferimentos/Sorte/necessidades de um PERSONAGEM na própria ficha; por isso o duelo guarda uma cópia da ficha ao começar e **devolve esses campos** ao reiniciar/sair (testado; ver `NAO-VALIDADO.md` para o limite).

**Testes** (`tests/v205-duelo-browser.cjs`, `tests/_duelo-fixtura.cjs`; harness local, mestre simulado, Firestore falso): ficha por `window.novoPersonagem()`, itens do CSV por `normalizarLinhaImportacao_`, perícias/ataque/defesa/dano/tempo real REAIS. Cobre: sem alvo = teste; com alvo = ataque; sem munição; fora de alcance; duelo até vitória (personagem forte) e até derrota (`DERROTA=1`); criatura reage; ficha devolvida; reinício; novo ataque; sair.
Publicar: `npx firebase-tools deploy --only hosting --project d100-mesa-estelar` (nada de regras/funções).

## Adendo — miniaturas que faltavam e reserva de mapas (25/10/2026)
- **11 miniaturas novas** (as únicas do bestiário `dados/banco_criaturas_2026-09-26.csv` sem arte de cima): `criatura1`–`criatura7` e `metamorfo1`–`metamorfo4`. O bestiário não descreve essas criaturas (nome = id, sem espécie nem medida): as receitas em `scripts/blender/receitas_mapa.json` são **propostas** (canino, felino, inseto, aracnídeo, primata, larva, alado; amorfo roxo, amorfo lamacento, humanoide pálido, serpente) e as medidas em `scripts/escala-fisica.cjs` são **P** (propostas). O Yuri troca receita/medida quando definir cada criatura. Folha: `docs/galeria-11-novas.png`. As 5 ações (parado, andar, atacar, golpe, morrer) existem, no mesmo nível das outras procedurais (sem rig).
- `serpente_sanguessuga` e `vampiro_psiquico` continuam com arte antiga e sem medida física (pendência já registrada); `cao_de_sucata` tem arte mas o modelo não está no CSV.
- `montar-cima.cjs` agora ignora arquivos (`meta.json`) dentro da pasta de cada criatura.
- **🗂️ Mapas → "🗄️ Guardar todos (menos o de teste)"** (`js/mesa-apagar-mapas.js`): dois cliques (o 1º só pede confirmação) marcam `arquivadoV176` em todos os mapas, menos os de nome/id "Ecossistema". Nada é apagado, as portas continuam e dá para mostrar de novo com 👁. **Quem clica é o Yuri** (o banco de produção não é acessível daqui).

## Adendo — painel "🌿 Mapa de teste" único (25/10/2026)
- Os 5 botões soltos da faixa "Ferramentas do mestre" (Mapa de teste, Testar com personagem, Reformar, Aba de jogador, Ajustar tamanhos) viraram **um**: 🌿 Mapa de teste (`js/mesa-hub-teste.js`). "Ajustar tamanhos" era igual a "Criaturas e comportamento" e saiu.
- O painel lista os mapas de teste (aberto agora / principal / guardado / versão), com 👁️ Abrir, 🛠️ Atualizar (abre a reforma já no mapa escolhido; reconstrói o MESMO mapa, com backup) e 🗄️ Guardar (esconde cópias). Só "➕ Criar o mapa de teste" faz um mapa novo, e fica bloqueado enquanto já existir um à mostra (antes, clicar em "🌿 Mapa de teste" criava uma cópia nova a cada vez).
- Também reúne: 🧪 colocar personagem, 👥 jogar como jogador (outra aba) e 🗂️ guardar os outros mapas. Teste: `tests/v205-hub-teste-browser.cjs` (harness local). Não foi reorganizada a barra de ícones de cima nem o resto da tela do mestre.

## Adendo — barra do mapa organizada (25/10/2026)
- `js/mesa-barra-organizada.js`: botões só-ícone ganham um nome curto ao lado (tirado do título do botão); os **pouco usados ficam recolhidos em "⋯ Mais (N)"** (desenho ao vivo, cor, desfazer/apagar desenhos, panorâmico, lojas, mapa geral, companheiros, soltar item, interativos) — nada foi apagado, um clique mostra de volta e a escolha fica lembrada; **"❓ Ajuda"** lista todos os botões e o que cada um faz (lido dos próprios títulos). Só aparência. Teste: `tests/v205-barra-organizada-browser.cjs` (harness local). Quais botões são "pouco usados" foi decisão minha (o Yuri ajusta): lista em `RAROS_ID`/`RAROS_TITULO`.

## Adendo — trecho de teste: sombras projetadas, poças de luz e contorno fino (25/10/2026)
- `js/mesa-sombras-luz.js`: camada SVG com **sombras projetadas** de paredes e móveis (sudeste, suaves) e **poças de luz quente** (que tremulam) em volta de lâmpadas, braseiros, fogueiras e velas. Só na **casa** e nas **ruínas** do mapa de teste (campo `sombrasV205` do mapa = retângulos em metros; sem o campo, o mapa "Ecossistema" usa as duas áreas padrão). Só desenho: não muda colisão nem visão.
- **Contorno das massas de rocha**: marrom-escuro fino no lugar do preto grosso (vale para todos os mapas).
- Duas lâmpadas dentro da casa (reaplicar a reforma 🛠️ para aparecerem no mapa salvo).
- Fotos: `docs/antes-depois/trecho-antes-*.png` × `trecho-depois-*.png` (`tests/_foto-trecho.cjs`, `MODO=antes|depois`). Inspiração e próximos passos: `docs/INSPIRACAO-MAPAS.md` (piso com sujeira, tapetes, musgo no paralelepípedo, grama em tufos, cachoeira em degraus).

## Adendo — sem linhas pretas (25/10/2026, madrugada)
- **Paredes, cavernas, cercas e muretas** não têm mais borda (antes: contorno preto grosso em alguns lados e nenhum em outros). A definição vem da sombra projetada. Vale para todos os mapas (`js/nova-direta.js`, `semBordaV205`).
- **Massas de rocha (montanha)**: contorno marrom quase invisível (0,6–0,7 px, 20–28% de opacidade); antes preto grosso.
- Trecho de teste ganhou **sujeira no piso** (manchas marrons e claras) e **sombra das copas** (desenhadas pelo módulo, no mapa todo; um passo `decor` no gerador quebrava a reforma repetida e saiu).
- `docs/PARA-O-CHATGPT-rodada-25-10.md`: o que ficou aberto.

## Adendo — correções após os prints do Yuri (25/10/2026, noite)
- O mapa de teste que o Yuri tinha aberto estava **vazio** (nada do gerador aplicado). O painel 🌿 agora avisa "vazio" e manda clicar 🛠️ Atualizar (uma vez, e esperar). Sombras/luz/sujeira não desenham mais em mapa com menos de 20 peças (antes apareciam manchas num fundo vazio).
- Barra do mapa: rótulos só nos botões conhecidos (o rótulo automático de todos sobrepunha legendas de 📍 🎲 🖌 ♻).
- Reforma: a conferência do banco passou a ser por **IDs** da cena viva (não por contagem). A 2ª aplicação continua instável (peças repetidas); os textos do painel e da reforma agora dizem "aplique uma vez".
- Treino: o texto "a saúde não vai para a ficha" estava errado; agora avisa que ferimentos/Sorte passam pela ficha e que se deve usar personagem descartável.
- `docs/MATRIZ-DE-ESTADO.md`: matriz única de estado (revisão geral do ChatGPT de 25/10).

## Adendo — treino ISOLADO das fichas reais (25/10/2026)
**Problema:** o ⚔️ Duelo de treino deixava ferimentos/Sorte/necessidades passarem pela ficha real e tentava "devolver" depois (`devolverFichas()`): fechar a aba ou perder a rede deixava a ficha alterada, e uma edição legítima feita no meio podia ser sobrescrita. **Removido.**
**Agora (`js/mesa-treino-sessao.js`):**
1. **Sessão de treino**: ao iniciar, a ficha é COPIADA para `treinoSessoes/<sessão>/fichas/<id>` (marcada `treinoV205`, `treinoOrigemV205`, `treinoSessaoV205`). A ficha real só é LIDA.
2. **Adaptador**: `globalThis.mesaTreinoRotaV205(caminho)` redireciona `personagens/<id>` para a cópia enquanto a sessão está armada NESTE navegador (o do mestre). Cobre: ataque/defesa/dano (ficha do ator e do alvo), Sorte, fadiga/necessidades (relógio), restaurar do mestre, uso/consumo de itens, equipar, itens de objetos e o painel. Fora da sessão tudo segue como era (partida normal).
3. **Resolvedores reais** (sem regra de demonstração).
4. **Reiniciar** recria a cópia a partir da ficha real DE AGORA (edições legítimas entram; nada sobrescreve a ficha real). **Sair** apaga a cópia, desarma o redirecionamento e tira do documento de saúde/histórico do mapa as entradas do treino. **Fechar a aba** = a memória some, o redirecionamento some e a ficha real nunca foi tocada (cópia órfã é apagada pelo mestre depois de 12 h; F5 na mesma aba reanexa a sessão).
5. **Permissões**: só o mestre lê/escreve \`treinoSessoes\` (regra nova em `firestore.rules`); o combate de partida não lê dali. Se a cópia não puder ser criada (rede/permissão) o duelo NÃO começa e a ficha real fica como está; se a gravação na cópia falhar no meio, o golpe falha com mensagem (nunca cai na ficha real).
6. Texto da interface corrigido ("a ficha real NÃO é alterada…"). Sem 🔄 Restaurar da mesa ao sair (ele regrava fichas); sem sessão nesta aba, Reiniciar recusa em vez de gravar na ficha real.
**Teste:** `tests/v205-treino-isolado-browser.cjs` compara o documento INTEIRO da ficha real antes/depois de cada etapa (+ `CENARIO=derrota`); `tests/v205-treino-sessao.test.mjs` (roteamento e regra). Harness local, mestre simulado, banco falso.
**Publicar (regras + site):** `npx firebase-tools deploy --only firestore:rules,hosting --project d100-mesa-estelar`

## Adendo — correção urgente da reforma no mapa real (26/10/2026)
- No banco real a reforma parava com "o banco tem 0 peças; faltam 400": a conferência por IDs olhava só a cena viva e a arquivada, mas o mapa real guarda a cena também (ou só) **embutida no próprio mapa**. Agora basta UMA das três cópias (viva, arquivada, embutida) ter exatamente as peças do editor; se nenhuma bater, a mensagem diz qual cópia chegou mais perto. Falha introduzida por mim na rodada anterior; o harness não reproduzia porque grava nos três lugares.
- A 2ª aplicação ainda dá menos peças (376 × 400): aberto em `docs/MATRIZ-DE-ESTADO.md`.

## Adendo — causa real do "banco tem 0 peças" na reforma do mapa real (26/10/2026)
- **Causa confirmada** (print do Yuri: "1300 alteração(ões) ainda não salvas — clique em Salvar mapa"): o editor só grava quando o seletor de personagem está em **Mestre** (`enabled = masterMode`). Com um personagem (Kael) selecionado, `rascunho.salvar()` não faz nada e as 400 peças ficam só no rascunho; o banco continua vazio. No harness o seletor já estava em Mestre, por isso nunca apareceu.
- **Correção** (`js/mesa-reforma-teste.js`): a reforma coloca o seletor em "Mestre" sozinha, salva até o rascunho ficar sem pendências (até 6 tentativas) e avisa se não conseguir. Teste: `tests/v205-reforma-modo-mestre-browser.cjs` (harness local, personagem selecionado).
- Ainda aberto: a 2ª aplicação dá 376 peças em vez de 400.

## Adendo — plano B de gravação da reforma (26/10/2026)
- Se o Salvar do editor não gravar (rascunho com pendências após 3 tentativas), a reforma grava a cena direto nos 3 lugares (arquivada, embutida no mapa, viva), descarta o rascunho e confere por IDs; a causa real da falha no banco de produção continua **desconhecida**: `docs/PARA-O-CHATGPT-reforma-nao-grava.md`. Teste: `tests/v205-reforma-modo-mestre-browser.cjs` (harness local).

## Adendo — mapa "estranho" depois de reforma que falha (26/10/2026)
- Relato do Yuri: depois das tentativas, a cachoeira sumiu e os objetos só moviam na horizontal. Hipótese mais provável (não provada no banco real): cada tentativa que não gravava empilhava edições no rascunho (450 → 1300 → 2150) e a tela mostrava essa prévia quebrada. Não consegui reproduzir "só move na horizontal" no harness (arrastar em x e y funciona).
- A reforma agora **descarta o rascunho** antes de cada tentativa e ao falhar (o mapa volta ao banco); o painel 🌿 ganhou "↩️ Descartar alterações não salvas". Recarregar a página (Ctrl+F5) também descarta.

## Adendo — salvar observável e sem gravação parcial (26/10/2026, instruções `instrucoes-claude-bloqueios-26-10.md`)
- `js/nova-editor.js`: `save()` agora **devolve um resultado** `{id,mapa,edicoes,caminhos,estado}` com `estado` = `bloqueado-papel` · `ocupado` · `sem-mudancas` · `confirmado` · `falhou` (+ `erro.code`/`erro.message` originais). `fail(e)` continua atualizando a barra de status. Nenhum chamador existente depende do retorno.
- `js/mesa-reforma-teste.js`: usa o resultado; mostra no painel "❌ O Firebase/editor recusou a gravação: <código> — <mensagem>" e um **📋 Relatório da gravação** (operação, estado, edições, pendências, erro, caminhos, KB estimado); **para** na primeira falha, descarta o rascunho (o mapa volta ao banco) e lança erro com o código. O **plano B de gravação direta foi removido** (era 3 `setDoc` não atômicos). Em `bloqueado-papel` coloca o seletor em "Mestre" e tenta UMA vez.
- Teste: `tests/v205-reforma-modo-mestre-browser.cjs` (harness; `window.__FALHA_TX` faz toda transação falhar com `permission-denied`): a reforma não finge sucesso, mostra o código, rascunho 0, banco igual. Isso **não** prova nada sobre o banco real.
- Ainda aberto: causa da falha real; 2ª aplicação (376 × 400); isolamento completo do treino (itens da seção 3 do guia).

## Adendo — CAUSA REAL da reforma não gravar no banco (26/10/2026): arrays aninhados
- Relatório do Yuri: `invalid-argument — Function Transaction.set() called with invalid data. Nested arrays are not supported (found in document combatesAtivos/mapaMesaSyncDiretaCena)`.
- **Causa:** a cena tem `rectsV201` e `blocosV201` = `[[x,y,w,h],…]` (array dentro de array: Firestore recusa). Aparecem em "Grama" (28 peças, `macicoTopo`) e "Paredão · Planalto" (4, `macico`). O banco falso do harness aceitava tudo, por isso nunca apareceu.
- **Correção:** `js/app/22-mesa-e-modulos.js` — na gravação cada array interno vira `{__arrV205:[…]}`; na leitura (`database.get`, `transact.get`, `subscribeDoc`, `subscribe`) volta ao formato original. Módulos que leem a cena direto do banco (`mesa-lava.js`, `mesa-agua-visual.js`, `mesa-agua-ambiente.js`) aceitam os dois formatos (`rectsNormais`).
- **Harness:** o banco falso agora RECUSA array dentro de array (`setDoc` e `Transaction.set`, como o Firestore real; desligável com `window.__SEM_CHECAR_ANINHADOS`). Isso revelou outro escritor com o mesmo defeito: `[Fixos]` grava `combatesAtivos/mesaObjetosMestre` com arrays aninhados (falha também em produção; **não corrigido**).
- Provas (harness): reforma conclui, água/lava/cachoeira passam com o banco estrito. **Não** provado no banco real.

## Adendo — 2º erro de gravação real: campo undefined (26/10/2026)
- Depois dos arrays aninhados, o relatório do Yuri mostrou `invalid-argument — Unsupported field value: undefined (found in document combatesAtivos/mapaMesaSyncDiretaCena)`: algum objeto da cena (peças do banco real) tem um campo `undefined`, que o Firestore recusa. A codificação de gravação (`mesaCodificarAninhadosV205_`) agora **remove** campos `undefined` (e troca `undefined` em arrays por `null`). O banco falso do harness passou a recusar `undefined` também. Em produção ainda não confirmado.

## Adendo — 🏠 Criar mapa BÁSICO (26/10/2026)
- Pedido do Yuri: começar do básico para ver se o caminho funciona. Em 🌿 Mapa de teste → "🏠 Criar mapa BÁSICO (casa + personagem)": cria "🏠 Casa de teste (básico)" (24 × 16 m), desenha uma casa de 2 cômodos (portas, janelas, mesa, cadeira, estante, tapete, 2 lampiões), **salva** e mostra o resultado estruturado (ou o erro exato do Firebase) e coloca o personagem de teste dentro. Teste: `tests/v205-mapa-basico-browser.cjs` (harness com banco falso estrito). Não provado no banco real.

## Adendo — colisão, Kael, botão de personagem, arma/perícia (26/10/2026)
- **Colisão entre miniaturas**: só o espaço do corpo bloqueia outros corpos. A distância mínima entre dois corpos era no mínimo 1,4 m (`TOKEN_DIAMETER`), o que travava corredores com espaço de sobra; agora é a soma dos raios dos corpos: diâmetro de **solo** da arte de cima (`ESCALA_FISICA[...].soloM`, sem asas/cauda/arma) ou, sem arte medida, o diâmetro do token (`raioCorpoM` em `js/nova-colisao.js`; `mesaRaioCorpoV205` em `js/mesa-arte3d.js`). Pessoa de 1 m com pessoa de 1 m: 1 m. Teste unitário novo. A IA/tempo real pode ter regra própria (não revisada).
- **Kael começa no mapa aberto**: 🌿 → "🧪 Testar com o Kael neste mapa" move o Kael para um ponto livre do mapa aberto (no mapa de teste: o acampamento), já selecionado (`iniciarComKael`).
- **Kael "careca"**: o seletor mostra o capacete marcado; capacete equipado/marcado (letra K) esconde o cabelo por regra. O editor de personagem agora avisa "⚠️ Há um capacete equipado ou marcado".
- **Botão "Editar personagem"** saiu de cima dos botões de ação: agora fica no canto superior direito do mapa.
- **Arma e perícia no painel 🧪**: dois seletores que espelham a barra de ação (`#novaSyncSkill`/`#novaSyncWeapon`): ao escolher a perícia, a arma padrão dela já vem escolhida (mesmo sistema do jogo). Teste com seletores simulados; não testado com a ficha real do Kael.

## Adendo — sem setas nas rampas de rocha (26/10/2026)
- As setas (chevrons) das rampas de rocha da cordilheira (`setasV201` em `js/nova-direta.js`) também foram removidas; já não existiam nas escadas/rampas de objeto. Toda rampa/escada sobe ou desce conforme o lado de onde se entra.

## Adendo — arrastar tudo, sem ponte na lava (26/10/2026)
- **Mover**: o mestre arrasta qualquer peça (decoração, itens, personagens, NPCs, criaturas, **pisos, pontes e calçadas**); só o **chão de fundo** (o "Chão do mapa" escolhido ao criar, ou uma peça que cobre ≥80% do mapa) não se arrasta — arrastá-lo move a tela (`js/mesa-chao.js`). Antes, qualquer `piso` era "chão" e não dava para arrastar a ponte.
- O botão ✋ agora se chama **"Mover tudo"** na barra (antes "Modo mestre"; só o rótulo).
- A **ponte de crosta sobre a lava foi removida** do gerador (pedido do Yuri). Reaplicar a reforma para sair do mapa salvo. A regra de suporte continua em `js/mesa-lava.js` (teste unitário).

## Adendo — Kael no mapa básico recém-criado (26/10/2026)
- O Kael ia para o mapa que estava ABERTO (outro) porque o mapa novo ainda não tinha aberto. Agora o 🏠 mapa básico espera o mapa novo abrir (tenta `openMap` de novo) e chama `iniciarComKael({mapaId,x,y,W,H})`, que usa o id e as dimensões do mapa novo (não os do aberto). Se o Kael não existir, cai num personagem descartável. Teste atualizado (`v205-mapa-basico-browser`: o Kael troca de mapa).

## Adendo — limpar NPCs e monstros dos mapas guardados (26/10/2026)
- 🗂️ Mapas → "🧹 Tirar NPCs e monstros dos guardados" (dois cliques): remove as miniaturas `syncnpc:`/`synccriatura:` dos mapas guardados (exceto "Ecossistema"/mapa de teste), com cópia antes em `combatesAtivos/backupTokensGuardados_<data>_N` (texto JSON). Personagens de jogadores não são tocados. Teste: `tests/v205-guardar-mapas-browser.cjs`. Quem clica é o Yuri.

## Adendo — editar personagem na barra e arma na mão (26/10/2026)
- O botão **🧑 Editar personagem** (aparência: pele, roupa, cabelo, capa, acessórios…) agora fica **na barra do mapa**, ao lado de "⋯ Mais" (antes: canto do mapa, que escondia/atrapalhava). O painel não foi removido.
- Novo: **Arma na mão** (sem arma / espada de energia / pistola / fuzil) — muda a miniatura (letras E/P/G do visual) e o golpe; sugere pela arma escolhida em "Arma / ataque" na barra de ação. Teste: `tests/v205-personagem-editor-browser.cjs` (harness).
- Cabelo "careca" em miniaturas com cabelo: no harness o cabelo aparece (volumoso/longo/rabo). Não reproduzi o relato; um capacete marcado (letra K) esconde o cabelo por regra (aviso adicionado). Falta o visual salvo do Kael real para diagnosticar.

## Adendo — cabelo cobre a cabeça, folhas sem piscar, 🏃 Correr, criatura no jardim (26/10/2026)
- **Cabelo** (`scripts/blender/pessoa_rig.py`): a cabeça do modelo novo é mais alta que a antiga e o cabelo era recortado por ela; vista de cima aparecia um disco de pele ("careca de rabo de cavalo"). Os cabelos (curto, longo, rabo, coque, volumoso) são calotas maiores e mais altas (`HMAP_CABELO`); as 5 camadas foram re-renderizadas e mescladas em `cima_pessoa` (`MESCLAR=1 node scripts/blender/montar-pessoa.cjs <pasta>` troca só as camadas da pasta). Moicano não mudou.
- **Roupa/armadura sumindo ao andar**: ao trocar de ação (parado↔andar) a camada ficava sem imagem até a nova folha carregar. Agora todas as folhas são pré-carregadas e a troca só ocorre quando a nova já carregou (`prontos` em `js/mesa-arte3d.js`).
- **🏃 Correr** (`js/mesa-correr.js`): botão na barra (junto de 🧑); anda 1,8× e gasta 6 de fadiga por segundo (a barra azul já existente); atacar continua 6 por ataque; sem fôlego (≤20%) para de correr. Só o mestre grava a fadiga (regra existente): num jogador sem mestre online, corre mas a barra não desce. Testes: `tests/v205-correr.test.mjs`, `tests/v205-correr-browser.cjs` (harness; correndo anda ~1,7× mais: 4,1 m → 7,3 m em 2 s; o alcance de cada pedido de direção do teclado também cresce ao correr).
- **Mapa básico**: ganhou jardim (grama, caminhos, árvores, pedras, 4 luminárias) e uma criatura de teste fraca (Rastejante de Cinzas) fora da casa; as portas começam fechadas.
- Peça "Lampião de poste" renomeada para "Luminária de poste" (mapa futurista).

## Adendo — revisão do que o Yuri pediu e não via (26/10/2026, noite)
- **Mapa básico**: o jardim e a criatura só existem em mapas criados/reconstruídos DEPOIS desta versão. 🏠 Criar mapa BÁSICO agora **reconstrói o mapa que já existe** (mesmo nome) em vez de criar outro: casa, jardim, 1 criatura, Kael. A criatura entra antes do Kael; o Kael fica selecionado e o cartão de comportamento da criatura fecha (antes a criatura virava "Atuar como" e o cartão cobria o mapa).
- **Disparar**: o botão na tela foi **removido** (`#maRapido` oculto). Atacar = **␣ (Espaço)** no teclado, **A / RT** no controle; sem alvo marcado, ataca o NPC/criatura **mais perto** (antes só dizia "Clique num alvo" em letras pequenas). Novos atalhos (`js/mesa-controles.js`): **E** correr (controle: **L3**; a postura do controle saiu de L3 e pode ser remapeada em H), **G** editar personagem. **Legenda do mapa** (`#maLegenda`, embaixo, centralizada) lista teclado e controle.
- **Barra de fadiga/vida**: o personagem em uso sempre mostra a barra de fadiga (e a de vida quando a ficha de saúde existir); antes só aparecia com ficha de saúde carregada.
- **Atuar como → aba nova** (`js/mesa-atuar-aba.js`): ao escolher um personagem em "Atuar como" (clique do mestre) abre outra aba com a visão dele (`?verComo=`). O navegador pode bloquear pop-ups (aviso na tela). Desligar: `localStorage['mesa:atuarAbaOff']='1'`.
- Não verificado: nada disto com o Kael real e o banco real (só harness local, mestre/jogador simulados).

## Adendo — criatura caçadora, barras e aba do Kael
- Mapa básico: a criatura nasce com atitude **sanguinária** (antes ficava sem atitude e parada).
- Barras da miniatura: vida **vermelha**, fadiga azul, psiquismo roxo (só quem tem), mais finas (3 px) e mais estreitas.
- Botão do painel: **🎮 Abrir o Kael em outra aba (como jogador)** abre `?verComo=teste_jogador_v138` direto, sem clicar na miniatura.
- Ataque sem resposta: a aba de jogador só ENVIA o comando; quem processa é a aba do mestre (precisa ficar aberta). Agora o aviso sai em 20 s explicando isso. **Não reproduzido** o "Enviando ataque…" travado no banco real; a causa mais provável é a aba do mestre não estar processando.
- Colisão entre miniaturas: o Yuri confirmou que existe.
- Andar sentado/deitado: o personagem levanta sozinho ao começar a andar (mesa-objetos `mesaLevantarAoAndarV205` + nova-direta `step`). Só testado pela suíte unitária; falta conferir no navegador.
- Atuar como: vigia extra no seletor (abre a aba mesmo sem o evento change). Ataque travado do Kael NÃO resolvido; detalhes em docs/PARA-O-CHATGPT-ataque-travado-e-atuar-como.md.
- Atuando como MESTRE: esconde Correr, legenda de teclas, Editar personagem e Disparar (aparecem só com um personagem escolhido).
