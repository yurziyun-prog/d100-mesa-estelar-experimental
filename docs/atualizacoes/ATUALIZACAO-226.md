# Orla como aba do Mesa D100 — 19/11/2026

A entrada experimental agora abre o Mesa original, com seu login e suas abas. Orla é uma aba nativa, ao lado de Ficha, Cenário Atual e Mapa da Mesa; a mesa atual não foi aposentada. A Orla integrada usa o cenário semi-3D detalhado original, e não o protótipo 3D separado.

A ponte recebe apenas identidade, papel e nome/ID do personagem selecionado pelo Mesa. Não transmite senha ou token nem abre outro login. Mestre entra como Deus. Jogador usa o personagem próprio selecionado em Ficha (ou o único personagem ativo); NPCs não entram nessa escolha. Ao sair da conta, o quadro é removido. A exploração continua local: inventário, combate e posições ainda não são sincronizados com a ficha real nem entre computadores. Essa ligação será feita gradualmente.

O protótipo online anterior permanece preservado, identificado como em revisão. O bloqueio por falta de sincronização dessa experiência não afeta a exploração local da aba Orla. Não declarar o defeito online resolvido por essa integração.

Testes de abertura agora conferem a entrada pelo Mesa, presença das abas anteriores e a integração de Deus/personagem próprio/saída da conta usando um contexto de teste, sem contas reais. Permanecem os testes do carregador, integridade, desktop/celular, regressões da Orla, Mesa e protótipo online.

A tentativa dfa721a passou no GitHub, mas o Cloudflare reportou falha de build sem detalhes no check público. A montagem e abertura do pacote final, já aprovadas localmente, passam também a ser obrigatórias no GitHub/Linux para verificar o mesmo artefato antes do deploy. Não atribuir a falha a uma causa sem o registro detalhado.


Publicação f629962 confirmada no domínio público: integridade, abertura desktop/celular, Mesa original, abas e ponte de conta passaram. A verificação foi ajustada para aceitar /mesa, endereço canônico do Cloudflare, além de /mesa.html. O timeout anterior era da expectativa do teste, não da abertura do site. A validação de papéis usa contexto de teste; não equivale a ensaio multiplayer real.

