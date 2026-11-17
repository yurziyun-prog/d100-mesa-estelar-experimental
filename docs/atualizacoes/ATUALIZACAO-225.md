# Atualização 225 — Orla v0.62 e sessão 3D

A Orla experimental passa a oferecer sessão 3D compartilhada, com controle do mestre por Deus no mapa, fichas importadas do Mesa, equipamentos visíveis, quatro cenários e novos modelos de criaturas. A exploração local incorpora as correções v0.61, preservando casas, móveis, inventário e câmera.

Veja `orla/README-v062.md` para entrada na sala, comandos, conteúdo e limites. Nenhuma regra Firebase, ficha original ou aba externa à Orla foi alterada.

Os testes da sessão entram no workflow obrigatório de publicação: propriedade de personagens, poderes de Deus, colisões, munição, d100, consumíveis, controle exclusivo, sincronização entre duas abas e SDK real sem autenticação. O manifesto de publicação também identifica o hash do código online.

O teste em duas abas usa transporte de teste. A integração com contas reais exige ensaio autenticado com o mestre e jogadores; não declarar que esse ensaio ocorreu sem evidência. Não houve publicação de regras ou site no Firebase.

## Correção da validação Linux
O primeiro envio (546b243) foi bloqueado: dois testes online excederam o tempo no renderizador por software do GitHub. A resolução das sombras e do canvas agora se adapta a renderizadores por software, preservando a geometria. O transporte de teste usa tempo real decorrido, e o teste de movimento renova a intenção como o cliente real. As capturas têm prazo maior sem remover verificações. A publicação continua condicionada à aprovação de todos os testes.

