# Etapa 3 — jogo contínuo, pausa do mestre e interações simples

Trabalho iniciado em 26/10 e concluído em 27/10/2026, autorizado pelo Yuri após conferir as etapas anteriores. Corrige o conjunto de problemas relatados durante o teste do Kael, sem substituir fichas, perícias, dano ou equipamentos.

## Combate

O estado podia estar ativo para um mapa antigo e/ou pausado por calmaria, fim de luta ou escolha de crítico. O início antigo recusava inicializar se `ativo` já fosse verdadeiro, mesmo nessas condições. O gancho do ataque também pulava a inicialização quando via esse flag. Isso deixava o novo ataque usando um motor incompatível com o mapa atual.

Agora o mestre mantém o motor contínuo, inicializado e reconciliado com o mapa atual. A inicialização é transacional e compartilhada entre chamadas concorrentes desta aba. Pausas antigas são migradas; só a pausa explícita de emergência permanece. Estado de turnos ativo é desativado nessa migração, sem zerar saúde ou fichas. A interface padrão não oferece iniciar/encerrar combate nem turnos. As funções antigas de regras continuam no projeto por compatibilidade.

Calmaria e fim de luta não pausam o mundo. Acertos especiais usam a seleção automática de efeitos que o motor já possuía. Erros repetidos não criam mais uma pausa automática silenciosa. Recarga, alcance, oposição, dano e atributos continuam sendo os existentes.

Também corrigido o contrato de envio: o prazo continua cobrindo escrita e resposta, mas a assinatura do comando começa depois da criação confirmada. As regras permitem ao jogador ler seus comandos existentes; observar um documento ainda inexistente podia ser recusado. O snapshot inicial entrega também uma resolução ocorrida antes de a assinatura ser criada. Timeout continua sendo resultado desconhecido, sem reenvio automático.

Não se afirma que essa tenha sido a única causa no banco do Yuri: os dados reais da campanha não foram lidos pelo GPT. As causas foram reproduzidas com o app montado e banco falso.

## Pausa de emergência

Botão do mestre: **⏸ Pausa de emergência / ▶ Retomar jogo**. O estado compartilhado usa `pausaEmergencia`, distinto das pausas legadas.

- Jogadores não podem acionar a pausa nem retomar pelo módulo.
- Caminhada por mouse/controle e confirmações de movimento respeitam a pausa; a regra do Firestore também impede atualização de posição por jogadores comuns durante ela.
- A IA de combate e a vida/rotinas/interpolação de NPCs param. A separação automática de corpos também não mexe nas miniaturas.
- O mestre continua podendo reposicionar miniaturas.
- Interações de jogador com objetos são recusadas durante a pausa. A pausa não desaparece sozinha por proximidade de inimigo ou ao mudar de mapa.

O relógio narrativo existente continua sendo uma configuração separada. Esta etapa não reescreve todos os relógios, efeitos ambientais e contadores do jogo; a validação da pausa cobre movimento, IA e combate, não uma garantia de congelamento de qualquer efeito de todos os módulos.

## Cadeira e mensagens

- Sem “Pedido enviado; a mesa aplica em instantes” no sucesso de ações comuns.
- Pedidos de objeto têm confirmação interna de conclusão/recusa e limite de espera. Sucesso é silencioso; erro e demora real chegam ao jogador. Comandos concluídos não são reaplicados ao recarregar e são limpos depois.
- Cadeira oferece Sentar; o jogador não precisa de botão Levantar e não recebe Arrastar nesse balão. Mestre mantém ferramentas de configuração.
- Caminhar encerra o repouso; levantar do próprio assento não é recusado só porque o personagem já se afastou durante a sincronização.
- O aviso do relógio parado aparece somente enquanto o relógio está parado, como solicitado. As informações de descanso continuam disponíveis.
- Ataque comum não desenha o balão técnico “Enviando ataque”. O painel deixa de mostrar mensagem genérica de indisponibilidade só porque está processando; demora anormal e falha continuam visíveis.
- Corrigido posicionamento do balão perto da borda e em redimensionamento: testado em 1280 e 390 px.

## Verificação

- 780 testes unitários/contratos aprovados. Atualizados os contratos estáticos que exigiam pausa por crítico e opção de turnos, o formato anterior do gancho e da regra de movimento, e a assinatura antiga de Atuar como. Nenhuma falha foi ocultada por pular testes.
- `jogo-continuo-browser.cjs`: espada real do CSV, estado pausado/mapa antigo e turnos antigos, execução e resolução do ataque, crítico automático, pausa persistente, bloqueio do jogador, reposicionamento pelo mestre e retomada.
- `ataque-jogador-autoridade-browser.cjs`: sender com dono de jogador distinto recebe resolução enquanto a interface da autoridade permanece em Mestre.
- `cadeira-jogador-browser.cjs`: UI de jogador e processador de objetos separado, configuração oculta, relógio condicional, sentar silencioso, levantar ao caminhar e balão dentro de 1280/390 px.
- `ataque-envio-pendente-browser.cjs`: banco que nunca confirma não deixa os controles presos e não causa reenvio automático.

Todos esses testes usam Firestore e papéis simulados. O processo de autoridade separado não equivale a duas contas autenticadas reais. Não há Java disponível para o emulador; os testes locais não comprovam permissões de produção. A publicação das regras precisa passar pelo compilador do Firebase. O retorno do Yuri no Brave continua necessário.

## Conferência após publicação

Publicado em 27/10/2026 no Hosting e nas regras do Firestore. O compilador remoto aprovou as regras após separar a consulta da pausa em função própria (limite de dez variáveis locais). Os cinco módulos principais foram baixados do site e comparados byte a byte com a compilação local; todos coincidem. Os três contratos da regra foram novamente aprovados após esse ajuste. Teste com contas reais ainda pendente.

1. Atualizar a aba do mestre com Ctrl+F5; fechar as abas antigas de jogador e abrir novamente Atuar como no Kael da casa.
2. Manter a aba do mestre aberta: a autoridade ainda executa nela; esta etapa não criou um servidor de combate independente.
3. Atacar com a espada. Acerto ou erro da rolagem devem produzir resultado, sem exigir Iniciar/Continuar combate.
4. Experimentar a pausa de emergência na aba do mestre: jogador não anda, mestre pode reposicionar. Retomar libera o movimento.
5. Sentar e clicar para andar; conferir ausência de mensagens técnicas e de controles de configuração no jogador.

As demais pendências antigas (reforma/persistência, arte, rigs e desempenho geral) não foram declaradas resolvidas por esta etapa.
