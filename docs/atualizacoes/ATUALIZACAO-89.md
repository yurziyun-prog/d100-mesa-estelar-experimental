# Atualização 89 — interações multi-perícia, limite diário, Sorte e inventários compartilhados

## Cenário Atual
- Uma interação pode permitir várias perícias reais do Banco de Perícias.
- O jogador escolhe a perícia antes do teste.
- Cada personagem pode testar cada perícia uma vez por interação, por dia de campanha.
- Uma perícia usada não bloqueia as outras perícias permitidas na mesma interação.
- O resultado diário fica persistido na ficha.

## Sorte nas interações
- Depois de uma tentativa normal, o jogador pode gastar 1 Ponto de Sorte para rerrolar aquela perícia.
- A rerrolagem substitui o resultado anterior, inclusive quando o novo resultado é pior.
- A tentativa continua marcada como usada naquele dia.
- Esta alteração vale apenas para as Interações do Cenário Atual. A revisão global da Sorte em combate/mapa continua reservada para uma etapa própria.

## Histórico
- Testes de interações agora usam o histórico geral da ficha.
- O mesmo registro é replicado pelo mecanismo já existente para o histórico do mestre.
- O registro inclui cenário, interação, perícia, rolagem, valor efetivo, grau e indicação de rerrolagem por Sorte.

## Editor de cenários
- O construtor guiado passa a usar seleção múltipla de perícias diretamente do Banco de Perícias.
- O formato textual permanece compatível: o terceiro campo pode conter vários IDs de perícia separados por ponto e vírgula.

## Veículos e naves
- Itens em inventários compartilhados passam a permanecer totalmente dentro do slot.
- O ícone 🚙/🚀 fica sobreposto no canto superior direito da imagem em vez de deslocar o item.

## Compatibilidade
- Interações antigas com uma única perícia continuam funcionando.
- Interações sem teste continuam funcionando.
- Comércio, combate normal, Psi e Primeiros Socorros não foram alterados.

## Validação
- 225 testes automatizados aprovados.
- Preparação do Firebase Hosting concluída sem erros.
