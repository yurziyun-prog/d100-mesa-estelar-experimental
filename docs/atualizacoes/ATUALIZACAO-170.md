# v170 — Peças das imagens, visão mais perto, plantas que não barram

- **Peças das imagens.** As 72 imagens de `arte-fonte/imagens-ia/pecas-vespera` viraram peças do Banco de Objetos de Mapa (as que começam com "ia_"):
  - casas, terraços, telhados, toldos, barracas, barris, caixas, escadas, paredes, chãos, fonte, estátua, palmeiras e outras;
  - cada uma foi limpa (sem os pedacinhos soltos em volta), cortada e posta no tamanho real em metros;
  - o site do mestre cadastra as peças sozinho;
  - peças novas: `python3 arte-fonte/pecas.py`, com o tamanho de cada peça na tabela do script.
- **Veículos e naves:** ainda não entram. O mestre vai refazer as imagens com as dimensões no nome.
- **Ruas Escavadas decoradas com as peças:**
  - fonte ou estátua nas pracinhas;
  - barracas, barris, caixas, sucata, arbustos, varais e tapetes;
  - o que barra só fica encostado na parede e com rua livre na frente; corredor estreito não recebe nada que barre;
  - as plantas soltas que atrapalhavam a passagem saíram;
  - cópia antes da mudança: `backupCena_<mapa>_v170`.
- **Plantas pequenas não barram mais ninguém:** jogador, NPCs e o caminho automático passam por elas.
- **Visão do jogador:** em mapa maior que a taverna, ele vê uns 20 m de largura, em vez de 28; a câmera segue o personagem. Os botões 🔍 continuam funcionando.
