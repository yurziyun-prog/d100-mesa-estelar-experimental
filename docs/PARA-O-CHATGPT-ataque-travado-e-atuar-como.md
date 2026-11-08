# Para o ChatGPT — Kael fica em "⏳ Enviando ataque…" e "Atuar como" não abre aba

Data: 2026-10-26. O Claude NÃO conseguiu reproduzir nem resolver o primeiro problema. O segundo recebeu uma correção às cegas.

## Problema 1 — o Kael não ataca (SEM solução)
**O que o Yuri vê (banco real, Brave):** mapa "🏠 Casa de teste (básico)", Kael Teste (`teste_jogador_v138`) colado na criatura Rastejante de Cinzas. Ele ataca (Espaço ou botão do balão) e o balão do Kael fica "⏳ Enviando ataque…" para sempre. O painel de ações mostra "Ação indisponível agora" (isso é só consequência: `attacking=true` bloqueia novas ações). A criatura também não ataca o Kael.

**Onde a mensagem nasce:** `js/nova-direta.js` linhas ~391-392 (`sendingActor=payload.actorId`, só limpa no `finally` de `attacks.attack`) e ~604 (balão). `attacks.attack` → `send()` em `js/nova-ataques.js` (~345): grava `combatesAtivos/mapaMesaSyncDireta/comandos/<uuid>` com `status:'pending'` e espera o status `done`/`awaiting`/`rejected`. Timeout (agora 20 s; era 35 s): "Ataque sem resposta do mestre…". Quem processa é a ABA DO MESTRE (`process()` em nova-ataques.js ~90: só roda se `user().master`) → `mesaTempoRealV111.iniciar()` (liga o tempo real) → `assumir()` (js/mesa-tempo-real.js ~251) → `resolverAtaque` (transação no Firestore).

**O que foi tentado no harness (Edge + Firestore falso):** `tests/_repro-kael.cjs` usa a ficha no formato do `criarPersonagemTesteV138_` (atributos 10, `combate:{hitLocations:{},armor:{},…}`, todas as perícias a ~50%) e a criatura colada (0,6 m). Resultado: `disparar()` devolve true, o tempo real liga sozinho, **nenhum balão fica preso**. O duelo `tests/v205-duelo-browser.cjs` também passa. Ou seja: no harness funciona; no banco real trava.

**Hipóteses, da mais para a menos provável (nenhuma confirmada):**
1. A transação de `resolverAtaque` falha no Firestore REAL e o erro não chega ao jogador (o harness é "estrito" mas não igual ao real): `undefined` em algum campo gravado (já aconteceu nesta reforma), array aninhado, ou documento de saúde `combatesAtivos/mapaMesaSyncSaude` sem o ator do Kael/criatura (criatura posta com `place(...,{instancia:true})` pode não ter ator de saúde). Peça ao Yuri o console (F12) do Brave na hora do ataque e o documento do comando (`comandos/<id>`: status/mensagem).
2. A aba do mestre não está processando: `process()` sai calado se `!user().master`, `closed` ou `running.has(id)`. Se o Yuri estava numa aba `?verComo=` (papel vira "jogador", ver js/app/01-nucleo.js ~793), ninguém processa. Confirmar qual aba ele usou.
3. `assumir()` lança antes de gravar `status` (ex.: `exigirAtaqueRT`, "Personagem não está no mapa", `dadosDe` null) — o `catch` de `process` deveria gravar `rejected`; verificar se a transação do catch também falha no banco real.
4. Kael e criatura em mapas/andares diferentes (`mapaId`, `mesaAndarV144`), então `tokens.get()` não acha um deles.

**Sugestão para resolver:** logar no `process()` (início, ramo escolhido, erro) e no `send()` (id do comando, status recebido) com `console.info('[Ataque]',…)`, pedir ao Yuri para repetir o ataque no banco real e colar o console + o documento do comando. Também fazer `send()` mostrar na mesa o `status` atual do comando.

## Problema 2 — a criatura não persegue/ataca o Kael
Causa certa (corrigida): a criatura do mapa básico nascia SEM atitude (`atitudeV200` vazio) e ficava parada. Agora `criarBasico` grava `atitudeV200:'sanguinaria'`. O Yuri precisa reconstruir o mapa (🏠 Criar mapa BÁSICO) para valer. Se mesmo assim ela não se mexer, ver `mesaAtitudesIaV200.diagnostico(token)` (mostra atitude, estado do tempo real e alvos) e `mesa-tempo-real.js mover()` (~375). A colisão entre miniaturas existe (o Yuri confirmou).

## Problema 3 — "Atuar como" não abre outra aba
`js/mesa-atuar-aba.js` abre `?verComo=<id>` num evento `change` CONFIÁVEL de `#novaSyncPersonagem`. No harness passa; no Brave real não abriu. Possíveis causas: o seleto muda sem `change` (código seta `.value`), pop-up bloqueado pelo Brave (deveria aparecer o aviso `#aaAviso`), ou o módulo em cache antigo (service worker). Correção às cegas já publicada: um vigia (400 ms) que abre a aba se o valor mudou até 6 s depois de o Yuri mexer no seletor. Alternativa sem depender do seletor: botão do painel 🌿 "🎮 Abrir o Kael em outra aba (como jogador)" (abre `?verComo=teste_jogador_v138`).

## Problema 3 (reforço) — pedido várias vezes pelo Yuri e AINDA NÃO FUNCIONA para ele
**Pedido:** ao escolher QUALQUER personagem em "Atuar como" (Kael, jogador, NPC, criatura), abrir sozinho uma aba nova onde o Yuri controla aquele personagem exatamente como um jogador controla (mesma tela, mesmas configurações, sem ferramentas de mestre). A aba original continua como mestre.
**Estado honesto:** o código existe (`mesa-atuar-aba.js` + modo `?verComo=` em `js/app/01-nucleo.js` ~793 e `mesa-tempo-real.js` modo diretor v206/v207) e passa no harness, mas o Yuri nunca viu funcionar no Brave real. Também não foi verificado que a aba nova mostra tudo "igual ao jogador" (barras, correr, ataque, mochila). Pendente para o ChatGPT/Claude: (a) descobrir por que a aba não abre no Brave (pop-up bloqueado? `change` não disparado?), (b) conferir a aba `?verComo=` com o Kael de ponta a ponta no banco real (atacar, correr, ver barras), (c) lembrar que ataques da aba de jogador só são processados se a aba do mestre ficar aberta — talvez fazer a aba do jogador também processar quando o mesmo navegador for do mestre.
