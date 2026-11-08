# Pendências e provas — mapa de testes "🌿 Ecossistema (teste)" (3ª etapa, v205)

Registro vivo, reconciliado com o que foi **executado**. Um item só é "provado" se há teste que falha quando o comportamento some.
Legenda de validação: **[H]** harness local (Edge sem cabeça, Firestore FALSO, papel de jogador SIMULADO; o mestre online é SIMULADO por alguns segundos) · **[U]** teste unitário · **[pad-emul]** Gamepad API emulada · **[auth]** sessão autenticada real (só o Yuri) · **[pad-fisico]** controle físico (só o Yuri).

Limites desta máquina: sem acesso ao Firestore de produção nem ao mapa salvo do Yuri; **sem Java**, logo sem emulador do Firestore (duas sessões independentes ficam pendentes). A reforma do mapa SALVO é entregue como ferramenta do mestre (🛠️ Reformar mapa de teste: inventário → backup → aplicar → restaurar); **o Yuri aplica uma vez** (versão 3 da reforma).

## Matriz da etapa
| # | Item | Estado | Validação / evidência | Observação |
|---|---|---|---|---|
| 1 | Escala adulta por espécie, sem multiplicadores acumulados | **feito** | [H] `v205-escala-browser`; fotos `docs/antes-depois/` | medidas **P** (proposta) em `scripts/escala-fisica.cjs`; macaco ≈ 1,8 m de pegada / 2,1 m de altura |
| 2 | Discos/auras removidos | **feito** | [H] mesmo teste | sombra de voo (aprovada) mantida |
| 3 | Giros e andar espontâneos | **feito** | [H] `v205-giros-browser` | causa confirmada: leitura do retângulo da tela |
| 4 | Altura de voo × solo × objeto (colisão e ordem) | **parcial** | [U] `v205-espaco.test`; [H] sem cavaleiro real | altitude: montaria 5 m, voador natural 3 m |
| 5 | Níveis com elevação por dado (subsolo −3 m) | **feito** | [U] `v205-andares-subsolo.test`; [H] `v205-subsolo-browser` | saltos/quedas ainda em (id−1)·3 |
| 6 | Cavernas cobertas (teto abre só para quem está dentro, no nível) | **parcial** | [H] uma sessão | duas sessões [auth]/emulador pendente |
| 7 | Subsolo com acesso de ida e volta (alçapão e rampa da boca) | **feito** | [H] percurso desce e sobe andando | autoridade do mestre simulada |
| 8 | Escuridão real + lanterna/tocha/espada de energia empunhadas | **feito** | [U] `v205-escuridao.test`; [H] subsolo | só o equipado acende (letras L/T/N) |
| 9 | Cachoeira animada | **feito** | [H] `v205-cachoeira-browser` | som: não feito |
| 10 | Água: profundidade visual (sem dano) | **feito** | [U] [H] `v205-agua-*` | máscara de submersão em Blender: não feita |
| 11 | Lava: queimadura por contato, altura de voo, ponte firme | **feito** | [U] [H] `v205-lava-*` | mestre simulado; reset: ação "restaurar" do Diretor |
| 12 | Interações sem balões; clique no objeto; escada/rampa ao andar | **feito** | [H] percurso do jogador | Interagir (F) e controle continuam |
| 13 | Insetoide bípede (4 braços) × artrópodes alienígenas (nomes, grupos) | **parcial** | nomes e grupos em `mesa-especies-mapa.js`; render com 4 mãos distintas | rigs com pesos: não |
| 14 | Habitat, sede/água, atividades observáveis, diagnóstico do mestre | **parcial** | [H] `v205-ecossistema-browser` (120 s) | horas de simulação e filhotes: não |
| 15 | Ataque do jogador e equipar pela ficha real | **pendente** | — | precisa da ficha (emulador/Java) |
| 16 | Duas sessões independentes (autenticação de emulador) | **pendente** | — | sem Java |
| 17 | Controle físico | **pendente** | [pad-emul] stick e B passaram | o Yuri testa |
| 18 | Desempenho | **parcial** | 114 fps, p95 16 ms (`docs/desempenho-mapa-teste.json`) | Edge sem cabeça, 2 tokens na tela |
| 19 | Publicação e reabertura do site publicado | ver o final deste arquivo | | |

## Pendências que dependem do Yuri
1. Entrar como mestre, abrir o mapa de teste e usar **🛠️ Reformar mapa de teste** (faz backup antes; coleção `backupsMapa`).
2. Autorizar a instalação de um JRE para o emulador (duas sessões, ataque e equipar pela ficha real) ou testar autenticado.
3. Testar com controle físico e olhar as proporções (tabela **P** de `scripts/escala-fisica.cjs`).

## Vídeo e fotos
- `docs/video-percurso/percurso-jogador-teste.webm` — percurso da etapa anterior.
- Vídeos desta etapa em `docs/video-etapa3/` (subsolo, cachoeira, ecossistema).
- Fotos antes/depois em `docs/antes-depois/`.

## Dificuldades
Ver `docs/dificuldades-para-gpt.md` (e o histórico em `docs/dificuldades-para-gpt.historico-etapa2.md`).
