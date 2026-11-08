import {ignicao} from '../js/nova-fogo.js';
import {lerApp} from './_app.mjs';
import {danoObjeto,distanciaObjeto} from '../js/nova-dano-objetos.js';
import {linhaBloqueadaPorObjetos} from '../js/nova-colisao.js';
import {aplicarDanoArma} from '../js/nova-dano-armas.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {classificarTeste,locaisValidos,descreverTeste} from '../js/nova-regras.js';
import {ataqueSuperaDefesa,defesasRestantes} from '../js/nova-turnos.js';
import {testeComSorte} from '../js/nova-recuperacao.js';
import {criarRelogio} from '../js/nova-duracoes.js';
import {sorteio} from '../js/nova-suporte.js';
import {perfilRT as perfilAtitudeRT_,exigirAtaqueRT as exigirAtitudeRT_} from '../js/mesa-atitudes-dados.js';
const file=lerApp();
const source=file.slice(file.indexOf('function novaPericiaDaArma_'),file.indexOf('async function novaDadosAcoes_'));
function seedWhere(predicate){for(let seed=0;seed<100000;seed++){const r=sorteio(seed);if(predicate(r(100),r(100)))return seed;}throw Error('seed');}
async function fixture(seed,{ranged=false,back=false,psi=false,luck=false,defenseOnly=false,object=false,far=false,barrier=false,damageWeapon=false,posture='',stance=''}={}){
 const skill={id:'melee',nome:'Combate'},dodge={id:'dodge',nome:'Esquiva'},item={nome:'Arma',ranged,propriedades:[]};
 const a={id:'a',nome:'Atacante',x:1,y:1},b={id:'b',nome:'Besta Ululante',x:2,y:1,facing:back?0:Math.PI};
 if(object)Object.assign(b,{nome:'Caixa',x:far?20:2,larguraM:1,alturaM:1,pvMax:6,pvAtual:6,dureza:2,destrutivel:true,bloqueiaMovimento:true});
 const defenderWeapon={instanciaId:'def-weapon',nome:'Pistola Defensora',categoria:'Armas',pv:2,pvAtual:2,pa:0};
 const chars={a:{value:80},b:{value:60,...(damageWeapon?{inventario:{equipado:[defenderWeapon]}}:{})}},hp=()=>damageWeapon?({hit:{Peito:10,'Braço Direito':5},hitMax:{Peito:10,'Braço Direito':5},armor:{'Braço Direito':0}}):({hit:{Peito:10,Braço:-3},hitMax:{Peito:10,Braço:3},armor:{}}),health={a:{luckPrepared:luck,combateLab:hp()},b:{...(posture?{postura:posture}:{}),...(stance?{modoRT:{modo:stance,mapa:'m1',sessao:7,em:0}}:{}),combateLab:hp()}};
 const map={larguraM:28,alturaM:14,...(stance?{mapId:'m1',rtContext:{ativo:true,mapId:'m1',iniciadoEm:7}}:{}),combat:{active:true,...(stance?{session:'rt'}:{}),round:1,roundId:'s:1',initial:{b:{remaining:3}}}};
 const scene={objects:barrier?[{id:'wall',x:1.5,y:1,larguraM:.2,alturaM:2,camada:3,bloqueiaMovimento:true}]:[]};
 const c={novaValorPericiaTotal_:char=>char.value,ignicao,perfilAtitudeRT_,exigirAtitudeRT_,danoObjeto,distanciaObjeto,linhaBloqueadaPorObjetos,obterPenetracaoArma_:()=>1,testeComSorte,novaInfoSuporte_:()=>({powers:[{id:"grito_psiquico",value:80,cost:3}],psiMax:15,psiSpent:0}),novaCriarRelogio_:criarRelogio,labRolarResistenciaFerimento22_:()=>({passou:false,roll:90,valor:50,grau:"Falha"}),structuredClone,Math:Object.create(Math),novaFicha_:async t=>chars[t.id],batalhaListaPericias_:()=>defenseOnly?[skill]:[skill,dodge],batalhaTokenPericia_:p=>p.id,periciaCriaturaPodeAtacar_:(_,p)=>p.id==='melee',novaEquipamentos_:()=>[{valor:'w',item,graus:0}],getNome:i=>i.nome,
  labEstado_:{},labComContextoLocal_:(_,__,fn)=>fn(),labGarantirSnapshotCombate_:t=>t.combateLab,ocupado:()=>false,labAtaqueEhDistancia_:i=>!!i.ranged,labDistanciaEntre_:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),labAlcanceAtaque_:()=>2,labEhArmaMuniciada_:()=>false,novaValorPericia_:c=>c.value,novaDetalharValorPericia_:c=>({valor:c.value,raw:c.value,armaduraPct:0,armaduraValor:c.value,aposDificuldade:c.value,ajuste:{degrausFadiga:0,modificadorMestre:0},grausCompatibilidade:0,grausFerimento:0,grausCaido:0,grausInfeccao:0,escudo:0,debuff:0,armaDanificadaLegado:0,bonusAgilidade:0,bonusIntuicao:0,fadiga:'Fresh'}),novaDescreverTesteAtaque_:(d,die)=>descreverTeste(d.raw,d.valor,die),novaClassificar_:classificarTeste,defesasRestantes,
  batalhaListaPericiasDefesa_:()=>[dodge],obterItensEquipados_:()=>[],labEhEsquivaD7_:p=>p.id==='dodge',ataquesNaturaisChar_:()=>[{nome:'Cauda',alcanceMetros:2}],obterValorRegistroPericia_:c=>c.value,ataqueSuperaDefesa,novaLocaisValidos_:locaisValidos,novaDescreverTeste_:descreverTeste,
  novaArmaAtivaDefensor_:char=>damageWeapon?char?.inventario?.equipado?.[0]||null:null,novaAplicarDanoArma_:aplicarDanoArma,
  labEfeitosDisponiveis_:()=>[{id:'sangrar',nome:'Sangrar'},{id:'contornar_armadura',nome:'Contornar Armadura'},...(damageWeapon?[{id:'danificar_arma',nome:'Danificar Arma'}]:[])],labEfeitosQuantidade_:(g)=>g==='Crítico'?2:1,labConsumirMunicao_:t=>{t.municaoLab={charge:(t.municaoLab?.charge??10)-1};},labExpressaoDano_:()=> '1d8',maximizarExpressaoDanoCombate_:()=>({total:8}),rolarExpressaoDanoCombate_:()=>({total:4}),labLocalizacaoD20_:()=>({local:'Braço'}),labAplicarDanoLocal_:(t,total,item,opts)=>{assert.notEqual(opts.localForcada,'Braço');t.combateLab.hit[opts.localForcada]-=total;return {local:opts.localForcada,bruto:total,paEf:0,final:total};}};
 vm.createContext(c);vm.runInContext(source,c);const resolve=await c.novaPrepararAtaque_(a,b,{skillId:'melee',weaponId:'w',seed,targetId:'b',...(object?{targetKind:'object'}:{}),...(psi?{powerId:'grito_psiquico',cost:3}:{})});return decision=>resolve(a,b,health,map,decision,scene,chars.b);
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


