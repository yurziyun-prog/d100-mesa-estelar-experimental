# Atualização 63 — Rádio da Mesa restaurado para jogadores

## Objetivo

Restaurar o player flutuante de Música da Mesa para jogadores e tornar a sincronização da trilha independente do protocolo do Mapa da Mesa.

## Mudanças

- Todo usuário autenticado volta a receber o botão flutuante no canto inferior esquerdo.
- Desativado, o rádio fica recolhido como um pequeno ícone de alto-falante mudo.
- Ao ativar, o usuário pode recolher/expandir o player, ajustar o volume local, retomar a faixa ou silenciar.
- A música escolhida no Escudo do Mestre é publicada em `configuracoes/audio_mesa_ao_vivo_v1`.
- Jogadores escutam esse documento diretamente, portanto o rádio funciona independentemente da aba aberta e independentemente de qual implementação do mapa estiver ativa.
- Trocar música, iniciar um Momento/playlist, parar e avançar a playlist são sincronizados.
- A preferência de áudio e o volume continuam locais ao navegador do jogador.

## Compatibilidade

O banco existente `configuracoes/trilhas_mesa_v1` continua sendo a fonte das músicas cadastradas. Nenhuma música precisa ser recadastrada.
