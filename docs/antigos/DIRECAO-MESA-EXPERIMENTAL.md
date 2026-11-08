D100 MESA ESTELAR — PRÓXIMA ETAPA DE DESENVOLVIMENTO
MESA EXPERIMENTAL / SINCRONIZAÇÃO NOVA

Estamos trabalhando na MESA EXPERIMENTAL.

Nesta fase você pode ser relativamente agressivo na refatoração da Mesa Experimental.
Prefiro uma arquitetura limpa a manter compatibilidade interna com patches antigos.

Porém:
- não destrua dados persistentes do Firebase;
- faça migração de schema quando necessário;
- não altere a Mesa oficial sem eu pedir;
- não volte a empilhar wrappers no fim de app.js;
- trabalhe preferencialmente nos módulos nova-* da sincronização nova;
- se precisar criar novos módulos, pode criar.

Antes de editar:
1. examine os arquivos atuais;
2. confirme qual build está carregado;
3. veja git status / git diff;
4. identifique quais partes pertencem à sincronização nova;
5. não use o sistema legado da antiga Mesa como estado principal.

============================================================
PRINCÍPIO DE ARQUITETURA
============================================================

A sincronização nova é a base.

Não reative o antigo labEstado_ como autoridade do mapa.

O estado compartilhado deve continuar separado aproximadamente em:

- mapa;
- posições de tokens;
- combate;
- saúde/estados;
- objetos/cenário;
- comandos.

Objetos do cenário precisam agora se tornar entidades de gameplay reais.

Eu quero que mapa, inventário, objetos, combate e exploração façam parte do mesmo mundo persistente.

============================================================
PARTE 1 — REFORMAR A FICHA DE CRIATURAS
============================================================

Antes de corrigir individualmente ataques como Eco da Matilha, quero corrigir a estrutura das criaturas.

Hoje existe uma ambiguidade.

Na interface aparece algo como:

Combate Desarmado:69

e a interface diz que 69 é o valor percentual usado no teste.

Porém parte do código trata 69 como investimento e soma novamente a base dos atributos.

Isso faz valores chegarem facilmente a 100.

Quero substituir esse sistema.

Cada PERÍCIA de criatura deve aparecer numa linha/tabela:

PERÍCIA | BASE | TREINO | TOTAL

Exemplo:

Combate Desarmado | 39 | 30 | 69

BASE:
calculada automaticamente pela fórmula normal da perícia usando os atributos daquele indivíduo.

TREINO:
valor editável armazenado no modelo da criatura.

TOTAL:
Base + Treino.

É o TOTAL que deve ser usado em TODOS os testes.

Fazer o mesmo para Especializações:

ESPECIALIZAÇÃO | BASE | TREINO | TOTAL

Não quero digitar manualmente o Total.

============================================================
ATRIBUTOS INDIVIDUAIS DAS CRIATURAS
============================================================

Já existe a possibilidade de usar fórmulas como:

3d6+8
3d6+4
2d6+6

Isso deve ser preservado e integrado de verdade ao sistema.

O modelo da espécie guarda:

- fórmulas dos atributos;
- treino das perícias;
- treino das especializações;
- ataques naturais;
- demais características.

Quando uma NOVA criatura dessa espécie entrar no jogo:

1. rolar os atributos daquela instância;
2. guardar os atributos individuais;
3. calcular Base de cada perícia;
4. somar Treino;
5. obter Total daquele indivíduo.

Portanto duas Bestas Ululantes podem ter:

Besta A:
Base 38 + Treino 30 = 68

Besta B:
Base 42 + Treino 30 = 72

O treino pertence ao modelo.
Os atributos pertencem ao indivíduo.
O total é calculado para o indivíduo.

============================================================
MIGRAÇÃO DAS PERÍCIAS ANTIGAS
============================================================

Os registros antigos usam strings como:

Atletismo:58|Percepção:62|Combate Desarmado:69

O significado é ambíguo.

Não destrua os dados.

Crie um caminho de migração explícito.

