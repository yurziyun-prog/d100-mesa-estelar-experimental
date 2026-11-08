# D100 · Mesa Estelar (mesa-sync) — instruções para o Claude

Site de RPG de mesa online (ficção científica) que o Yuri Yung usa para mestrar a campanha dele: mapas, miniaturas, batalha, fichas, mercado, conversas. Responda sempre **em português**, de forma concisa e sem jargão. Quando pedir que ele faça algo fora daqui, explique o caminho passo a passo.

## Regra principal
**Cada atualização tem de deixar o site funcionando e jogável**, mesmo se o trabalho for interrompido no meio. Trabalhe em passos pequenos, cada um completo e testado.

## Como o projeto é
- Leia `LEIA-ME.md` primeiro: ele tem o mapa das pastas.
- O código principal fica em `js/app/NN-assunto.js` (01 núcleo … 24 localização e mapas). As partes viram um `app.js` só, na ordem do nome. **Não crie um `js/app.js` solto.**
- Módulos da mesa: `js/mesa-*.js` e `js/nova-*.js`.
- `index.html`: página do jogo (HTML e estilos). `firestore.rules`: regras do banco.
- `scripts/preparar-hosting.cjs` monta a pasta `.firebase-public` no deploy, confere sintaxe e imports e cancela o deploy se algo estiver errado. Os `?v=` dos imports são automáticos.
- Testes: `node --test tests/*.test.mjs`; os `tests/*-browser.cjs` testam no navegador (Playwright).
- `docs/atualizacoes/ATUALIZACAO-NNN.md`: nota de cada versão. Ao terminar, crie a próxima com o que mudou.
- `_entregas/`: cópias de segurança (`backup-antes-vNNN.tgz`). Antes de uma mudança grande, faça uma nova.
- A pasta é um repositório git: faça commits pequenos e descritivos, em português.
- `arte-fonte/imagens-ia/`: o Yuri coloca aqui imagens novas de mapas (geradas por IA) para virar mapa jogável.

## Publicar (quem publica é o Yuri)
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
Sempre diga o que mudou e o comando exato.

## Preferências do Yuri
- Foco em deixar o jogo **funcional** (mestrar, criar mapas e histórias), não em arte. Os mapas ele mesmo cria; imagens e texturas ele pede ao GPT.
- Ele deu liberdade para melhorar como achar melhor: mais mapas, cenários, imagens, miniaturas, efeitos.
- Miniaturas no mapa: **realistas, vistas de cima**, não fichas redondas.
- A página não pode "pular" ao clicar ou marcar algo (nada muda de posição de repente). Elementos alinhados e espaço bem aproveitado.
- Testar em 1280 px e 390 px: sem erros no console e sem rolagem lateral.

## A campanha
- História do jogo em `_historia/historia-do-jogo.txt`.
- Personagens dos jogadores: **Qozae** (reptiliano com cara de jacaré, caubói), **Jullytrath** (drakoniana: mulher dragão humanoide com asas e cauda, não voa), **Kibi** (humanoide pequeno parecido com gnomo, variação de humano), **Sérgio Leone** (pistoleiro espacial sempre de capacete, acompanhado de uma galinha).
