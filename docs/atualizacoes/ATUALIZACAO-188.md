# v188 — Masmorra pintada pela arte do mapa (pedra envelhecida, abismo, pontes, luz discreta)

Termina o que o GPT tinha planejado antes de acabar o tempo dele: "pisos muito contrastantes, rochas com aparência de blocos e pouca continuidade entre as salas" (v187). O GPT não chegou a gerar imagem nenhuma. Em vez de uma pintura externa, a estrutura passa a ser **formas da Oficina** desenhadas pela arte do próprio mapa (`mesa-mapa-arte`, v110), que dá material, relevo e sombra, com os objetos interativos por cima, como ele queria. Imagem: `docs/imagens/v188-masmorra.png`.

## O que mudou no visual (`js/mesa-masmorra.js`)
- **Paredes** finas em pedra com relevo e sombra (material `pedra`), **rochas** da caverna em elipses de rocha, **abismo** quase preto com uma sombra de fumaça na beirada, **pontes** em madeira.
- **Pisos** em tons apagados e próximos, todos da arte do jogo: lajota nas salas, piso escuro nos corredores, trilha de pedra na caverna, madeira no refeitório e no quartel; **poço** de água com o material `agua`.
- **Desgaste**: cascalho e rachaduras discretas espalhados pelo chão (pincéis da Oficina).
- **Luz discreta**: uma poça de luz quente, translúcida, em volta de cada braseiro.
- Portas, grades das celas, alavanca, armadilhas, escadas e mobília continuam objetos separados (o Banco quando existe; desenho leve quando não).
- Mesmo sem o Banco, a cena fica abaixo do limite da mesa (600 KB). As paredes continuam destrutíveis e reconstruíveis (PV 24).

## IA
- A linha de visão das criaturas agora respeita também as formas da Oficina (a visão fica guardada no elemento da forma); portas abertas e pisos não escondem.

## Testes
- `tests/v187-masmorra.test.mjs` atualizado para as formas; `tests/v186-visao.test.mjs` com o caso das formas; `tests/v187-masmorra-browser.cjs` continua passando (armadilha que abre a cela, 🧱 numa parede de forma, controle, alavanca).
- Suíte completa: 560 testes aprovados. `scripts/preparar-hosting.cjs` confere sintaxe e imports.
- Quem já tinha a masmorra recebe a nova sozinho na primeira abertura como mestre. Cópia de segurança: `_entregas/backup-antes-v188.tgz`. Nada muda em `firestore.rules`.

## Publicar
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
