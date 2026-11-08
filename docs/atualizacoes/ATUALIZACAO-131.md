# Mesa Estelar v131 — Cila sem encolher e troca de alvo de quem é atacado

## 🐙 A Cila (e outras grandes) não encolhem mais
- **A causa:** no tempo real, quando uma criatura atacava, a posição dela era regravada sem o campo de tamanho. Ela voltava a ter 1 m até a barra do mestre corrigir alguns segundos depois. Por isso "às vezes diminuía".
- **Agora:** o tamanho (e os atributos do indivíduo) são mantidos sempre.

## 🎯 Quem é atacado tende a ir atrás de quem o atacou
- **Alvo fixo:** cada criatura no automático guarda o seu alvo atual, em vez de recalcular a cada instante.
- **Troca de alvo:** quando **outro oponente** a ataca, ela decide **uma vez** se troca de alvo. A chance é calculada assim:

| Situação | Chance de trocar |
|---|---|
| Base | 60% |
| O agressor é ameaça maior (perícia de ataque mais alta) | +25% |
| O agressor é bem mais fraco | −20% |
| O agressor está bem mais longe que o alvo atual | −25% |
| Perfil "vingança" | +20% |
| Perfil que caça o mais ferido | −10% |

- **Limites:** a chance fica sempre entre 15% e 95%. Ou seja, na maioria das vezes ela vai atrás de quem a atacou, mas às vezes continua no alvo de antes.
- **Escolha de novo alvo:** se o alvo morre ou sai do alcance, ela escolhe outro pelo perfil, como antes.

## Técnico
- **`mesa-tempo-real.js`:**
  - `CHAVES_POS` inclui `diametroM` e `atributosIndividuo`;
  - novos `alvoAtual` e `provocacao`.
- **`mesa-tempo-real-ia.js`:** `chanceDeTrocar`.
- **Versão:** `app.js?v=46.144-v131-mesa`.

## Validação
- **Navegador de teste:** Cila (8 m) contra 3 cadáveres por 14 s no tempo real. Ela atacou 5 vezes e continuou com 8 m.
- `node --test`: 376 de 408. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
