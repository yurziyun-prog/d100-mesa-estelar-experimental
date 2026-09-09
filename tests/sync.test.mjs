import test from 'node:test';
import assert from 'node:assert/strict';
import {claimAuthority,ownsAuthority,acceptSnapshot,applyCommand,opportunity,move,advance} from '../js/mesa-sync-core.js';
import {createTransport} from '../js/mesa-sync-transport.js';
const state=()=>({fase:'combate',combateIdD8:'test',rodada:1,turnoIndex:0,larguraM:50,alturaM:50,ordemIniciativa:['v','d'],tokens:['v','d'].map(id=>({id,x:0,y:0,acoesAtuaisLab:3,acoesMaxLab:3,defesasAtuaisLab:3}))});
const packet=()=>({estado:state(),protocol:1,revision:1,authority:{session:'gm',epoch:1,until:12000}});
const command=(s,n,type='attack')=>({protocol:1,id:`c${n}`,uid:'player',stream:'s',sequence:n,actor:'v',type,opportunity:opportunity(s)});
const attack=(s,c)=>{const t=s.tokens.find(t=>t.id===c.actor);if(c.opportunity!==opportunity(s)||t.acoesAtuaisLab<=0)return false;t.acoesAtuaisLab--;if(t.acoesAtuaisLab===0)advance(s,c.opportunity);return true;};
test('duas sessões: liderança exclusiva e fencing após expiração',()=>{
 let p=packet();assert.equal(claimAuthority(p,'other',100),null);
 const next=claimAuthority(p,'other',13000);assert.equal(next.epoch,2);p.authority=next;
 assert.equal(ownsAuthority(p,{session:'gm',epoch:1},13001),false);
 assert.throws(()=>applyCommand(p,command(p.estado,1),{session:'gm',epoch:1},13001,attack),/authority-lost/);
});
test('3 ataques, nenhuma quarta ação, Darek exatamente uma vez',()=>{
 let p=packet();const lease=p.authority,op=opportunity(p.estado);
 for(let n=1;n<=3;n++){const c={...command(p.estado,n),opportunity:op};p=applyCommand(p,c,lease,100,attack);assert.equal(p.estado.tokens[0].acoesAtuaisLab,3-n);assert.equal(p.estado.tokens[0].defesasAtuaisLab,3);}
 assert.equal(p.estado.turnoIndex,1);
 p=applyCommand(p,{...command(p.estado,4),opportunity:op},lease,100,attack);
 assert.equal(p.lastCommand.accepted,false);assert.equal(p.estado.turnoIndex,1);
});
test('recibo e consequência atômicos; retry não desconta de novo',()=>{
 const p=packet(),c=command(p.estado,1),next=applyCommand(p,c,p.authority,10,attack);
 assert.equal(p.estado.tokens[0].acoesAtuaisLab,3);
 assert.equal(applyCommand(next,c,p.authority,10,attack),null);
});
test('comando de outra coleção não invalida comando anterior distinto',()=>{
 let p=packet();p=applyCommand(p,command(p.estado,2),p.authority,10,attack);
 p=applyCommand(p,command(p.estado,1),p.authority,10,attack);assert.equal(p.estado.tokens[0].acoesAtuaisLab,1);
});
test('snapshots antigos, duplicados e sem revisão são rejeitados',()=>{
 const p=packet();assert(!acceptSnapshot(p,{...p,revision:0}));assert(!acceptSnapshot(p,p));assert(!acceptSnapshot(p,{estado:p.estado}));assert(acceptSnapshot(p,{...p,revision:2}));
});
function movement(s,n,x,distance,extra={}){return {...command(s,n,'movement'),payload:{x,y:0,distance,gesture:'g',...extra}};}
test('arraste e contínuo: mesma posição final e mesmo consumo',()=>{
 const a=state(),b=state();assert(move(a,movement(a,1,10,10),3));
 for(let x=1;x<=10;x++)assert(move(b,movement(b,x,x,x),3));
 assert.equal(a.tokens[0].x,b.tokens[0].x);assert.equal(a.tokens[0].acoesAtuaisLab,0);assert.equal(b.tokens[0].acoesAtuaisLab,0);
});
test('movimento fora de ordem e repetido não faz posição regredir',()=>{
 const s=state();move(s,movement(s,2,4,4),3);const before=JSON.stringify(s);
 assert(!move(s,movement(s,1,2,2),3));assert(!move(s,movement(s,2,4,4),3));assert.equal(JSON.stringify(s),before);
});
test('sequência não zera ao iniciar outro gesto da mesma sessão',()=>{
 const s=state();move(s,movement(s,3,4,4),3);
 assert(!move(s,movement(s,2,5,1,{gesture:'other'}),3));
});
test('curvas cobram caminho acumulado e limite não fica negativo',()=>{
 const s=state();move(s,movement(s,1,3,6),3);assert.equal(s.tokens[0].acoesAtuaisLab,1);
 move(s,movement(s,2,9,12),3);assert.equal(s.tokens[0].acoesAtuaisLab,0);assert(s.tokens[0].x<9);
});
test('Passar é grátis; segundo passe encerra participação na rodada',()=>{
 const s=state();advance(s,opportunity(s),{pass:true});assert.equal(s.tokens[0].acoesAtuaisLab,3);assert.equal(s.turnoIndex,1);
 advance(s,opportunity(s),{pass:true});assert.equal(s.turnoIndex,0);
 advance(s,opportunity(s),{pass:true});assert.equal(s.tokens[0].acoesAtuaisLab,3);assert(s.tokens[0].finishedRound);assert.equal(s.turnoIndex,1);
 advance(s,opportunity(s),{pass:true});assert.equal(s.rodada,2);assert.equal(s.tokens[0].finishedRound,false);
});
test('timer/operação da oportunidade anterior não avança a nova',()=>{
 const s=state(),op=opportunity(s);advance(s,op);assert(!advance(s,op));
});
test('dano pendente bloqueia avanço; caído continua na iniciativa',()=>{
 const s=state();s.danoPendenteLab={id:'damage'};assert(!advance(s,opportunity(s)));delete s.danoPendenteLab;s.tokens[1].combateLab={derrubado:true};advance(s,opportunity(s));assert.equal(s.turnoIndex,1);
});
test('falha de validação descarta toda mutação parcial',()=>{
 const p=packet(),next=applyCommand(p,command(p.estado,1),p.authority,1,s=>{s.tokens[0].x=99;return false});assert.equal(next.estado.tokens[0].x,0);
});
test('transporte separa documento de movimento e ataque',async()=>{
 const writes=[];const t=createTransport({session:'s',uid:()=> 'u',isMaster:()=>false,commandPath:'actions',movementPath:'moves',write:async(path,data)=>writes.push({path,data})});
 await t.send('movement','v',{},'op');await t.send('attack','v',{},'op');assert.equal(writes[0].path,'moves/s_1');assert.equal(writes[1].path,'actions/s_2');assert.notEqual(writes[0].data.id,writes[1].data.id);
});
