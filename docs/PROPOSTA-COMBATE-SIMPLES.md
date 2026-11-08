# Proposta: combate mais simples e dinâmico (estudo — nada disto foi implementado)

Motivo: o Yuri não consegue simular uma luta com boneco de teste ("enviando" e depois nada). O guia dele autoriza adaptar o combate para algo próximo de videogame, **mantendo as fichas** (atributos, perícias, equipamento, condições).

## Passo 1 — fazer o motor atual completar UM duelo (antes de mudar regras)
1. Fixture de ficha válida no harness (caminho `personagens/<id>` lido por `novaFicha_`) criada pela fábrica real do projeto.
2. Percurso medido: personagem selecionado → token → dono/permissão → ficha → arma/perícia → alvo → validação de alcance/nível → resolução → defesa → saúde/animação.
3. Mensagens úteis para cada falta (sem arma, sem ficha, sem permissão, sem munição, mestre offline) no lugar de "Enviando…".
4. Área de treino com estado de saúde separado (não grava nas fichas) e botão "reiniciar".

## Passo 2 — modo de ação contínua (opt-in, só treino no começo)
- Intenção → preparação → janela de contato → recuperação; um id por golpe (sem dano duplicado por rede).
- Alcance em metros + arco; linha de visão; sobreposição de nível (superfície não acerta subsolo).
- Defesa: bloqueio/esquiva com resposta visual, sem diálogo por golpe.
- IA mínima: perceber → aproximar → preparar → atacar → recuperar.
- Uma autoridade de resolução por luta (hoje: o cliente do mestre).
