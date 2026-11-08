# Mesa Estelar v123 — Combate em tempo real corrigido

## ⏸ Pausar e encerrar valem na hora
- **O problema:** a pausa só parava as decisões novas. Os ataques que as criaturas já tinham "na fila" continuavam saindo um atrás do outro.
- **A causa:** com o banco de dados demorando um pouco, essa fila crescia sem parar.
- **Agora:**
  - ⏸ e ⏹ cancelam na hora tudo que estava esperando;
  - no máximo a transação que já estava em andamento termina;
  - cada criatura tem **no máximo uma ação na fila**.

## ⚔️ O ataque do jogador não fica mais "carregando"
- **A causa:** o ataque do jogador entrava no fim da mesma fila, atrás de vários ataques das criaturas, que caíam nele enquanto isso.
- **Agora:** ataques de jogadores (e do mestre atuando como alguém) **passam na frente** de tudo.
- No teste, com o banco de dados simulado lento (0,9 s por gravação) e 4 criaturas lutando, o ataque do jogador foi resolvido em cerca de 0,3 s.

## ⏱️ Rodada de 5 segundos
- **Uma rodada = 5 s.** Quem tem 3/3 faz até 3 ataques e 3 defesas a cada 5 s (um ataque a cada ~1,7 s). Com 2 ações, um a cada 2,5 s.
- **A defesa é rolada sozinha,** com a melhor opção que a pessoa tiver, dentro das defesas daquela rodada.
- O deslocamento também é por rodada de 5 s.

## ⭐ Crítico ou acerto especial pausa para escolher
- **Quando acontece:** quem acertou é controlado por alguém (um jogador, ou o mestre atuando como a criatura), e o acerto permite escolher local ou efeitos.
- **O que acontece:** o tempo real **pausa sozinho por 10 s**. Para quem acertou, aparece um cartão no mapa com o **local do acerto**, os **efeitos** (até o máximo permitido) e **✅ Confirmar**.
- **Sem resposta:** a escolha é automática.
- **Depois:** o combate continua sozinho, a menos que o mestre já tivesse pausado antes.
- **Criaturas no automático** escolhem sozinhas, sem pausar.

## ⚡ Barra de disparo rápido recolhida
- **Quando aparece:** só durante o combate (tempo real ou por turnos).
- **Fechada:** mostra só o ataque escolhido (ex.: "1 ⚔️ Cabeçada ▸"), **⚡ Disparar** e o alvo.
- **Trocar de ataque:** clique no ▸ para ver os outros (ela se recolhe ao escolher), use as teclas **1–9**, ou escolha a arma no balão ao clicar na criatura. O ataque usado no balão vira o ataque rápido.

## Técnico
- **`mesa-tempo-real.js`:**
  - fila nova: `enfileirar(fn,{prioridade,ator})`, `tocarFila`, `cancelarFila`, `pausarLocal`;
  - escolha do crítico: `perguntarEfeitos` e `desenharEscolha`; a resposta do jogador vai em `combatesAtivos/mesaTempoReal/acoes/{id}`, que as regras atuais já permitem.
- **`mesa-tempo-real-ia.js`:** `RODADA_S=5`.
- **`mesa-acoes-mapa.js`:** barra recolhível, visível só em combate.
- **`app.js`:** passa `getDoc` ao tempo real. Versões: `app.js?v=46.136-v123-mesa`, `mesa-tempo-real.js?v=123`.

## Validação
- **Navegador de teste com gravação lenta:**
  - 4 criaturas em duas facções;
  - depois do ⏸, nenhum ataque novo em 5 s;
  - o mestre atuando com a Besta: o Shift+clique foi processado na frente da fila.
- **Cartão do crítico:**
  - apareceu com contagem;
  - limitou os efeitos ao máximo;
  - gravou a resposta (Sangrar, Peito).
- `node --test`: 356 de 388. Só falham os mesmos 32 antigos.

## Próximo (v124)
Portas, gavetas e armários que abrem; lâmpadas, computadores e máquinas que ligam; os trancados pedem teste.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
