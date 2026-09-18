# Levantamento de psiquismo — 18/09/2026

As rotinas abaixo existem no Mapa da Mesa antigo (`js/app.js`). Este levantamento não significa que estejam ativadas na Sincronização nova.

| Grupo | Rotinas/poderes existentes | Integração necessária |
|---|---|---|
| Cura por localização | `labPsiEhCura_`, `labPsiCuraLimite_`, `labPsiAplicarDireto_` | PV por região, custo de PP, ferimentos e estabilização no documento de saúde |
| Telecinese | Mover Objeto, Impulso; limites de peso e gasto | Transação de posição/objeto, alcance e colisão |
| Movimento | Salto, Teletransporte, Aceleração | Metros, orientação, orçamento de movimento e duração |
| Resistidos | Medo, Atordoar, Influenciar/Controlar Mente, Amnésia, Banimento | Fila de resistência por alvo; `labPsiSolicitarResistencia_`, `labPsiFinalizarResistencia_` |
| Grito Psíquico | Cone de 60° e 20 m, Força de Vontade | Reutilizar geometria e fila multialvo; manter regras distintas do Eco da Matilha (15 m/Esquiva) |
| Proteção | Círculo de Proteção, Evitar Dano, Ocultar Mente | Reservas, bloqueio de alvos e expiração sincronizados |
| Bônus | Intuição, Mente Acelerada, Agilidade Psi, Fluxo Marcial, Reflexos | Testes, ações e defesas separadas; cargas/duração |
| Mapa e aparência | Ilusão, Mimetismo, Anoitecer | Objetos ilusórios, transparência, áreas e visibilidade |
| Informação | Detectar, Empatia, Localizar, Psicometria, Visão Distante, Ler Mente | Resposta do mestre, entrega privada ao jogador |
| Telepatia | Mensagem com revisão do mestre | Caixa de entrada e respostas privadas |
| Recuperação | Meditação; Doador da Vida com confirmação narrativa | Tempo fora de combate e validação do mestre |

## Cuidados encontrados

- Existem várias redefinições de `labPsiAplicarDireto_`, `labPsiSolicitarResistencia_` e outras funções. A versão final carregada deve ser auditada para cada poder.
- O motor antigo altera `labEstado_` diretamente. Não pode ser chamado sobre o estado novo sem um adaptador transacional.
- `labPsiPassarDuracoesDoAtor_` concentra duração e manutenção; o novo combate precisa de marcação por rodada/oportunidade para não cobrar duas vezes em múltiplas abas.
- O cadastro do Firebase pode substituir os dados iniciais do arquivo; custos, alcance e requisitos devem ser lidos da ficha/cadastro vigente.
- A fila multialvo do Eco, adicionada nesta atualização, é uma base de sincronização, não a implementação dos poderes psíquicos.

## Próximo bloco autorizado

Migrar efeitos de regra (sangramento, derrubar, desarmar etc.) com escolhas e aplicação real, depois poderes por grupos. Cada aplicação precisa persistir estado, duração, gasto e histórico e sobreviver a reconexões. Não basta escrever o nome do efeito no histórico.
