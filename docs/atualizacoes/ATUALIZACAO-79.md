# Atualização 79 — correção definitiva das imagens de objetos em mapas importados

Causa confirmada:
- mapas importados por CSV carregavam inicialmente os objetos a partir da prévia da Oficina 2;
- ao sincronizar a cena, a referência visual continha `src: ""`;
- o normalizador tratava essa string vazia como um valor explícito e, por isso, ela mascarava a imagem existente no modelo do Banco de Objetos;
- além disso, mapas importados não reconstruíam `oficinaElement` e `oficinaBounds` como mapas salvos normalmente pela Oficina 2.

Correções:
- `src: ""` e `imagem: ""` deixam de mascarar a imagem do modelo;
- objetos reconstruídos a partir de `oficina2State` passam a conservar `oficinaElement` e `oficinaBounds`;
- cenas já arquivadas com a estrutura antiga são migradas automaticamente ao serem abertas novamente;
- cache-busting atualizado para a v79.

Validação:
- teste específico reproduz o caso em que a imagem aparece inicialmente e desaparece após a sincronização;
- a imagem é reidratada corretamente a partir do Banco de Objetos;
- 173/173 testes automatizados aprovados.
