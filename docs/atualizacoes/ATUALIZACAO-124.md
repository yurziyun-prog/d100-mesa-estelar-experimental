# Mesa Estelar v124 — Ambiente interativo no mapa

## 🚪 Portas, gavetas, luzes e máquinas
Os objetos do mapa reconhecidos pelo nome ganham um ícone pequeno em cima:

| Ícone | Objetos |
|---|---|
| 🚪 | Porta, portão, escotilha, comporta, alçapão |
| 🗄️ | Gaveta, armário, cômoda, cofre, baú, arquivo, geladeira, escrivaninha |
| 💡 | Lâmpada, luminária, abajur, lustre, poste, holofote |
| 💻 | Computador, terminal, console, painel de controle, máquina, gerador, monitor, rádio, elevador, reator |

O jogador clica no ícone, com o personagem a até **2 m**:
- **Abrir / fechar** e **ligar / desligar**.
  - Porta **fechada bloqueia** a passagem; aberta libera e fica translúcida.
  - Luz acesa ilumina em volta, e máquina ligada brilha.
  - Armário aberto mostra **o que tem dentro**, se o mestre escreveu.
- **Trancado / travado:** pede um teste. O valor já vem da ficha, com a dificuldade aplicada.
  - **Portas e recipientes:** Segurança [Cofres e Fechaduras], Mecanismos ou Força Bruta. A Força Bruta abre, mas deixa **arrombado** e faz barulho quando falha.
  - **Máquinas e terminais:** Computação, Cibersegurança, Eletrônica ou Mecânica.
  - **Luzes:** Eletrônica ou Mecânica.
  - **Uma tentativa por perícia**, por personagem, em cada objeto.
- **Histórico:** tudo é registrado (ex.: "🚪 Qozae destrancou e abriu: Porta (Segurança [Cofres e Fechaduras] 5/30 · Sucesso)").

## 🛠️ Mestre
- **Configurar cada objeto:** clique no ícone para:
  - abrir, fechar, ligar ou desligar direto;
  - 🔒 **trancar ou travar**;
  - escolher a **dificuldade** (Muito fácil … Hercúleo);
  - **↺ liberar tentativas**;
  - escrever **o que tem dentro**;
  - trocar o **tipo** (ou marcar "não interativo").
- **🚪 Interativos** (canto do mapa): mostra ⚙️ em todos os objetos, para transformar qualquer um (um sofá, um baú desenhado…) em interativo.
- **Pedidos dos jogadores:** vão para uma fila que o navegador do mestre confere (quem pediu controla o personagem, está perto, o mapa é o mesmo) e aplica na cena. Por isso o mestre precisa estar com o site aberto, como no combate.

## Também nesta versão
- No tempo real, a lista de cada miniatura mostra **⚔️ Ações/Defesas e 🦶 Deslocamento da própria ficha** (ex.: 2/2 · 6 m). O ritmo de cada um vem da ficha, com a fadiga incluída. Não é um número único para todos.
- Os campos de escolha dos balões não ficam mais vazios ou cortados.

## Técnico
- **Novo módulo:** `js/mesa-objetos.js`. O estado fica em `estadoInterativo` de cada objeto da cena, e os pedidos em `combatesAtivos/mesaObjetos/acoes/{id}`, que as regras atuais já permitem.
- **Ponte no `app.js`:** `window.mesaObjetosV124_`, que lê o valor da perícia da ficha e rola o d100 com `classificarD100_`.
- **Versão:** `app.js?v=46.137-v124-mesa`.

## Validação
- **Navegador de teste:**
  - porta, luminária, terminal e armário ganharam ícone; sofá e paredes não;
  - o mestre trancou a porta e o terminal, acendeu a luz (com brilho) e escreveu o conteúdo do armário;
  - atuando como Qozae, as três perícias apareceram com os valores. Segurança e Mecanismos falharam, Força Bruta arrombou, e o Qozae **atravessou a porta aberta**;
  - pedido do jogador longe demais foi recusado e apagado; perto, o armário abriu e mostrou "2 cargas de energia".
- `node --test`: 359 de 391. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
