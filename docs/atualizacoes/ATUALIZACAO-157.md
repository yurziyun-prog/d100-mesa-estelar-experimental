# Atualização 157 — Estrutura arrumada e carregamento mais rápido

O jogo funciona igual; o que mudou foi a organização e a forma de publicar.

- **Carrega mais rápido:**
  - os módulos são baixados todos em paralelo, e não mais em cadeia;
  - na segunda visita, o navegador usa o que já guardou e não baixa o código de novo. Antes ele perguntava ao servidor por cada um dos ~90 arquivos a cada abertura;
  - em teste com a demora de rede parecida com a da China, o jogo ficou pronto em 1,3 s em vez de 2,1 s.
- **Cada módulo carrega uma vez só:** cinco módulos (colisão, objetos, turnos, miniaturas, IA) eram carregados 2 ou 3 vezes por causa de números de versão diferentes nos imports.
- **Código separado por assunto:** o arquivo gigante `js/app.js` (2,6 MB, 41 mil linhas) virou 24 partes em `js/app/` (núcleo, batalha, oficina, mapas…). Na publicação elas são juntadas exatamente como eram.
- **Publicação protegida:** antes de enviar, o deploy confere a sintaxe de todo o código e se todo import existe. Se algo estiver errado, o deploy é cancelado e o site no ar não muda.
- **Pasta arrumada:**
  - notas de versão em `docs/atualizacoes/`;
  - CSVs antigos em `dados/`;
  - explicação geral em `LEIA-ME.md`.
- **Testes:** os 32 testes antigos que verificavam números de versão (agora automáticos) ou recursos já removidos saíram. Entraram testes da montagem. Resultado: 447 de 447 passando.
