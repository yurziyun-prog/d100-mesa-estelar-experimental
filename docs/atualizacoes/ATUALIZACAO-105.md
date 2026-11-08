# Mesa Estelar v105 — Miniaturas vistas de cima

## Jogadores
- Na ficha, embaixo do retrato: **🧩 Miniatura do mapa**.
  - **Montar**: corpo, porte, pele, roupa, cabelo, cabeça (capuz, capacete, chapéu, bandana, visor), armadura, capa, mochila, arma em cada mão, pose e traços de espécie (cauda, focinho, quatro braços, cabeça grande, orelhas longas, nadadeiras, membranas, chifres, antenas, tentáculos, olhos brilhantes, carapaça…).
  - **Usar imagem própria**: envia uma imagem vista de cima, com zoom, giro e posição; a seta amarela mostra a frente.
  - Funciona mesmo com a ficha aprovada (a miniatura não é campo estrutural).
- Ao salvar, se o personagem já estiver no mapa, o token troca na hora.

## Mestre
- Banco → **Criaturas** e **NPCs**: painel **🧩 Miniaturas vistas de cima** com a prévia de todos.
  - Prévias tracejadas = automáticas, feitas a partir da descrição (todas as criaturas atuais têm receita própria; NPCs usam raça, carreira, armas e descrição).
  - Clique para editar e salvar uma; **✨ Gerar as que faltam** salva todas de uma vez.
- Tokens novos de NPCs/criaturas/personagens usam a miniatura automaticamente.

## No mapa (com a camada visual 🎨 ligada)
- A miniatura aparece **como figura no chão, sem ficha redonda**, com sombra própria.
- Ela **gira para onde o personagem está virado**.
- Seleção vira um brilho em volta da figura (amarelo = selecionado, laranja = alvo); uma luz suave no chão indica o tipo (verde personagem, amarelo NPC, vermelho monstro).
- Com a camada visual desligada, a miniatura aparece dentro do token redondo antigo (o mapa continua jogável).

## Técnico
- Novos: `js/mesa-miniaturas.js` (gerador SVG), `js/mesa-miniaturas-ui.js` (editor e painéis), `tests/v105-miniaturas.test.mjs`.
- Alterados: `js/app.js` (carrega o módulo à parte; "Trazer personagens" usa a miniatura), `js/nova-direta.js` (3 pontos passam a preferir `miniatura.url`), `js/mesa-visual.js` (figura sem ficha + giro), `index.html` (versão), **`firestore.rules`** (o dono pode trocar só a imagem do próprio token).
- Miniaturas vão para o Storage em `personagens/<uid>/miniaturas/` e o endereço termina em `#mini`.

## Segurança
- Módulos carregados à parte: se faltarem ou falharem, o site segue igual.
- Nada é gerado sozinho: só quando alguém clica em salvar/gerar.

## Validação
- Navegador de teste com o site inteiro: editor na ficha (montar e imagem própria), token atualizado, painel de criaturas gerando 6/6; Mapa da Mesa com miniaturas girando, noite, névoa, chuva, ataque — sem erros.
- `node --test tests/*.test.mjs`: 282 de 316; falhas = as 31 antigas + testes de cache v102–v104. 6/6 novos passam.

## Deploy (desta vez com regras)
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
