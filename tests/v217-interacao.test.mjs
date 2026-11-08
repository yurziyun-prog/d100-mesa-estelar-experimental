import test from 'node:test';import assert from 'node:assert/strict';
import {instalarLatidoMesa} from '../js/mesa-latido.js';
import {tokenArrastavel,posicaoFrente,fatorArrasto} from '../js/mesa-arrastar.js';
import {ocupadoNoArrasto} from '../js/mesa-arrasto-regras.js';
test('canal acorda apenas mestre oculto da mesma conta e valida IDs',()=>{
 const canais=[],timers=[];class Canal{constructor(){canais.push(this);}postMessage(data){for(const c of canais)if(c!==this&&!c.closed)c.onmessage?.({data});}close(){this.closed=true;}}
 const win={BroadcastChannel:Canal,setInterval:f=>(timers.push(f),timers.length),clearInterval:()=>{}};let pulsos=0,comandos=[];
 const mestre=instalarLatidoMesa({root:{defaultView:win,visibilityState:'hidden'},uid:()=> 'u1',acordar:()=>pulsos++,aoComando:id=>comandos.push(id)});
 const player=instalarLatidoMesa({root:{defaultView:win,visibilityState:'visible'},uid:()=> 'u1',acordar:()=>assert.fail('jogador visível não acorda')});
 const outro=instalarLatidoMesa({root:{defaultView:win,visibilityState:'visible'},uid:()=> 'u2',acordar:()=>{}});
 timers[2]();assert.equal(pulsos,0);timers[1]();assert.equal(pulsos,1);
 player.comando('cmd_123');player.comando('../invalido');outro.comando('outro');assert.deepEqual(comandos,['cmd_123']);
 mestre.parar();player.comando('encerrado');assert.deepEqual(comandos,['cmd_123']);player.parar();outro.parar();
});
test('arrasto rejeita criatura viva e caída, permite cadáver e socorro humano',()=>{
 const b={id:'synccriatura%3Arastejante_de_cinzas~1'};
 assert.equal(tokenArrastavel({caido:true},b),false);assert.equal(tokenArrastavel({inconsciente:true},b),false);assert.equal(tokenArrastavel({morto:true},b),true);
 assert.equal(tokenArrastavel({inconsciente:true},{id:'pc'}),true);assert.equal(tokenArrastavel({caido:true},{id:'pc'}),false);
 assert.deepEqual(posicaoFrente({x:1,y:2},0,2),{x:3,y:2});assert.equal(fatorArrasto(500,80),0);
 assert.equal(ocupadoNoArrasto({lista:{pc:{ajudantes:['aux']}}},'pc'),true);assert.equal(ocupadoNoArrasto({lista:{pc:{ajudantes:['aux']}}},'aux'),true);assert.equal(ocupadoNoArrasto({lista:{}},'livre'),false);
});
