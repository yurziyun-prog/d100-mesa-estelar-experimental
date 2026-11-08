# Atualização 59 — correções após teste integrado

- Mercado: autorização profissional médica reconhece a categoria `Itens Médicos` e nomes como `Analisador Biomédico`, sem liberar outros itens Restritos para a carreira.
- Movimento: a borda do mapa usa o raio real da miniatura. Uma miniatura normal de 1 m pode encostar a 0,5 m da borda, em vez da antiga margem fixa maior.
- Resistência: testes de consciência e as resistências físicas diretas que pedem a perícia inteira usam o total de Resistência, sem aplicar novamente redutores situacionais de ferimento, fadiga, queda, armadura ou efeitos temporários. A Esquiva e os testes que realmente usam dificuldade continuam com seus modificadores normais.
- NPCs: novos NPCs colocados na mesa direta guardam os atributos individuais usados para calcular suas perícias, evitando uma nova rolagem de atributos em leituras posteriores quando o modelo usa fórmulas aleatórias.
- Mesa do mestre: arrastar um objeto no modo `Atuar como mestre` grava a nova posição imediatamente na cena compartilhada, no arquivo da cena e no mapa salvo. Assim jogadores e colisão passam a usar a mesma posição e `Salvar mapa` não deve fazê-lo voltar ao local anterior.
- Ataques à distância: objetos sólidos na camada 3 com `Bloqueia movimento` bloqueiam também a linha reta de tiro. Objetos destruídos, passáveis e de outras camadas não bloqueiam. Ataques de cone não foram alterados por esta regra.
- Testes automatizados Node: 115/115 aprovados.
