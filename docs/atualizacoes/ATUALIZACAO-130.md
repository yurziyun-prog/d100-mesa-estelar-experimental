# Mesa Estelar v130 — Clima no painel "Visual do mapa" e miniaturas das criaturas com foto

## ⛈️ Clima no 🎨 Visual do mapa
- **Botão único:** o botão ☀️/🌧️/⛈️ separado (v128) saiu. O clima fica só no painel **🎨 Visual do mapa**.
- **Nova opção ⛈️ Tempestade (raios e trovões):** chuva forte e inclinada pelo vento.
  - **Raios:** clarão em cerca de 1 a cada 7 s, no mesmo instante para todos.
  - **Trovão:** vem logo depois (com o 🔊 ligado).
- **Nova caixa "Cenário inteiro":**
  - **marcada:** o clima e a intensidade valem para **todos os mapas**, e continuam ao trocar de mapa;
  - **desmarcada:** cada mapa volta a usar o próprio clima.

## 🐙 Miniaturas da Cila, da Besta Ululante e de outras criaturas com foto
- **A causa:** a foto delas tinha sido salva pelo editor de miniaturas como "imagem", e por isso não era trocada pela miniatura desenhada.
- **Agora:** na conta do mestre, criaturas nessa situação ganham a miniatura desenhada sozinhas, e as miniaturas no mapa trocam em até 15 s.
- **A foto antiga** fica guardada em `miniaturaAnterior`.
- O botão "✨ Gerar as que faltam", no Banco, continua funcionando.

## Técnico
- **`mesa-visual.js`:** `CLIMAS.tempestade`, `climaEfetivo`, documento `combatesAtivos/mesaVisualGlobal` e `window.mesaVisualClima`.
- **`mesa-efeitos.js`:** os raios e trovões seguem o clima do painel; o botão próprio saiu.
- **`mesa-conteudo.js`:** criaturas com miniatura do tipo "imagem" são redesenhadas.
- **Versão:** `app.js?v=46.143-v130-mesa`.

## Validação
- **Navegador de teste:**
  - a opção Tempestade aparece no painel;
  - com "Cenário inteiro" marcado, o clima foi salvo para todos e continuou "tempestade" ao trocar de mapa;
  - houve clarões de raio;
  - a Cila com foto ("imagem") ganhou a miniatura desenhada, e a foto ficou guardada.
- `node --test`: 374 de 406. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