test('Danificar Arma consome PV da arma e só manda o excesso ao Braço Direito',async()=>{
 const resolve=await fixture(seedWhere(a=>a>=8&&a<=80),{damageWeapon:true});
 const r=resolve({phase:'resolve',choice:'none',effectsConfirmed:true,effects:['danificar_arma']});
 assert.equal(r.event.weaponDamage.pvAtual,0);assert.equal(r.event.weaponDamage.aplicado,2);assert.equal(r.event.weaponDamage.excesso,2);
 assert.equal(r.targetSheetPatch.inventario.equipado[0].pvAtual,0);assert.equal(r.targetSheetPatch.inventario.equipado[0].inutilizavel,true);
 assert.equal(r.actors.b.combateLab.hit['Braço Direito'],3);assert.equal(r.event.damage,2);assert.match(r.event.message,/excesso 2 → Braço Direito/);
});

test('Grito Psíquico usa poder, consome PP e derruba sem dano nem arma equipada',async()=>{
 const resolve=await fixture(seedWhere(a=>a>=8&&a<=80),{psi:true});
 assert.ok(resolve({phase:'preview'}).pending.cone);
 const r=resolve({phase:'resolve',choice:'none'});
 assert.equal(r.event.item.nome,'Grito Psíquico');assert.equal(r.event.damage,0);assert.equal(r.actors.a.psiSpent,3);assert.equal(r.actors.b.combateLab.caido,true);assert.equal(r.actors.b.combateLab.inconsciente,true);assert.equal(r.actors.b.combateLab.hit.Peito,10);assert.ok(r.actors.b.combateLab.unconsciousClock);
});

