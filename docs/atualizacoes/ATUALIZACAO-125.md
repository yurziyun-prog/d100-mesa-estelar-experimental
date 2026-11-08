# Mesa Estelar v125 — Itens no mapa, bilhetes, arma derrubada, mesas e setas de mapa

## 🗄️ Armários, baús e gavetas com itens
- **Ao abrir:** aparece uma **grade de quadradinhos** com o que tem dentro. Clicando num quadradinho:
  - **📖 Ler:** só para bilhetes. O texto aparece no balão e o bilhete fica onde está.
  - **✋ Pegar:** vai para a **mochila** (ou o bolso, se a mochila estiver cheia).
- **Bilhetes guardados** ficam no inventário como "📜 Título" e podem ser lidos depois, passando o mouse sobre eles.
- **Mestre:** no balão do armário, **＋ Guardar item ou bilhete aqui** permite:
  - buscar um item do banco;
  - escrever um bilhete;
  - tirar algo da grade com o ✕.
  - Com o armário fechado, só o mestre vê o que tem dentro.

## ✋ Itens e bilhetes soltos no chão
- **Mestre:** **📦 Soltar item**, no canto do mapa → escolha o item ou escreva o bilhete → clique no lugar.
- **Jogadores:** veem ✋ (item) ou 📜 (bilhete) e, a até 2 m, leem ou pegam.
- **Itens do catálogo** colocados no mapa também podem ser pegos.

## 🫳 Arma derrubada
- **Novo efeito especial: "Desarmar (a arma cai no chão)".** Fica disponível quando o defensor tem uma arma empunhada.
- **Efeito:** a arma aparece 🗡️ no chão, ao lado de quem a perdeu, e **não pode mais ser usada** até ser recuperada. O personagem ainda pode usar outro ataque (soco, outra arma).
- **Pegar de volta gasta tempo:**
  - no combate por turnos, só na sua vez, e gasta 1 ação;
  - no tempo real, ~1,5 ação de recarga.
- **Outro personagem pode pegar a arma:** ela sai do inventário do dono e vai para a mochila de quem pegou.
- **No tempo real,** criaturas desarmadas passam a usar os outros ataques.

## 📏 Mesas no tamanho registrado
- As mesas redondas (`mesa1`, `mesa2`) voltam a **1,5 m**.
- Mesas que tinham ficado com 1,3 m (correção antiga) ou 1 m (medida que não veio) são ajustadas.
- Mesas que você redimensionou à mão ficam como estão.

## ◀ ▶ Troca rápida de mapa
- Setas dos dois lados do seletor de mapas, na barra do mestre.
- A ordem por acesso (mapas ligados por portas) entra na v126.

## Técnico
- **`js/mesa-objetos.js`:**
  - itens: `itensDentro`, `itemSolto`, `aplicarPedido('pegar')`, `aplicarPegar` numa única transação (cena + ficha + saúde + histórico);
  - `soltarNoChao`;
  - `armasNoChao`, que cria a arma no chão a partir de `combateLab.armaCaida`.
- **`app.js`:**
  - efeito `desarmar`;
  - bloqueio do ataque com arma no chão;
  - `chaveArmaV125_`;
  - ponte com `itens`, `itemInfo`, `instancia`, `guardar` e `retirarArma`.
- **`nova-direta.js`:** `gastarAcao`.
- **`mesa-tempo-real.js`:** `atrasar`.
- **`mesa-tamanhos.js`** e **`mesa-barra.js`:** setas e ganchos de ordem.
- **Versão:** `app.js?v=46.138-v125-mesa`.

## Validação
- **Navegador de teste:**
  - o mestre guardou a Pistola Laser e um bilhete no armário e soltou um recado no chão;
  - atuando como Qozae: abriu, leu o bilhete sem levar, pegou a pistola (foi para a mochila) e pegou o recado do chão (com o texto);
  - arma derrubada: apareceu no chão, foi recuperada e a trava saiu;
  - ▶ trocou para o próximo mapa.
- `node --test`: 363 de 395. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
