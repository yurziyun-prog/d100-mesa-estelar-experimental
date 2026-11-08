# Regras do projeto

Preservar as instruções de `CLAUDE.md` e `LEIA-ME.md`.

## Mapa livre de painéis permanentes — pedido do Yuri, 27/10/2026

- Nenhum painel, menu ou barra permanente pode cobrir a área jogável do mapa, no computador ou no celular.
- Usar `acomodarPainelMapa` de `js/mesa-paineis-layout.js` para colocar controles permanentes em fluxo normal fora do mapa.
- Identificar novos painéis permanentes com `data-mapa-painel="permanente"`. A salvaguarda central os move automaticamente para fora da área jogável, inclusive se outro módulo tentar reinseri-los no mapa.
- Sobreposições são permitidas somente para balões temporários que fecham/recolhem ou janelas que o usuário pode arrastar. Não transformar uma barra permanente em sobreposição só porque ocupa pouco espaço.
- Arte de cenário, miniaturas, indicadores de alvo e efeitos do mundo não são painéis de interface.
- Conferir os retângulos dos painéis em relação ao mapa nas larguras 1280 e 390 px. Novos controles devem seguir esta regra antes de publicar.
