# Mesa Estelar v107 — Novo visual dos objetos do mapa (etapa 1 da arte)

As fotos vistas de cima foram redesenhadas no mesmo universo visual das miniaturas: desenho detalhado, com sombra, relevo, grão de madeira e folhagem pintada (seguindo o estilo da `arvreparmera3`).

## Como usar (mestre)
Banco → **Objetos de Mapa** → **🎨 Novo visual dos objetos**
- Cada objeto aparece com a **imagem atual (esquerda)** e o **novo desenho (direita)**. Desmarque o que quiser manter como está.
- **🎨 Trocar marcados**: baixa um backup com as imagens atuais, desenha, converte para WebP, envia ao Storage e troca só a imagem. Todos os mapas que usam o objeto mudam juntos (tamanho, PV, colisão etc. não mudam).
- **➕ Adicionar objetos novos (19)**: barril, caixote de suprimentos, terminal, luminária de teto, pinheiro (com e sem neve), árvore florida, árvore alienígena, arbusto florido, pedra grande e pequena, cristal azul, mesa com cadeiras, cama de solteiro, sofá de couro, tapete retangular, tronco caído, chão metálico enferrujado e carro vermelho.
- **Desfazer**: Biblioteca de imagens → **↩️ Restaurar backup** com o arquivo `backup-imagens-mesa-objetos-v107-….json`.

## Objetos com desenho pronto (55)
Árvores e palmeiras (arvre1, arvre3, avre4, avreneve, avrepalmeira, arvrepalmeira2, arvreparmera3), arbusto, plantas, galhos, troncos, toco, pedras (preda1, predramusgosa1, predranova2/3/4), cristais (cristalgay1, predragay1, redragay2), cadeiras, poltrona, sofás (inclusive os em L e os hippies), camas, mesas, balcão de bar (mesa4), caixotes, tapete, chão metálico, escotilha, grade, calçamento, telhados, luminária, ossada, armadilha, túmulo, carro e caminhão.

## Próximas etapas da arte
- **v108**: chão e terrenos dos mapas (substituir as texturas atuais, inclusive a floresta de "bolas verdes") + mapas de Véspera.
- **v109**: prévias do **Cenário Atual** no mesmo estilo.

## Técnico
- Novos: `js/mesa-arte-objetos.js` (desenhista), `js/mesa-arte-ui.js` (painel), `tests/v107-arte-objetos.test.mjs`.
- `js/app.js`: carrega o painel à parte (se faltar, nada muda). `index.html`: versão.
- Imagens geradas: `personagens/<uid>/biblioteca/objetos-v107/` (WebP, 256–768 px).

## Validação
- Navegador de teste com o site inteiro e os 60 objetos reais do CSV de 22/09: 55 trocados em ~6 s (2,6 MB no total), backup baixado, 19 objetos novos adicionados e índice do banco atualizado; sem erros.
- `node --test tests/*.test.mjs`: 291 de 323 (só as 31 falhas antigas + o teste de cache da v102).

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