Como a interface antiga dizia que esses números eram valores percentuais finais, trate-os como TOTAL LEGADO para fins de migração.

Ao migrar um modelo:

Treino novo = Total legado - Base de referência do modelo.

Nunca permitir treino negativo:
mínimo 0.

Depois salvar no formato novo.

Marcar o modelo como schema novo para não migrar novamente.

Eu enviarei posteriormente um CSV corrigido para as criaturas, então não precisa tornar essa migração perfeita para todos os casos imagináveis.
Ela precisa apenas preservar razoavelmente os dados atuais.

============================================================
ATAQUES NATURAIS DAS CRIATURAS
============================================================

Ataques naturais continuam separados das perícias.

Exemplos:

Mordida
Garras
Patada
Eco da Matilha
Cauda

Ataque natural guarda coisas como:

- dano;
- alcance;
- propriedades;
- área;
- efeitos;
- som;
- animação.

Mas o teste deve usar uma PERÍCIA ou ESPECIALIZAÇÃO vinculada.

Já existe a ideia de vínculo:

perícia → ataques.

Preservar e melhorar isso.

Exemplo:

Combate Desarmado
→ Mordida
→ Patada
→ Eco da Matilha

Nesse caso todos usam o TOTAL atual de Combate Desarmado daquele indivíduo.

Não colocar “Eco da Matilha = 70” diretamente no ataque se já existe uma perícia apropriada.

Se um ataque tiver vínculo próprio, usar o vínculo próprio.

Se for um ataque natural comum sem vínculo explícito:
usar Combate Desarmado por padrão.

============================================================
ECO DA MATILHA
============================================================

Atualmente aparece:

base 100

Isso está errado.

A Besta Ululante tem Combate Desarmado registrado aproximadamente em torno de 69 no sistema legado.

Depois da reforma:

Eco da Matilha usa o TOTAL real de Combate Desarmado da Besta individual.

Ele NÃO possui 100 automático.

Preservar suas demais regras existentes:
- ataque em cone;
- alcance;
- defesa;
- efeito sonoro/especial;
- demais consequências já implementadas.

============================================================
PARTE 2 — OBJETOS INTERATIVOS NA SINCRONIZAÇÃO NOVA
============================================================

Quero trazer para a sincronização nova as propriedades de objetos que existiam na Mesa antiga.

Isso vale para:

A) objetos adicionados pelo catálogo “Adicionar ao mapa”;

B) objetos que já vieram salvos dentro do mapa carregado.

Ambos precisam usar o mesmo schema canônico de objeto.

Um objeto de cena pode ter:

id de instância
modeloId
nome
imagem
x
y
largura
altura
ângulo
camada

material
peso

pvMax
pvAtual
dureza
destrutível

inflamável
inflamabilidade
pegandoFogo
estado do fogo

bloqueiaMovimento
bloqueiaVisao

fixoAoMapa

eventuais recursos minerais
eventuais itens/recursos internos

Outros campos podem existir conforme a necessidade.

============================================================
MODELO x INSTÂNCIA
============================================================

O banco define o MODELO.

Exemplo:

Árvore:
PV 40
Dureza 5
Madeira
Inflamabilidade 3
etc.

Quando colocada no mapa, vira uma INSTÂNCIA.

A instância possui estado próprio:

pvAtual
pegandoFogo
posição
ângulo
recursos restantes
etc.

Se duas árvores usam o mesmo modelo:
danificar uma NÃO danifica a outra.

Ao carregar mapa salvo:
hidratar propriedades ausentes a partir do modeloId.

Mas nunca sobrescrever estado legítimo da instância.

Exemplo:

pvAtual = 12

não pode voltar para 40 só porque o modelo tem 40.

Especialmente:
pvAtual = 0 deve continuar 0.

============================================================
PARTE 3 — SISTEMA DE CAMADAS
============================================================

Adicionar propriedade numérica:

camada

Tanto modelos de objeto quanto instâncias no mapa devem poder ter camada.

Tokens/personagens começam por padrão na:

CAMADA 3.

Conceito:

