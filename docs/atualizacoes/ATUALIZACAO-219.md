# Atualização 219 — mapa na tela, visão 2.5D e casas por dentro

- A mesa agora cabe na janela: o mapa ocupa o espaço restante e a página não rola para baixo. Funciona em 1280×720 e 390×844.
- O modo **⛶ Mapa maior** começa ligado e esconde as barras opcionais (Ferramentas, faixas de botões, ficha e histórico). O botão **🗗 Painéis** traz tudo de volta; a escolha fica guardada no navegador.
- O botão **2.5D** liga/desliga a visão inclinada de 30° (estilo Ragnarok aproximado). O mapa ganhou sombra de tabuleiro e os nomes das miniaturas ficaram em pé. A visão de cima continua disponível.
- No celular o mapa é dimensionado pela altura (miniaturas legíveis) e pode ser arrastado/pinçado; não há rolagem lateral da página.
- **Casas por dentro:** o botão **🏠 Todos os interiores**, no Marcador (🖌️), cria em lote o interior das casas do mapa e liga cada uma pela porta. Ao chegar perto da porta, o personagem entra sozinho no mapa interno; ao voltar para a porta de dentro, sai para o mapa externo.
- A troca de mapa não devolve mais o controle ao “Mestre” quando ele estava atuando como alguém.
- O movimento pendente do mapa antigo é descartado em silêncio ao atravessar a porta (antes aparecia “Este personagem está em outro mapa” no console e podia puxar a miniatura de volta).
- A ficha rápida começa recolhida; o histórico continua disponível.

Validação: 794 testes unitários passando; teste de navegador do layout em 1280 e 390; teste de navegador da casa (entrar e sair sozinho) passando; montagem confere sintaxe e imports.

Limites: a visão 2.5D é uma inclinação do mapa atual, não uma arte isométrica nova; para ficar igual a Ragnarok de verdade seria preciso redesenhar o cenário e as miniaturas em perspectiva. Os interiores são gerados pelo gerador de interiores existente e precisam de ajuste manual de móveis/portas quando o mestre quiser um cômodo específico.
