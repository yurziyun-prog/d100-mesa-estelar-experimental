# Atualização 135 — Tempo do jogo · sono · hospital · lanterna, machado, picareta, extintor e kit

## ⏰ Tempo do jogo
- No canto do mapa aparece a hora do jogo (ex.: "🌙 dia 2 · 01:07"). Os jogadores veem quando o mestre deixa o relógio andando, ou quando marca "mostrar a hora mesmo parado".
- O mestre clica na hora para:
  - ligar e desligar o relógio;
  - escolher quanto dura um dia: padrão **24 h do jogo = 1 h real**, ajustável;
  - acertar o dia e a hora;
  - pular +1 h, +8 h (noite de sono) ou +1 dia.
- Painel 🎨, Iluminação **"🕐 Pela hora do jogo"**: a luz do mapa segue o relógio (dia 7–17 h, entardecer, noite).
- Só a conta do mestre faz o tempo agir. Se ela ficar fechada, as horas são recuperadas quando voltar.

## 😴 Dormir
- Camas, beliches e cápsulas de descanso ou de aluguel são **🛏️ interativas**: "😴 Dormir aqui", "🛏️ Deitar X" e "⏰ Acordar".
- A Fadiga da ficha melhora um nível por vez, conforme a tabela: Ofegante 15 min, Cansado 3 h, Fatigado 6 h, Exausto 12 h, e assim por diante.
- A miniatura mostra 😴.

## 🩺 Hospital
- Novo móvel **Cápsula de recuperação**, que entra sozinho no banco. Três delas foram colocadas na **Clínica das Três Arcadas** (e em qualquer mapa com clínica, hospital ou enfermaria no nome).
- **"🩺 Colocar X na cápsula"** funciona para quem estiver perto, inclusive desacordados.
- A cada hora de jogo:
  - +1 PV em cada parte ferida;
  - os ferimentos são estabilizados, o que tira do coma;
  - o personagem acorda quando a cabeça, o peito e o abdômen voltam a ficar acima de 0.
- "🚪 Tirar da cápsula" mostra o total curado.

## 🔦 Itens com efeito
- **Lanterna** equipada: cone de luz na direção em que o personagem olha, visível para todos quando o mapa está escuro.
- **Machado** e **picareta**:
  - no balão de objetos de madeira (machado) ou de pedra (picareta): "🪓 Cortar" / "⛏️ Quebrar" com Força Bruta +20;
  - no combate, a ferramenta certa ignora a dureza e faz +50% de dano no objeto;
  - machado, picareta e pé de cabra dão +20 para arrombar portas e baús.
- **Extintor:** "🧯 Apagar com o extintor" direto no balão do objeto em chamas. Continua no painel de ações também.
- **Kit médico:** como antes, os Primeiros Socorros com kit valem a perícia inteira; sem kit, metade. Isso vale também para a IA dos médicos.
- A mesa reconhece as ferramentas pelo nome dos itens equipados ou no bolso.

## Técnico
- Novo: `js/mesa-relogio.js`.
- Arquivos alterados:
  - `mesa-objetos.js` (tipos 🛏️/🩺, ferramentas, extintor);
  - `mesa-visual.js` (luz pela hora, lanterna);
  - `mesa-arte-objetos.js` (Cápsula de recuperação);
  - `nova-direta.js`;
  - `app.js` (ferramentas, bônus no dano a objetos);
  - `mesa-elenco.js`;
  - `mesa-recheio.js`;
  - `mesa-arte-ui.js`;
  - `index.html` (`46.148-v135-mesa`).
