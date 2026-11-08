# Atualização 82 — Entidades vinculadas e Banco de Companheiros

A v82 cria a fundação persistente para animais companheiros, robôs, drones e criaturas vinculadas a personagens, sem tornar companheiros obrigatórios e sem integrar ainda essas entidades ao combate do Mapa da Mesa.

## Banco de Companheiros

Nova aba privada do mestre em Banco de Dados → Companheiros.

Recursos:
- criar, editar e remover modelos;
- importar/atualizar CSV;
- exportar CSV e baixar template;
- criar quatro modelos básicos: Galinha doméstica, Lobo companheiro, Drone auxiliar ZK-4 e Dragão Trombeta domesticado;
- sinalizar Montaria, Combatente, Controlável, Robótico, Vendável e Disponível na campanha;
- campos de PV, movimento, carga, energia, preço, acesso, capacidades, imagem e descrição.

## Instâncias vinculadas

Um modelo pode gerar indivíduos diferentes. Ao usar Vincular, o mestre escolhe uma ficha e cria uma instância persistente dentro dela. A instância guarda um snapshot do modelo, nome individual, PV, energia, estado e observações.

O vínculo é exclusivo da ficha em que o indivíduo foi criado. Usar o mesmo modelo em outro personagem cria outro indivíduo, não transfere o primeiro.

## Ficha do personagem

Personagens sem companheiros não ganham uma nova área vazia. Quando houver pelo menos um vínculo, a coluna lateral exibe uma pequena seção Vínculos / Companheiros.

Ao abrir um companheiro, aparecem somente os campos relevantes. Montaria, combate, carga e energia aparecem conforme o modelo. Dono e mestre podem atualizar nome individual, estado, PV/energia e observações. O mestre também pode restaurar ou desvincular.

## Fora de escopo nesta etapa

- miniaturas de companheiros no mapa;
- combate de companheiros;
- compra de companheiros no mercado;
- montarias temporárias/alugadas;
- inventário interno de carga.

A estrutura de modelo + instância + vínculo foi criada para ser reaproveitada depois por veículos e naves.

## Segurança

O banco `/companheiros` é privado do mestre no Firestore. Jogadores recebem os dados necessários somente através do snapshot salvo na própria ficha.
