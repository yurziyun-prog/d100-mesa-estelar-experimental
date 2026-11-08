# Atualização 56 — Oficina 2 dentro da mesa

## Interface

“Atuar como” lista somente personagens colocados no mapa. O jogador escolhe uma ficha ausente em “Personagem para entrar”, separado do controle de atuação.

O mestre abre **Editar mapa · Oficina 2** acima do mapa. O painel reutiliza a mesma instância, controles e ferramentas da Oficina 2: pincéis, espessura, opacidade, carimbos, borracha, preenchimento, bordas, texturas, grade, linhas, formas na lateral, redimensionamento, rotação, duplicar, ordenar, fixar, recortar, importação e objetos do banco. Ao fechar, o painel volta ao lugar original sem substituir o rascunho da Oficina.

Para fazer um muro: desenhe um retângulo, selecione **3 · Personagens e muros**, marque **Bloqueia movimento** e aplique aos selecionados. A escala de visualização pode mudar; o tamanho físico do mapa é mantido nesta edição para não alterar as posições dos participantes.

As miniaturas aparecem como referência na edição. As mudanças gráficas só são publicadas em **Salvar mapa**; movimento e combate continuam sincronizados. Recolher o painel mantém o rascunho. **Recarregar cenário / descartar rascunho** recupera a versão salva. O salvamento preserva dano, fogo e alterações de posição recebidas durante a edição, e detecta outro salvamento de edição concorrente.

## Ataques pelo mestre

Há um teste específico para o mestre atacar um objeto usando a ficha de um jogador, com gasto de ação e munição uma única vez. Os novos pedidos de ataque, defesa e efeitos usam uma identificação de versão que abas antigas não processam. Isso evita que uma aba anterior aplique a antiga restrição de controle a um pedido novo. Não foi possível provar que a última recusa observada foi causada por uma aba antiga; o arquivo publicado já continha a correção de autorização.

## Publicação

```powershell
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```

Depois, fechar as abas antigas do jogo e abrir novamente ou atualizar com Ctrl+F5 nas contas do mestre e dos jogadores. A publicação não foi executada automaticamente.

## Verificações

- 92 testes de regras e regressão aprovados.
- Navegador com a Oficina 2 real: pincel/espessura, forma, camada e colisão, gravação pelo controlador da mesa, renderização dos elementos publicados e retorno do painel à Oficina original.
- Dois navegadores simulando mestre e jogador: seleção, movimento, combate, objetos, entrada e salvamento.
- Os testes de navegador usam armazenamento simulado. É necessário conferir a sessão real após publicar.
