# Matriz de estado (25/10/2026) — única fonte; os documentos antigos podem estar superados

## Rastejante e combate/interface — 27/10/2026

Publicado no Hosting e Firestore; regras compiladas remotamente, nove módulos e cinco atlas conferidos no site. 786 testes e verificações de navegador aprovados. Complemento: seletores de arma/defesa/poder, perícia automática e equipamento compatível do Kael aplicado pelo mestre na próxima leitura (sem alterar treino nem apagar itens).

Nova arte do Rastejante (64 quadros), seleção de arma com regras/revisão/visual sincronizados e preservados no combate, percentuais com base/ajustes explícitos, barras permanentes fora do mapa e salvaguarda para painéis declarados. IA retoma perseguição e ataque no teste local; causa exata da imobilidade na sessão real ainda não comprovada. Regra do mapa em `AGENTS.md`. Ver `atualizacoes/ATUALIZACAO-216.md`.

## Predador Quitinoso — 27/10/2026

Publicado no Hosting; catálogo, escala e cinco folhas comparados com o site público. Aguarda aprovação visual no mapa da campanha.

Nova miniatura modelada no Blender a partir do conceito aprovado pelo Yuri, com cinco ações e 64 quadros. Integração no mesmo ID da espécie; preserva fichas e escala adulta. 780 testes e teste de navegador da miniatura aprovados (banco simulado). Ver `atualizacoes/ATUALIZACAO-215.md` e fonte em `arte-fonte/predador-quitinoso/`.

## Etapa 3 do GPT — 27/10/2026

Publicada no Hosting e nas regras do Firestore; compilação remota das regras aprovada e cinco módulos principais conferidos byte a byte no site. Aguardando teste real do Yuri.

Jogo contínuo como padrão; migração de pausas/mapa/turnos legados; pausa de emergência do mestre com bloqueio de movimento; interações da cadeira e mensagens simplificadas. 780 testes de unidade/contrato e quatro testes de navegador com banco falso aprovados. Ver `atualizacoes/ATUALIZACAO-214.md` para escopo, limites e roteiro. Não confundir esta validação local com teste autenticado do Yuri nem com resolução de todas as pendências da reforma/arte.

Legenda de ambiente: **H** = harness local (Edge sem cabeça, banco falso, papéis simulados). Nada está provado com contas reais, rede real ou controle físico.

## Etapa 1 do GPT — 26/10/2026 (local, não publicada)

Corrigido o bloqueio indefinido de envio: o timeout agora começa antes da confirmação da escrita, e fechar a sessão também encerra esse pedido. Cinco testes determinísticos e teste da interface com escrita pendente passaram. O resultado de um envio sem confirmação é explicitamente desconhecido; não há reenvio automático. Isso não comprova que o mestre resolva o ataque em produção. Publicada no Hosting com autorização do Yuri. Detalhes em `atualizacoes/ATUALIZACAO-211.md`.

## Etapa 2 do GPT — 26/10/2026 (publicada no Hosting)

Complemento após o teste do Yuri: abertura funcionou, mas a visão mostrava escadaria antiga. Corrigida a escolha de mapa para seguir o token explícito do modo diretor, aguardando a posição e acompanhando mudanças de mapa; ficha e visão do mestre preservadas. Teste de navegador e 18 testes de contrato aprovados; publicado e arquivos conferidos no site. Ver `atualizacoes/ATUALIZACAO-213.md`. Aguarda teste real do Yuri.

Corrigida a integração entre a barra Atuar como e a abertura de aba: o clique na miniatura antes virava um change sintético ignorado pelo módulo. Agora encaminha o gesto diretamente, mantém a aba original como Mestre e oferece link de recuperação visível. Dois testes de navegador e 22 testes de unidade/contrato aprovados. Login/controles/combate reais da aba filha continuam pendentes. Ver `atualizacoes/ATUALIZACAO-212.md`. Aguardar conferência do Yuri antes da próxima etapa.

