import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {classificarTeste,locaisValidos,descreverTeste} from '../js/nova-regras.js';
import {ataqueSuperaDefesa,defesasRestantes} from '../js/nova-turnos.js';
import {testeComSorte} from '../js/nova-recuperacao.js';
import {criarRelogio} from '../js/nova-duracoes.js';
import {sorteio} from '../js/nova-suporte.js';
const file=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const source=file.slice(file.indexOf('async function novaPrepararAtaque_'),file.indexOf('async function novaDadosAcoes_'));
function seedWhere(predicate){for(let seed=0;seed<100000;seed++){const r=sorteio(seed);if(predicate(r(100),r(100)))return seed;}throw Error('seed');}
async function fixture(seed,{ranged=false,back=false,psi=false,luck=false,defenseOnly=false}={}){
 const skill={id:'melee',nome:'Combate'},dodge={id:'dodge',nome:'Esquiva'},item={nome:'Arma',ranged,propriedades:[]};
 const a={id:'a',nome:'Atacante',x:1,y:1},b={id:'b',nome:'Besta Ululante',x:2,y:1,facing:back?0:Math.PI};
 const chars={a:{value:80},b:{value:60}},hp=()=>({hit:{Peito:10,Braço:-3},hitMax:{Peito:10,Braço:3},armor:{}}),health={a:{luckPrepared:luck,combateLab:hp()},b:{combateLab:hp()}};
 const map={combat:{active:true,round:1,roundId:'s:1',initial:{b:{remaining:3}}}};
 const c={testeComSorte,novaInfoSuporte_:()=>({powers:[{id:"grito_psiquico",value:80,cost:3}],psiMax:15,psiSpent:0}),novaCriarRelogio_:criarRelogio,labRolarResistenciaFerimento22_:()=>({passou:false,roll:90,valor:50,grau:"Falha"}),structuredClone,Math:Object.create(Math),novaFicha_:async t=>chars[t.id],batalhaListaPericias_:()=>defenseOnly?[skill]:[skill,dodge],batalhaTokenPericia_:p=>p.id,periciaCriaturaPodeAtacar_:(_,p)=>p.id==='melee',novaEquipamentos_:()=>[{valor:'w',item,graus:0}],getNome:i=>i.nome,
  labEstado_:{},labComContextoLocal_:(_,__,fn)=>fn(),labGarantirSnapshotCombate_:t=>t.combateLab,ocupado:()=>false,labAtaqueEhDistancia_:i=>!!i.ranged,labDistanciaEntre_:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),labAlcanceAtaque_:()=>2,labEhArmaMuniciada_:()=>false,novaValorPericia_:c=>c.value,novaClassificar_:classificarTeste,defesasRestantes,
  batalhaListaPericiasDefesa_:()=>[dodge],obterItensEquipados_:()=>[],labEhEsquivaD7_:p=>p.id==='dodge',ataquesNaturaisChar_:()=>[{nome:'Cauda',alcanceMetros:2}],obterValorRegistroPericia_:c=>c.value,ataqueSuperaDefesa,novaLocaisValidos_:locaisValidos,novaDescreverTeste_:descreverTeste,
  labEfeitosDisponiveis_:()=>[{id:'sangrar',nome:'Sangrar'},{id:'contornar_armadura',nome:'Contornar Armadura'}],labEfeitosQuantidade_:(g)=>g==='Crítico'?2:1,labConsumirMunicao_:()=>{},labExpressaoDano_:()=> '1d8',maximizarExpressaoDanoCombate_:()=>({total:8}),rolarExpressaoDanoCombate_:()=>({total:4}),labLocalizacaoD20_:()=>({local:'Braço'}),labAplicarDanoLocal_:(t,total,item,opts)=>{assert.notEqual(opts.localForcada,'Braço');t.combateLab.hit[opts.localForcada]-=total;return {local:opts.localForcada,bruto:total,paEf:0,final:total};}};
 vm.createContext(c);vm.runInContext(source,c);const resolve=await c.novaPrepararAtaque_(a,b,{skillId:'melee',weaponId:'w',seed,targetId:'b',...(psi?{powerId:'grito_psiquico',cost:3}:{})});return decision=>resolve(a,b,health,map,decision);
}
test('crítico permite defesa; sucesso defensivo não libera especiais; dano máximo quando atinge',async()=>{
 const resolve=await fixture(seedWhere((a,b)=>a<8&&b>=6&&b<=60));
 assert.ok(resolve({phase:'preview'}).pending);
 const result=resolve({phase:'resolve',choice:'dodge'});assert.equal(result.effectsPending,undefined);assert.equal(result.event.grade,'Crítico');assert.equal(result.event.damage,8);assert.deepEqual(Array.from(result.event.specialEffects),[]);
});
test('falha defensiva libera escolhas; membro destruído é excluído do golpe escolhido e aleatório',async()=>{
 const resolve=await fixture(seedWhere((a,b)=>a<8&&b>60));
 const pending=resolve({phase:'resolve',choice:'dodge'}).effectsPending;assert.deepEqual(Array.from(pending.locations),['Peito']);assert.equal(pending.maxEffects,2);
 const final=resolve({phase:'resolve',choice:'dodge',effectsConfirmed:true,effects:['sangrar'],local:'Peito'});assert.equal(final.event.damage,8);assert.equal(final.actors.b.combateLab.sangrando,true);
 assert.throws(()=>resolve({phase:'resolve',choice:'none',effectsConfirmed:true,local:'Braço'}),/Localização/);
 assert.equal(resolve({phase:'resolve',choice:'none',effectsConfirmed:true}).actors.b.combateLab.hit.Peito,2);
});
test('cauda apara pelas costas somente corpo a corpo; penalidade e base aparecem separadas',async()=>{
 const seed=seedWhere(a=>a>=8&&a<=80),melee=await fixture(seed,{back:true}),ranged=await fixture(seed,{back:true,ranged:true});
 const options=melee({phase:'preview'}).pending.options,tail=options.find(o=>o.id==='natural:aparar-cauda');assert.equal(tail.base,60);assert.equal(tail.valor,40);
 assert.ok(!ranged({phase:'preview'}).pending.options.some(o=>o.id==='natural:aparar-cauda'));
});

