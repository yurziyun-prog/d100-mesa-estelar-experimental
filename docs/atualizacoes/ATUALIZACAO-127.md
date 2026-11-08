# Mesa Estelar v127 — Companheiros que acompanham o dono

## 🐔 Seguir o dono
- **Seguir:** a Galinha do Sérgio (e qualquer animal ou drone companheiro) **anda atrás do dono** pelo mapa, desviando de paredes.
- **Trocar de mapa:** quando o dono passa por uma saída (v126), o companheiro **vai junto** para o outro mapa.
- **Quem é companheiro de quem:**
  - **pelo nome:** "Galinha do Sérgio" → Sérgio Leone;
  - **pela ficha:** os companheiros vinculados ao personagem (banco de Companheiros);
  - **à mão,** no painel **🐾 Companheiros**, no canto do mapa (só o mestre).

## 💨 Em perigo, foge
- **Combate (por turnos ou em tempo real) com inimigo a menos de 6 m** do companheiro ou do dono: o companheiro **foge** para longe dos inimigos.
- **Histórico:** registra "💨 Galinha do Sérgio foge do perigo cacarejando!" e aparece 💨 sobre a miniatura.
- **Quando o perigo passa,** ele volta para perto do dono.
- **No tempo real,** o companheiro que foge **não ataca ninguém**, e os companheiros ficam do lado do grupo.

## ⚔️ Outras funções (para o futuro)
No painel 🐾, cada companheiro pode ser **"💨 foge do perigo"** ou **"⚔️ luta junto"**. Lobos e cães de guarda já começam como "luta junto": no tempo real, lutam pelo grupo.

## Técnico
- **Novo módulo:** `js/mesa-companheiros.js`, que roda no navegador do mestre e grava só a posição do companheiro. Os pares manuais ficam em `combatesAtivos/mesaCompanheiros`.
- **`nova-direta.js`:** `todosTokens`.
- **`mesa-tempo-real-ia.js`:** companheiro = facção do grupo.
- **`mesa-tempo-real.js`:** companheiro que foge não entra na IA de ataque.
- **Versão:** `app.js?v=46.140-v127-mesa`.

## Validação
- **Navegador de teste:**
  - a galinha começou a 7,7 m do Sérgio, do outro lado de uma parede, e chegou a 1,8 m contornando a parede;
  - o Sérgio andou e ela foi atrás (1,2 m);
  - com a Besta perto e o tempo real ligado, ela fugiu para 11,7 m e o histórico registrou;
  - o Sérgio foi para outro mapa e ela foi junto.
- `node --test`: 368 de 400. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
