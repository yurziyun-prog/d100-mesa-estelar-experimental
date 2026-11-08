# Para o ChatGPT: a reforma do mapa de teste não grava no banco REAL (26/10/2026)

## Sintoma (prints do Yuri, mapa real, banco de produção)
Em 🌿 Mapa de teste → 🛠️ Atualizar, o log mostra: "Desenhando o terreno… 💾 Salvando o mapa… 📝 Aviso do editor depois de salvar (301 KB de peças): ✏️ 1300 alteração(ões) ainda não salvas — clique em 💾 Salvar mapa. ⚠️ nenhuma cópia do banco bate com o editor (400 peças). Melhor cópia (viva): 0 peças; faltam 400". Repete 3 vezes (as "alterações" sobem 450 → 1300 → 2150: cada tentativa empilha as edições no rascunho). O backup antes da reforma é feito e fica seguro.
O mesmo mapa foi criado com sucesso no banco real, antes, pelo botão antigo "🌿 Mapa de teste" (que usa o mesmo editor). No harness local (banco falso) a reforma grava normalmente.

## O que o código faz (fatos lidos)
- `js/nova-editor.js` `save()`: `if(!enabled()||pending)return;` — `enabled` é `masterMode` = `user().master && #novaSyncPersonagem.value==='__mestre__'`. Se o seletor não está em "Mestre", **sai em silêncio** (nenhum erro). Se `pending` ficou preso, também.
- Se `enabled`, faz UMA `database.transact` que lê 3 documentos e grava 3: `combatesAtivos/mapaMesaSyncDiretaCena` (viva), `combatesAtivos/mapaMesaSyncCena_<id>` (arquivada) e `mapas/<id>` com `mesaScene` embutida (a cena inteira, ~300 KB, três vezes). Em erro chama `fail(e)`, que só escreve em `#novaSyncStatus` (mensagem "Não foi possível salvar/sincronizar: …" ou permission-denied); o texto do aviso do editor não muda.
- `js/mesa-reforma-teste.js` chama `rascunho.salvar()` e depois lê as 3 cópias para conferir por IDs.

## Hipóteses (nenhuma confirmada)
1. **Seletor fora de "Mestre"** (Kael selecionado) → `save()` silencioso. A reforma agora força "Mestre" e repete até 3 vezes; o print posterior ainda mostra o mesmo, então esta hipótese sozinha provavelmente não explica (ou o app volta o seletor para o personagem logo depois).
2. **A transação falha** e o erro fica só em `#novaSyncStatus`. Candidatos: (a) **limite de entradas de índice por documento (40.000)**: 400 objetos × dezenas de campos aninhados (`rectsV201`, `lacosV201`, `blocosV201`…) geram muitas entradas de índice de campo único por documento, nos 3 documentos; (b) tamanho do documento `mapas/<id>` (cabeçalho + `mesaScene`) perto de 1 MiB; (c) regra de segurança recusando a escrita grande/campo novo; (d) conflito de transação (retries) com os listeners.
3. `pending` preso por uma gravação anterior que nunca terminou.

## O que eu fiz
- Diagnóstico no log da reforma: mostra o texto do aviso do editor, o valor do seletor e o texto de `#novaSyncStatus` depois de cada tentativa (o Yuri ainda não mandou esse print).
- **Plano B** (publicado): se o Salvar do editor não limpar o rascunho em 3 tentativas, a reforma grava direto (`setDoc`) nos 3 lugares com a cena atual do editor, descarta o rascunho e confere por IDs. Teste no harness com o Salvar do editor quebrado: passa. **Não foi provado no banco real**, e se o problema for o limite de índices/tamanho/regra, o plano B vai falhar do mesmo jeito (a mensagem de erro dele vai para o log).

## Perguntas para o ChatGPT propor solução
1. Como confirmar a causa sem acesso ao banco? Proponha um diagnóstico mínimo no cliente (ex.: gravar um documento de teste com 400 objetos aninhados e ler o código de erro) e onde exibir o erro real do `save()`.
2. Se for o limite de **40.000 entradas de índice**: proposta para a cena (isenção de índice por campo via `firestore.indexes.json` `fieldOverrides` para `objects`/`mesaScene`, ou dividir a cena em partes de ~100 objetos como já se faz em `mapas/<id>__parte__NNNN` para o formato antigo, ou guardar a cena como texto JSON serializado em 1–3 documentos, sem campos aninhados indexáveis).
3. Se for **tamanho**: migrar `mesaScene` para fora de `mapas/<id>` (referência à cena arquivada) ou usar partes.
4. Como garantir atomicidade/ordem entre as 3 cópias e uma única fonte canônica (hoje viva, arquivada e embutida podem divergir)?
5. A 2ª aplicação da reforma ainda produz menos peças (376 em vez de 400): ver `docs/MATRIZ-DE-ESTADO.md`.

## Atualização (após as instruções de 26/10)
- O plano B (3 setDoc não atômicos) foi **removido**. `save()` do editor agora devolve estado estruturado e a reforma exibe código/mensagem originais e um relatório; para na 1ª falha e descarta o rascunho. Falta o Yuri rodar e mandar o relatório (linha "📋 Relatório da gravação").

## CAUSA CONFIRMADA (relatório do Yuri, 26/10)
`invalid-argument — Nested arrays are not supported (documento combatesAtivos/mapaMesaSyncDiretaCena)`: a cena tem `rectsV201`/`blocosV201` como arrays de arrays. Corrigido com codificação {__arrV205:[…]} na gravação e decodificação na leitura (`js/app/22-mesa-e-modulos.js`), leitores diretos tolerantes, e o banco falso do harness agora recusa arrays aninhados. Abertos: (1) [Fixos] `mesaObjetosMestre` tem o mesmo defeito; (2) migração dos documentos já gravados com arrays aninhados (não existem no banco real, pois a gravação sempre falhou); (3) proposta mais limpa: trocar o modelo de dados por objetos {x,y,w,h} em vez de codificar; (4) a 2ª aplicação (376×400) continua.