test('Grito Psíquico usa poder, consome PP e derruba sem dano nem arma equipada',async()=>{
 const resolve=await fixture(seedWhere(a=>a>=8&&a<=80),{psi:true});
 assert.ok(resolve({phase:'preview'}).pending.cone);
 const r=resolve({phase:'resolve',choice:'none'});
 assert.equal(r.event.item.nome,'Grito Psíquico');assert.equal(r.event.damage,0);assert.equal(r.actors.a.psiSpent,3);assert.equal(r.actors.b.combateLab.caido,true);assert.equal(r.actors.b.combateLab.inconsciente,true);assert.equal(r.actors.b.combateLab.hit.Peito,10);assert.ok(r.actors.b.combateLab.unconsciousClock);
});

test('Sorte no ataque transforma fiasco em sucesso comum e se consome somente na resolução',async()=>{
 const resolve=await fixture(seedWhere(a=>a>=99),{luck:true});assert.ok(resolve({phase:'preview'}).pending);
 const result=resolve({phase:'resolve',choice:'none',effectsConfirmed:true});assert.equal(result.event.grade,'Sucesso');assert.equal(result.actors.a.luckPrepared,false);assert.equal(result.event.damage,4);assert.match(result.event.message,/Sorte/);
});

test('Esquiva ausente da lista ofensiva mantém base real no cone, sem bônus fantasma',async()=>{const resolve=await fixture(seedWhere(a=>a>=8&&a<=80),{psi:true,defenseOnly:true});const dodge=resolve({phase:'preview'}).pending.options.find(o=>o.id==='dodge');assert.equal(dodge.base,60);assert.equal(dodge.valor,40);assert.equal(dodge.modifiers.reduce((n,m)=>n+m.value,0),-20);assert.ok(!descreverTeste(dodge.base,dodge.valor,23,dodge.modifiers).includes('outros modificadores'));});
