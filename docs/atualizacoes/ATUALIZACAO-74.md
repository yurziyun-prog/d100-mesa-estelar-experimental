# Atualização 74 — cenários, comércio, serviços e mercado negro

## Código

- NPCs podem ser **comerciantes**, **prestadores de serviços** ou ambos.
- Serviços são cadastrados no formato `Nome|Preço|Descrição`, um por linha.
- NPCs marcados como **Mercado negro** podem vender os itens de seu estoque mesmo quando o personagem não possui o acesso legal normal ao item.
- Barganha também pode reduzir o preço de serviços.
- Contratar um serviço desconta recursos e registra o evento; o efeito mecânico específico continua sendo resolvido pelas regras/cena para não interferir nos sistemas médicos e de combate já estabilizados.
- A tabela do Banco de Cenários agora dá mais espaço às descrições de jogadores/GM e limita Tipo, Estado e Destinos.

## Dados fornecidos

A pasta `dados-v74/` contém:

- `banco_npcs_v74_2026-09-22.csv`
- `banco_cenarios_v74_2026-09-22.csv`

Eles foram derivados dos CSVs enviados em 22/09/2026. Para preservar alterações adicionais que possam existir no Firestore, prefira **Importar/Atualizar CSV** em vez de substituir o banco inteiro.

### NPCs

Foram configurados ou ampliados comerciantes/prestadores já existentes, incluindo Hessa Varn, Samir Vek, T'kesh Var, Rha-Kel, Ulka Ren, Boro Tann, Meral-Ti e Tor Vask.

Foram adicionados perfis de banco para UR-17, Kara Venn, Dra. Ilya Nemer, Tessan Vey, Dorrik e a contrabandista Siva Korr.

### Cenários

Foram acrescentados:

- C014 — Mina das Costelas de Ferro
- C015 — Bosque de Vidro-Pálido
- C016 — Serra dos Dentes Negros
- C017 — Palácio de Vaelkor
- C018 — Galeria de Íon
- C019 — Mercado das Mil Panelas
- C020 — Pátio das Sete Rodas
- C021 — Feira Sem Luz

Também foram acrescentados vínculos de NPCs ao Mercado das Cavidades, Última Bateria e Clínica das Três Arcadas para alimentar as Interações do Cenário Atual.

## Observação sobre mapa ↔ cenário

Esta atualização não vincula mapas e cenários automaticamente, mas preserva IDs independentes para que uma associação opcional possa ser adicionada mais adiante sem obrigar todo mapa a possuir cenário ou todo cenário a possuir mapa.
