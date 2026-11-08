# v186 — Masmorra com a cara do jogo: peças de construção, Banco de Objetos, jaulas, facções e monstros que precisam ver

Refaz a Masmorra de treino (v184) com os recursos que o jogo já tem e muda a IA do tempo real: criatura só ataca quem vê. Imagem: `docs/imagens/v186-masmorra.png`. Na primeira abertura como mestre, a masmorra antiga é refeita sozinha (aviso 🏰).

## A masmorra agora é feita com as peças do jogo (`js/mesa-masmorra.js`)
- **Paredes**: blocos de 2×2 m com o material **Pedras de rio** da Oficina 3.0 (textura `arte/materiais/pedra-rio/parede.webp`), como se tivessem sido construídos com o 👷. O construtor reconhece (pintar, mover, quebrar). Continuam destrutíveis (PV 24, dureza 2).
- **Piso das salas**: Pedra polida (chão da Oficina 3.0). Corredores no chão "masmorra" do mapa.
- **Sala do chefe**: uma **porta trancada** (porta de pedra, Mecanismos / Segurança / Força Bruta para abrir, ou quebrar: PV 30) e os outros acessos fechados com parede fina.
- **Banco de Objetos**: braseiros de plasma (iluminam), baú brasonado (guarda itens), estandarte, ossadas, túmulo antigo, cristal azul, pedras soltas e a própria "Armadilha de estacas" do Banco. Quando o Banco não tem a peça, entra o mesmo desenho do jogo (`mesa-arte-objetos`).
- **Jaulas**: grades de metal (barram o passo, deixam ver, quebram com PV 30). Uma no canto da sala do meio, aberta pela **alavanca** 🕹️ no canto oposto; outra num beco, aberta por uma **armadilha** do corredor (quem pisa liberta o que está preso).
- **Monstros com as miniaturas prontas do jogo** (`mesa-miniaturas`), em **facções diferentes** e em partes diferentes: rastejantes (💀 Inimigos) na primeira sala; cadáveres e enxame (🟣 B) na sala do meio e no chefe; carrapatos (🟡 C) soltos nos corredores; uma larva **🕊️ neutra** num beco (só reage se atacada); na jaula da sala, um predador de névoa **🐾 cada um por si**; na jaula do beco, um vampiro (🔵 A). Quem não existir no Banco de Criaturas é trocado pela alternativa. Facção e jeito de lutar ficam gravados no estado do ⚡ (gaveta do mestre pode mudar).

## IA do tempo real (`js/mesa-tempo-real.js`, `js/mesa-tempo-real-tatica.js`)
- **Só ataca quem vê**: linha de visão até 14 m sem parede, pedra ou porta fechada no meio (grades, muretas e telhados não escondem). Quem foi visto fica na memória por 20 s. **Tempo de reação**: zumbis e chefes reagem na hora; animais em 0,6 s; inteligentes em 1,2 s; presas em 1,8 s.
- **Quem é atacado sabe do agressor na hora**, e quem está a até 10 m "ouve a luta" e também passa a contar com ele.
- **Neutro atacado se enfurece**: vira "cada um por si" (histórico: "😡 … se enfurece e passa a atacar.").
- Gaveta ⚡: "👁️ em alerta" na linha da criatura que já viu alguém.

## Testes
- `tests/v186-masmorra.test.mjs`, `tests/v186-visao.test.mjs` (substituem o teste da v184) e `tests/v186-masmorra-browser.cjs` (Chrome sem janela: armadilha que liberta a jaula, 🧱, controle falso, 🕹️ da alavanca, botão 🏰).
- Suíte completa: 560 testes aprovados. `scripts/preparar-hosting.cjs` confere sintaxe e imports.
- Cópia de segurança: `_entregas/backup-antes-v186.tgz`. Nada muda em `firestore.rules`.

## Publicar
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
