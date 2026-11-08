# Correção da etapa 2 — visão abre o mapa da miniatura escolhida

26/10/2026. Relato do Yuri: a aba abriu corretamente, mas mostrou a escadaria guardada, enquanto o Kael estava na Casa de teste.

Publicada no Hosting. Leitura pública confirmou o índice e os bytes dos módulos entregues: `nova-direta.js?h=b9e0a8a6b930` e `app.js?h=256d6807aec1`. Sem deploy de regras ou gravação de fichas/mapas de produção. Teste de navegador aprovado e 18 testes de contrato aprovados. Aguardar conferência do Yuri.

## Causa reproduzida

A montagem atual da mesa não recebia o ID do ator do modo diretor para escolher o mapa. `desiredViewMapId()` priorizava localização da ficha, combate global e fallback coletivo. A ficha pode ainda apontar para um mapa antigo mesmo depois de a miniatura ter sido colocada no mapa de teste. O modo diretor já identificava o personagem em outras partes do app, mas essa seleção não participava da escolha do mapa da mesa atual.

O teste reproduziu ficha apontando para escadaria arquivada, token na casa e mapa global também antigo. Não foi consultada a ficha de produção do Yuri: essa é a causa demonstrada no código e na reprodução local, não uma inspeção dos dados reais dele.

## Correção

- A montagem fornece `viewActor`, com o ID explícito do modo diretor.
- A visão “Atuar como” segue o `mapaId` atual do token escolhido, antes de considerar ficha antiga ou mapa coletivo.
- Enquanto o token não chega, mostra visão sem mapa em vez de carregar outro lugar; não cria nem teleporta o personagem.
- Mudanças de mapa do token atualizam a visão pela assinatura de posições já existente.
- Um combate no mapa global antigo não puxa essa visão para outro mapa.
- Política de localização do jogador comum e visão do mestre preservadas. Não houve gravação/migração de fichas nem remoção de mapas arquivados.

Produto alterado: `js/nova-direta.js`, `js/app/22-mesa-e-modulos.js`. Nenhuma regra de banco foi alterada.

## Provas

`tests/atuar-mapa-personagem-browser.cjs`: Edge com app montado real e banco falso. Exercita posição inicialmente ausente, ficha antiga, mapa antigo arquivado, miniatura na casa, combate global em outro mapa, mudança posterior de destino e preservação da política do jogador comum. Confere que a ficha e o mapa do mestre não foram alterados.

Testes de contrato de localização v92/v93/v94, modo diretor e URL também conferidos. O teste estático v92 foi atualizado porque exigia mestre e combate na mesma expressão; agora os ramos são separados para encaixar a visão explícita. A proteção funcional dessa exceção está no teste de navegador.

## Conferência do Yuri

Atualizar o site com Ctrl+F5 e abrir novamente a visão do Kael pela aba do mestre, com ele na Casa de teste. A aba deve mostrar essa casa e o Kael, sem reaplicar reforma nem apagar a escadaria. Conferir também um deslocamento curto. Esta etapa corrige seleção de mapa; o combate real ainda precisa ser validado separadamente.