CAMADA 1
Terreno/base.

Exemplos:
- chão;
- areia;
- grama;
- água visual;
- terreno-base.

CAMADA 2
Superfície/decorativo baixo.

Exemplos:
- tapete;
- piso;
- manchas;
- placas no chão;
- decoração plana.

O jogador passa por cima.

CAMADA 3
Plano normal dos personagens.

Exemplos:
- personagens;
- pedras;
- troncos baixos;
- paredes;
- muros;
- móveis sólidos;
- portas;
- caixas.

Se um objeto da camada 3 tiver:

bloqueiaMovimento = true

a miniatura da camada 3 NÃO pode atravessá-lo.

CAMADA 4
Elementos acima do personagem.

Exemplos:
- copa de árvores;
- galhos;
- teto parcial;
- toldos;
- passarelas elevadas.

Personagens da camada 3 passam POR BAIXO desses elementos.

Uma árvore pode portanto estar na camada 4.

Assim:
- não impede o personagem de entrar sob a copa;
- visualmente aparece acima da miniatura;
- pode ajudar a esconder o personagem.

Não limitar o sistema permanentemente a 1–4.
O campo deve ser numérico e extensível.

============================================================
COLISÃO
============================================================

A regra principal deve ser:

objeto bloqueia movimento quando:

bloqueiaMovimento = true
E
ele ocupa uma camada relevante para colisão com o token.

Por padrão:
token camada 3 colide com obstáculo camada 3.

Token camada 3:
passa por objetos camada 1, 2 e 4.

No futuro pode haver personagens voando ou em outro nível, por isso não escrever uma regra impossível de ampliar.

Usar geometria real do objeto quando possível.

Não apenas centro-centro.

============================================================
BLOQUEIA VISÃO
============================================================

O campo existente:

bloqueiaVisao

deve finalmente ter função.

Ele é diferente de bloqueiaMovimento.

Exemplo:

árvore camada 4:
não bloqueia movimento;
pode bloquear/obscurecer visão.

parede camada 3:
bloqueia movimento e visão.

tapete camada 2:
não bloqueia nada.

Não precisa implementar agora um sistema extremamente complexo de linha de visão 3D.

Mas estabelecer um sistema real de oclusão/visibilidade que possa crescer depois.

============================================================
PARTE 4 — SOMBRA / FOG OF WAR MANUAL DO MESTRE
============================================================

Quero uma ferramenta de SOMBRA no mapa.

O mestre pode criar regiões que os jogadores NÃO podem enxergar.

Para o mestre:
a sombra pode aparecer translúcida e editável.

Para jogadores:
ela deve ser opaca e esconder o conteúdo que está embaixo.

O mestre pode:
- adicionar;
- mover/editar;
- apagar/remover.

Essas sombras devem ficar salvas com o mapa.

Começar simples é aceitável.

Por exemplo:
- retângulo;
- círculo;
- polígono;
ou pincel.

Não precisa implementar linha de visão automática nesta primeira versão.

É essencial apenas existir FOG OF WAR manual persistente.

Guardar isso separado dos desenhos decorativos.

Exemplo de estrutura:

fogAreas / sombrasGM

Não misturar com objetos de gameplay.

============================================================
PARTE 5 — ATACAR OBJETOS DURANTE COMBATE
============================================================

Objetos destrutíveis podem ser alvos durante combate.

Exemplos:

árvore;
porta;
caixa;
pedra;
parede.

Ao selecionar um objeto e atacar:

- consumir AÇ normalmente;
- consumir munição/carga normalmente;
- tocar efeito visual;
- tocar som;
- aplicar dano.

Objeto imóvel não precisa Esquiva.

Não fazer defesa ativa de uma árvore.

Aplicar:

dano bruto
- dureza aplicável
= dano em PV.

Respeitar propriedades de arma/material já existentes quando possível.

Se objeto chegar a 0 PV:
marcar destruído.

Objeto destruído:
- deixa de bloquear movimento;
- deixa de bloquear visão, salvo se o tipo justificar o contrário;
- ações incompatíveis deixam de aparecer.

