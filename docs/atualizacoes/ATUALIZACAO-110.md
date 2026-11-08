# Mesa Estelar v110 — Mapas mais bonitos + gerador de mapas aleatórios

## 🌲 Todos os mapas que já existem ficaram mais bonitos (sem mexer em nada salvo)
- **Chão pintado** no mesmo estilo das miniaturas e dos objetos:
  - A **floresta de "bolas verdes"** virou chão de mata, com folhas secas, musgo, galhos e pedrinhas.
  - Texturas novas no seletor da Oficina: esgoto, assoalho, lajotas, calçamento, asfalto, lama, chão de metal, rochas, ruínas, grama e caverna.
- **Formas da Oficina** (paredes, balcões, canteiros, piscinas…) ganham material pelo tom da cor: pedra, concreto, madeira, grama, água ou metal. Também ganham relevo e sombra.
- É só desenho. Nenhum mapa salvo é alterado, e se o módulo falhar volta o visual antigo.

## 🗺️ Gerador de mapas (botão 🗺️ nas ferramentas do mapa, só o mestre)
- **Tipos**: esgoto/túneis, caverna/mina, floresta/clareira, ermos/estrada, rua/praça da cidade, interior com salas e portas, e arena (ringue ou estande de tiro).
- **Tamanhos**: 28×14, 36×18 ou 42×21 m.
- **Semente**: o mesmo número gera sempre o mesmo mapa. 🎲 sorteia outro.
- **Prévia** antes de salvar, depois **💾 Salvar como mapa novo**. Ele vai direto para o Banco de Mapas, sem arquivo.
- **Paredes e obstáculos** já bloqueiam movimento e visão na mesa. A luz, a névoa de guerra e o clima funcionam com eles.
- **Objetos do mapa** (caixotes, barris, árvores, pedras, móveis, postes, grades…) vêm do seu Banco de Objetos, então dá para mover, apagar ou trocar depois.
- **Mapas vazios dos cenários**:
  - O painel lista os mapas criados para cenários que ainda não têm desenho, já com o tipo sugerido pelo nome.
  - Use 👁️ para ver e **📌 Preencher**, ou **Gerar e salvar todos**.
  - Mapas que já têm desenho nunca entram nessa lista.
- Para retocar um mapa gerado, abra-o na Oficina como qualquer outro.

## Próximo (v111): combate em tempo real
- As criaturas agem sozinhas.
- Mais ações por turno significam atirar e se mover mais rápido.
- Botão ⏸️ pausar.
- Facções, para criaturas lutarem entre si ou se unirem contra o grupo.
- Cada jogador escolhe entre controlar o próprio personagem ou deixá-lo no automático.

## Técnico
- **Novos arquivos**:
  - `js/mesa-mapa-arte.js` (texturas e materiais);
  - `js/mesa-gerador-mapas.js` (gerador, sem tela);
  - `js/mesa-mapas-ui.js` (painel);
  - `tests/v110-mapas.test.mjs`.
- **`js/app.js`**:
  - ganchos com try/catch na textura e nas formas;
  - ponte `mesaMapasV110_` para salvar no Banco de Mapas, no mesmo formato dos mapas editados na mesa (`cena-oficina-v1`);
  - módulos carregados à parte.
- **Mapa preenchido** com o mesmo id: o cenário arquivado da mesa também é trocado, para não voltar o desenho antigo.

## Validação
- Navegador de teste:
  - mapa de esgoto gerado e salvo (33 KB, 23 elementos com colisão);
  - mapa vazio de cenário preenchido, com o arquivo antigo substituído;
  - render oficial da mesa abriu o mapa salvo;
  - nenhum erro.
- `node --test tests/*.test.mjs`: 310 de 342. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
