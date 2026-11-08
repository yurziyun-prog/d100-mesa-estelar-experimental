# Atualização 137 — Vida nos mapas, mapas amplos e controle de videogame

## Vida fora do combate (js/mesa-vida.js)
- Funciona só quando há jogador no mapa ativo ou quando o mestre está olhando o mapa, e só fora de combate (por turno ou em tempo real).
- O navegador do mestre decide as rotinas; todos os navegadores desenham o movimento de forma suave.
- O movimento vai num único documento (combatesAtivos/mesaVida) e as posições são gravadas a cada 20 s e quando a vida para.
- Rotinas:
  - limpeza: UR-17, garçons e zeladores vão de mesa em mesa;
  - comércio: o comerciante fica perto da banca;
  - guarda: faz ronda;
  - civil: passeia e visita as bancas;
  - montaria: o cavaleiro vai em cima da montaria domesticada;
  - caça: o predador persegue a presa, e a presa foge;
  - criaturas sésseis (como a Sila) ficam paradas.
- Ficam de fora: caídos, quem está deitado, quem está sendo arrastado, companheiros e o personagem com quem o mestre está atuando.

## Mapas amplos novos (criados uma vez, na conta do mestre)
- Grande Feira de Véspera (cidade retrofuturista, 84×42 m): mercadores, cambista, crianças, mensageiros e guardas em dragões-trombeta domesticados.
- Planície dos Trombetídeos (ermos, 84×42 m): manadas de cavalgantes prismáticos e macacodecálicos, caçados por dragões-trombeta selvagens, um predador couraçado e rastejantes de cinzas.

## Controle (js/mesa-controle.js)
- Funciona com Xbox, PlayStation e Steam Controller (pelo Steam Input).
- Comandos:
  - alavanca esquerda: andar (leve = devagar);
  - alavanca direita: rolar o mapa;
  - A ou RT: atacar com a arma rápida;
  - B: fechar;
  - X: interagir ou arrastar;
  - Y: alvo mais perto;
  - D-pad: trocar o alvo;
  - LB/RB: trocar a arma;
  - LT: menu de ações;
  - Back: centralizar;
  - Start: pausar o tempo real (mestre).
- Um ícone 🎮 com dica aparece quando o controle conecta.
