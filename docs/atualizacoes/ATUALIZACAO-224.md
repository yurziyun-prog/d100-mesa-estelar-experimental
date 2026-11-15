# Publicação automática experimental

Data: 15/11/2026. Branch: chatgpt-tres-mapas-correcoes-v224.

## Mudanças

AGENTS.md registra autorização permanente para testar, criar commit, enviar ao GitHub e conferir a publicação experimental. Firebase e site principal permanecem fora deste fluxo.

Corrigida a divergência entre a página antiga mesa.html e seus módulos atuais: recuperada a página da instalação local D100-Publicacao/mesa-estelar, mantendo a navegação do portal e o cabeçalho unificado de salvamento v265 do histórico do repositório. Os testes de Mesa agora leem mesa.html, não o portal index.html. Três expressões de teste aceitam quebras Windows/Linux; a verificação de foco segue o estado atual sem ocultar painéis e a verificação de cópia de artes examina o código em vez de um comentário removido.

Artes originais recuperadas de Documents/Codex/2026-09-09/referenced-chatgpt-conversation-this-is-an/work/mesa-sync, incluindo mapas, móveis, texturas e criaturas. O pacote monta app.js das partes, confere imports/sintaxe e inclui artes, fontes e Orla. Não foram alteradas mecânicas da Orla v0.60 nesta atualização.

## Fluxo permanente

- npm ci; npx playwright install --with-deps chromium.
- npm run check:publication (792 testes, sintaxe/imports e navegador). Windows pode usar ORLA_BROWSER=chrome.
- npm run build:pages; repetir abertura com PUBLICATION_DIR=dist.
- Commit pequeno e git push origin chatgpt-tres-mapas-correcoes-v224.
- Consultar check Cloudflare Pages do SHA; npm run verify:publication -- SHA confirma manifesto no domínio público, hash do carregador e abertura real. Repetir enquanto deploy estiver pendente; falhas exigem investigação, nunca declarar sucesso por push ou preview apenas.

O script build-cloudflare-pages.sh exige validação antes de montar dist. O workflow GitHub repete os testes. publication.json informa commit, branch e SHA-256; verificação considera os bytes do commit, evitando diferenças de quebra de linha no Windows. Não usa tokens Cloudflare.

## Validação local

792 testes aprovados, zero falhas. Sintaxe/imports aprovados. Abertura e integridade Orla em 1280 e 390 px aprovadas; atualização corrompida corretamente recusada; cinco abas do portal verificadas. As 74 falhas iniciais foram resolvidas sem excluir testes. A cobertura completa de mecânicas Orla não foi reexecutada, pois o jogo não mudou; o teste de inicialização não equivale a esse conjunto.

A confirmação do deploy deste commit deve ser obtida no check Cloudflare e no manifesto público, e relatada ao usuário após o push.

## Compatibilidade do build Cloudflare

O primeiro deploy d36874d falhou no Cloudflare, embora todos os testes tenham passado no GitHub/Linux. O registro público não informou a causa detalhada. O build agora exige a aprovação do workflow GitHub do mesmo SHA/branch, sem instalar Chromium no Cloudflare; falha, cancelamento ou expiração bloqueiam a publicação. Os testes de navegador continuam obrigatórios no GitHub. Dois testes adicionais verificam esse bloqueio.
