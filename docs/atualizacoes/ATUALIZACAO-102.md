# Mesa Estelar v102 — mapa/cenário acoplados, desenho colaborativo e personagens inativos

## Interface do Mapa da Mesa
- Barra principal compactada com botões de ícone e `title` explicativo.
- Ação redundante “Preparar personagens” removida da interface.
- “Trazer personagens ativos”, iniciar/encerrar combate, retirar selecionado, aleatório, limpar e restaurar usam controles compactos e alinhados.
- Texto de exploração fora de combate reduzido a uma linha discreta.
- Histórico superior removido visualmente; permanece o histórico abaixo do mapa.
- Controles da Oficina 2 dentro do Mapa da Mesa foram reunidos em barra compacta ao lado de recarregar cenário.
- Cenário Atual e Mapa da Mesa ficam adjacentes nas abas.

## Cenário ↔ mapa
- Para o mestre, abrir um mapa também muda o contexto de Cenário Atual para o cenário vinculado, sem transportar jogadores.
- Selecionar/ativar um cenário muda a câmera do mestre para o mapa vinculado, sem transportar jogadores.
- Cada jogador continua vendo o mapa/cenário de sua própria ficha, independentemente do mapa que o mestre esteja editando.
- “Trazer personagens ativos” grava mapa e cenário de destino juntos.
- “Trazer jogadores” pelo cenário faz o mesmo no sentido cenário → mapa.
- Personagem ainda sem localização usa como fallback o último destino coletivo usado por “Trazer personagens ativos”, não o mapa que o mestre apenas abriu.

## Desenho colaborativo
- Jogadores podem desenhar sobre o mapa em uma camada compartilhada e sincronizada por mapa.
- Cada usuário pode desfazer ou apagar seus próprios desenhos.
- Jogadores não recebem permissão para salvar mapa, editar atributos de objetos, arrastar objetos do mestre ou alterar propriedades como PV/dureza.
- Desenhos colaborativos ficam separados do conteúdo persistente do mapa e são armazenados por mapa e usuário.

## Personagens inativos
- Mestre pode marcar qualquer PJ/PM como ativo ou inativo na campanha sem apagar a ficha.
- Personagens inativos recebem indicação visual e podem ser filtrados em “Inativos”.
- “Trazer personagens ativos” e “Trazer jogadores” ignoram personagens marcados como inativos.
- Reativar o personagem o devolve aos fluxos normais sem perder ficha ou localização armazenada.
- O campo de atividade é protegido contra alteração estrutural pelo jogador em fichas aprovadas.

## Segurança
- Nova regra `mapaDesenhos/{mapaId}/usuarios/{userId}`: cada usuário autenticado só pode gravar seu próprio documento de desenho; mestre mantém controle geral.
- `ativoNaCampanha` e metadados de alteração passam a integrar os campos estruturais protegidos da ficha aprovada.

## Validação
- `node --check js/app.js`
- `node --check js/nova-direta.js`
- `node --test tests/*.test.mjs`
- Resultado: 291/291 testes aprovados.
