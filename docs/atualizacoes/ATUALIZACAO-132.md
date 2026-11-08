# Atualização 132 — Raios, abrigos, areia e meteoros · Taverna do UR-17 · Elenco automático · Cila com 6 cabeças · Trombeta em cone

## Clima (painel 🎨 Visual do mapa)
- **Relâmpago ≠ raio.** O relâmpago é só clarão e trovão. O raio de verdade é raro (cerca de 1 a cada poucos minutos de tempestade) e causa **2d6 de dano elétrico, ignorando a armadura**. Criaturas grandes ou com muito metal (robôs, drones, armaduras, UR-17…) atraem mais; na maioria das vezes o raio cai no chão.
- **Abrigo** (novo seletor, por mapa):
  - ao ar livre;
  - 🛖 barraco: ainda respinga, e o raio entra pouco;
  - 🏠 casa;
  - 🏢 edifício sólido;
  - 🏰 palácio/fortaleza.

  Dentro de um abrigo, todos veem o clarão e ouvem o trovão abafado, mas a chuva, a areia e os raios não entram. Os meteoros ainda podem furar o teto: palácio 10%, edifício 25%, casa 50%, barraco 80%.
- **🏜️ Tempestade de areia:** partículas pesadas, céu amarelado e som de vento.
- **☄️ Chuva de meteoros:** riscos de fogo no céu, com um impacto a cada ~15 s.
  - O impacto causa 3d6 em quem estiver a até ~1,5 m.
  - Ele **incendeia o que é de madeira, tecido ou palha** a até ~2 m. O fogo é o mesmo que já existe na mesa: queima, se espalha e o extintor apaga.
- Só o navegador do mestre sorteia raios e meteoros; o resultado vai para o histórico.

## "A Última Bateria" (bar1_2)
- O mapa foi reformado automaticamente, uma única vez, na conta do mestre, numa **taverna retrofuturista administrada pelo robô UR-17**:
  - balcão, mesas bumerangue, poltronas ovo, jukebox e sofá;
  - armário de suprimentos trancado, com itens e o *Livro-caixa de UR-17*;
  - tabela de preços no chão;
  - corredor com **6 quartos-cápsula de aluguel**, com portas fechadas, algumas trancadas.
- O mapa antigo ficou guardado em `combatesAtivos/backupMapa_bar1_2_v132`.

## Elenco automático
- Ao abrir um mapa, o mestre vê entrar sozinhos os NPCs, PMs e criaturas vinculados ao cenário desse mapa (vínculos e nomes escritos em "NPCs da cena"), em lugares livres. O NPC que tem um objeto com o seu nome fica perto dele: o UR-17, por exemplo, fica ao lado da caixa registradora.
- Quem já está em outro mapa não é duplicado.
- **NPC com nome tem uma miniatura só no jogo inteiro**, como os jogadores. Colocar de novo **move** a miniatura. Os genéricos (guarda, soldado, frequentador…) ainda podem ter várias cópias.

## Combate
- **Ataques em área partem do atacante:** a Trombeta do dragão-trombeta (e todo ataque marcado como cone, cone_sonoro ou área) sai da boca do atacante em cone de 60° na direção do alvo. Atinge todos dentro do cone com a mesma rolagem de ataque, e cada um se defende. Funciona também no tempo real.
- **Cila:** não sai do lugar. Os seis pescoços agem por conta própria: cada ataque é de uma cabeça, que escolhe o seu alvo entre os que estão ao alcance. No mapa, as cabeças balançam em volta do corpo, e a cabeça que ataca estica o pescoço até o alvo, morde e volta.

## Técnico
- Novos módulos: `js/mesa-elenco.js` e `js/mesa-cabecas.js`.
- Arquivos alterados:
  - `mesa-visual.js` (abrigo, areia, meteoros);
  - `mesa-efeitos.js` (raio, meteoro, vento);
  - `mesa-tempo-real.js` (área, cabeças, sésseis);
  - `mesa-tempo-real-ia.js`;
  - `mesa-barra.js` (miniatura única);
  - `mesa-gerador-mapas.js` (`gerarTaverna`);
  - `app.js` (ponte do raio/meteoro, cone pelas propriedades do ataque, módulos);
  - `nova-direta.js`;
  - `index.html` (`46.145-v132-mesa`).
- Testes: `tests/v132-static.test.mjs` e `tests/v132-elenco.test.mjs`.
