# Mesa Estelar v112 — Barra do Mestre no mapa + tamanhos reais

## 🧭 Barra do Mestre (fica logo acima do mapa; só o mestre vê)
Tudo numa linha, sem abrir sub-abas:
- **Seletor de mapa**: troca o mapa da mesa na hora, e os jogadores acompanham.
- **＋ Colocar**: abre um painel com abas **Criaturas · NPCs · Personagens · Objetos**, com busca e as miniaturas.
  - Escolha e **clique no ponto do mapa**.
  - **× N** coloca várias cópias em volta do ponto (ex.: 4 Errantes).
  - **Shift** mantém o item escolhido para continuar clicando. **Esc** cancela.
- **✋ Mover e editar**: arraste miniaturas, personagens e móveis livremente.
- **🗑️** retira do mapa o que estiver selecionado.
- **✏️ Desenhar ao vivo**: os jogadores veem na hora. Também tem cor, **↶** desfazer e **🧽** apagar os seus desenhos.
- **👥** traz o grupo para o mapa, e **🛠️** abre a Oficina.
- Os botões **🎨 ⚡ 🔎 🧭 🗺️** dos outros módulos também foram para a barra.
- **💾 Salvamento automático**: móveis colocados ou editados se salvam sozinhos 1,5 s depois. O canto da barra mostra **⏳ salvando…** e depois **✔ tudo salvo**. Não existe mais "esqueci de salvar".

## 📏 Tamanhos reais
- **Miniaturas no tamanho da criatura**, pela ficha (categoria, altura e TAM):
  - Carrapato ≈ 0,4 m, humano 1 m, Besta Ululante ≈ 2,3 m, Dragão-Trombeta selvagem ≈ 4 m, **Cila 8 m**.
  - As que já estão no mapa ganham o tamanho certo sozinhas quando o mestre abre o mapa.
- **A Cila não sai do lugar.** Deslocamento 0 agora é respeitado; antes caía no padrão de 6 m. Isso vale também no combate em tempo real.
- **Móveis com medida real** no banco:
  - sofás de 2,4 m (retos) e 2,6–2,8 m (em L), poltrona 0,95 m, camas 2 m, cadeiras 0,65 m, mesas, balcão e ossada;
  - os móveis já colocados no mapa aberto são corrigidos juntos;
  - quem você ajustou à mão não muda.
- **📦 Conteúdo novo → Miniaturas para todas as criaturas e NPCs que ainda não têm**: desenha a miniatura de quem está sem, como a Cila, uma massa com vários pescoços vista de cima.

## Correções
- Colocar NPC pelo catálogo podia ser recusado pelas regras do Firestore (campo de atributos do NPC). As regras foram ajustadas.
- O alcance dos ataques agora considera o tamanho real das miniaturas.

## Próximo (v113)
Mapas prontos para os cenários, com pontos de teste (investigar, examinar…) já colocados.

## Técnico
- **Novos arquivos**:
  - `js/mesa-barra.js` (barra);
  - `js/mesa-tamanhos.js` (tamanhos, sem tela);
  - `tests/v112-barra.test.mjs`.
- `js/nova-direta.js`:
  - `place()` aceita cópias (`~2`, `~3`…) e grava `diametroM`;
  - o controlador expõe `place` e `mapaAtual`.
- `js/nova-editor.js`: salvamento automático do rascunho (desligável com `window.mesaAutoSalvar=false`).
- **Outros**:
  - `js/mesa-diretor.js`: os encontros já nascem do tamanho certo;
  - `js/mesa-conteudo*.js`: pacote de miniaturas.
- `firestore.rules`: posições aceitam `diametroM` (0,2–12 m) e `atributosIndividuo`.
- `js/app.js`: carrega a barra à parte e usa o deslocamento correto (0 = imóvel). O alcance também usa `diametroM`.

## Validação
- **Navegador de teste com a mesa completa** (mapa real, Firestore simulado ao vivo):
  - 3 Bestas colocadas com um clique;
  - personagem e 2 caixotes colocados, com salvamento automático (⏳ → ✔);
  - troca de mapa pela barra;
  - Cila com 8 m;
  - 10 móveis do banco e os do mapa aberto corrigidos;
  - nenhum erro.
- `node --test tests/*.test.mjs`: 323 de 355. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy (inclui as regras)
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