Não deletar automaticamente do mapa, porque posso querer ver os restos.

============================================================
PARTE 6 — FOGO
============================================================

Portar para a sincronização nova as regras de fogo que já existem no sistema antigo, em vez de reinventá-las do zero.

Objeto inflamável pode pegar fogo.

Usar:

inflamável
inflamabilidade
material
PV
estado do fogo

O fogo precisa:

- sincronizar entre telas;
- possuir efeito visual;
- poder causar dano;
- poder destruir objeto;
- interagir com personagens quando apropriado.

Se já existir código funcional antigo de propagação/dano:
extraia a regra pura e adapte ao novo estado.

Não volte a usar o estado compartilhado antigo.

============================================================
EXTINTOR / APAGAR FOGO
============================================================

Equipamento adequado deve gerar ação contextual:

Apagar fogo

Exemplo:

objeto em chamas
+
Extintor equipado/disponível
=
Apagar fogo.

Água ou outros métodos podem futuramente funcionar.

Não mostrar “Apagar fogo” se o personagem não possuir um método válido.

Usar a lógica existente de extintor quando houver.

============================================================
PARTE 7 — AÇÕES DE EXPLORAÇÃO EM OBJETOS
============================================================

FORA DE COMBATE, objetos apropriados podem gerar ações contextuais.

ÁRVORE / MADEIRA
+
Machado
=
Lenhar

PEDRA / ROCHA
+
Picareta
=
Minerar

Mineração física usa por padrão:

Força Bruta.

Se o personagem possui investimento REAL em Mineração:
pode também utilizar Mineração quando a regra permitir.

Perícias profissionais sem investimento não podem ser usadas.

============================================================
LENHAR
============================================================

Lenhar:

- exige madeira/objeto apropriado;
- exige machado;
- usa Força Bruta;
- reduz PV do objeto;
- respeita dureza/ferramenta;
- gera resultado no histórico.

Recuperar as regras antigas já discutidas quando estiverem no código.

============================================================
MINERAR FISICAMENTE
============================================================

Minerar fisicamente:

- exige pedra/minério;
- exige picareta;
- usa Força Bruta por padrão;
- reduz PV da rocha;
- respeita dureza.

Se personagem possui Mineração treinada:
pode haver alternativa técnica conforme regra existente.

Não mostrar Mineração para quem tem treino 0.

============================================================
PROSPECÇÃO MINERAL
============================================================

Mineração também é uma perícia PROFISSIONAL de conhecimento.

Ela deve possuir ação diferente:

PROSPECTAR.

Prospectar NÃO significa quebrar a pedra.

Serve para descobrir depósitos.

Somente personagem com investimento real em Mineração pode usar.

Objeto/terreno pode conter dados ocultos como:

depositosMinerais: [
  {
    recursoId,
    nome,
    quantidade,
    raridade,
    concentracao
  }
]

Esses dados são do mestre até serem descobertos.

Resultado de Prospeção pode revelar progressivamente:

Sucesso:
- presença de mineral;
- tipo aproximado.

Sucesso melhor:
- tipo;
- concentração;
- quantidade aproximada.

Crítico:
- informação bastante precisa;
- recursos raros ocultos.

Falha:
- inconclusivo.

Fiasco/falha crítica:
pode fornecer impressão enganosa ou falsa pista.

Não precisa criar uma tabela gigantesca.
Criar uma primeira tabela clara e isolada para podermos ajustar depois.

Resultado deve aparecer:
- para o jogador que prospectou;
- para o mestre.

Não revelar automaticamente para todos os jogadores.

============================================================
EXTRAÇÃO DE RECURSOS
============================================================

Depósitos precisam ser finitos.

Minerar pode diminuir:

quantidadeRestante.

Recursos extraídos podem virar itens:

- minério;
- gema;
- pedra preciosa;
- cristal;
- recurso raro.

Esses itens devem entrar no mesmo sistema de item-instância usado pelo inventário/mapa.

Não criar recurso infinito por cliques repetidos.

