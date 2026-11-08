# Atualização 61 — histórico transparente de modificadores + favicon

## Por que apareciam −26 e −23

Os valores observados não vinham de defesa do alvo nem da antiga incompatibilidade de arma.
O caminho numérico bate exatamente com duas regras já existentes:

- penalidade de armadura de 15%;
- fadiga em nível que impõe dificuldade **Difícil** (multiplicador 2/3).

Exemplos observados:

- 58 → 49 pela armadura de 15% → 32 em Difícil;
- 53 → 45 pela armadura de 15% → 30 em Difícil.

Como o histórico antigo recebia apenas base e valor final, chamava toda essa diferença de “outros modificadores”.

## Alterações

- O histórico de ataques agora detalha as etapas que transformam a perícia base em efetiva, incluindo:
  - armadura percentual;
  - fadiga/dificuldade;
  - incompatibilidade de arma;
  - ferimentos;
  - estado caído;
  - infecção;
  - escudo;
  - efeitos psíquicos;
  - modificadores do mestre;
  - bônus de Agilidade Psi e Intuição;
  - eventual campo legado de arma danificada.
- A mecânica de armadura e fadiga não foi removida. Apenas deixou de aparecer como um número opaco.
- Adicionado `favicon.svg`: um dado/astro facetado em ciano com estrela dourada, pensado para continuar legível em abas pequenas.
- O `index.html` referencia o favicon e usa cache `mapa-61`.
- O script de pré-deploy agora copia `favicon.svg` para `.firebase-public`.

## Validação

- 123 testes automatizados aprovados.
- Pré-deploy executado e confirmado: `index.html`, módulos JS e `favicon.svg` são copiados para `.firebase-public`.
