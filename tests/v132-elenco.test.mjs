import test from 'node:test';import assert from 'node:assert/strict';
let m=null;try{m=await import('../js/mesa-elenco.js');}catch(e){}
test('v132: elenco do cenário (sem duplicar PM e NPC do banco; quem está em outro mapa não entra)',{skip:!m},()=>{
 const c={mapaId:'bar1_2',npcsCena:'UR-17; Kara Venn; Dorrik; frequentadores variados',personagensCena:[{id:'npcdb:ur17'},{id:'char_kara'}]};
 const el=m.elencoDoCenario(c,{npcs:[{id:'ur17',nome:'UR-17'},{id:'kara',nome:'Kara Venn'},{id:'dorrik',nome:'Dorrik'}],personagens:[{id:'char_kara',nome:'Kara Venn',dono:'M'}],mestreUid:'M'});
 assert.deepEqual(el.map(e=>e.id),['syncnpc:ur17','syncnpc:kara','syncnpc:dorrik']); // v139: PM acabou, só NPCs do banco
 const falta=m.quemFalta(el,[{id:encodeURIComponent('syncnpc:dorrik~2'),mapaId:'outro'}]);
 assert.deepEqual(falta.map(e=>e.id),['syncnpc:ur17','syncnpc:kara']);
 const p=m.pontoPara({nome:'UR-17'},[{nome:'Caixa registradora de UR-17',x:14,y:1.4}],0);assert.equal(p.x,14);assert.ok(Math.abs(p.y-2.6)<1e-9);
});
