# Mesa Estelar v126 — Mapas ligados, mapa geral e mapas intermediários

## 🚪➜ Saídas entre mapas
- **Onde ficam:** nas bordas dos mapas, um marcador verde "🚪➜ Nome do destino". Cada ligação funciona **nos dois sentidos**.
- **Jogador:** chega a até 1,6 m da saída, clica e escolhe **🚶 segue para…**. A miniatura vai para o outro mapa, num lugar livre perto da entrada correspondente, e entra no histórico.
- **Quando o último personagem sai,** a mesa **abre o mapa novo sozinha** para todos.
- **Mestre:**
  - **👥 Levar o grupo todo** move todos os personagens e abre o destino;
  - **👁️ Abrir o destino** abre sem mover ninguém;
  - **🗑️ Remover a ligação**;
  - **arrastar o 🚪➜** muda o lugar da saída (ex.: para cima de uma porta desenhada).

## 🕸️ Mapa geral (botão no canto do mapa, só o mestre)
- **O esquema:** todos os mapas em caixas, ligados por linhas, em colunas por distância (quem leva a quem).
  - 🟦 cidade/interior;
  - 🟩 fora da cidade;
  - 🟨 tracejado = mapa intermediário;
  - borda vermelha = mapa sem nenhuma ligação.
- **Clique num mapa** para abri-lo.
- **⚙️ Montar pelos cenários:** cria as ligações a partir dos **destinos** de cada cenário (destino1/2/3).
  - Quando os dois lugares ficam em **regiões diferentes**, cria um **mapa intermediário** e liga A ↔ trajeto ↔ B:
    - cidade ↔ fora da cidade: **estrada**;
    - Cidade Baixa ↔ Cidade Superior: **rua**;
    - serra ↔ palácio: **trilha/estrada**.
  - Cenários que já são viagem (Mar de Pedras, Local do Ataque) ligam direto.
  - Um mapa sem nenhum acesso ganha um trajeto até o lugar de nome/região mais parecido.
- **🔗 Ligar** (dois mapas escolhidos) e **🧩 Intermediário** (cria o trajeto entre dois mapas) servem para fazer à mão.

## 🧭 Mapas intermediários
- **Contexto do lugar:** gerados como **rua** (urbano) ou **estrada/trilha** (rural), com 36 × 18 m.
- **Aviso só para o mestre:** ao abrir, aparece "Este mapa representa o espaço entre X e Y". O ✕ esconde.
- Com os seus 25 cenários, o "Montar pelos cenários" deve criar por volta de 9 trajetos (ruas para a Cidade Superior, estradas para Calico, trilha da serra ao palácio).

## ◀ ▶ Ordem de acesso
O seletor de mapas da barra passa a seguir a ordem de acesso, começando pelo Portão de Véspera. As setas ◀ ▶ andam nessa ordem.

## 🔍 Mapas grandes
Em mapas com mais de 30 m de largura, as figuras das miniaturas aumentam menos, proporcionalmente ao tamanho do mapa.

## Técnico
- **Novo módulo:** `js/mesa-ligacoes.js`, que usa `gerarMapa` e `cenaDoEstado` e salva pelos mapas da v110.
  - Ligações em `combatesAtivos/mesaLigacoes` (gravação só do mestre).
  - Pedidos de viagem em `combatesAtivos/mesaLigacoes/acoes/{id}`.
  - Mapas intermediários ganham o campo `intermediario {a,b,texto,tipo}`.
- **`nova-direta.js`:** `tokensNoMapa`.
- **`mesa-visual.js`:** escala menor em mapas grandes.
- **Versão:** `app.js?v=46.139-v126-mesa`.

## Validação
- **Navegador de teste com 5 cenários reais:**
  - "Montar pelos cenários" criou 3 ligações diretas e 3 trajetos: rua Porto Alto ↔ Ruas Escavadas, estrada Mina ↔ Última Bateria, estrada Mina ↔ Ruas Escavadas;
  - o seletor ficou em ordem de acesso;
  - o Qozae saiu pela porta da Última Bateria, apareceu nas Ruas Escavadas, e a mesa abriu esse mapa sozinha;
  - o aviso do mapa intermediário apareceu para o mestre.
- `node --test`: 366 de 398. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
