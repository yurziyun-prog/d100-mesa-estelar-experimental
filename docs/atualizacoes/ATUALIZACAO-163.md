# v163 — Lojas por comerciante, Denzel no portão e Marcador de áreas

## O que cada comerciante vende
- Cada comerciante do mapa tem a sua loja, com um ou mais ramos: água e bebidas, comida, mantimentos de viagem,
  armas e munição, armaduras, peças e ferramentas, tecnologia, remédios, roupas, exploração, curiosidades e bar.
- Já vem com um padrão:
  - lojas do portão pelo nome;
  - caravaneiros vendem mantimentos;
  - os outros comerciantes recebem um ramo em rodízio, começando por comida e água.
- Feira grande tem um vendedor para cada coisa. A loja "Água e comida" dos portões ganhou um segundo vendedor, só de comida.
- O mestre muda o que cada um vende:
  - botão 🧾 na barra de cima: lista os comerciantes do mapa, com os ramos para ligar e desligar;
  - na própria loja, painel "O que este comerciante vende": ramos, nome da loja, itens de acesso Militar e itens postos ou tirados um a um.
- Comerciantes com nome (UR-17, Hessa…) continuam com o estoque do banco até o mestre escolher ramos para eles.

## Denzel
- Clicar no Denzel abre o pedágio, nunca a loja. Se ele também vender coisas, há um botão "Ver o que o Denzel vende".
- Se a conta do mestre não estiver com o site aberto, o balão avisa que está esperando o mestre. É o navegador do mestre que rola os dados.
- Agora há um Denzel também nos mapas novos do portão ("nossa arte" e "imagem IA"). Ele fica parado no portão.

## Marcador de áreas (🖌️, só o mestre)
Serve para transformar uma imagem, por exemplo uma gerada por IA, num mapa jogável.
- **Como marcar:**
  - retângulo, arrastando;
  - polígono, clicando nos cantos;
  - varinha, que pega a área de cor parecida (com tolerância e alcance).
  - Para mudar uma marca: selecionar e trocar a etiqueta, o nome, ou apagar.
  - Desfazer: Ctrl+Z.
- **Etiquetas:**
  - parede e rocha bloqueiam o movimento e a visão;
  - móvel e água bloqueiam só o movimento;
  - porta abre passagem;
  - escada;
  - teto: a imagem fica por cima e some quando um jogador entra embaixo;
  - por cima (toldo, varal, galho) e planta: os personagens passam por baixo;
  - tapete.
- **Apagar da imagem:** arraste sobre o que quer sumir e clique num chão limpo. Esse pedaço é copiado por cima, com a borda suave. Depois clique em "Salvar imagem".
- **Aplicar no mapa:** as marcas viram o mapa. Paredes invisíveis, uma imagem só com as coisas "por cima" e os tetos recortados.
- **Salvar como peça:** o pedaço marcado vira objeto do Banco de Objetos de Mapa, para usar em outros mapas.
- **Novo mapa de uma imagem:** envia a imagem, você diz a largura em metros e o mapa é criado.

## Mapa "Portão de Véspera · imagem IA"
- Feito com a imagem da IA (`arte/mapas/portao-ia.webp`, 32×48 m).
- Já tem o meu primeiro reconhecimento: 35 casas, rochas, portão, 66 toldos e 48 plantas por cima, e escadas.
- Tem Denzel e 7 vendedores: água, comida, mantimentos, peças, roupas, remédios e armas.
- Tem as saídas do Portão pintado: subida para a cidade passando o portão, e o espaço-porto embaixo.
- A camada "por cima" foi feita por `arte-fonte/acima_ia.py`.
- O Portão pintado continua sendo a entrada oficial.
