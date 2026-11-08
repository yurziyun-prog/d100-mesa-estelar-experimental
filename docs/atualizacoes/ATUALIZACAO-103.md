# Mesa Estelar v103 — Camada visual do Mapa da Mesa

Primeira etapa da reforma visual. **Nada de combate, movimento, fichas, cenários ou regras foi alterado.**
A camada nova apenas desenha por cima do mapa (sem receber cliques).

## O que aparece
- **🎨 Botão "Visual do mapa"** ao lado de ⛶ e 📜.
  - Todos: ligar/desligar os efeitos *neste aparelho* e escolher qualidade (Alta/Leve).
  - Mestre: Iluminação, Névoa de guerra, Clima, Intensidade e Luz dos personagens — salvo **por mapa** e valendo para todos.
- **Iluminação**: Dia (padrão, igual a antes), Entardecer, Noite, Escuridão.
  - Luz automática em objetos cujo nome/ID contém lâmpada, luminária, abajur, lanterna, poste, tocha, fogueira, lareira, vela, neon, painel, cristal etc.
  - Objetos em chamas iluminam e tremulam; o 🔥 vira fogo animado.
  - Personagens carregam uma luz pessoal (raio ajustável pelo mestre; 0 desliga).
  - Paredes (formas que bloqueiam movimento) e objetos com *Bloqueia visão* projetam sombra.
- **Névoa de guerra** (desligada por padrão): o jogador só vê o que o próprio personagem enxerga; o mestre vê tudo, com as áreas fora da visão dos jogadores levemente escurecidas.
  - Se o jogador não tiver miniatura no mapa, a névoa não é aplicada para ele (nunca trava a tela).
- **Clima**: chuva, neve, poeira, brasas, neblina.
- **Ataques**: projéteis que viajam (laser, energia, blaster, bala, flecha), cortes, garras, mordidas, impactos, ondas Psi e cone sônico, faíscas, sangue no chão (some em ~45 s), número de dano e destaque de crítico. Sem tremor de tela.
- **Miniaturas**: sombra, anel por tipo (verde = personagem, amarelo = NPC, vermelho = monstro), rótulo mais legível e barra de PV (mestre vê todas; jogador vê a do próprio personagem).

## Segurança (o site continua jogável)
- O módulo `js/mesa-visual.js` é carregado à parte. Se o arquivo faltar ou falhar ao carregar, o mapa clássico segue normal.
- Erros repetidos (3 em 2 minutos) desligam a camada sozinha e removem tudo o que ela desenhou; o efeito de ataque antigo volta automaticamente.
- Qualidade cai para "Leve" sozinha se o computador ficar lento.
- Configuração padrão = Dia, sem névoa, sem clima → visual igual ao anterior, só com miniaturas e ataques mais bonitos.
- A configuração do mestre fica em `combatesAtivos/mesaVisual_<mapa>`, coleção que já tinha as permissões certas: **não há mudança em `firestore.rules`**.
- Para voltar à v102 basta reenviar os arquivos antigos: nenhum dado foi migrado.

## Arquivos
- novo: `js/mesa-visual.js`, `tests/v103-visual.test.mjs`
- alterados: `js/nova-direta.js` (gancho de ~15 linhas), `js/app.js` (só a versão do import), `index.html` (só a versão do cache)

## Validação
- `node --check` nos arquivos alterados.
- `node --test tests/*.test.mjs`: 274 de 306 aprovados. As 31 falhas que já existiam na v102 continuam iguais (testes antigos das v62–v101 que conferem versões e recursos substituídos); a única falha nova é o teste de cache da v102, que deixa de valer porque a versão mudou para v103. Os 6 testes novos da v103 passam.
- Teste no navegador montando o Mapa da Mesa real com banco simulado: mestre e jogador, noite, névoa, chuva, neve, brasas, ataque com crítico; arquivo ausente; erro simulado (desligamento automático confirmado).

## Deploy
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
(Sem mudança de regras nesta versão.)
