# Regras do projeto

Preservar as instruções de `CLAUDE.md` e `LEIA-ME.md`.

## Publicação automática experimental — autorização de Yuri, 15/11/2026

- Repositório: `yurziyun-prog/d100-mesa-estelar-experimental`. Trabalhar na branch `chatgpt-tres-mapas-correcoes-v224`, sem trocar para `main`.
- Destino autorizado: https://d100-mesa-estelar-experimental.pages.dev/ . Não publicar no Firebase nem alterar o site principal. Esta autorização substitui a instrução histórica de publicação manual de CLAUDE.md somente para este experimental.
- Ao concluir cada alteração solicitada: executar `npm test`, `npm run check:syntax`, `npm run test:orla-startup` e os testes de navegador relevantes; somente com os testes obrigatórios aprovados criar commit pequeno e executar `git push origin chatgpt-tres-mapas-correcoes-v224`. Não pedir novamente autorização para esse fluxo.
- Falhas anteriores também devem ser registradas e investigadas; não remover testes, aceitar novas referências visuais ou ignorar falhas apenas para publicar. Se impedirem validação, informar bloqueio, sem declarar conclusão.
- Atualizações da Orla ficam em `orla/`; preservar as abas, artes e funcionalidades do Mesa. Conferir movimentação, câmeras em vários ângulos, paredes, portas, telhados, inventário, rotação de móveis e modos 2.5D/3D quando afetados. Não confundir o teste de inicialização com cobertura dessas mecânicas.
- O teste de abertura deve executar o carregador real e sua integridade SHA-256; nunca pular a verificação para fazer a Orla abrir. Testar desktop e celular.
- A integração GitHub → Cloudflare dispensa login para atualizações normais. Consultar o check `Cloudflare Pages` do SHA enviado e exigir `completed/success`. Um preview bem-sucedido NÃO prova que o domínio público foi atualizado.
- `scripts/build-cloudflare-pages.sh` exige aprovação do workflow `.github/workflows/publication-checks.yml` para o mesmo SHA e branch antes de montar o pacote. O navegador roda no GitHub; Cloudflare repete testes e sintaxe. Manter esse bloqueio: não publicar por um workflow antigo ou outra branch.
- Após deploy, consultar `/publication.json?verify=<SHA>` no domínio público, exigir commit e branch exatos e comparar SHA-256 do carregador. Executar também `PUBLICATION_URL` apontando para o domínio com `npm run test:orla-startup`. Só então confirmar publicação. Não inferir branch de produção pela branch padrão do GitHub.
- Em falha, investigar logs/checks, corrigir e testar novamente. Se necessário preparar `git revert` do commit problemático, preservando histórico; nunca reset forçado ou force-push.
- Relatório obrigatório: mudanças, testes aprovados/falhos, branch e SHA, resultado real do deploy e link direto. Se não foi confirmado, dizer explicitamente.

## Mapa livre de painéis permanentes — pedido do Yuri, 27/10/2026

- Nenhum painel, menu ou barra permanente pode cobrir a área jogável do mapa, no computador ou no celular.
- Usar `acomodarPainelMapa` de `js/mesa-paineis-layout.js` para colocar controles permanentes em fluxo normal fora do mapa.
- Identificar novos painéis permanentes com `data-mapa-painel="permanente"`. A salvaguarda central os move automaticamente para fora da área jogável, inclusive se outro módulo tentar reinseri-los no mapa.
- Sobreposições são permitidas somente para balões temporários que fecham/recolhem ou janelas que o usuário pode arrastar. Não transformar uma barra permanente em sobreposição só porque ocupa pouco espaço.
- Arte de cenário, miniaturas, indicadores de alvo e efeitos do mundo não são painéis de interface.
- Conferir os retângulos dos painéis em relação ao mapa nas larguras 1280 e 390 px. Novos controles devem seguir esta regra antes de publicar.

## Direção confirmada em 19/11/2026
Orla é somente uma aba dentro do Mesa D100 nesta etapa. Usar login/conta e personagem do Mesa, preservar visual semi-3D original e manter a mesa atual disponível. Integrar sistemas gradualmente; não promover o protótipo online separado como substituto. A ponte atual é local e não equivale a multiplayer validado.