Inicialmente é aceitável fazer o recurso extraído aparecer NO CHÃO perto da rocha.

Depois o jogador usa Pegar.

============================================================
PARTE 8 — ITENS FÍSICOS NO CHÃO
============================================================

Quero continuidade real entre:

BANCO DE ITENS
↕
INVENTÁRIO
↕
MAPA.

Uma arma no inventário é uma INSTÂNCIA.

Se cair no chão:
a mesma instância vai para o mapa.

Não duplicar.

Conservar:

- id da instância;
- modeloId;
- munição;
- PV/estado;
- qualidade;
- peso;
- demais propriedades individuais.

============================================================
DESCARTAR
============================================================

Adicionar opção:

Descartar

nos equipamentos/inventário se ela ainda não existir.

FORA DO MAPA:
usar comportamento normal de descarte existente, se houver.

QUANDO PERSONAGEM ESTIVER NO MAPA:

Descartar
=
retirar do inventário
+
criar item físico no chão perto do token.

Fazer isso atomicamente/transacionalmente.

Nunca deixar item simultaneamente:
- no inventário;
- no chão.

============================================================
DERRUBAR ARMA — EFEITO ESPECIAL
============================================================

O efeito especial de combate:

Derrubar arma

deve realmente remover a arma da mão/equipado do defensor e criar aquela instância no chão perto dele.

Isso é forçado.

Não custa AÇ adicional ao defensor.

Depois ele ou outra pessoa pode pegá-la.

============================================================
PEGAR ITEM DO CHÃO
============================================================

Ao selecionar/aproximar-se de item no chão:

mostrar:

Pegar

somente se possível.

Antes de pegar verificar:

- capacidade de inventário;
- limite de peso;
- espaço/local disponível;
- demais regras atuais.

Se puder:

remover do mapa
+
inserir no inventário

na mesma operação lógica/transação.

Se não puder:
item continua no chão.

Durante combate:
Pegar item do chão custa 1 AÇ.

Fora de combate:
não usa AÇ.

============================================================
DESCARTE VOLUNTÁRIO DURANTE COMBATE
============================================================

Sugestão de regra consistente:

descartar voluntariamente item equipado durante combate:
1 AÇ.

Derrubar arma por efeito especial:
0 AÇ para quem perdeu a arma.

Se já existir regra diferente explicitamente no sistema, me mostre antes de alterar.

============================================================
PARTE 9 — INVENTÁRIO DURANTE COMBATE
============================================================

Regra já definida:

durante combate o personagem NÃO pode fazer compras.

Mover item entre:

Equipado ↔ Bolso
Equipado ↔ Mochila
Bolso/Mochila ↔ Equipado

custa 1 AÇ.

Se isso envolver Kit Médico / Kit de Primeiros Socorros:

o painel de Primeiros Socorros deve atualizar AUTOMATICAMENTE.

Não deve existir necessidade de botão:

“Atualizar ficha e kits”.

Remover esse botão quando a atualização automática estiver funcionando.

============================================================
CASA E VEÍCULO DURANTE COMBATE
============================================================

Itens guardados em:

Casa
Veículo

não podem ser transferidos para:

Mochila
Bolso
Equipado

durante combate.

Eles não estão fisicamente acessíveis.

Fora de combate:
usar regras normais existentes.

============================================================
PARTE 10 — PEQUENAS CORREÇÕES DE PAINEL
============================================================

Depois das reformas estruturais acima:

1. Colocar botão 🍀 Sorte na MESMA LINHA do botão Testar.

2. Diminuir largura dos selects:
   - Ação / Perícia
   - Arma / ataque

Hoje eles ocupam espaço demais.

Organizar algo aproximadamente:

[Perícia] [Arma] [Munição] [Passar] [🍀 Sorte] [🎲 Testar]

ajustando responsivamente conforme largura.

3. Remover “Atualizar ficha e kits”.

4. Preservar Primeiros Socorros abaixo.

============================================================
BUG DE DEFESA +20
============================================================

