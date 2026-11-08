# Mesa Estelar v108 — Diretor de cena + conteúdo aplicado pelo site

Esta versão não precisa de nenhum upload de arquivo: o conteúdo novo é gravado pelo próprio site.

## 📦 Conteúdo novo (sem CSV)
Quando o mestre entra, aparece no canto inferior direito o botão **📦 Conteúdo novo para o banco (n)**.

Ao clicar, escolha os pacotes e aperte **✅ Aplicar marcados**:
- **Criaturas v106**:
  - zumbis renomeados para Errante Parasitado (fraco) e Carniçal Dominante (forte);
  - Inchado Pustulento, Cão de Sucata, Rastejador de Tubulações, Sentinela Imperial, Mariposa Cinza e a galinha do Sérgio.
- **Subterrâneo v108**:
  - Rato Gigante de Esgoto, Enxame de Ratos, Lagarto de Galeria e Limo de Esgoto;
  - NPCs Pip Rasco (catador de túneis) e Irla Venn (técnica de manutenção).

O que já existe é atualizado sem perder a imagem e a miniatura atuais. Quem não tem miniatura ganha uma automaticamente.

## 🧭 Diretor de cena (botão 🧭 nas ferramentas do mapa, só o mestre vê)
- **Encontros**
  - Escolha o ambiente: Esgoto, Cidade, Ermos, Caverna, Ruínas ou Floresta.
  - Use o relógio de exploração: ▶ rodar, +10 min, +1 h e ↺ zerar.
  - Quanto mais tempo no lugar, mais a **tensão** sobe e maior a chance de catástrofes. No esgoto as catástrofes são enchente, enxame de ratos, o Carniçal com seu bando e desabamento.
  - Também há encontros bons: catador, equipe de manutenção, suprimentos e achados.
  - Cada proposta tem **Aprovar** (coloca as miniaturas e objetos direto no mapa, perto do grupo), **Outro** ou **Descartar**.
  - A **enchente** aprovada sobe sozinha no mapa a cada 10 min de jogo. **Encerrar perigo** acaba com ela.
- **Clima**: sorteia e aplica o clima do ambiente e o nível de luz. Também pode evoluir sozinho com o tempo.
- **Notas**:
  - Clique no mapa para fixar um alfinete com balão explicativo.
  - Cada nota pode ficar só para o mestre ou ser revelada aos jogadores.
  - **Criar balões do cenário** gera as notas a partir do resumo.
- **NPC**: gera um NPC (espécie e papel), salva no banco já com miniatura e coloca no mapa.

O estado do diretor fica no Escudo do Mestre; os jogadores só veem as notas reveladas.

## Segurança
- O diretor e o conteúdo carregam à parte. Se algum deles falhar, o mapa, o combate e as fichas continuam funcionando normalmente.
- Tokens repetidos da mesma criatura (`~1`, `~2`…) encontram a ficha do modelo no banco.

## Próximo (v109)
- Gerador de mapas (começando pelos esgotos de Véspera, salvos direto no site).
- Chão e terrenos novos, substituindo a floresta de "bolas verdes".
- Depois: prévias do Cenário Atual no estilo novo.

## Validação
- Navegador de teste com o site inteiro:
  - pacotes aplicados com miniaturas;
  - encontros propostos e aprovados, com miniaturas colocadas no mapa;
  - enchente subindo;
  - nota com balão;
  - NPC gerado, salvo e colocado no mapa.
- `node --test tests/*.test.mjs`: 298 de 330. Só falham os 31 testes antigos e o teste de cache da v102. Os 7 testes novos da v108 passam.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
