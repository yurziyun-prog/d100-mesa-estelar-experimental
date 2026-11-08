# Para o ChatGPT ler e propor melhorias — rodada de 24–25/10/2026

Escrito pelo Claude. Cada item diz o que foi feito, o que NÃO foi provado e o que ficou aberto. Ambiente de todos os testes: **harness local** (Edge sem cabeça, Firestore falso, papéis de mestre/jogador simulados). Nada foi validado com autenticação real, duas contas, rede real ou controle físico.

## 1. O que foi feito (resumo)
- Cursor do mouse por modo; Kael/personagem de outro mapa pode ser trazido ao mapa de teste (com saída 🚪➜); movimento: animação agora segue o corpo na tela.
- Névoa automática (só escuro/noite/neblina), borda exata e gradiente; claro de dia = sem névoa.
- Topo de caverna orgânico (SVG procedural), sombras das rochas, contorno marrom fino, grama em células de 1 m.
- 11 miniaturas que faltavam (criatura1–7, metamorfo1–4), receitas e medidas **propostas** (o bestiário não descreve essas criaturas).
- Painel único "🌿 Mapa de teste", barra do mapa com rótulos + "⋯ Mais" + "❓ Ajuda", botão "Guardar todos os mapas (menos o de teste)".
- Trecho de teste (casa e ruínas): sombras projetadas, poças de luz quente, contorno fino.
- Lava: causa do teste que falhava confirmada (ponto de teste sobre a ponte); teste corrigido.
- Sessões filhas: duelo jogável (causa do "Enviando… e nada") e vegetação (variantes de tronco/raiz/planta).

## 2. Problemas e dúvidas abertas (para o ChatGPT propor melhorias)
1. **Bestiário com dados quebrados** (`dados/banco_criaturas_2026-09-26.csv`): as 11 criaturas placeholder (`criatura1–7`, `metamorfo1–4`) não têm nome, espécie, medida, perícias nem ataques, então **não agem** no tempo real; e linhas como `besta_ululante` têm colunas deslocadas (`armasTexto` contém perícias; os ataques estão em `alcancesAtaques`). Não alterei o CSV (dado do Yuri). Propor: formato único, validador do CSV e ataque padrão por tamanho/anatomia para criaturas sem dados.
2. **Testes intermitentes**: `tests/v200-app-real-browser.cjs` (direção costas/frente da aparência 3D do rig) falha em ~metade das rodadas, **também sem** a minha mudança de `tokenVisual`; `tests/v205-ecossistema-browser.cjs` falhou 1 vez (habitat aquático); o teste do duelo derrubou o navegador 1 vez em ~5. Falta reproduzir com semente fixa e medir a trajetória, não só o destino.
3. **Animação "arrastando" do Kael**: só reproduzi com atraso de rede simulado no harness; a correção (`tokenVisual`) não foi testada em rede real. Hipótese dos dois escritores da posição (IA do mestre × controle do jogador) continua **não comprovada**.
4. **Sombras/luz**: só no trecho (casa e ruínas); desempenho não medido; poças de luz não se integram às luzes do módulo Visual do mapa nem à névoa (a luz da lâmpada não "abre" a névoa); sombras não respeitam andares nem teto aberto/fechado.
5. **Névoa**: não existe o modo "claro com oclusão" (árvore/casa escondendo o que está atrás); cone/raio de lâmpadas do mapa não entra no gradiente; sem teste com jogador real.
6. **Reforma do mapa salvo**: toda novidade do gerador exige o Yuri reaplicar 🛠️ (backup antes). A trava de backup recusa se não achar cena; num mapa novo vazio ela deixa passar só se existir algum documento de cena.
7. **Barra do mapa**: quais botões são "pouco usados" foi decisão minha (`RAROS_ID`/`RAROS_TITULO` em `js/mesa-barra-organizada.js`); o Yuri pode discordar. A barra de ícones só ganhou rótulos; as faixas de cima e de baixo continuam vindas de módulos diferentes (ids `mbBarra`, `mb-g`, `mdAtalhos`).
8. **Instagram**: o link pedido pelo Yuri exigiu login/cookies e não abriu no navegador do app; usei só os prints da pasta Screenshots (`docs/INSPIRACAO-MAPAS.md`).
9. **Combate contínuo estilo videogame**: só proposta (`docs/PROPOSTA-COMBATE-SIMPLES.md`); o motor atual foi consertado, não substituído.
10. **Vegetação**: a sessão de vegetação trocou as peças reprovadas por variantes novas; a aprovação do Yuri pela imagem ainda falta (`docs/antes-depois/relevo-var-*.png`).
11. **Relógio da máquina**: o `date` e a minha contagem de tempo divergiram; não influencia o jogo.

12. **Testes de navegador antigos que falham** (rodada de 25/10, harness): `v203-ecossistema` ("criaturas e NPCs colocados no mapa novo: 0"), `v204-percurso-jogador` (subir ao planalto/2º andar) e `v204-reforma` (a 2ª aplicação da reforma: "o banco guardou N peças em vez de M", N varia entre rodadas: 381/400, 421/422; passa em cerca de 1 de 3). Descartado como causa: sombras/luz, grama de 1 m (reverter para 2 m também falha às vezes), ids dos itens. Um passo `decor` com 22 itens que eu havia acrescentado ao gerador piorava isso e foi removido, mas a falha continua: hipótese aberta = mesclagem de poças/objetos no editor e conferência de contagem por `res.esperado`. Cuidado: usar o 🛠️ Reformar duas vezes seguidas no mapa real pode recusar (o backup fica seguro).
13. **Navegador do app com a aba do Instagram aberta** consumiu CPU e fez os testes de navegador falharem por tempo; fechei a aba.

## 3. Onde olhar
`docs/PROBLEMAS-NAO-RESOLVIDOS.md`, `docs/NAO-VALIDADO.md`, `docs/atualizacoes/ATUALIZACAO-205.md` (adendos por data), `docs/INSPIRACAO-MAPAS.md`, `docs/PROPOSTA-COMBATE-SIMPLES.md`.
