# v166 — Portão com a imagem nova, ver a colisão no Marcador

## Portão de Véspera com a imagem nova
- É a imagem nova da IA: margem em volta e casas inteiras (`arte/mapas/portao-ia-2.webp`, 32×48 m).
- **Reconhecimento à mão:**
  - 27 casas com terraço (2º andar);
  - escadas de fora (🪜 Subir/Descer);
  - rochas e o portão;
  - toldos e plantas por cima de quem passa.
- Denzel e os 7 vendedores vão para os lugares novos, e as saídas (cidade e espaço-porto) também.
- Antes da troca, guarda uma cópia da cena anterior em `backupCena_cenario_c001_v166`.

## Marcador: ver e mexer no que está valendo
- **🧱 Ver colisão:** mostra o que está valendo agora no mapa.
  - vermelho: o que barra quem anda na rua;
  - roxo tracejado: os terraços (2º andar);
  - amarelo: as escadas.
- **📥 Marcas do mapa:** transforma as paredes, escadas e terraços que já estão no mapa em marcas, para editar e reaplicar.
- **Mapas sem marcas guardadas:** ao abrir o marcador, essas marcas já aparecem sozinhas.
- **Onde ficam as marcas:** agora num documento próprio (`combatesAtivos/marcasMapa_<mapa>`). Antes ficavam dentro do mapa e podiam sumir quando o mapa era regravado.
- **Aplicar sem marcas "por cima":** a camada de toldos e plantas que já existe continua.
- **Barra do mestre:** a camada do marcador ficou abaixo da barra, que agora pode ser clicada com o marcador aberto.

## Andares
- O 2º andar (beirada dos terraços) não atrapalha mais quem está no térreo. Isso vale para:
  - quem chega por uma saída;
  - os NPCs que vão dormir;
  - as posturas;
  - o combate automático;
  - a arrumação de miniaturas.
