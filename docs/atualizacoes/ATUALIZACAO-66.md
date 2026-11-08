# Atualização 66 — primeira camada de reorganização visual

Esta versão inicia a reorganização da interface de forma conservadora, sem trocar IDs nem reescrever a lógica das fichas.

- cabeçalho superior mais compacto, com marca do sistema, usuário, idioma e saída;
- menu principal (Ficha, Cenário, Mercado, Regras, Mapa e Escudo) mantido horizontal, agora em uma única faixa com rolagem horizontal quando faltar espaço;
- ao selecionar um personagem, a lista de personagens é recolhida e surge um contexto persistente à esquerda com retrato, nome e identificação;
- botão **Trocar personagem** reabre a lista sem perder a ficha atual;
- as abas internas do personagem continuam horizontais e passam a ter rolagem horizontal em telas estreitas;
- layout responsivo: em telas menores o contexto do personagem passa para uma faixa compacta acima da ficha.

A mudança foi feita como camada visual sobre os elementos atuais para reduzir risco: os mesmos IDs, botões e funções continuam existindo.
