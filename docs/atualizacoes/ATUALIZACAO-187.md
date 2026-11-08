# v187 — Masmorra de treino com planta de mapa de batalha

O Yuri não gostou do labirinto de blocos (v184–v186) e pediu algo no estilo dos mapas de masmorra usados em RPG. A masmorra agora segue uma **planta desenhada à mão** (`ZONAS`, `PORTAS`, `MOBILIA`, `MONSTROS` em `js/mesa-masmorra.js`), construída com as peças e objetos do próprio jogo. Imagem: `docs/imagens/v187-masmorra.png`. Quem já tinha a masmorra antiga recebe a nova sozinho na primeira abertura como mestre.

## A planta (44 × 26 m)
- **Esquerda**: Depósito (barris, caixotes, baú, cristal), Refeitório (mesa redonda, cadeiras, tapete, barris, braseiros) e Quartel (quatro camas, baú), ligados por um corredor com a **escada da entrada**.
- **Meio**: caverna de chão de pedras de rio com rochas nas bordas, um **abismo** que a corta de ponta a ponta (barra o passo) e **duas pontes de madeira**. Cristais, ossada e pedras soltas.
- **Direita**: corredores em volta da **Cripta** (sala do chefe: quatro sarcófagos, trono, estandarte, braseiros, baú; **porta trancada** pelo lado da caverna e uma segunda porta pelo corredor), **Prisão** com duas **celas gradeadas** (uma abre pela alavanca 🕹️, a outra por uma armadilha do corredor), **Sala do poço** (água que não barra, barris) e **Sala da guarda** (mesa, cadeiras, baú, **escada de saída**).
- **Pisos diferentes por sala** (tijolo, madeira, pedra polida, pedras de rio) e corredores de tijolo; fora das salas, a pedra escura do mapa.
- **Paredes finas** de pedras de rio (0,3 m) geradas pelas arestas da planta, em trechos de até 2 m (quebrar um trecho abre 2 m); **portas de pedra** em cada sala; na caverna, **rochas** em vez de parede. Tudo é peça da Oficina 3.0 (o 👷 reconhece).
- Seis armadilhas nos corredores, celas, alavanca e monstros nos mesmos moldes da v186 (facções diferentes, miniaturas do jogo, só atacam quem veem).

## Como funciona por dentro
- A planta é rasterizada em células de 0,5 m (`rasterizar`); cada aresta entre célula andável e rocha vira parede (ou rocha, na caverna); entre sala e corredor vira parede com abertura de 1,4 m onde há porta; abismo e intrusões de rocha viram retângulos que barram. Objetos do Banco entram por `modeloId`; sem o Banco, entra o desenho do jogo (rochas viram elipses com a textura de pedra, para caber na mesa).
- Mesmo sem nenhum objeto no Banco, a cena fica abaixo do limite da mesa (650 KB).

## Testes
- `tests/v187-masmorra.test.mjs` (planta, paredes e rochas, portas e celas, mobília por sala, facções, caminho da entrada a tudo pela caverna e pelas pontes, cela fechada inalcançável e aberta alcançável) e `tests/v187-masmorra-browser.cjs` (armadilha que abre a cela, 🧱, controle, alavanca).
- Suíte completa: 560 testes aprovados. `scripts/preparar-hosting.cjs` confere sintaxe e imports.
- Cópia de segurança: `_entregas/backup-antes-v187.tgz`. Nada muda em `firestore.rules`.

## Publicar
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
