# v164 — Cidade Baixa da imagem de IA, terraços como 2º andar, interiores

## Mapa "Cidade Baixa de Véspera · imagem IA"
- É a imagem nova, com riacho e sem barcos. Tem 73×54 m (20 px = 1 m).
- **Reconhecimento:**
  - à mão: 63 casas, 23 rochas e 20 escadas de fora (`arte-fonte/cidade_baixa_manual.py`);
  - automático: toldos, palmeiras e riacho (`arte-fonte/reconhecer_cidade_baixa.py`);
  - as duas partes são juntadas por `arte-fonte/montar_cidade_baixa.py`.
- Feira no meio com 6 vendedores, um para cada coisa: comida, água, bar, roupas, remédios e sucata.

## Terraços = 2º andar no mesmo mapa
- Etiqueta nova no Marcador: **🏘️ Casa com terraço (2º andar)**.
- Na rua, a casa barra a passagem. Em cima, só se anda dentro do terraço: a mureta e o vazio barram.
- Uma escada encostada num terraço vira **🪜 Subir / Descer**: liga o ponto da rua ao terraço, sem passar por dentro da casa.
- Quem está num terraço continua visível da rua. Quem está em cima vê a rua, menos o que está debaixo dos terraços.

## Interior das casas
- No Marcador, selecione uma casa (parede ou terraço) e clique em **🏠 Criar interior**. Ele cria o mapa de dentro, do tamanho da casa, com salas e móveis gerados.
- O interior fica ligado à porta. Ponha antes uma marca 🚪 Porta onde fica a entrada; sem ela, a porta vai para o lado da casa que dá para a rua.
- Casas com o mesmo nome contam como uma casa só.
- Por enquanto o interior tem só o térreo. O andar de cima é o terraço do mapa da rua.
