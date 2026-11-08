# Objetos persistentes — fase B / versão 47

Esta fase padroniza os dados de objetos na Sincronização nova. Camadas visuais/colisão (C), ataques/destruição (D), fogo (E) e mineração (F) vêm depois. O campo Camada já pode ser editado, mas ainda não muda a ordem visual ou a colisão.

## Alterações

- Catálogo e objetos salvos na Oficina/Mapa usam o mesmo formato: PV máximo/atual, dureza, peso, material, inflamabilidade, estado de fogo, bloqueios, posição, dimensões, ângulo e camada.
- Campos ausentes são recuperados do modelo; PV zero, false e estado próprio da instância prevalecem. A posição dos objetos da Oficina é convertida do canto para o centro e para a escala da mesa.
- Cada cópia tem estado independente. Imagens do modelo são lidas pela referência, evitando duplicar imagens grandes no documento da cena.
- Objetos do mapa são incorporados uma vez à cena e deixam de ser desenhados em duplicidade no fundo. Objetos removidos não reaparecem ao recarregar.
- Trocar mapas arquiva a cena anterior e recupera a cena do destino, conservando objetos e desenhos.
- Banco de Objetos de Mapa: Importar CSV, Exportar CSV e campo numérico Camada. Importar adiciona/atualiza por ID, não remove os demais modelos. Campos/ imagens vazios conservam os valores existentes. IDs inválidos, repetidos e números inválidos são rejeitados antes de qualquer gravação. A importação é transacional, até 450 modelos por arquivo.
- Camadas antigas: terreno explícito 1; objetos explicitamente passáveis 2; demais 3. Não se infere copa pelo nome. O mestre pode ajustar o número.

## Dados e publicação

Instâncias usam objetoSchema: 1. Cena usa objetosMapaImportados: true. Documento ativo: combatesAtivos/mapaMesaSyncDiretaCena. Cenas arquivadas: combatesAtivos/mapaMesaSyncCena_<id do mapa>. O banco continua em configuracoes/objetoMapa_<id> e no índice configuracoes/objetosMapa.

A migração ocorre quando o mestre abre a mesa, sem comando manual e sem alterar o mapa original. Não há alteração nas regras do Firestore: as permissões existentes para documentos de combate e configurações cobrem esta fase. Mantenha a conta do mestre aberta para inicializar cenas antigas.

Arquivos: index.html, js/app.js, js/nova-direta.js, js/nova-objetos.js e três testes nova-objetos*. Nenhum CSV enviado pelo usuário foi alterado nesta fase.

## Teste manual após atualizar

1. Recarregue mestre e jogador com Ctrl+F5.
2. Em Banco de dados → Objetos de Mapa, exporte CSV. Confirme as colunas camada, material, pvMax e bloqueios. Importe o mesmo arquivo: não deve duplicar IDs.
3. Abra um modelo, ajuste Camada e salve. Reabra para conferir.
4. Na Sincronização nova, abra um mapa com objetos da Oficina. Cada objeto deve aparecer uma vez; o texto ao passar o cursor informa PV, dureza, material e camada.
5. Adicione um objeto pelo catálogo, mova-o como Mestre; troque de mapa e volte. A posição deve ser preservada nas duas contas.

Os objetos ficam preparados para a fase C. Não há novos ataques, dano/fogo automáticos ou linha de visão nesta entrega.
