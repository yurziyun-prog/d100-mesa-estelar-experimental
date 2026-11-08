# Atualização 78 — side quest de mapas e cadastro de testes

Esta atualização prepara o terreno antes do vínculo Cenário ↔ Mapa.

- Corrige o seletor de mapas da Mesa para recarregar a biblioteca completa do Firestore ao abrir a Mesa.
- Adiciona Importar/Atualizar CSV, Exportar CSV e Template CSV ao Banco de Mapas.
- O CSV atualiza mapas pelo ID e preserva os demais mapas existentes.
- O conteúdo visual do mapa é serializado no campo `dados_json`; mapas grandes continuam sendo divididos em partes ao serem gravados no Firestore.
- O cadastro guiado de interações de cenário repopula a lista de perícias diretamente do Banco de Perícias.

A próxima etapa planejada continua sendo o vínculo opcional entre Cenário Atual e Mapa da Mesa.
