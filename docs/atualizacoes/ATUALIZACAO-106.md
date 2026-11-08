# Mesa Estelar v106 — Miniaturas dos jogadores e novos monstros

## Miniaturas prontas dos personagens
Reconhecidas pelo nome da ficha (sem diferença de acento/maiúscula):
- **Qozae / Kozae** — reptiliano com focinho de jacaré, olhos amarelos, chapéu de caubói, sobretudo de couro, cauda e revólver.
- **Jullytrath** — drakoniana: escamas verde-esmeralda, chifres, cauda, asas recolhidas nas costas, cabelo longo vermelho-escuro.
- **Kibi** — humanoide pequeno com jeito de gnomo: baixinho, barba ruiva, mochila.
- **Sérgio Leone** — pistoleiro espacial de capacete, poncho e revólver.
- **Galinha do Sérgio** — criatura nova, para colocar no mapa ao lado dele.

Onde usar:
- Mestre: Banco → **NPCs** → painel **🧩 Miniaturas · personagens dos jogadores (PJ/PM)** → **✨ Gerar as que faltam** (ou clique em um para ajustar antes).
- Jogador: na ficha, **🧩 Miniatura do mapa** já abre com a receita dele; é só salvar ou mudar o que quiser.

## Novos monstros e zumbis refeitos
Arquivo: `dados-v106/criaturas_novas_e_zumbis_v106.csv` (mesmo formato do banco). Importe em Banco → Criaturas → importar CSV.
- `zumbi_1` → **Errante Parasitado** (fraco, lento, perigoso em grupo).
- `cadaver_de_chefe` → **Carniçal Dominante** (forte: placas ósseas, regeneração lenta, conduz errantes, 3 ações, armadura 2).
- **Inchado Pustulento** — zumbi de esporos que explode ao morrer (3 m, Resistência ou infecção).
- **Cão de Sucata** — predador ciborgue de matilha, rápido, enxerga no escuro.
- **Rastejador de Tubulações** — serpente dos dutos de Véspera, mordida paralisante e constrição.
- **Sentinela Imperial Corrompida** — robô de segurança do antigo Império com laser de varredura.
- **Mariposa-Cinza de Calico** — mariposa gigante atraída por luz, pó alucinógeno.
- **Galinha do Sérgio**.

Os IDs dos dois zumbis foram mantidos, então tokens e cenários que já usam esses monstros continuam funcionando; só mudam nome, atributos, ataques e descrição. As imagens antigas dos dois foram mantidas.

**Ordem recomendada:** importe o CSV **antes** de gerar as miniaturas das criaturas (a importação regrava a criatura inteira e apagaria uma miniatura salva antes).

## Técnico
- `js/mesa-miniaturas.js`: corpo **Ave**, arma **Revólver**, traços **Focinho de jacaré**, **Barba** e **Asas recolhidas**, asas grandes de mariposa, receitas dos novos monstros e dos personagens.
- `js/mesa-miniaturas-ui.js`: painel de personagens para o mestre; a ficha usa a receita pelo nome.
- `js/app.js`: entrega a lista de personagens ao painel; versão do módulo.
- Testes de versão v103–v106 passaram a aceitar versões futuras (não falham mais a cada atualização).

## Validação
- Navegador de teste com o site inteiro: painel de PJs gerou Jullytrath, Kibi e Sérgio com as receitas certas; editor da ficha e painel de criaturas continuam ok; sem erros.
- `node --test tests/*.test.mjs`: 287 de 319 — só as 31 falhas antigas + o teste de cache da v102.

## Deploy
Sem mudança de regras nesta versão (as regras da v105 continuam necessárias — se ainda não publicou a v105, use o comando com regras):
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
