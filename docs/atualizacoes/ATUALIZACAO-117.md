# Mesa Estelar v117 — Conta do mestre, PDMs como NPCs e testes dos seus cenários

## 🛡️ Abas na ordem do mestre
- **Escudo do Mestre primeiro:** na sua conta, é a primeira aba e abre ao entrar. A **Ficha** vai para o fim.
- **Nenhuma ficha escolhida:** na Ficha não vem nenhuma pré-selecionada. No topo aparece o painel **📚 Todas as fichas**, com busca e três abas:
  - **🧑 Jogadores:** abre a ficha completa.
  - **🎭 NPCs:** os NPCs de **📋 ficha avançada** (antigos PDMs) abrem a ficha completa, como a de um jogador; os NPCs do banco abrem o editor de NPC.
  - **👾 Monstros:** abre o editor da criatura.
- **Criar:** **➕ Ficha completa**, **➕ NPC** e **➕ Monstro**.
- **Jogadores:** nada muda para eles.

## 🎭 PDM = NPC com ficha avançada
- **Lista de NPCs:** os seus PDMs (fichas suas) aparecem junto com os NPCs, inclusive no **＋** do mapa. No ＋, a aba "Personagens" virou "Jogadores".
- **Duplicados somem das listas:** quando um NPC do banco tem o mesmo nome de um NPC de ficha avançada, como a **Dra. Ilya Nemer**, o do banco sai das listas. Nada é apagado do banco.
- **No mapa:** se os dois estiverem no mesmo mapa, a cópia do banco sai sozinha quando você abre o mapa.
- **Miniatura da Ilya:** a Ilya de ficha avançada fica com a **miniatura feminina** do NPC gêmeo (se a dela era automática). Além disso, "Feminino" ou "Dra." no nome agora geram miniatura feminina.

## 🎬 Testes escritos para os seus cenários
- **Testes próprios:** o 🎬 Preparar a sessão agora usa testes escritos a partir das descrições, objetivos e segredos dos cenários do CSV de 03/10. Cenários com testes próprios:
  - A Caravana que Não Chegou;
  - Local do Ataque (sangue e arrasto, o "sobrevivente"…);
  - Clínica das Três Arcadas;
  - Ringue das Cavidades;
  - Mercado das Cavidades;
  - Ruas Escavadas;
  - Mil Panelas;
  - Galeria de Íon;
  - Sete Rodas;
  - Feira Sem Luz;
  - Mina das Costelas de Ferro;
  - Bosque de Vidro-Pálido;
  - Portão de Véspera.
- **Só perícias que existem no jogo** (conferidas com o banco de perícias). Nomes de outros sistemas nos "testes sugeridos" são trocados por perícias reais:
  - Investigação → Pesquisa/Percepção;
  - Insight → Intuição;
  - Costumes → Etiqueta/Região;
  - Locale → Região;
  - Dissimulação → Enganação;
  - Conduzir → Condução de Veículos.
- **Portas e sangue:**
  - porta trancada = Segurança [Cofres e Fechaduras], Mecanismos ou Força Bruta;
  - mancha de sangue = Anatomia, Medicina ou Percepção.
- **O que você já escreveu fica:** cenários com interações próprias (Última Bateria, Arquivo Cívico, Tribunal…) não são mexidos.

## Próximo (v118)
O Cenário Atual vai para dentro do mapa: o mestre vê segredos e o "ler para os jogadores", e os jogadores veem só o que é deles. Depois disso, a aba sai.

## Validação
- **Navegador de teste:**
  - as abas ficaram Escudo → … → Ficha, abrindo no Escudo;
  - "Todas as fichas" listou a Ilya como "📋 ficha avançada", sem o duplicado;
  - a cópia do banco saiu do mapa;
  - o ＋ mostrou só a Ilya avançada;
  - a C008 recebeu 3 testes próprios e 3 pontos;
  - a miniatura da Ilya ficou feminina.
- `node --test tests/*.test.mjs`: 340 de 372. Só falham os 31 testes antigos e o teste de cache da v102.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
