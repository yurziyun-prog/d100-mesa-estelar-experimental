# Orla v0.62 — sessão 3D compartilhada

A sessão online fica em `orla/online/`. Na exploração da Orla, clique em **ORLA** e em **Entrar na sessão online 3D**.

## Para jogar

1. O mestre entra com a conta habitual do Mesa, informa um código de sala e escolhe **Abrir sala como Deus**.
2. Cada jogador entra com sua própria conta, escolhe sua ficha e usa o mesmo código.
3. O mestre mantém a sala aberta. O mundo, os ataques, a munição, as colisões e os NPCs são resolvidos nessa conexão; desconexão suspende os comandos.
4. Deus usa o botão direito no chão para evocar NPCs, monstros ou personagens de jogadores e transportar o grupo. No personagem, o botão direito permite controlar, entregar itens, mudar atitude ou ressuscitar. Arrastar com o direito gira a câmera.
5. WASD ou clique no chão move. Clique em um alvo e pressione F para atacar. Na mochila, dois cliques equipam ou consomem; baterias e munição equipam a arma correspondente sem gastar. No baú, botão direito transfere o item.

## Conteúdo

- Quatro cenários 3D: Posto de Véspera, Dunas de ametista, Bosque bioluminescente e Observatório partido.
- Cinco formas de personagem, cabelo, cores, traje, acessórios e estatura; frente, perfil e costas em volume.
- Quinze modelos de NPCs/criaturas, incluindo Louva-a-deus de cristal, Sabueso de cinzas e Oráculo do arquivo orbital.
- Armas, armadura e mochila visíveis quando equipadas; munição finita para jogadores, crítica e munição infinita para Deus.
- Quatro categorias d100; maior perícia relacionada da ficha, com bases e investimentos importados do Mesa. Dano simplificado da Orla. Testes genéricos aparecem no registro compartilhado.
- Consumíveis de fadiga usam os intervalos e níveis já usados na Orla/Mesa. Deus pode materializar novamente itens consumidos.
- Jogadores acompanham as mudanças de cenário. NPCs ficam no cenário de origem. Quando Deus assume um jogador, comandos desse jogador ficam suspensos até Deus trocar de personagem.

## Preservação e limites

As fichas são copiadas para a sessão. A sala não altera PV, inventário nem aprovação das fichas originais. A persistência usa documentos `combatesAtivos/orla-online-<codigo>` e sua fila `acoes`, com as permissões já existentes do Mesa; não foram publicadas novas regras Firebase.

A exploração local também inclui as correções v0.61: movimento independente, personagens direcionais, oclusão dos andares, baú e seleção de cenário. Os desenhos e funcionalidades das casas continuam preservados. Esta primeira sessão online usa seus quatro cenários próprios; a construção das casas ainda pertence à exploração local e não foi convertida em editor multiplayer.

O mestre precisa permanecer conectado. Não há servidor autônomo nem retomada automática de comandos enviados enquanto desconectado. Objetos de inventário reconhecidos são convertidos para os itens da Orla; itens sem correspondência continuam somente na ficha original.

Validação: suíte da Orla, testes do Mesa, duas abas com transporte de teste e SDK real sem autenticação. Um ensaio com mestre e jogadores autenticados no Firebase ainda é necessário antes de considerar a sessão de fim de semana validada de ponta a ponta.

Fontes em `orla/source/src/`; implementação offline e online preservadas. Three.js tem licença MIT em `online/LICENSE-three.txt`. O carregador verifica GZIP e SHA-256. Versões anteriores de carregadores/partes continuam disponíveis no histórico e nos arquivos existentes.
