# O que AINDA NÃO foi validado (separado do que foi provado) — 24/10/2026, rodada "revisão água e criaturas"

Provado (harness local, jogador e mestre SIMULADOS, Firestore falso; veja `docs/pendencias-mapa-testes.md`): água integrada queda→canal→lagoa, galeria de espécies no mapa, escala, subsolo/luz, lava, habitat.
Tudo abaixo é **pendência real**; nada disto foi publicado como pronto.

## Água
- Máscara real de submersão/poses próprias de nado (hoje: tinta, ondas e rastro; é "demonstração de profundidade visual").
- Pausa/retomada do jogo: não existe pausa global no código; o relógio da água é compartilhado, mas "pausa" não foi exercitada.
- Qualidade em dispositivos fracos/zoom máximo: canvas ambiente é 12 px/m (mapa todo); desempenho medido só no Edge sem cabeça.
- Efeito de água de criatura oculta/fora da visão (neblina/andar): o rastro local usa os tokens visíveis da tela; não foi testado com neblina.

## Criaturas
- **`cao_de_sucata` não aparece no mapa**: o modelo está ausente do bestiário CSV local (povoarMapa o registra como "faltou"). Lacuna real, registrada no teste.
- `serpente_sanguessuga` (mapa) e `vampiro_psiquico` (catálogo): arte antiga, sem medida física → ainda dimensionadas pelo token.
- Rig/animação por família: as criaturas procedurais têm as 5 ações (parado, andar, atacar, golpe, morrer) por ciclo de pose por membro, **sem pesos nem apoio alternado dedicado**; insetoide de 4 braços tem 4 mãos visíveis, mas o ataque não usa especificamente as quatro. Rig mínimo por família: não feito.
- Reação a dano/queda ligada à saúde real foi mostrada só como estado "morta" fixo na galeria; não houve combate real com a mesma arte.
- Primata de cálico, quadrúpedes, anfíbios, larva/serpente, enxame (partículas): revisão visual feita só nas fotos da galeria; ajustes anatômicos finos não feitos.
- Dragões alados e montaria voadora: envergadura × cavaleiro não revalidados; arte aprovada preservada só para os corredores.

## Espacialidade e travessia
- `alturaNoPonto()` (salto/queda/travessia) ainda usa (id−1)·3: **incoerente com o subsolo de ID 9 (−3 m)**. Não corrigido nesta rodada; o recurso de salto/queda não deve ser considerado pronto para o subsolo.
- Duas sessões independentes (jogador dentro revela, observador fora não vê; mesmo X/Y em níveis diferentes sem interferência de alvo/ataque/luz): não testado (precisa do emulador).
- Gatilho de armadilha por segmento/pegada/nível: não feito (hoje: ponto).
- Rampa com ~1 m e obstáculos que travam a rota automática (fogueira do acampamento, rochas ao sul da lava): não corrigidos; o percurso fiel sem remover armadilha nem teleportar não foi concluído. O vídeo da etapa 3 removeu a armadilha da soleira da torre e parou antes da ponte de crosta (o Yuri disse que pode tirar a armadilha quando precisar).
- Autoridade de posição (vida/IA × jogador): "saltos" relatados pelo Yuri **não investigados**; hipótese de dois escritores da posição.

## Fichas, ataque e controles
- Ficha válida no harness, ataque do jogador (Espaço/A), equipar/retirar pela ficha real, duas sessões: **não feito**. Falta Java para o emulador; o harness poderia receber uma ficha-fixture (caminho `personagens/<id>` lido por `novaFicha_`), **ainda não criada**.
- Controle físico: não testado.

## Ecossistema e desempenho
- Estabilidade: 7 inconscientes e 3 mortos em 2 min no harness (lutas em tempo real) — **não balanceado**.
- Ciclo completo busca→consumo→retorno/abrigo em sequência observada com motivo: só vistos ícones isolados (💧🍃🍎🪨🕳️).
- Desempenho com cena representativa (fauna, pessoas em camadas, água, luzes, combate): **não medido** (114 fps foi com 2 tokens).
- Sentar/deitar/embarcar/montar com mãos/pés encaixados: não implementado.

