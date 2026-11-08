import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {escolherAtitude} from '../js/mesa-tempo-real-tatica.js';
import {perfilCombate} from '../js/mesa-tempo-real-ia.js';
import {MODOS_RT} from '../js/mesa-atitudes-dados.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const P={predador:perfilCombate({texto:'Besta Ululante predador grande',int:5,mov:8}),zumbi:perfilCombate({texto:'Cadáver de trabalhador zumbi',int:2,mov:4}),
 npc:perfilCombate({texto:'Soldado mercenário',int:12,mov:6,tipo:'npc'}),chefe:perfilCombate({texto:'Alfa da matilha predador',int:6,mov:8}),cadaverChefe:perfilCombate({texto:'Cadáver Chefe dominante',int:9,mov:5}),presa:perfilCombate({texto:'Galinha domesticada',int:3,mov:6}),cila:perfilCombate({texto:'Cila séssil',int:2,mov:0})};

test('v185: toda atitude escolhida existe; sem mente só usa Normal',()=>{
 for(const perfil of Object.values(P))for(const frac of [1,.6,.2])for(const emChoque of [false,true])assert.ok(MODOS_RT[escolherAtitude({perfil,frac,emChoque,distAlvo:.5,alcance:1.5})]);
 assert.equal(P.zumbi.tipo,'sem mente');
 for(const frac of [1,.5,.1])assert.equal(escolherAtitude({perfil:P.zumbi,frac,distAlvo:.2,alcance:1}),'normal');
 assert.equal(escolherAtitude({perfil:P.zumbi,frac:.8,emChoque:true}),'normal');
});
test('v185: fugindo → Recuo; encurralada volta ao Normal e luta; imóvel que "foge" se defende',()=>{
 assert.equal(escolherAtitude({perfil:P.presa,frac:.5,fugindo:true}),'fuga');
 assert.equal(escolherAtitude({perfil:P.presa,frac:.5,fugindo:true,encurralado:true}),'normal');
 assert.equal(escolherAtitude({perfil:{...P.npc,imovel:true},frac:.2,fugindo:true}),'defesa');
});
test('v185: em choque → Defesa total (menos sem mente); quase morta e destemida → chefe ataca, inteligente se defende',()=>{
 assert.equal(escolherAtitude({perfil:P.npc,frac:.9,emChoque:true}),'defesa');
 assert.equal(escolherAtitude({perfil:P.predador,frac:.9,emChoque:true}),'defesa');
 assert.equal(P.chefe.fuga,0);assert.equal(escolherAtitude({perfil:P.chefe,frac:.25,distAlvo:5}),'ataque');
 assert.equal(P.cadaverChefe.tipo,'sem mente · chefe');assert.equal(escolherAtitude({perfil:P.cadaverChefe,frac:.25,distAlvo:5}),'ataque','chefe sem mente também entra em frenesi');assert.equal(escolherAtitude({perfil:P.cadaverChefe,frac:1,distAlvo:.5,alcance:1}),'normal');
 const destemido={...P.npc,fuga:0};assert.equal(escolherAtitude({perfil:destemido,frac:.25,distAlvo:5}),'defesa');
 assert.equal(escolherAtitude({perfil:destemido,frac:.38,distAlvo:5,atual:'defesa'}),'defesa','mantém a defesa até 40%');
 assert.equal(escolherAtitude({perfil:destemido,frac:.45,distAlvo:5,atual:'defesa'}),'normal');
 assert.equal(escolherAtitude({perfil:P.npc,frac:.25,distAlvo:5}),'normal','quem foge por moral não entra em defesa: a fuga é tratada antes');
});
test('v185: predador com vida alta e alvo colado → Ataque total, mantido até 50%; longe ou ferido → Normal',()=>{
 assert.equal(escolherAtitude({perfil:P.predador,frac:1,distAlvo:1,alcance:1.5}),'ataque');
 assert.equal(escolherAtitude({perfil:P.predador,frac:1,distAlvo:4,alcance:1.5}),'normal');
 assert.equal(escolherAtitude({perfil:P.predador,frac:.6,distAlvo:1,alcance:1.5}),'normal');
 assert.equal(escolherAtitude({perfil:P.predador,frac:.6,distAlvo:1,alcance:1.5,atual:'ataque'}),'ataque');
 assert.equal(escolherAtitude({perfil:P.predador,frac:.45,distAlvo:1,alcance:1.5,atual:'ataque'}),'normal');
 assert.equal(escolherAtitude({perfil:P.chefe,frac:1,distAlvo:1,alcance:1.5}),'ataque');
 assert.equal(escolherAtitude({perfil:P.npc,frac:1,distAlvo:1,alcance:1.5}),'normal','inteligente não parte para o tudo ou nada');
 assert.equal(escolherAtitude({perfil:P.cila,frac:1,distAlvo:1,alcance:4}),'normal','imóvel não entra em Ataque total');
 assert.equal(escolherAtitude(),'normal');
});
test('v185: a IA troca pela transação do módulo de atitudes, com intervalo, e avisa na gaveta e no histórico',()=>{
 const rt=ler('js/mesa-tempo-real.js');
 assert.match(rt,/import \{perfilRT,exigirAtaqueRT,psiOfensivoRT,MODOS_RT\} from '\.\/mesa-atitudes-dados\.js/);
 assert.match(rt,/emComa,escolherAtitude[^}]*\} from '\.\/mesa-tempo-real-tatica\.js/);
 assert.match(rt,/async function trocarAtitude\(t,modo,agora=Date\.now\(\)\)\{[\s\S]*api\.processar\('ia_'[\s\S]*\{tokenId:t\.id,personagemId:decodeURIComponent\(String\(t\.id\)\),donoUid:'',modo,criadoEm:agora\},true\)/);
 assert.match(rt,/\(atitudeEm\.get\(t\.id\)\|\|0\)>agora-1500/);
 assert.match(rt,/const desejada=escolherAtitude\(\{perfil,frac,emChoque,fugindo:fugindo\.has\(t\.id\),encurralado,distAlvo:pertoD,alcance:alcanceMax,atual:atitudeId\}\);\n\s*if\(desejada!==atitudeId\)void trocarAtitude\(t,desejada,agora\);/);
 assert.match(rt,/encurralado=!pf\|\|pertoD<\.6/);
 assert.match(rt,/if\(modo!=='normal'\)void registrar\(`\$\{m\.icone\} \$\{t\.nome\|\|'Criatura'\}: \$\{m\.nome\}\.`\)/);
 assert.match(rt,/a!==MODOS_RT\.normal\?a\.icone\+' '\+a\.nome\+' · ':''\)\(perfilRT\(health\?\.actors\?\.\[t\.id\],estado,mapa\)\)/);
 // o módulo de atitudes aceita pedido local do mestre sem exigir dono
 assert.match(ler('js/mesa-atitudes.js'),/async function process\(id,cmd,local=false\)[\s\S]*if\(!local&&\(!cmd\.donoUid\|\|t\.donoUid!==cmd\.donoUid\)\)/);
 assert.match(ler('js/mesa-atitudes.js'),/processar:process/);
});
