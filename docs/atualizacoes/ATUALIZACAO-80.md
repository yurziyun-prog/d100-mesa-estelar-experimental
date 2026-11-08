# Atualização 80 — vínculo opcional Cenário ↔ Mapa + correção de mapas importados

## Correção do erro `Cannot read properties of undefined (reading 'w')`

A causa foi localizada no renderizador visual da Oficina 2 usado pela Mesa. Objetos provenientes de mapas importados podiam chegar à cena com `oficinaElement`, mas sem `oficinaBounds`. O renderer assumia que `oficinaBounds` sempre existia e acessava diretamente `b.w`, interrompendo a sincronização da cena.

A v80 agora:

- reconstrói largura, altura e posição a partir de `oficinaElement`, dimensões do objeto ou coordenadas da cena quando `oficinaBounds` estiver ausente;
- usa um fallback visual caso um objeto antigo ainda esteja incompleto;
- atualiza o cache-busting de `nova-direta.js`, `nova-objetos.js` e `nova-oficina.js` para v80. A v79 ainda carregava `nova-direta.js?v=62`, o que podia fazer o navegador reutilizar uma cópia antiga do módulo e ignorar a correção anterior de imagens.

## Vínculo opcional Cenário ↔ Mapa

- O cadastro de Cenários ganhou `Mapa vinculado (opcional)`.
- O campo `mapaId` passa a ser preservado em importação/exportação CSV de cenários.
- No Escudo do Mestre existe a preferência `Sincronizar automaticamente cenário ↔ mapa vinculado`.
- Com essa preferência ligada:
  - ativar um cenário que possua mapa vinculado abre esse mapa na Mesa;
  - abrir manualmente um mapa vinculado ativa o cenário correspondente.
- Com a preferência desligada, mapas e cenários podem ser usados de forma totalmente independente.
- Cenários sem mapa e mapas sem cenário continuam funcionando normalmente.
- O painel de Cenário mostra o mapa vinculado e oferece um botão para abri-lo manualmente.

## Validação

- 176/176 testes automatizados aprovados.
- preparação do Firebase Hosting executada sem erro.