test('Sorte ativa (+50%) não transforma Fiasco em sucesso automático no ataque',async()=>{
 const resolve=await fixture(seedWhere(a=>a>=99),{luck:true}),result=resolve({phase:'preview'});
 assert.equal(result.pending,undefined);assert.equal(result.event.grade,'Fiasco');assert.equal(result.event.hit,false);assert.equal(result.event.damage,0);assert.match(result.event.message,/🍀 Sorte/,'a Sorte ativa aparece no ataque');
});

test('Esquiva ausente da lista ofensiva mantém base real no cone, sem bônus fantasma',async()=>{const resolve=await fixture(seedWhere(a=>a>=8&&a<=80),{psi:true,defenseOnly:true});const dodge=resolve({phase:'preview'}).pending.options.find(o=>o.id==='dodge');assert.equal(dodge.base,60);assert.equal(dodge.valor,40);assert.equal(dodge.modifiers.reduce((n,m)=>n+m.value,0),-20);assert.ok(!descreverTeste(dodge.base,dodge.valor,23,dodge.modifiers).includes('outros modificadores'));});

test('objeto: crítico aplica máximo menos dureza/penetração, sem defesa ou escolha corporal',async()=>{
 const resolve=await fixture(seedWhere(a=>a<8),{object:true}),r=resolve({phase:'preview'});assert.equal(r.pending,undefined);assert.equal(r.effectsPending,undefined);assert.equal(r.object.pvAtual,0);assert.equal(r.object.destruido,true);assert.equal(r.object.bloqueiaMovimento,false);assert.equal(r.event.damage,7);assert.equal(r.actors.a.municaoLab.charge,9);assert.equal(r.actors.b,undefined);assert.match(r.event.message,/Crítico: dano máximo/);
});
test('objeto: falha gasta munição sem dano; alcance inválido não resolve',async()=>{const miss=await fixture(seedWhere(a=>a>80),{object:true}),r=miss({phase:'preview'});assert.equal(r.object.pvAtual,6);assert.equal(r.event.damage,0);assert.equal(r.actors.a.municaoLab.charge,9);const far=await fixture(1,{object:true,far:true});assert.throws(()=>far({phase:'preview'}),/Fora de alcance/);});


test('ataque à distância é interrompido por barreira sólida da camada 3 em linha reta',async()=>{
 const resolve=await fixture(seedWhere(a=>a>=8&&a<=80),{ranged:true,barrier:true});
 assert.throws(()=>resolve({phase:'preview'}),/Linha de tiro bloqueada/);
});

test('valor integral de Resistência ignora redutores situacionais quando a regra pede a perícia inteira',()=>{
 const start=file.indexOf('function novaValorPericiaTotal_');
 const end=file.indexOf('async function novaPrepararAtaque_',start);
 const c={obterValorRegistroPericia_:()=>50,Math};vm.createContext(c);vm.runInContext(file.slice(start,end),c);
 assert.equal(c.novaValorPericiaTotal_({id:'darek'},{id:'resistencia'}),50);
});

test('v183: agachado contra tiro soma +10 de verdade; Defesa total +40 em todas as defesas; Ataque total −25',async()=>{
 const seed=seedWhere(a=>a>10&&a<=60);
 const base=await fixture(seed,{ranged:true});const v0=base({phase:'preview'}).pending.options.find(o=>o.nome==='Esquiva').valor;
 const r1=await fixture(seed,{ranged:true,posture:'agachado'});const o1=r1({phase:'preview'}).pending.options.find(o=>o.nome==='Esquiva');
 assert.equal(o1.valor,v0+10);assert.equal(JSON.stringify(o1.modifiers.filter(m=>m.name==='agachado')),JSON.stringify([{name:'agachado',value:10}]));
 const r2=await fixture(seed,{stance:'defesa'});const ops=r2({phase:'preview'}).pending.options;assert.ok(ops.length>=1);
 for(const o of ops)assert.ok(o.modifiers.some(m=>m.name==='Defesa total'&&m.value===40),o.nome);
 assert.equal(ops.find(o=>o.nome==='Esquiva').valor,Math.min(100,v0+40));
 const r3=await fixture(seed,{stance:'ataque'});assert.equal(r3({phase:'preview'}).pending.options.find(o=>o.nome==='Esquiva').valor,Math.max(0,v0-25));
 const r4=await fixture(seed,{});assert.equal(r4({phase:'preview'}).pending.options.find(o=>o.nome==='Esquiva').modifiers.some(m=>/total|Recuo/.test(m.name)),false); // por turnos: nada muda
});
