# Mesa Estelar v114 — Miniaturas no tamanho real, insetoides e miniaturas para todos

## 📏 As miniaturas ocupam o espaço de verdade
- **Figuras maiores:** uma pessoa agora ocupa cerca de 1 m no mapa. Antes parecia ter meio metro.
- **Criaturas grandes crescem menos**, para não invadir a casa do vizinho.
- **Sombra no chão:** cada figura tem uma sombra suave, redonda, do tamanho exato do espaço que ocupa, com um leve tom da cor do lado dela. Não é uma ficha redonda; é o "chão" da figura.
- **Tamanho pela ficha:** carrapato 0,35 m, pessoa 1 m, Besta ≈ 2,3 m, Cila 8 m.
- **Fotos antigas trocadas:** criaturas e NPCs que já estavam no mapa com a foto antiga passam a usar a miniatura do banco quando o mestre abre o mapa. Quem já tem miniatura própria não muda.

## 🐜 Insetoides bípedes, de 4 braços
- **Corpo de pé**, com carapaça, antenas, mandíbulas e olhos compostos.
- **Dois pares de braços:** o de cima com as mãos à frente; o segundo, segmentado e com cotovelo, sai do meio do tronco.
- **Vale para:**
  - NPCs e personagens da raça Insetoide;
  - a criatura "Insetoide Predador";
  - qualquer criatura nova com "insetoide" no nome.
- **Formiga só quando a ficha pede:** quem a ficha descreve como hexápode (6 patas), como o "Insetoide Predador 1", continua com corpo de inseto.
- **Redesenho automático:** os insetoides que tinham ganhado a miniatura antiga de formiga são redesenhados.

## 🧩 Miniaturas para todos, sozinho
- **Sem clicar em nada:** quando o mestre entra, toda criatura, NPC ou personagem que ainda não tem miniatura ganha uma, e aparece o aviso "🧩 N miniaturas novas".
- **Nada é sobrescrito:** quem já tem miniatura (feita no editor ou enviada) fica como está.

## Próximo (v115)
- Mapas prontos para os cenários, com pontos de teste.
- Psi no combate em tempo real.

## Validação
- **Navegador de teste com a mesa completa:**
  - 41 criaturas, 39 NPCs e 3 personagens ganharam miniatura sozinhos;
  - a mesa ficou com Insetoide Predador, Cadáveres, Besta, Carrapatos, Cila, Qozae, Zik (insetoide) e Kibi, cada um do seu tamanho;
  - nenhum erro.
- `node --test tests/*.test.mjs`: 329 de 361. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