Existe um bug observado em ataque em cone / Eco da Matilha.

Histórico mostrou algo parecido:

Esquiva
-20 centro do cone
+20 outros modificadores

Não existe motivo para um bônus +20 naquele caso.

Investigue.

Pelo código anterior, parece que o sistema registrava a penalidade -20 na descrição, mas não subtraía corretamente do valor efetivo; a função de descrição então inventava “+20 outros modificadores” para reconciliar os números.

Corrigir a CAUSA.

Não esconder apenas o texto.

Depois o histórico deve mostrar uma conta real.

Exemplo:

Base 54
-20 centro do cone
Efetiva 34

Sem “+20 outros modificadores” fantasma.

============================================================
PARTE 11 — VISIBILIDADE / ESCONDER SOB ÁRVORES
============================================================

Com camadas:

personagem camada 3
árvore camada 4

deve ser possível visualmente entrar sob a copa.

A copa fica desenhada ACIMA do token.

Se a árvore possui bloqueiaVisao:
ela deve poder esconder/obscurecer personagem.

Não precisa implementar furtividade perfeita nesta etapa.

Mas preparar a arquitetura para:

- oclusão;
- cobertura;
- esconder-se;
- linha de visão.

============================================================
PARTE 12 — MAPAS FUNCIONAIS
============================================================

A intenção central desta etapa é:

UM MAPA NÃO É APENAS UMA IMAGEM.

Exemplos:

Parede:
camada 3
bloqueia movimento
bloqueia visão

Pedra:
camada 3
bloqueia movimento
PV
dureza
pode ser minerada
pode possuir depósito mineral

Árvore:
camada 4
não impede personagem camada 3 de passar sob a copa
pode bloquear/obscurecer visão
PV
dureza
madeira
inflamável
pode ser lenhada
pode queimar

Tapete:
camada 2
não bloqueia movimento
não bloqueia visão

Piso:
camada 2 ou 1
não bloqueia movimento

Muro:
camada 3
bloqueia movimento
bloqueia visão
PV
dureza

Arma no chão:
camada 2 ou camada de itens do chão
não bloqueia movimento
pode ser pega

Fog do mestre:
camada visual superior exclusiva
jogadores não enxergam conteúdo abaixo.

============================================================
PARTE 13 — CARREGAMENTO DE MAPAS
============================================================

Essas funções precisam funcionar para:

1. objetos colocados na sessão atual via “Adicionar ao mapa”;

2. objetos já salvos no mapa;

3. mapas carregados posteriormente;

4. itens que caíram no chão;

5. recursos produzidos por mineração.

Ao carregar um mapa:
não perder estado persistente da instância.

Ao abrir um mapa novo:
hidratar propriedades do modelo.

============================================================
PARTE 14 — SINCRONIZAÇÃO
============================================================

Todos estes estados precisam sincronizar na arquitetura nova:

objetos
PV
fogo
camada
posição
destruído
recursos restantes
itens no chão
fog/shadows
bloqueios relevantes

Não voltar ao protocolo antigo.

Não fazer write a cada frame.

Movimento visual continua sendo otimizado como já estava.

Objetos estáticos só precisam escrever quando seu estado realmente muda.

============================================================
PARTE 15 — SEGURANÇA CONTRA DUPLICAÇÃO
============================================================

Operações de inventário/mapa precisam ser transacionais.

Especial atenção a:

Pegar
Descartar
Derrubar arma
Extrair minério

Nunca permitir:

item no chão + item no inventário simultaneamente

ou

dois jogadores pegarem a mesma arma simultaneamente.

Usar IDs únicos de instância.

============================================================
PARTE 16 — UI DO EDITOR DE OBJETOS
============================================================

Adicionar ao editor de objeto:

Camada

com seletor/input numérico.

Sugestões visuais:

1 — Terreno
2 — Piso / baixo
3 — Obstáculo / personagens
4 — Superior / copa

Mas armazenar número.

Pode permitir qualquer inteiro razoável.

Preservar:

