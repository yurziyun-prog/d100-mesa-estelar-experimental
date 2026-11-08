# Dificuldades e erros em aberto (para o GPT ler e propor alternativas)

Escrito por Claude durante a reforma do mapa de testes. Cada item: o que tentei, o que deu errado, o que peço.

## 1. Criaturas muito humanas (insetoides, macacos, etc.)
- **Problema:** ao reaproveitar o rig `Adventurer` (Quaternius) para criaturas "humanoides", elas ficaram parecidas demais com pessoas. O Yuri notou nos insetoides e no macaco de cálico.
- **Regra do Yuri:** há dois tipos de insetoide: (a) bípede, de pé (`insetoide_predador`), e (b) de 6 patas (`insetoide_predador_1`). Humanoides = personagens jogáveis; os outros = monstros.
- **Tentado:** braços longos, curvatura, carapaça via cores, braços de louva-a-deus dobrados. Não bastou: a silhueta (cabeça, tronco, 2 pernas) continua humana.
- **Peço:** técnicas para silhueta não humana sobre um rig bípede (cabeça triangular com mandíbulas, abdômen alongado, 4 braços reais, antenas, pernas digitígradas/invertidas), vistas de cima em 256 px.

## 2. Só ~23 das 27 espécies têm arte própria bem diferenciada
- As demais são reskins procedurais (`criaturas_cima.py` + `receitas_mapa.json`), sem rig e sem todas as ações (atacar, morrer).
- **Peço:** método barato para ganhar animação (balanço de membros, respiração) sem rig completo.

## 3. Testes simulados, não reais
- Firestore falso, papel de jogador simulado, mestre simulado ao "virar" o papel por instantes. Sem sessão autenticada e sem controle físico.
- **Peço:** forma de rodar o emulador do Firebase + dois navegadores (mestre e jogador) com autenticação de teste.

## 4. Rampa estreita
- Corredor entre rochas na rampa do planalto tem ~1 m (difícil de usar com mouse). Falta alargar no gerador.

## 5. Armadilha deixa a jogadora inconsciente
- Comportamento correto do jogo, mas atrapalha testes seguidos: o teste do calabouço só funcionou depois de "reanimar" a personagem (preparação registrada).
- Causa do primeiro falso erro da alavanca: o botão está na camada `#maCamada` (não `#moCamada`) e o pedido falhava com "Inconsciente.".

## 6. Ambiente
- Sem Python no PC; patches feitos em Node. Heredocs longos truncam (usar Write). Crases em `node -e` do Bash viram comando.
- Playwright antigo não abre o Chrome 155: usar Edge.
- Teste de assinaturas falha conforme o dia do mês (não relacionado).

## 7. Ainda não medido
- Desempenho (≥30 fps), controle (gamepad) real, combate com clique direito, equipamento pela ficha. Serão anotados aqui quando testados.

## 8. Ataque do jogador no teste automático
- Clique direito marca o alvo (provado) e o zumbi hostil ataca a jogadora (provado), mas Espaço/A do jogador não ataca no harness: `disparar()` precisa de `estado().sheet` com perícias/armas, que vem de `novaFicha_` (documento de ficha completo). O Firestore falso não tem essa ficha.
- **Peço:** forma de montar uma ficha mínima válida para o harness (ou rodar com o emulador do Firebase e uma ficha real).
- A armadilha de laje às vezes não dispara quando o jogador anda até ela com o teclado (parou dentro da laje, sem mensagem); disparou ao reposicionar sobre o centro. Possível janela de detecção estreita.
