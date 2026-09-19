# Camadas e colisão — fase C / versão 48

## Comportamento

- Terreno/piso ficam abaixo dos personagens; copas ou objetos com camada superior aparecem acima. A ordem é numérica, sem limite fixo de quatro camadas. Na mesma camada, miniaturas ficam acima dos objetos.
- Personagens antigos usam camada 3. Novas posições guardam a camada fornecida pelo catálogo (3 por padrão).
- Objetos bloqueiam caminhadas apenas quando bloqueiaMovimento está ativo, não estão destruídos e têm a mesma camada da miniatura.
- Colisão considera largura, altura, rotação e raio visual da miniatura, inclusive criaturas maiores. Usa a área retangular girada do objeto e cantos arredondados pelo raio do personagem; não interpreta a transparência da imagem como contorno.
- O caminho inteiro é verificado, tanto na prévia quanto na transação que salva a posição. A transação lê o estado atual dos objetos, para que alterações simultâneas sejam consideradas. Sair de uma sobreposição antiga é permitido; avançar para dentro do obstáculo não.
- No modo Mestre, selecione um objeto na lista do editor (ou clique nele), digite a camada e clique Aplicar camada. A mudança vale apenas para aquela instância. O mestre continua podendo arrastar livremente para organizar a mesa fora do combate.
- Diálogos de defesa, áreas psíquicas e desenhos continuam acima da cena. Copas não capturam cliques do jogador sobre sua miniatura.

## Dados e publicação

Nenhuma migração manual. A fase B já fornece camada e propriedades físicas. Personagens sem camada são interpretados como 3. As regras do Firestore existentes continuam suficientes; não há arquivo de regras modificado.

A validação geométrica pertence ao cliente e à transação do aplicativo; não é uma nova proteção contra clientes adulterados. Teletransportes, ataques a objetos e bloqueio automático de visão não fazem parte desta fase.

Arquivos: js/nova-camadas.js (geometria/ordenação), js/nova-colisao.js, js/nova-direta.js, js/nova-editor.js, js/app.js, index.html e testes nova-camadas*. Próxima fase D: atacar e destruir objetos, gastar ação/munição e aplicar dureza.

## Conferência após publicação

1. Recarregue mestre e jogador com Ctrl+F5.
2. Coloque um objeto com Bloqueia movimento e camada 3. O jogador deve parar antes de encostar sua borda no objeto, mesmo clicando além dele.
3. No modo Mestre, escolha esse objeto, mude para camada 4 e aplique. Ele deve aparecer acima da miniatura e permitir passar por baixo.
4. Camada 2 deve ficar abaixo da miniatura. Voltar para camada 3 deve restaurar o bloqueio.
5. A outra conta deve mostrar a mesma posição e camada; a alteração persiste após recarregar.

Validação: testes unitários de rotação, escala, raio, cantos, sobreposição, camadas e regressão da mesa, mais navegador com mestre/jogador e edição da camada.
