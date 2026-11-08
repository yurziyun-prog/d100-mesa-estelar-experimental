// Gera docs/manifesto-criaturas.md a partir dos DADOS (catálogo de arte, escala física, identidade, populações): uma linha por espécie. Rodar: node scripts/gerar-manifesto.mjs
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const raiz=path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')),'..');
const imp=p=>import(pathToFileURL(path.join(raiz,p)).href);
const {SPRITES_3D}=await imp('js/mesa-sprites-3d-dados.js'),{ESCALA_FISICA}=await imp('js/mesa-escala-fisica.js'),{ESPECIES,a3DaEspecie}=await imp('js/mesa-especies-mapa.js'),{POPULACAO}=await imp('js/mesa-ecossistema.js');
const receitas=JSON.parse(fs.readFileSync(path.join(raiz,'scripts/blender/receitas_mapa.json'),'utf8'));
const FONTE={zumbi_1:'rig Adventurer (humanoide)',cadaver_de_chefe:'rig Adventurer (humanoide)',vampiro_generico:'rig Adventurer (humanoide)',serpente_sanguessuga:'arte anterior (sem receita nova)'};
const lin=[];const pop=Object.fromEntries(POPULACAO.map(p=>[p[0],p]));
const acoesDe=a3=>{const f=SPRITES_3D[a3]?.folhas||{};const nomes=Object.keys(f).map(k=>k.replace(/_(lado|costas|frente|perfil)$/,''));return [...new Set(nomes)].join(', ')||'—';};
for(const [id,e] of Object.entries(ESPECIES)){
 const a3=a3DaEspecie(id),f=ESCALA_FISICA[a3],pr=pop[id],tem=!!SPRITES_3D[a3];
 const arq=SPRITES_3D[a3]?.folhas?.andar_lado?.arquivo||'',fonte=SPRITES_3D[a3]?.aprovadaV205?'ARTE APROVADA (Blender): alias de blender_dragao_trombeta_cima — preservada':/^pessoa2_/.test(arq)?'rig Adventurer (humanoide), arquivo '+arq:FONTE[id]||(receitas[id]?'procedural (criaturas_cima.py), arquivo '+arq+', receita '+(receitas[id].corpo||'?'):'catálogo anterior, arquivo '+arq); // v205: fonte pelo catálogo RESOLVIDO (arquivo que o jogo usa)
 lin.push(`| \`${id}\` | ${e.nome} | ${e.grupo}${e.jogavel?' (jogável)':''} | ${fonte} | ${tem?acoesDe(a3):'sem arte 3D de cima'} | ${f?`${f.pegadaM??'—'} m · colisão ${f.soloM??'—'} m · alt. ${f.alturaM??'—'} m`:'—'} | ${e.habitat.join('/')}${pr?` (${pr[1]}× em ${pr[2]})`:''} | ${e.atividades.join(', ')} |`);
}
const md=`# Manifesto das criaturas do mapa de testes (gerado por \`scripts/gerar-manifesto.mjs\`)

Uma linha por espécie. **Não** conta criaturas como prova de ecossistema: o que foi observado está em \`docs/diagnostico-ecossistema.json\`.
Escala: medidas com **P** (proposta) estão em \`scripts/escala-fisica.cjs\` e podem ser ajustadas pelo Yuri; o bestiário não tem medida utilizável para todas.

## Decisão do Yuri (substitui a anotação antiga de "dois tipos de insetoide")
- **Insetoides**: bípedes, quatro braços, traços de inseto e anatomia alienígena; normalmente personagens/NPCs jogáveis, podendo haver indivíduos inimigos da mesma raça (\`insetoide_predador\`).
- **Artrópodes alienígenas**: monstros de outras anatomias (hexápodes, aracnomorfos, escavadores, enxames). Cada espécie tem nome próprio; o ID técnico não mudou (\`insetoide_predador_1\` → "Predador Quitinoso").
- "Monstro", "inimigo" e "bípede" não são sinônimos.

| ID técnico | Nome de exibição | Grupo | Arte / fonte | Ações no atlas | Escala física | Habitat (população) | O que faz (atividades) |
|---|---|---|---|---|---|---|---|
${lin.join('\n')}

## Pendências por espécie (honestas)
- Sem rig de esqueleto completo: todas as espécies procedurais (\`criaturas_cima.py\`) — andam por ciclo de pose por membro, não por rig com pesos. Humanoides (carniçal, cadáver, vampiro) e o lobo usam rig.
- \`serpente_sanguessuga\` e \`vampiro_psiquico\` não têm receita nova nem medida física: seguem pelo dimensionamento antigo (diâmetro do token).
- Hexápodes: marcha por grupos alternados de apoio ainda é a do procedural; ajuste fino por espécie não foi feito.
- Enxame: uma miniatura por enxame (agente único); partículas/atlas de muitos corpos não foram feitos.
- Filhotes, pequenos voadores decorativos e fauna aquática alienígena própria: **não implementados** (extensão proposta no guia).
`;
fs.writeFileSync(path.join(raiz,'docs','manifesto-criaturas.md'),md);console.log('manifesto:',lin.length,'espécies');