| Item | Estado | Evidência (ambiente) | Próxima ação |
|---|---|---|---|
| Lava: ponte, borda quente, núcleo | feito, com ressalva (origem da mudança de geometria desconhecida) | `tests/v205-lava-browser.cjs`, `tests/_diag-lava.cjs` (H) | manter pré-condições geométricas |
| Água queda→canal→lagoa | feito no H | `v205-agua-integrada` (H) | validar no mapa salvo e com névoa |
| Vegetação (variantes de tronco/raiz/planta) | integrada, **sem aprovação visual do Yuri** | `docs/antes-depois/relevo-var-*.png` | Yuri aprova pela imagem |
| Duelo (vitória/derrota, ficha da fábrica real) | feito no H com mestre simulado | `v205-duelo-browser`, `docs/video-duelo/` | dois clientes; ver P0 isolamento |
| **Treino × fichas reais** | **isolado no H (25/10)**: o duelo usa uma CÓPIA da ficha em `treinoSessoes/<sessão>/fichas/<id>`; ferimentos de ficha, Sorte, necessidades, munição e consumo de itens vão para a cópia (roteamento em `22-mesa-e-modulos`, `mesa-relogio`, `mesa-limpeza`, `mesa-uso-itens`, `mesa-equipar`, `mesa-objetos`, painel). Ficha real IDÊNTICA após iniciar, Sorte, vitória, derrota, reiniciar, sair, fechar a aba e falha de rede (começo e meio da luta); edição legítima de outro cliente preservada | `tests/v205-treino-isolado-browser.cjs` (vitória e `CENARIO=derrota`), `tests/v205-treino-sessao.test.mjs` (H, mestre simulado, banco falso); regra `treinoSessoes` só mestre (**não testada no emulador**) | publicar regras; validar com duas contas; saúde das criaturas de treino ainda vive no documento de saúde/histórico do MAPA (limpa ao reiniciar/sair); cópia órfã de aba fechada só é apagada depois de 12 h |
| **Reforma do mapa: 2ª aplicação** | **ABERTO (P0)**, agora **determinístico**: 1ª aplicação = 400 peças, 2ª = 376 (faltam 24: 6 pedras submersas da lagoa, uma poça de lava, pisos/paredes do andar 2 da torre, paredes curtas). Já feito: conferência do banco por IDs; espera as peças antigas saírem do editor antes de desenhar (não resolveu). Hipótese aberta: o gerador corta/apaga peças novas que tocam o que sobrou do desenho anterior, ou o editor mescla poças na 2ª passada. | `tests/v204-reforma-browser.cjs` com `DEBUG_MAPA=1` (H) | comparar assinaturas passo a passo (1ª × 2ª) e achar quais passos perdem peças; IDs estáveis |
| Giro (retângulo de tela) | feito (H) | `v205-giros-browser` | — |
| Direção costas/frente do rig 3D | **ABERTO**, intermitente, causa não confirmada | `v200-app-real-browser` (H) | trace por ator com revisão |
| `v203-ecossistema` (0 atores), `v204-percurso-jogador` (subir ao planalto) | **ABERTO**, falham | H | diagnosticar povoamento e colisores |
| Habitat aquático | **ABERTO**, intermitente; 101/2132 amostras são território, não falha | `docs/diagnostico-ecossistema.json` | validar trajetória e máscara real de água |
| Névoa automática | feito no H; sem "claro com oclusão" | `v205-nevoa-auto-browser` | luz × visão unificadas |
| Sombras/luz do trecho | decorativo, só casa/ruínas, sem dados de visão | `docs/antes-depois/trecho-*` | ligar às fontes de luz e níveis |
| Painel Mapa de teste, barra, Guardar mapas | feito no H | `v205-hub-teste`, `v205-barra-organizada`, `v205-guardar-mapas` | Yuri usa; "raros" é escolha minha |
| 11 miniaturas placeholder | arte feita; **sem nome/ficha/ataque** (medidas P) | `docs/galeria-11-novas.png` | importação do bestiário (P1) |
| Bestiário (colunas/ataques) | **ABERTO** | `docs/NAO-VALIDADO.md` | parser por cabeçalho + relatório por espécie |
| `alturaNoPonto` ID 9 | **ABERTO** ((id−1)·3) | `docs/NAO-VALIDADO.md` | fonte única de elevação |
