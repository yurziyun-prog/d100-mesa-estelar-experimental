# Atualização 136 — Arrastar

- **✋ Arrastar alguém caído:** chegue perto (até 1,5 m) de um personagem desacordado, em coma, morto ou caído. Aparece o botão "✋ Arrastar X" em cima dele.
  - Ele passa a vir logo atrás de você enquanto você anda.
  - Em cima de quem arrasta aparece a velocidade: 🐢 % e o peso.
- **Peso × Força:** a velocidade depende do peso da carga comparado com a sua Força (capacidade ≈ FOR × 8 kg).
  - Carga leve quase não atrasa (até ~85% da velocidade).
  - Igual à capacidade: metade da velocidade.
  - Mais do que o dobro: não sai do lugar, e aparece "pesado demais: precisa de ajuda".
- **🤝 Ajudar:** outro personagem perto da carga clica "🤝 Ajudar a arrastar". A Força dele soma, e ele anda ao lado da carga até soltar.
- **Objetos soltos** (caixotes, barris, móveis…): "✋ Arrastar" no balão do objeto. Paredes, pisos, portas e balcões não se arrastam. O peso vem do banco ou é estimado pelo tamanho e material.
- **Hospital:** leve quem está ferido ou em coma até a cápsula de recuperação e use "🩺 Colocar X na cápsula". O arrasto solta sozinho quando ele entra.
- **"✋ Soltar"** aparece em cima de quem está arrastando. O arrasto também solta sozinho se quem puxa cair ou trocar de mapa.
- A carga não bloqueia quem a puxa. Tudo vai para o histórico.

Técnico:
- Novo: `js/mesa-arrastar.js`.
- Alterados: `nova-direta.js` (velocidade/colisão de quem arrasta), `mesa-objetos.js` (botão no balão), `app.js` (Força e peso), `index.html` (`46.149-v136-mesa`).
