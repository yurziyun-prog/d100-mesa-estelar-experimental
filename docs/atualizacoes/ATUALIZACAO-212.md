# Etapa 2 do GPT — Atuar como abre a visão em outra aba

Data: 26/10/2026. Continuação autorizada pelo Yuri após a etapa 1. Correção limitada à abertura da visão e preservação do papel da aba original.

Publicação Hosting concluída. Conferência pública confirmou que o índice referencia e o servidor entrega os dois módulos exatamente iguais à montagem testada (`mesa-atuar-aba.js` h=5ff8503c1cf1; `mesa-barra.js` h=8dff9d6b00d5). Sem deploy de regras ou gravação de dados da campanha. Isso confirma os arquivos publicados, não uma sessão autenticada funcionando.

## Causa encontrada no caminho real

A barra do mestre oculta o seletor legado `novaSyncPersonagem`. Ao clicar no botão Atuar como e numa miniatura, `mesa-barra.js` alterava o seletor por código e disparava `new Event('change')`. `mesa-atuar-aba.js` ignorava esse evento porque `isTrusted` era falso. O temporizador de recuperação só registrava gestos no seletor oculto; o clique na miniatura não passava por esse caminho.

Isso explica um caminho concreto em que a aba não abria. O bloqueador/configuração do Brave também pode interferir; não houve teste autenticado no Brave do Yuri nesta etapa.

## Alteração

- A barra encaminha o clique real na miniatura diretamente ao módulo de abertura, antes de qualquer espera assíncrona.
- A seleção nativa ainda abre no próprio evento confiável. Mudanças automáticas do sistema não abrem abas.
- Removidas as tentativas de abrir por polling. O timer restante apenas atualiza apresentação e o link.
- A aba original retorna para Mestre, com evento de atualização dos controles. A URL original não muda.
- Um link real “Abrir visão de …” permanece na barra visível do mestre, para recuperar a abertura quando o navegador não a confirmar. Não fica dentro do seletor legado oculto.
- IDs codificados de criaturas preservam o contrato atual de `?verComo=`; não houve alteração na interpretação de permissões ou autenticação.
- Preferência de desligar abertura automática continua respeitada; nesse caso a barra mantém o controle local anterior. Instalação repetida limpa listeners/timers do módulo anterior.

Arquivos de produto: `js/mesa-atuar-aba.js` e `js/mesa-barra.js`.

## Validação

- 22 testes de unidade/contrato aprovados: seletor e URL, barra e módulos de modo diretor/tempo real.
- `tests/atuar-aba-gesto-browser.cjs`: Edge real com bloqueador de pop-ups habilitado; gesto de teclado abre, original volta para Mestre, bloqueio simulado oferece link que abre de verdade, alterações automáticas e contexto jogador não geram abas.
- `tests/atuar-barra-aba-browser.cjs`: app montado real e banco falso; botão da barra + clique na miniatura abre a aba mesmo com seletor legado oculto. Confere destino, Mestre preservado e link visível. Destino interceptado: não valida login nem funcionalidades completas da aba filha.
- Montagem e sintaxe/imports dos 166 módulos conferidos.

Não foram alterados fichas, mapas, regras de banco, dano ou autoridade de resolução do combate.

## Conferência do Yuri

1. Atualizar https://d100-mesa-estelar.web.app com Ctrl+F5 e entrar como mestre.
2. Abrir o mapa básico, clicar em Atuar como na barra e clicar no Kael ou outra miniatura.
3. Deve abrir a visão em outra aba. A aba original deve permanecer como Mestre; mantê-la aberta para processar ataques.
4. Se a aba não abrir, usar o link “Abrir visão de …” que aparece na barra. O aviso não depende de console nem pede desativar globalmente o bloqueador.
5. Conferir login, controle, barras e ataque na aba filha. Esses pontos ainda exigem validação real; abrir uma aba corretamente não prova que o combate remoto esteja resolvido.

Parar após a publicação desta etapa e aguardar retorno do Yuri antes de iniciar outra correção. Persistência/reforma e processamento de ataque em produção continuam abertos.
