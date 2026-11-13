# Orla v0.58 no Mesa Estelar experimental

Este diretório integra Orla v0.58, recebida em Orla_v058_para_continuar.zip, mantendo o jogo isolado das demais abas.

- `index.html` carrega e reconstitui o HTML autocontido da v0.58 a partir de 17 partes estáticas em `parts-v058/`.
- Cada parte contém um trecho de texto Base64; juntas formam o GZIP do HTML original.
- SHA-256 do HTML reconstruído: `d14fe68f3af2faa3996f1e5ddc82cb5e702e397a6368a96a1a80c7b06233fe32`.
- `backup-v057.html` preserva o arquivo online anterior da branch, sem modificá-lo.
- Testes locais: 16 unitários aprovados, sintaxe do JavaScript aprovada, reconstituição GZIP byte a byte confirmada.
- Testes reais no navegador/deploy Cloudflare permanecem necessários. A versão 3D é experimental e o editor retorna ao 2.5D.
- A versão original autocontida também está no ZIP e pode ser aberta offline.

A página do Mesa Estelar continua apontando para `./orla/index.html`; outras abas não foram alteradas.