## Rodada 24/10 (noite)
- Animação do boneco com rede real (hoje só com atraso simulado no harness); movimento "arrastando" do Kael não reproduzido.
- Névoa: nenhum teste com sessão de jogador real; cone/raio de outras fontes de luz do mapa (lâmpadas) não integrado ao gradiente; modo "claro com oclusão" não existe.
- Teste `v205-lava-browser` (borda) falha sem causa conhecida; ver `docs/PROBLEMAS-NAO-RESOLVIDOS.md`.
- Combate com boneco de teste: causa do "Enviando… e nada" não reproduzida.

## Combate / duelo (rodada 24/10, sessão do duelo jogável)
**Provado (harness local, Edge sem cabeça, Firestore FALSO, mestre SIMULADO — a mesma conta controla o personagem e processa os comandos; vídeo `docs/video-duelo/duelo-vitoria.webm`):** ficha criada por `window.novoPersonagem()`, itens do CSV pelo importador real, perícias/arma/ataque/defesa/dano/tempo real reais; vitória e derrota (`DERROTA=1`); criatura que reage; mensagens de falta (sem munição, fora de alcance); reiniciar; sair.
**Ainda NÃO validado:**
- Duas contas/clientes (jogador real + mestre em outro aparelho), rede real, regras do Firestore em produção, controle físico.
- `tests/v205-duelo-browser.cjs` é **intermitente**: ~1 em 5 execuções o renderer do Edge sem cabeça cai ("Target crashed") e, antes de fixar o ponto de partida, o resultado variava por sorte dos dados (duelos longos). Passou várias vezes seguidas em vitória e derrota, não é determinístico.
- Ferimentos/Sorte/necessidades de um PERSONAGEM são gravados na própria ficha pelo motor; o treino só **devolve** esses campos ao reiniciar/sair (lista branca por diferença, ignora localização/visual). Se o dono da ficha editar a ficha DURANTE o duelo, esses campos voltam ao valor de antes do duelo.
- Criaturas do bestiário sem dados de ataque no tempo real (`ataques=0`, não agem): besta_ululante, cila, criatura1–7, dragão trombeta alado (domesticado/selvagem), larva, macaco de calico, metamorfo genérico/1–4, montaria pterodátilo, predador couraçado, serpente sanguessuga, vampiro genérico, vespa de vidro. `zumbi_1` e `cadaver_de_chefe` têm `mov=0` (só batem de perto).
- A ficha de teste usa uma entrada `armas_brancas_curtas` montada à mão (o banco real de especializações não está no repositório); `combate_pistola_laser` vem do padrão do app.
- Modo de ação contínua (`docs/PROPOSTA-COMBATE-SIMPLES.md`): NÃO implementado; o motor atual (tempo real automático) já completou o duelo, então ficou como proposta.
- Desempenho com luta + mapa cheio: não medido.

## Treino isolado (25/10)
- A regra \`treinoSessoes\` (só mestre) não foi exercitada no emulador (sem Java); só o texto foi conferido por teste.
- A saúde/munição de PERSONAGEM durante o treino fica no documento de saúde do MAPA (não na ficha). Ao sair, as entradas das criaturas E do personagem de treino são removidas desse documento: se o personagem estiver em uma partida real no mesmo mapa, seus ferimentos de partida também somem. Use o Kael de teste ou um personagem descartável em mapa de teste.
- Várias abas do mestre: só a aba que iniciou o treino redireciona; outra aba do mestre processando comandos escreveria na ficha real. (Reanexa só na mesma aba.)
- Módulos que gravam ficha e NÃO foram roteados por não serem de combate: compra/venda e recursos (`22-mesa-e-modulos` linhas de comércio), criação/edição de ficha, viagem, ligações. Se o mestre usá-los com o personagem em treino, gravam na ficha real.
- Tempo de espera da cópia: ~2,5 s após recarregar a página até a sessão reanexar; comandos nesse intervalo usam a ficha real.
