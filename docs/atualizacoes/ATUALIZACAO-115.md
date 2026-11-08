# Mesa Estelar v115 — 🎬 Preparar a sessão (mapas + testes prontos)

## 🎬 Um botão para deixar os cenários prontos
Na barra do mestre, em cima do mapa, há o botão **🎬**. Ele abre a lista de todos os cenários do banco, com a situação de cada um: **🗺️ mapa**, **🧭 testes** e **📍 pontos**. O tipo de lugar vem sugerido pelo nome e pode ser trocado.

Em **🎬 Preparar marcados**, cada cenário marcado passa por três passos:
1. **Mapa:** se o cenário não tem mapa, ou se o mapa está vazio, ele gera um do tipo certo (esgoto, caverna, floresta, ermos, cidade, interior ou arena), com paredes que bloqueiam e objetos do banco, e liga o mapa ao cenário.
2. **Testes:** se o cenário ainda não tem ações (investigar, examinar…), ele cria:
   - a partir dos **"testes sugeridos" do próprio cenário**, quando existem (ex.: "Engenharia: avaliar as escoras (difícil)" vira a ação *Avaliar as escoras*, Engenharia, Difícil);
   - senão, um **conjunto pronto para o tipo de lugar**, com o que todos percebem, sucesso, crítico e falha já escritos. Exemplos:
     - **Esgoto:** marcas de giz, comporta emperrada, rastros no lodo, caixote preso nos canos;
     - **Interior:** escrivaninha, cofre na parede, cama desarrumada, ouvir pela porta;
     - **Cidade:** cartazes, conversar com moradores, beco escuro, terminal público.
3. **Pontos no mapa:** cada teste ganha um ponto 📍 **perto do que combina**: os rastros na margem do canal, o caixote entre os caixotes, o cofre na parede. Os pontos ficam sempre em chão livre e espalhados.

**Nada que já existe é apagado.** Mapas desenhados, ações escritas e pontos já fixados ficam como estão; ele só completa o que falta.

Depois é só trocar de mapa pela barra. O Cenário Atual acompanha, e os jogadores clicam nos pontos para fazer os testes (regras da v109: até 3 m, uma tentativa por perícia por dia, ⭐ Sorte).

## 📏 Tamanho das pessoas pela ficha
- **Variação pela ficha:** em média uma pessoa ocupa 1 m, mas o tamanho varia pela **altura** ou pelo **TAM**. Alguém de 1,50 m ocupa ≈ 0,9 m e alguém de 2 m ≈ 1,1 m. Personagens pequenos, como o Kibi, ficam menores.
- **Personagens dos jogadores:** agora também recebem o tamanho da ficha ao entrar no mapa. Os que já estão no mapa são ajustados quando o mestre abre o mapa.

## Próximo (v116)
Psi no combate em tempo real.

## Técnico
- **Novos arquivos:**
  - `js/mesa-sessao.js` (painel);
  - `js/mesa-sessao-dados.js` (testes prontos e escolha dos pontos, sem tela);
  - `tests/v115-sessao.test.mjs`.
- **`js/app.js`:** ponte `mesaSessaoV115_`, que lê e grava cenários e republica o Cenário Atual quando ele muda. O módulo carrega à parte.
- **`js/mesa-tamanhos.js`:** variação em volta de 1 m. As versões dos imports foram atualizadas.

## Validação
- **Navegador de teste** com três cenários:
  - sem mapa: o esgoto foi gerado, ligado ao cenário, com 4 testes e 4 pontos;
  - mapa vazio com testes sugeridos: a mina foi gerada e os testes sugeridos viraram 3 ações com pontos;
  - mapa desenhado sem ações: a taverna manteve o mapa e ganhou 4 testes de interior com pontos.
- Ao trocar para o mapa do esgoto, o Cenário Atual acompanhou e os pontos apareceram. Nenhum erro.
- `node --test tests/*.test.mjs`: 334 de 366. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
