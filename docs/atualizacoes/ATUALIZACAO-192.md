# Atualização 192 — temas, controles de videogame, equipamento no mapa, mochila e miniaturas

- **Temas** (botão 🎨): Clássico (padrão), Modo Tático (do Kimi) e Retrô-futurista colorido.
- **Portas e itens instantâneos**: abrem/pegam na hora (sem "pedido à mesa"); porta destrancada desliza e fica aberta; item no chão aparece como miniatura.
- **Controles**: mouse/teclado/controle remapeáveis (botão ❓, tecla H). Alavanca esquerda anda; **alavanca direita rola barras laterais/página** (com balão aberto, escolhe o botão). LB/RB trocam arma, LT abre o menu, RT ataca, Select abre o equipamento.
- **Equipamento dentro do mapa** (🎒 / Select): equipar, guardar, usar e consumir, com controle.
- **Mochila**: a mochila **equipada** libera a aba Mochila; sem ela os espaços ficam 🔒. Mochila comprada (ou já guardada) é equipada sozinha se não houver outra.
- **Correções**: aviso falso de peso ao tirar item da mochila; descrição de item não estoura mais a tela.
- **Miniaturas** (`js/mesa-itens-mini.js`): desenho de cima, no traço do mapa, para os itens do mercado.

Publicar: `npx firebase-tools deploy --only hosting --project d100-mesa-estelar`

## Complemento (mesmo dia)
- **⚙️ Configurações** ao lado de PT/EN/中文 (login e dentro do site): visual, idioma e conta (e-mail, link para trocar a senha, sair). O 🎨 solto saiu.
- Botões flutuantes em coluna à esquerda, acima do som: 🧪 (96), 🏰 (136), ❓ (176).
- A faixa amarela das contas de teste some sozinha em 9 s.
- Item sem imagem mostra a miniatura em vez da caixa 📦 (mochila, mercado, banco, ficha).
- Veículos da concessionária mais baratos (scooter 900 … limusine 9.500); naves mantidas. Preços dos modelos já cadastrados no banco são atualizados uma vez, pelo mestre.
- Botões PT/EN/中文 saíram do topo; idioma fica em ⚙️ Configurações.
- Correção: os desenhos das miniaturas tinham atributo repetido no SVG e não carregavam; corrigido (teste novo `tests/v193-imagem-quebrada-browser.cjs`).
- Mercado: botões 🚗 Veículos e 🚀 Naves abrem a concessionária/estaleiro.
- **Montarias e companheiros à venda**: botão 🐉 Montarias no Mercado e ramo de comerciante "Montarias e animais". Galinha 12, Lobo 850, Drone ZK-4 2.400, Dragão Trombeta 3.000. O mestre entrega o animal na ficha (Companheiros) na mesma transação que desconta o dinheiro. Teste: `tests/v193-montarias.test.mjs`.
- Miniaturas: 55 desenhos (novos: abrigo, gerador, cortador, soldador, eletrônica, escalada, robótica, sobrevivência, mecânica, binóculos, navegador, amostras, rádio, terminal, lança, relíquia, antena, lobo, galinha, dragão). O tipo agora também lê a descrição do item. Montarias sem foto mostram a miniatura. Folha de conferência: docs/imagens/v193-miniaturas.png.
