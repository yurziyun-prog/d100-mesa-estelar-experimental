# Atualização 199 — 🎲 Gerador de NPCs e criaturas (MapForge) + miniaturas artísticas + animações e sons

## O que mudou
- **Onde está**: 🧭 Diretor de cena → aba **🎲 Gerador** (antes 🧑 NPC). O botão "⚔ Gerar e colocar na mesa" que o Kimi tinha pendurado no Laboratório de Combate (painel antigo, que não aparece no Mapa da Mesa, e que também apontava para `imagens/`, pasta que não é publicada) foi **removido** (cópia em `docs/antigos/kimi-25-gerador-rapido-2026-10-20.js`).
- **Motor**: o motor de NPCs e criaturas do MapForge (regras d100, dados reais do jogo: 16 raças, 33 carreiras, 29 criaturas de Calico, 90 perícias) foi empacotado em `js/mesa-npc-motor.js` (código-fonte TypeScript em `fontes/mapforge/`, empacotado por `node scripts/empacotar-npc-motor.cjs`).
- **NPC**: papel (7), raça, carreira, poder 1–6, quantidade e **semente** (mesma semente = mesmo resultado). Ficha completa (atributos, PV, sorte, PM, modificador de dano, perícias, especializações, traços, motivação, equipamento). Botões: 📍 Colocar no mapa, 💾 Salvar no banco (vira NPC do banco do site, com a miniatura artística), 🔍 Arte grande, 📋 Copiar a ficha, 📍 Todos no mapa.
- **Criatura**: espécie (ou sorteio), habitat, poder mínimo, quantidade (matilhas), semente. Entra pelo bestiário do site (mesmas fichas) e mostra a conduta sugerida pela IA do MapForge.
- **Miniaturas artísticas novas** (arte do Kimi): 45 peças (24 criaturas + criaturas extras + 5 NPCs) em `arte/miniaturas/<id>.webp` (384 px, token) e `arte/miniaturas/grande/<id>.webp` (1024 px, ficha). Geradas por `node scripts/gerar-miniaturas-npc.cjs` a partir de `imagens/sprites/*.png` (que não vão para o hospedagem). ~13 MB no total. **Substituem a arte antiga das criaturas no mapa** (as já postas e as novas) sem mexer em nenhum dado do banco; o token é de corpo inteiro, sem recorte redondo.
- **Animações** (miniaturas artísticas): respiram parados (cada uma no seu ritmo), balançam e inclinam ao andar para o lado do movimento, investem ao atacar, sacodem ao apanhar, desviam ao errar, **surgem** com brilho quando entram no mapa e **tombam** ao cair ou morrer. Desliga com "reduzir movimento" do sistema.
- **Sons** (sintetizados, sem arquivos): passos leve e pesado (criaturas grandes), golpe corpo a corpo por tipo (corte, mordida, garra, pancada) mais o impacto no alvo, e som de aparição. Respeitam o botão 🔊.

## O que NÃO mudou
- Editor rápido e todo o resto do mapa: intactos (todos os testes passam).
- Os outros geradores de NPC do site (comerciantes, trabalho, roteiros, cidade alta) seguem com o gerador antigo (`mesa-diretor-dados.js`).
- Os **geradores de mapa** do MapForge (masmorra, cidade, exterior) ainda NÃO foram integrados: próximo passo é importar o resultado como rascunho do Editor rápido.

## Testes
`tests/v199-gerador-npc.test.mjs` (motor, adaptador, miniaturas, CSS/sons) e `tests/v199-gerador-npc-browser.cjs` (Chrome real: abas, opções, semente, ficha, salvar, colocar NPC e criaturas com a arte nova, arte grande). Imagem: `docs/imagens/v199-gerador.png`.

Publicar: `npx firebase-tools deploy --only hosting --project d100-mesa-estelar`

## 🗺️ Geradores de mapa do MapForge no Editor rápido
- **Onde**: Editor rápido → botão **🗺️** (barra de cima do painel, ao lado do 🆕). Abre o **Gerador de mapas**: tipo (**Masmorra / Cidade / Exterior**), estilo (retrofuturista, futurista, medieval, hiboriano, híbrido), bioma (floresta, penhasco, campo, mina), tamanho, densidade, complexidade, conservação e **semente** (mesma semente = mesmo mapa).
- **Prévia** antes de criar. Depois: **Criar um mapa novo com isso** (com o tamanho do plano) ou **Pôr no mapa atual (rascunho)**. Em ambos o resultado entra como **RASCUNHO**: nada é gravado até 💾 Salvar mapa, e **Ctrl+Z desfaz a geração inteira**. Se o mapa novo ainda não tiver aberto, o gerador recusa aplicar (não cai no mapa errado).
- **Conversão** (`js/mesa-mapforge-plano.js`): salas, corredores, ruas, praças, parques, trilhas e terreno em grade viram **pisos com as nossas texturas** (por estilo/bioma); paredes finas com **vãos de porta** viram paredes e **portas**; prédios da cidade ganham piso, **telhado** e legenda com o nome; escarpas viram **parede de caverna** (rocha irregular); árvores viram **copas inteiras** (arte/copas); lâmpadas e braseiros viram **luzes**; mobília vira **objetos do banco** do site (mesa, banco, estante, gerador, estátua, cápsula, barraca, fonte, carro…); legendas das salas e pontos de interesse viram texto; chão do mapa conforme o estilo.
- **Orçamento**: a cena do mapa cabe em ~650 KB (≈480 bytes por peça), então o plano tem no máximo 1000 peças; se passar, o gerador reduz **só os adereços** (árvores, luzes, objetos) e avisa — a estrutura nunca é cortada.
- **Carregamento**: o motor (`js/mesa-mapforge-motor.js`, 157 KB, de `fontes/mapforge` via `node scripts/empacotar-mapforge.cjs`) só é baixado quando o mestre abre o gerador; o motor de NPCs também só carrega ao abrir a aba 🎲 Gerador. Jogadores não baixam nenhum dos dois.
- Imagens: `docs/imagens/v199-mapa-masmorra.png`, `v199-mapa-cidade.png`, `v199-mapa-exterior.png`. Testes: `tests/v199-gerador-mapas.test.mjs` e `tests/v199-gerador-mapas-browser.cjs`.
- **Ainda não**: preencher objetos que faltam no banco (aparece o aviso "Sem objeto para…"); gerar por cima de um mapa já desenhado mistura com o que existe (use "mapa novo" para partir limpo).
