# Mesa Estelar v119 — Carregamento mais rápido

## ⚡ O que mudou
- **Os bancos carregam todos ao mesmo tempo.** Ao entrar, o site buscava perícias, origens, carreiras, especializações, poderes Psi, itens, cenários, mapas, objetos, NPCs e criaturas **um depois do outro** (cerca de 11 idas e voltas em fila). Agora todos os pedidos saem juntos, e o tempo total fica próximo ao do maior deles, não à soma.
- **Objetos do mapa não são relidos a cada vez.** Antes, cada objeto colocado no mapa buscava de novo o seu modelo no banco, mesmo já carregado. Agora:
  - o modelo carregado ao entrar é reaproveitado;
  - pedidos iguais feitos ao mesmo tempo viram um só.
- **Modelos da cena em paralelo.** Ao abrir um mapa, os modelos dos objetos da cena são buscados todos juntos, e não um por um.
- **Fichas na mesa sem leituras repetidas.** Quando várias criaturas ou personagens são preparados ao mesmo tempo (iniciar combate, tempo real, colocar várias cópias), o documento compartilhado das criaturas e a ficha de cada personagem são lidos **uma vez** e reaproveitados por 1,5 s, em vez de uma leitura por miniatura.

Nenhuma regra mudou; só a forma de buscar os dados.

## Validação
- **Navegador de teste:**
  - os bancos completos carregaram em paralelo, com todos os números conferidos;
  - mesa, barra do mestre, 🎭, edição pela lateral, tempo real, 🎬 e 📜 testados de novo, sem erros.
- `node --test tests/*.test.mjs`: 344 de 376. Só falham os 31 testes antigos e o teste de cache da v102. O teste de instâncias de criaturas continua passando.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
