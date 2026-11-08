import test from 'node:test';
import assert from 'node:assert/strict';
import {estadoContinuo} from '../js/mesa-tempo-real.js';

test('tempo contínuo migra pausa antiga e mapa antigo sem perder configurações',()=>{
 const old={ativo:true,pausado:true,mapId:'escadaria',faccoes:{kael:'grupo'},auto:{monstro:true},prontoEm:{kael:9000},escolha:{id:'antiga'}};
 const next=estadoContinuo(old,'casa',1000);
 assert.equal(next.ativo,true);assert.equal(next.pausado,false);assert.equal(next.mapId,'casa');
 assert.equal(next.escolha,null);assert.deepEqual(next.prontoEm,{});
 assert.deepEqual(next.faccoes,old.faccoes);assert.deepEqual(next.auto,old.auto);
 assert.equal(old.pausado,true,'não modifica o objeto de entrada');
});

test('pausa explícita de emergência permanece mesmo ao trocar mapa',()=>{
 const next=estadoContinuo({mapId:'antigo',pausado:true,pausaEmergencia:true},'casa',1000);
 assert.equal(next.pausaEmergencia,true);assert.equal(next.pausado,true);
});

test('mesmo mapa conserva início e recarga; repetir não cria outra sessão',()=>{
 const old={mapId:'casa',ativo:true,iniciadoEm:123,prontoEm:{kael:5000}};
 const next=estadoContinuo(old,'casa',1000);
 assert.equal(next.iniciadoEm,123);assert.deepEqual(next.prontoEm,old.prontoEm);
 assert.equal(estadoContinuo(next,'casa',2000).iniciadoEm,123);
});

test('documento ausente começa ativo e sem pausa',()=>{
 assert.equal(estadoContinuo(undefined,'casa').ativo,true);
 assert.equal(estadoContinuo(undefined,'casa').pausado,false);
});
