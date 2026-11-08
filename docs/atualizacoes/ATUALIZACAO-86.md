# Atualização 86 — Banco de Naves, tripulação e porão compartilhado

Esta versão cria a fundação persistente de naves espaciais sem implementar ainda o combate espacial.

## Banco de Naves
- nova aba `Banco de Dados → Naves`;
- criar, editar, duplicar, remover, importar e exportar CSV;
- campos de tipo/finalidade, classe e porte;
- casco, blindagem, escudos, energia, combustível, movimento, manobra, sensores e slots de armas;
- capacidade de carga, tripulação mínima/máxima e passageiros;
- preço, acesso e flag de venda já preparados para integração comercial futura.

## Nave possuída / tripulação
- uma nave pode ser vinculada a vários personagens;
- funções: Dono, Capitão, Piloto, Navegador, Artilheiro, Engenheiro, Sensorista, Tripulante e Passageiro;
- a nave aparece na barra lateral somente para personagens vinculados;
- jogadores só recebem, em tempo real, as naves às quais estão vinculados.

## Porão compartilhado
- `Inventário → Nave` só aparece quando o personagem possui vínculo com ao menos uma nave;
- o bloco continua separado de `Inventário → Veículo`;
- vários personagens vinculados enxergam exatamente o mesmo porão;
- itens podem ser arrastados entre Equipado/Bolso/Mochila e o porão da nave;
- a carga máxima em kg é respeitada;
- durante combate normal, o porão fica fora do inventário imediato, preservando a regra já usada nos veículos.

## Segurança
- modelos de naves continuam administrativos;
- jogadores só podem ler naves possuídas às quais estão vinculados;
- jogadores vinculados podem alterar somente `cargaItens` e `atualizadoEm`.

## Ainda não incluído
- combate espacial;
- armas e módulos instaláveis;
- compra automática de nave pelo Mercado;
- presença de nave no Mapa da Mesa.

Validação automatizada: 210/210 testes aprovados.
