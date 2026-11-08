# Etapa 1 do GPT — ataque não pode ficar em “Enviando…” indefinidamente

Data: 26/10/2026. Publicada no Firebase Hosting pelo GPT após autorização expressa do Yuri. Regras e dados não foram publicados/alterados por esta etapa. O Yuri também autorizou iniciar a etapa seguinte.

## Causa reproduzida

Em `nova-ataques.js`, `send()` esperava `database.writeMap()` antes de criar o timeout e registrar o pedido na lista de esperas encerráveis. Se o banco não confirmasse a escrita, o timeout de 20 s nunca começava; fechar a sessão também não encerrava essa espera. Em `nova-direta.js`, `attacking` e `sendingActor` só eram limpos quando essa promessa terminava.

Esse defeito foi reproduzido em teste com escrita que nunca termina. Não prova que seja a única causa dos ataques do Kael falharem em produção.

## Correção

- O prazo de 20 s agora cobre envio e resposta, desde o início do pedido.
- A resposta é observada antes de enviar. Uma resposta rápida pode concluir o pedido mesmo antes de a promessa da escrita terminar.
- Fechar a sessão encerra também pedidos ainda aguardando confirmação de escrita.
- Assinatura e timer são limpos ao concluir, falhar ou encerrar; falhas tardias da escrita são consumidas, sem reenvio automático.
- Erros do banco mantêm seu código original. O timeout distingue envio não confirmado de envio confirmado sem resposta do mestre, informa o ID do comando e que o resultado ainda é desconhecido.
- A mesa usa “sem confirmação” nesses casos, em vez de afirmar “não realizado”. Um timeout não cancela uma escrita já enfileirada no SDK: o comando pode ser processado depois. Conferir o histórico antes de repetir.

Não foram alteradas regras, fichas, mapas, dano, permissões ou a autoridade do mestre.

## Validação

- `tests/ataque-envio-pendente.test.mjs`: cinco cenários determinísticos aprovados; quatro falhavam antes da correção. Incluem escrita sem resposta, fechamento, recusa do banco, resposta antes do término da escrita e mestre sem resposta.
- `tests/nova-ataques.test.mjs`: 15 testes aprovados na repetição. A primeira execução apresentou uma falha no resultado de cura de Primeiros Socorros; o teste usa semente de comando aleatória e a repetição passou. Não foi corrigido nem declarado determinístico nesta etapa.
- `tests/ataque-envio-pendente-browser.cjs`: app montado real no Edge, banco falso; comando sem confirmação, balão removido, controles liberados, aviso de resultado desconhecido e nenhum reenvio automático. A abertura do Edge precisou ocorrer fora do sandbox.
- Montagem em memória: sintaxe e imports dos 166 módulos conferidos. Sem publicação nem alteração de regras.

## Como conferir após publicar

Publicar somente Hosting, conforme fluxo do projeto (não precisa publicar regras para esta correção):

```powershell
cd "C:\Users\yurzi\Documents\Codex\2026-09-09\referenced-chatgpt-conversation-this-is-an\work\mesa-sync"
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```

O deploy publica o estado local do site inteiro. Publicação Hosting concluída pelo GPT em 26/10/2026, com montagem e validação dos módulos; sem deploy de regras.

1. Atualizar o site e abrir o mapa básico com o Kael de teste, preservando a aba do mestre.
2. Tentar um ataque normal. Se resolver, conferir dano/defesa normalmente.
3. Se faltar confirmação, esperar até cerca de 20 s com a aba ativa: o balão deve desaparecer e o painel deve explicar se faltou confirmação do banco ou resposta do mestre. Enviar o texto e a referência do comando se ainda houver falha.
4. Não repetir imediatamente um ataque sem confirmação: ele ainda pode executar depois. O objetivo desta etapa é remover o bloqueio indefinido, não mascarar uma falha de resolução como ataque bem-sucedido.

## Continua aberto

Diagnosticar o processamento do ataque no banco real, “Atuar como” no Brave, reforma/persistência e demais itens da matriz. Aguardar a conferência do Yuri antes de começar a próxima etapa. Não apagar estes itens por causa do sucesso local.
