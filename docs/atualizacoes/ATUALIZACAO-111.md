# Mesa Estelar v111 — Combate em tempo real (modo opcional)

O combate por turnos continua exatamente igual. O tempo real é um modo à parte, que o mestre liga e desliga.

## ⚡ Como usar (mestre)
1. Coloque as miniaturas no mapa. Para usar o tempo real, o combate por turnos não pode estar ativo.
2. Clique em **⚡** nas ferramentas do mapa.
3. Escolha as **facções** e clique em **▶ Iniciar tempo real**.
   - **⚔️ Todos contra o grupo**: criaturas e NPCs contra os personagens (padrão).
   - **🐾 Cada um por si**: toda criatura ataca qualquer outra.
   - **🔵🟣 Duas facções**: espécies diferentes ficam em lados opostos.
   - Também dá para escolher a facção de cada um: Grupo, Inimigos, Neutros (não lutam), Cada um por si, ou Facção A, B e C.
4. No topo do mapa aparece a barra **⚡ Tempo real** com **⏸ / ▶** (pausa na hora) e **⚙️** (abre o painel).
5. **Velocidade do jogo**: 0,5×, 1×, 1,5× ou 2×.
6. Quando só sobra um lado de pé, o jogo **pausa sozinho** e mostra quem venceu.

## Como as criaturas agem
- Cada criatura, NPC ou personagem marcado com 🤖 escolhe o inimigo vivo mais próximo. Ela prefere quem acabou de atacá-la.
- Ela anda até o inimigo desviando de paredes e obstáculos, e ataca quando a recarga acaba.
- **Mais ações por turno = recarga menor e passo mais rápido.** Com 2 ações: 1 ataque a cada 3 s e deslocamento normal. Com 3 ações: 1 ataque a cada 2 s e 25% mais rápido.
- Quem atira procura linha de tiro livre. Sem munição, troca de arma ou vai para o corpo a corpo.
- Caído, a criatura gasta uma ação para levantar.
- Usam **as mesmas regras da mesa**: perícia, armadura, local do golpe, crítico, efeitos especiais, munição, morte e inconsciência.
- **Defesa automática**: o alvo usa a melhor defesa que tiver (Esquiva ou Aparar), até o número de ações dele por rodada.

## Jogadores
- Atacam pelo **painel de ações normal**. No tempo real o ataque respeita a recarga do personagem, e a barra no topo mostra **recarregando** ou **✅ pronto**.
- Andam livremente pelo mapa.
- Defesa e efeitos especiais são escolhidos automaticamente, porque não dá para esperar escolhas no tempo real.
- Se um jogador não estiver, o mestre marca 🤖 no personagem dele e ele passa a agir sozinho.

## Limites desta versão
- Ataques em área (Eco da Matilha, Grito Psíquico), Psi e Primeiros Socorros continuam no combate por turnos.
- Sangramento e efeitos que contam rodadas só avançam no combate por turnos.
- Tudo é calculado no navegador do mestre, então ele precisa estar com o site aberto.

## Segurança
- **Módulo à parte.** Se ele falhar, o mapa e o combate por turnos seguem normais.
- **Pausa automática.** Com erros repetidos, o tempo real pausa sozinho.
- **Sem conflito com o combate por turnos.** O gancho no processador de ataques só age com o tempo real ligado e o combate por turnos desligado.

## Técnico
- **Novos:**
  - `js/mesa-tempo-real.js` (motor e telas);
  - `js/mesa-tempo-real-ia.js` (decisões, caminho e facções, sem tela);
  - `tests/v111-tempo-real.test.mjs`.
- **`js/nova-ataques.js`:** uma linha de gancho. **`js/nova-direta.js`:** só a versão do import.
- **`js/app.js`:** ponte `mesaTempoRealDadosV111_` (ações, deslocamento e ataques da ficha, mais o resolvedor oficial) e carregamento do módulo à parte.
- **Estado** em `combatesAtivos/mesaTempoReal`. As regras atuais já cobrem esse caminho: o mestre grava e todos leem. **Não precisa mudar as regras.**

## Validação
- **Navegador de teste**, com as fichas reais do banco (Errantes × Besta Ululante em duas facções, velocidade 2×):
  - as criaturas andaram, contornaram o muro e trocaram golpes com as regras da mesa;
  - houve sangramento, local do golpe, dano e quedas;
  - o combate pausou sozinho no fim, com a facção vencedora;
  - um ataque de jogador foi aceito e o seguinte foi barrado pela recarga;
  - sem erros.
- **`node --test tests/*.test.mjs`:** 317 de 349. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
