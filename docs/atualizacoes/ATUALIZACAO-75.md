# Atualização 75 — Oficina 2: Salvar atual / Salvar como novo / Excluir mapa

A Oficina 2 embutida no Mapa da Mesa agora diferencia explicitamente três operações:

- **Salvar mapa atual**: grava as edições no mapa que está aberto e compartilha a cena atualizada com os jogadores.
- **Salvar como novo mapa**: pede um novo nome, cria um novo documento de mapa sem sobrescrever o anterior e passa a usar a nova cópia na Mesa.
- **Excluir mapa**: remove o mapa atualmente aberto da biblioteca. Por segurança, exige que exista outro mapa para assumir o lugar e avisa caso haja alterações locais não salvas.

Também foram feitos os seguintes ajustes:

- o antigo botão pequeno de salvar, que duplicava a função de salvar, fica oculto durante a edição embutida;
- o campo de nome passa a indicar o mapa aberto e fica somente para leitura nesse modo;
- a Oficina mostra um estado claro: **Mapa salvo**, **Alterações não salvas** ou **Salvando…**;
- o cache do aplicativo foi atualizado para `mapa-75`.

Esta atualização é restrita ao gerenciamento de mapas pela Oficina 2 e não altera as regras de combate, Psi, primeiros socorros ou movimento.