PV
Dureza
Peso
Material
Inflamabilidade
Destrutível
Inflamável
Bloqueia movimento
Bloqueia visão
Fixo ao mapa

Adicionar quando necessário:
dados minerais/recursos.

============================================================
PARTE 17 — DEFAULTS DE CAMADA
============================================================

Para objetos antigos sem camada:

se bloqueiaMovimento:
default 3.

se for decorativo/baixo e não bloqueia movimento:
default 2.

terreno-base:
1.

Não tentar inferir “árvore” apenas pelo nome se isso puder causar erro.

Eu posso ajustar modelos existentes posteriormente.

Tokens:
default 3.

============================================================
PARTE 18 — ORDEM DE IMPLEMENTAÇÃO
============================================================

Faça em fases e teste a cada fase.

FASE A
Ficha de criaturas:
Base + Treino + Total
atributos individuais
ataques usando Total.

FASE B
Schema canônico de objetos na sincronização nova:
PV, dureza, material, camada, bloqueios etc.

FASE C
Render por camada + colisão de camada 3.

FASE D
Ataque e destruição de objetos.

FASE E
Fogo + apagar fogo.

FASE F
Lenhar + Minerar + Prospectar.

FASE G
Itens físicos:
Descartar
Derrubar arma
Pegar.

FASE H
Inventário em combate:
1 AÇ
bloqueio Casa/Veículo
kits atualizam automaticamente.

FASE I
Fog/shadow manual do mestre.

FASE J
Correções menores de painel:
Sorte na linha
larguras
remover Atualizar.

FASE K
Bug +20 de defesa e auditoria final dos cálculos.

Você pode reorganizar ligeiramente se houver dependência técnica clara.

============================================================
PARTE 19 — TESTES DE ACEITAÇÃO
============================================================

CRIATURA:

Criar duas Bestas Ululantes do mesmo modelo.

Os atributos rolados devem ser diferentes.

Exemplo:
uma tem Combate Desarmado Total 68;
outra 72.

Eco da Matilha deve usar esses totais, não 100.

============================================================

OBJETO ADICIONADO PELO CATÁLOGO:

Adicionar árvore.

Ela deve receber:

modeloId
PV
PV atual
dureza
material
inflamabilidade
camada
bloqueios.

Recarregar página.

Dados permanecem.

============================================================

OBJETO VINDO DE MAPA SALVO:

Carregar mapa contendo a mesma árvore.

Ela deve possuir as mesmas capacidades.

============================================================

COLISÃO:

Personagem camada 3.

Pedra camada 3 + bloqueiaMovimento:
não atravessa.

Tapete camada 2:
atravessa.

Árvore camada 4:
atravessa por baixo.

============================================================

ATAQUE:

Atacar pedra.

Sem defesa da pedra.

Gasta 1 AÇ.

Dano reduz PV conforme dureza.

Som/FX aparecem.

============================================================

FOGO:

Incendiar árvore.

Todos veem fogo.

PV pode diminuir.

Extintor oferece Apagar fogo.

Após apagar:
efeito desaparece em todas as telas.

============================================================

LENHAR:

Fora de combate:
personagem com machado seleciona árvore.

Aparece Lenhar.

Teste de Força Bruta.

PV da árvore diminui.

============================================================

MINERAR:

Picareta + pedra:
Minerar disponível.

Personagem sem treino de Mineração:
não pode Prospectar.

Personagem com treino:
pode Prospectar.

============================================================

PROSPECÇÃO:

Rocha possui depósito escondido.

Sucesso em Mineração revela informação ao jogador e mestre.

Outro jogador não recebe automaticamente o segredo.

============================================================

ITEM NO CHÃO:

Descartar pistola.

Sai do inventário.

A mesma instância aparece no chão.

Munição é preservada.

Outro personagem pega.

Some do mapa.

Entra no inventário dele.

============================================================

DERRUBAR ARMA:

Efeito especial Derrubar Arma.

Arma equipada do defensor aparece no chão.

Não permanece equipada.

============================================================

CAPACIDADE:

Personagem sem capacidade de peso tenta pegar item.

