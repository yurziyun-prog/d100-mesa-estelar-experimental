# Atualização 88 — vínculos de veículos e naves

## Correções
- Veículos e naves voltam a aparecer na coluna lateral depois de troca de personagem ou reconstrução da ficha.
- O inventário compartilhado continua usando os mesmos documentos de veículo/nave.
- Naves possuídas passam a ser lidas por qualquer usuário autenticado e filtradas localmente pelo `personagemId` vinculado; isso evita que instâncias antigas com `usuariosPermitidos` incompleto fiquem invisíveis.
- Permissões de escrita do porão continuam restritas a usuários em `usuariosPermitidos`.
- O mestre continua reconciliando automaticamente `usuariosPermitidos` das instâncias existentes.

## Causa
Os blocos `charVehiclesV83` e `charShipsV86` são inseridos dinamicamente. Em algumas reconstruções da coluna lateral eles eram removidos, mas os listeners chamavam apenas as rotinas de renderização, que não recriam o contêiner ausente. Por isso o inventário compartilhado podia continuar funcionando enquanto o cartão lateral desaparecia.

No caso das naves havia ainda uma segunda barreira: a própria leitura do documento dependia de `usuariosPermitidos`. Se uma instância tivesse sido criada/migrada sem UID completo, o jogador não conseguia sequer ler a nave para descobrir o vínculo por personagem.
