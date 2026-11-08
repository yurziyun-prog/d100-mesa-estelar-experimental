# Atualização 76 — Cenário Atual como central de interações

## Interações genéricas de cenário
- Cenários agora podem cadastrar ações independentes do mapa no campo **Interações do Cenário Atual**.
- Formato de cada linha: `Título|Ícone|Perícia|Dificuldade|Descrição evidente|Sucesso|Crítico|Falha`.
- Use `—` na perícia para uma interação sem teste.
- As ações aparecem na seção **Interações do cenário** junto de comércio e serviços.
- Testes usam a perícia do personagem selecionado, dificuldade e fadiga já existentes no sistema.
- Descobertas bem-sucedidas ficam registradas em `cenarioDescobertas` na ficha do personagem e reaparecem no Cenário Atual.
- Importação e exportação CSV de cenários passam a preservar `interacoesTexto`.

## Polimento visual incluído sem criar uma etapa extra
- Resumo lateral do personagem passa a usar linhas compactas com ícones (PV, fadiga, PP e Sorte), sem cartões grandes.
- Na interface em português, estados de fadiga deixam de exibir o nome inglês entre parênteses.
- Banco de Cenários impede texto de invadir colunas vizinhas.
- Botões **Editar** e **Remover** ficam empilhados, com a mesma largura, dentro da coluna Ações.
- Tipo e Estado ficam mais estreitos; descrições continuam priorizadas.

## Compatibilidade
- Não altera combate, Psi, primeiros socorros, movimentação, dano, rádio ou Oficina 2.