Operação falha.

Item continua no chão.

============================================================

CAMADAS:

Árvore camada 4 desenhada acima do personagem camada 3.

Tapete camada 2 abaixo do personagem.

Parede camada 3 impede passagem.

============================================================

FOG:

Mestre cria sombra.

Mestre vê região de forma editável/translúcida.

Jogador vê área opaca.

Mestre remove.

Jogador volta a enxergar.

============================================================
PARTE 20 — DIRETRIZ DE CÓDIGO
============================================================

Como esta é a Mesa Experimental:

PODE refatorar de verdade.

Evite:

patch em cima de patch;
wrapper de wrapper;
nova função D8/D9/D10;
duplicação entre legado e sincronização nova.

Prefira:

módulos claros;
funções puras para regras;
schema explícito;
migração explícita;
operações transacionais;
render sem efeitos colaterais;
testes pequenos.

Se fizer sentido, crie módulos como:

nova-objetos.js
nova-camadas.js
nova-itens-mapa.js
nova-fogo.js
nova-fog.js
nova-criaturas.js

Os nomes são sugestões, não obrigação.

============================================================
PARTE 21 — NÃO FAZER
============================================================

Não faça compra durante combate.

Não reative protocolo antigo.

Não transforme toda alteração visual em write de Firestore.

Não guarde valor Total manualmente quando ele pode ser calculado.

Não use 100 como fallback de ataque de criatura.

Não duplique item entre inventário e mapa.

Não exponha depósitos secretos automaticamente a jogadores.

Não fazer fog apenas visual no cliente do mestre.

Não colocar todos os objetos na mesma camada.

============================================================
PARTE 22 — ENTREGA
============================================================

Quando terminar cada grande fase:

1. rode os testes disponíveis;
2. rode node --check nos JS;
3. mostre git diff resumido;
4. liste arquivos alterados;
5. explique mudanças de schema;
6. diga se preciso aplicar regras do Firestore;
7. diga se precisa migrar dados.

Como eu não sou programador profissional:

quando chegar a hora de testar/publicar, me dê instruções EXATAS.

Exemplo:

1. arquivo que preciso substituir;
2. pasta exata;
3. comando PowerShell;
4. ordem dos comandos;
5. o que devo ver se funcionou.

Se puder fazer diretamente pelo ambiente/repositório, faça.

Não me peça para editar linhas manualmente.

============================================================
OBJETIVO FINAL DESTA ETAPA
============================================================

Quero que a Mesa Experimental comece a parecer um mundo físico persistente:

personagens caminham;
paredes impedem passagem;
árvores ficam acima deles;
pedras bloqueiam;
fogo existe;
objetos quebram;
armas caem;
itens podem ser recolhidos;
minérios existem dentro de rochas;
o mestre pode esconder áreas;
e as regras da ficha determinam o que o personagem consegue fazer nesse mundo.

A prioridade não é preservar o formato antigo.
A prioridade é que essa arquitetura nova fique coerente e expansível.

Eu manteria esse texto como o novo documento de direção da Mesa Experimental. Ele amarra praticamente tudo que discutimos: o mapa deixa de ser um pano de fundo e vira uma pequena máquina de mundo. 🌍
Uma observação importante para o Codex: na sincronização nova já existe um início de suporte a objetos de cena, mas, ao colocar pelo catálogo, ela atualmente copia apenas parte dos dados, como pvMax e dureza; várias propriedades importantes do modelo ainda ficam para trás. nova-direta.jsJS No código antigo já existe lógica para recuperar material, peso, PV, inflamabilidade e bloqueios a partir do modelo. Isso é material útil para extrair e portar, não para reativar o protocolo velho. app.jsJS
E também já existe no legado lógica de dano de ferramenta para minerar/cortar e fogo em objetos, então o Codex deve procurar essas regras antes de reescrevê-las. app.jsJS app.jsJS
Quando você abrir a próxima conversa, esse prompt já deve ser suficiente para o Codex entender tanto o que implementar quanto a filosofia do sistema.