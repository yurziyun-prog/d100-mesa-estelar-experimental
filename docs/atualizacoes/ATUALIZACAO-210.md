# Atualização 210 — Combatente aprovado no mapa

O combatente de casaco bege, lenço vermelho e rifle azul aprovado na prévia foi integrado ao mapa existente. Usa imagens animadas derivadas do modelo 3D, sem exigir renderização 3D em tempo real no navegador dos jogadores.

- 21 sequências, com 12 quadros cada. As ações usadas pelo mapa (parado, andar, atacar, receber golpe e morrer) têm frente, costas e lado próprios. Correr e mirar também foram preservados para evolução futura.
- Aparência `combatente_bege`, listada como **Mesa Estelar · Combatente de casaco bege** no seletor do cartão de comportamento.
- NPCs que usam `npc_combatente` passam a usar essa aparência por padrão. Uma escolha explícita anterior de aparência continua prevalecendo. Selecionar **Aparência: arte de antes** restaura a ilustração.
- Relevo, câmera e andares continuam sendo os do mapa atual. A miniatura tem sombreamento e volume pintados nos quadros, não cria uma nova câmera 3D.
- Modelo GLB aprovado preservado em `arte-fonte/combatente-aprovado`; cópias anteriores dos três módulos alterados na mesma pasta. A prévia independente aprovada continua intacta.
- Correção na troca de aparência: reinicia o estado da animação para não herdar a queda ou o golpe do modelo anterior.

Validação: 724 testes unitários passaram; teste do app real como mestre passou; teste específico do combatente confirmou padrão, escala, frente/costas, disparo, morte, escolha explícita de outro modelo e retorno à arte anterior.

Publicação: somente Hosting; esta alteração não modifica regras do banco nem dados da campanha.
