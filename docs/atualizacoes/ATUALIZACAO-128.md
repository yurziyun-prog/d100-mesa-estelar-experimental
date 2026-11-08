# Mesa Estelar v128 — Animações e sons de batalha, chuva e tempestade

## 🎬 Animações novas
Somam-se ao que já existia (projéteis, impactos, dano):

| Efeito | Quando aparece | O que se vê |
|---|---|---|
| 💥 **Explosão** | granada, bomba, míssil, foguete, explosivo, lança-chamas | bola de fogo, onda de choque, fumaça e **o mapa treme** |
| ⚡ **Raio elétrico** | bastão de choque, tesla, taser, arco voltaico | raio que vai do atacante ao alvo |
| ⬇️ **Queda** | alguém é derrubado ou cai | a miniatura tomba e levanta poeira |
| 💀 **Morte** | a miniatura morre | treme, fica cinza, sai fumaça e um 💀 sobe |

## 🔊 Sons
Todos são criados no próprio navegador: nada para baixar e nenhum arquivo extra.

- **Armas e impactos:** tiro de arma de fogo (estampido e eco), laser, explosão (com estrondo grave), choque elétrico, queda de corpo e grito de morte.
- **Vozes de criatura**, mais assustadoras:

| Voz | Criaturas |
|---|---|
| rugido grave e distorcido | bestas e predadores |
| estalos de mandíbula com zumbido | insetoides, carrapatos e aranhas |
| gemido arrastado | mortos-vivos e cadáveres |
| chiado | serpentes |
| borbulho | limos e larvas |
| zumbido | vespas e enxames |
| ruído mecânico | robôs e sentinelas |
| cacarejo | galinha |

- **Quando tocam:** a criatura **ruge ao atacar**, solta um **grito de dor mais agudo** quando é ferida e o **grito de morte** ao morrer. Criaturas grandes têm voz mais grave; as pequenas, mais aguda.
- **🔊 / 🔇** (canto do mapa): liga ou desliga os sons só para você. A escolha fica lembrada.

## ⛈️ Clima (mestre)
- **Botão ☀️ → 🌧️ → ⛈️** no canto do mapa.
- **Para todos os jogadores,** no mapa atual:
  - **chuva:** gotas e mapa um pouco mais escuro;
  - **tempestade:** mais escuro e **raios** com clarão.
- **Os raios caem no mesmo instante para todos** (cerca de 1 a cada 11 s), seguidos do **trovão**.

## Técnico
- **Novo módulo:** `js/mesa-efeitos.js`. Ele reage às mudanças da saúde (evento de ataque, caído, morto) e ao clima em `combatesAtivos/mesaClima`.
- **Versão:** `app.js?v=46.141-v128-mesa`.

## Validação
- **Navegador de teste:**
  - granada: explosão, onda de choque e tremor;
  - bastão de choque: raio;
  - Besta morta: animação de morte e fumaça;
  - Qozae derrubado: queda e poeira;
  - tempestade: chuva e 2 raios em 15 s;
  - sem erros.
- `node --test`: 371 de 403. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
