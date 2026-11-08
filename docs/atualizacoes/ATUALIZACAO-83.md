# Atualização 83 — Companheiros corrigidos + fundação de Veículos

## Companheiros
- Botões **Editar** e **Vincular** do Banco de Companheiros foram refeitos com eventos explícitos, evitando o problema em que o clique não abria nada.
- Novo botão **Duplicar** em cada modelo.
- Duplicar abre uma cópia editável com novo ID/nome sugerido, preservando imagem e propriedades; nada é salvo até clicar em **Salvar modelo**.
- O editor continua permitindo alterar nome, imagem por URL ou arquivo, capacidades, PV, montaria, combate e demais propriedades.
- O vínculo agora carrega a lista completa de personagens diretamente do Firestore, em vez de depender somente da lista local da conta do mestre.

## Veículos
- Nova aba **Banco de Dados → Veículos**.
- CRUD de modelos, duplicação, imagem, importação e exportação CSV.
- Modelos básicos: Moto gravítica leve, Rover de exploração e Caminhão de carga de Calico.
- Um veículo possuído pode ser vinculado a vários personagens simultaneamente.
- Funções iniciais: Dono, Motorista, Artilheiro, Mecânico, Tripulante e Passageiro.
- Personagens vinculados passam a ver o veículo na barra lateral da ficha.
- A instância guarda estrutura atual, energia, combustível, estado, tripulação e uma área de `cargaItens` já preparada para o inventário compartilhado futuro.
- Ainda não há combate veicular, representação no mapa ou compra automática pelo Mercado.

## Segurança
- `/veiculos` continua privado ao mestre.
- `/veiculosPossuidos` pode ser lido por usuários autenticados e escrito apenas pelo mestre nesta primeira etapa.

## Testes
189/189 testes automatizados aprovados.
