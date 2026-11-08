import test from 'node:test';
import assert from 'node:assert/strict';
import {conectarAtaques} from '../js/nova-ataques.js';

const payload={actorId:'kael',targetId:'criatura',mapId:'teste'};
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function cliente(writeMap,initial=()=>null){
 const listeners=new Map();let writes=0;
 const api=conectarAtaques({
  database:{writeMap:(...args)=>{writes++;return writeMap(...args);},
   subscribeDoc:(path,receive,fail)=>{listeners.set(path,{receive,fail});const value=initial(path);if(value)receive(value);return()=>listeners.delete(path);}},
  user:()=>({uid:'jogador',master:false}),tokens:()=>[],onHealth:()=>{},onError:()=>{}
 });
 return {api,listeners,writes:()=>writes,command:()=>[...listeners.entries()].find(([p])=>p.includes('/acoes/'))};
}

test('envio sem confirmação também expira e não repete o comando',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 let confirm;
 const c=cliente(()=>new Promise(resolve=>{confirm=resolve;}));
 try{
  let error;
  const request=c.api.attack(payload).catch(e=>{error=e;});await flush();
  t.mock.timers.tick(20001);await flush();
  assert.ok(error,'o limite deve começar antes de a escrita no banco confirmar');
  assert.match(error.message,/banco.*confirm/i);assert.equal(error.outcomeUnknown,true);
  assert.ok(error.commandId);assert.equal(c.listeners.size,1,'apenas a saúde permanece assinada');
  confirm();await flush();await request;
  assert.equal(c.writes(),1,'confirmar tarde não reenvia o ataque');
 }finally{c.api.close();}
});

test('fechar a sessão libera um envio cuja escrita não terminou',async()=>{
 const c=cliente(()=>new Promise(()=>{}));let error;
 c.api.attack(payload).catch(e=>{error=e;});await flush();c.api.close();await flush();
 assert.match(error?.message||'',/Sessão encerrada/);assert.equal(c.listeners.size,0);
});

test('erro do banco preserva código e encerra a espera',async()=>{
 const denied=Object.assign(new Error('Sem permissão'),{code:'permission-denied'});
 const c=cliente(async()=>{throw denied;});
 try{await assert.rejects(c.api.attack(payload),e=>e.code==='permission-denied'&&/Sem permissão/.test(e.message));
  assert.equal(c.listeners.size,1);
 }finally{c.api.close();}
});

test('resposta anterior à confirmação chega no snapshot inicial sem ler documento inexistente',async()=>{
 let confirm,response=null;const c=cliente(()=>new Promise(resolve=>{confirm=resolve;}),p=>p.includes('/acoes/')?response:null);
 try{
  const request=c.api.attack(payload);await flush();
  assert.equal(c.command(),undefined,'não tenta ler comando que ainda não foi criado');
  response={status:'done',message:'Ataque confirmado'};confirm();await flush();
  assert.equal(await request,'Ataque confirmado');assert.equal(c.listeners.size,1);
  assert.equal(c.writes(),1);
 }finally{c.api.close();}
});

test('envio confirmado sem mestre tem limite e resultado explicitamente incerto',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const c=cliente(async()=>{});
 try{
  let error;c.api.attack(payload).catch(e=>{error=e;});await flush();
  t.mock.timers.tick(20001);await flush();
  assert.match(error?.message||'',/sem resposta do mestre/i);assert.equal(error.outcomeUnknown,true);
  assert.match(error.message,/histórico/i);assert.equal(c.writes(),1);assert.equal(c.listeners.size,1);
 }finally{c.api.close();}
});
