# Mesa Estelar v122 — Ações dentro do mapa, disparo rápido e miniaturas dos monstros

## 💬 Balão de ações no mapa
Clique numa miniatura, ou use o **botão direito** no mapa, para abrir um balão ao lado dela. Ele tem cinco abas:
- **⚔️ Atacar:** cada perícia de ataque com as suas armas, mostrando dano, munição e **💥 área** quando o ataque é em área (cone, explosão, rajada).
- **🎲 Perícia:** qualquer perícia da ficha, com busca.
- **🔮 Psi:** poder, gasto de PP e alvo já preenchido. Poderes que pedem destino ou objeto avisam para completar na Ficha rápida.
- **🩹 Curar:** Primeiros Socorros na parte ferida (iniciar, continuar, concluir), ou a Cura psíquica.
- **🫀 Corpo:** PV e PA de cada parte do corpo; amarelo = ferida, vermelho = zerada.
  - Os jogadores veem as partes do próprio personagem.
  - O mestre vê as de todos.

Tudo usa o mesmo caminho da Ficha rápida: mesmas regras, turnos, munição e Sorte.

## ⚡ Disparo rápido (pensado para o combate dinâmico, sem turnos)
- **No canto do mapa** fica uma barra com os ataques do personagem numerados (**1 a 9**). O escolhido fica dourado e é lembrado.
- **Disparar:**
  - **Espaço** (ou **X**) dispara o ataque escolhido no alvo marcado;
  - **Shift + clique** numa miniatura ataca direto nela;
  - o botão **⚡ Disparar** faz o mesmo para quem usa só o mouse ou o celular.
- **Recarga:** respeita a recarga do tempo real, e o botão mostra "⏳ 1,2 s" enquanto recarrega.
- **Correção:** no combate em tempo real, o ataque do jogador pelo painel agora vai de fato para a mesa (recarga + defesa automática). Antes ele só rolava a perícia.

## ⌨️ Atalhos
Os atalhos valem com o mouse sobre o mapa ou com o balão aberto. Uma legenda compacta fica no canto do mapa; **?** esconde ou mostra.

| Tecla | Ação |
|---|---|
| A | atacar |
| T | perícia |
| P | psi |
| C | curar |
| F | corpo |
| 1–9 | escolhe o ataque |
| Espaço | dispara |
| Esc | fecha |

## 🐙 Miniaturas dos monstros (Cila e outros)
- **O problema:** monstros e NPCs do banco que tinham **foto** registrada como "miniatura" (Cila, Besta, dragões…) nunca ganhavam a miniatura desenhada.
- **O que muda:** ao abrir o site, o mestre desenha a miniatura deles sozinho, e as miniaturas que já estão no mapa trocam em até 15 s. A foto antiga continua guardada.
- **Personagens dos jogadores** com arte própria não são tocados.

## Técnico
- **Novo módulo:** `js/mesa-acoes-mapa.js` (balão, disparo rápido, atalhos, legenda), carregado à parte.
- **`nova-painel.js`:**
  - novas funções `estado`, `escolher` e `executar`;
  - o ataque é enviado também quando o tempo real está ativo.
- **`nova-direta.js`:** expõe `acoes`, `ator`, `alvo`, `marcarAlvo`, `saude`, `token` e `mestre`.
- **`mesa-conteudo.js`:** nova função `precisaMini`. A miniatura antiga fica em `miniaturaAnterior`.
- **`mesa-barra.js`:** a miniatura no mapa segue a miniatura atual do banco.
- **Versão:** `app.js?v=46.135-v122-mesa`.

## Validação
- **Navegador de teste:**
  - o mestre atua como a Besta Ululante e clica no Qozae: o balão abre ao lado com 3 ataques, e o ataque rolou;
  - atalhos T, F, C e P trocam de aba; Esc fecha;
  - a barra rápida mostra 1/2/3, a tecla 2 escolhe;
  - no tempo real, Espaço enviou o ataque pelo caminho do tempo real;
  - a página não pulou em nenhum momento.
- **Cila com foto:** ganhou a miniatura desenhada (corpo séssil), e a miniatura no mapa trocou sozinha.
- `node --test`: 353 de 385. Só falham os mesmos 32 antigos.

## Próximo (v123)
Portas, gavetas e armários que abrem; lâmpadas, computadores e máquinas que ligam; os trancados pedem teste (Segurança [Cofres e Fechaduras], Mecanismos, Força Bruta).

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
