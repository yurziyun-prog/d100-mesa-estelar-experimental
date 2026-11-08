# Mesa Estelar v121 — Oficina compacta e ficha rápida embaixo do mapa

## 🛠️ Oficina avançada (editar mapa)
- **Abre logo acima do mapa** e não fica mais escondida dentro da área de rolagem. O título dela continua clicável, então **dá para recolher de novo**.
- **Abas** no lugar daquela parede de controles:
  - **🗺️ Mapa e chão:** tamanho, escala, fundo, grade, textura, ferramenta;
  - **🎨 Cores, formas e objetos;**
  - **🧱 Regras da mesa;**
  - **☰ Tudo:** mostra tudo de uma vez;
  - **⇔ Painel:** mostra ou esconde a coluna lateral (formas, sombra, direção).
- **✕ Recolher** fecha a Oficina e volta ao mapa. A última aba usada fica lembrada.
- Nenhuma função foi removida, só reorganizada.

## 🧾 Ficha rápida embaixo do mapa (todos)
- A mini-ficha (ação/perícia, arma, munição, Sorte, Testar, PV por parte do corpo, Primeiros Socorros) saiu de cima do mapa.
- Agora fica numa **gaveta "🧾 Ficha rápida" logo depois do mapa e antes do histórico**.
- Clique no título para abrir ou fechar. O navegador lembra a escolha, e a gaveta some quando não há personagem selecionado.

## Próximo
- **v122:** ações por dentro do mapa, num balão flutuante, com atalhos e legenda.
- **v123:** portas, gavetas e armários que abrem; lâmpadas e máquinas que ligam; testes para os trancados.

## Técnico
- `index.html`: `#novaSyncActionPanel` foi movido para dentro de `details#novaSyncFichaGaveta`, depois de `.nova-board-scroll`.
- `js/mesa-barra.js`: `arrumarOficina` e `mostrarAbaOfi`, mais o CSS das abas.
- Versões: `app.js?v=46.134-v121-mesa` e `mesa-barra.js?v=121`.
- Novo teste: `tests/v121-mesa.test.mjs`.

## Validação
- **Navegador de teste:**
  - a Oficina abre fora da rolagem, o título é clicável e recolhe;
  - cada aba mostra só a sua linha;
  - ✕ Recolher fecha;
  - como jogador, a ficha rápida aparece entre o mapa e o histórico, fecha e lembra a escolha;
  - o teste da v120 (vão, deslizar, barra, descrição) continua passando, sem erros.
- `node --test`: 349 de 381. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
