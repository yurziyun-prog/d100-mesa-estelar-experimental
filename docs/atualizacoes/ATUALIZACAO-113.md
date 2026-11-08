# Mesa Estelar v113 — Criaturas com personalidade no tempo real (+ correção importante)

## ⚠️ Correção da v112 (publique esta versão)
- **Problema:** na v112, criaturas com o deslocamento **em branco** na ficha podiam ficar com deslocamento 0 e não andar no combate por turnos.
- **Correção:** agora o deslocamento vem direto do Banco:
  - campo vazio usa o "movimento terrestre" da criatura;
  - só quem tem **0 de verdade** (como a Cila) fica parado.

## 🧠 Cada criatura luta do seu jeito (combate em tempo real ⚡)
O jeito vem da ficha: inteligência, tipo, tamanho e descrição.

| Tipo | Quem ataca | Quando foge |
|---|---|---|
| Sem mente (zumbis, errantes, limos, enxames, Cila) | o mais próximo | nunca |
| Animais pequenos (ratos, rastejantes, vespas…) | **caçam o mais ferido** | com **50%** da vida |
| Grandes predadores (Besta Ululante, dragões, couraçados…) | caçam o mais ferido | só com **10%** |
| Inteligentes (NPCs, vampiros, soldados…) | **enfrentam o mais perigoso** (quem bate mais forte ou mais os feriu) | com 30%; quem atira **recua** quando alguém encosta |
| Presas e domesticados (galinha, montarias) | só revidam | cedo (75%) |
| Chefes (Carniçal Dominante, alfas, líderes) | o mais perigoso | nunca |
| Imóveis (Cila) | só quem está ao alcance | — (não andam) |

- **Fuga de verdade:** a criatura corre para longe dos inimigos, desviando de paredes, e aparece no histórico "🏃 … perde a coragem e foge!". Se for encurralada, luta.
- **Você manda:** no painel ⚡, cada criatura mostra como vai agir e tem um seletor para trocar:
  - 🎯 Ataca o mais próximo;
  - 🩸 Caça o mais ferido;
  - ⚔️ Enfrenta o mais forte;
  - 🏃 Covarde;
  - 🐗 Teimoso (10%);
  - 🔥 Fúria (nunca foge);
  - 🧱 Não sai do lugar.
- **Pela ficha:** palavras como "covarde", "feroz", "teimoso" ou "nunca foge" no campo *comportamento* ou na descrição também valem.

## 🎞️ Movimento mais fluido
- **Passos menores e mais frequentes:** as criaturas deslizam entre um passo e outro, em vez de pular.
- **Sem fila:** uma criatura andando não espera a outra; cada uma anda no seu próprio ritmo.

## Próximo (v114)
- Miniaturas no tamanho real: uma pessoa ocupando cerca de 1 m.
- Insetoides bípedes com 4 braços.
- Miniaturas automáticas para todos.
- Mapas prontos dos cenários.

## Validação
- **Navegador de teste com a mesa completa** (Besta Ululante × 3 Rastejantes, duas facções, 2×):
  - os Rastejantes avançaram e atacaram;
  - o ferido (38%) fugiu para o canto, e a Besta foi atrás do mais ferido;
  - no outro teste, os Cadáveres voltaram a andar (problema da v112 corrigido).
- `node --test tests/*.test.mjs`: 326 de 358. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
