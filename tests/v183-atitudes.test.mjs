import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {MODOS_RT,perfilRT,exigirAtaqueRT,mudarModoRT,psiOfensivoRT} from '../js/mesa-atitudes-dados.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const rt={ativo:true,mapId:'m1',iniciadoEm:1000,pausado:false},map={mapId:'m1',combat:null};
test('v183: quatro atitudes exclusivas do tempo real (Normal, Defesa total, Ataque total, Recuo)',()=>{
 assert.deepEqual(Object.keys(MODOS_RT),['normal','defesa','ataque','fuga']);
 assert.equal(MODOS_RT.defesa.podeAtacar,false);assert.ok(MODOS_RT.defesa.defesa>=40);assert.ok(MODOS_RT.defesa.velocidade<1);assert.equal(MODOS_RT.defesa.reserva,2);
 assert.equal(MODOS_RT.ataque.podeAtacar,true);assert.ok(MODOS_RT.ataque.ataque>0);assert.ok(MODOS_RT.ataque.defesa<0);assert.ok(MODOS_RT.ataque.intervalo<1);
 assert.equal(MODOS_RT.fuga.podeAtacar,false);assert.ok(MODOS_RT.fuga.velocidade>1);assert.ok(MODOS_RT.fuga.defesa>0&&MODOS_RT.fuga.defesa<MODOS_RT.defesa.defesa);
});
test('v183: fora do tempo real (turnos ou desligado) a atitude é sempre Normal',()=>{
 const actor={modoRT:{modo:'defesa',mapa:'m1',sessao:1000,em:0}};
 assert.equal(perfilRT(actor,rt,map),MODOS_RT.defesa);
 assert.equal(perfilRT(actor,{...rt,ativo:false},map),MODOS_RT.normal);
 assert.equal(perfilRT(actor,rt,{...map,combat:{active:true,session:'turnos'}}),MODOS_RT.normal);
 assert.equal(perfilRT(actor,{...rt,iniciadoEm:2000},map),MODOS_RT.normal); // atitude de uma sessão anterior não vale
 assert.equal(perfilRT(actor,{...rt,mapId:'m2'},{...map,mapId:'m2'}),MODOS_RT.normal);
 assert.equal(perfilRT(undefined,undefined,undefined),MODOS_RT.normal);
});
test('v183: Defesa total e Recuo bloqueiam ataques e psi ofensivo; cura psi continua livre',()=>{
 const def={modoRT:{modo:'defesa',mapa:'m1',sessao:1000,em:0}};
 assert.throws(()=>exigirAtaqueRT(def,rt,map),/Defesa total/);
 assert.doesNotThrow(()=>exigirAtaqueRT({modoRT:{modo:'ataque',mapa:'m1',sessao:1000,em:0}},rt,map));
 assert.equal(psiOfensivoRT('cura_psi','a','b'),false);assert.equal(psiOfensivoRT('grito_psiquico','a','a'),true);assert.equal(psiOfensivoRT('agilidade_psi','a','a'),false);assert.equal(psiOfensivoRT('agilidade_psi','a','b'),true);
});
test('v183: trocar de atitude só no tempo real, consciente e sem spam',()=>{
 const agora=5000,n=mudarModoRT({actor:{},rt,map,modo:'fuga',agora});
 assert.deepEqual(n.modoRT,{modo:'fuga',mapa:'m1',sessao:1000,em:agora});
 assert.throws(()=>mudarModoRT({actor:{},rt,map,modo:'voar'}),/inválido/);
 assert.throws(()=>mudarModoRT({actor:{},rt:{...rt,ativo:false},map,modo:'defesa'}),/exclusivos/);
 assert.throws(()=>mudarModoRT({actor:{},rt:{...rt,pausado:true},map,modo:'defesa'}),/pausado/);
 assert.throws(()=>mudarModoRT({actor:{combateLab:{inconsciente:true}},rt,map,modo:'defesa'}),/consciente/);
 assert.throws(()=>mudarModoRT({actor:n,rt,map,modo:'defesa',agora:agora+500}),/Aguarde/);
 assert.doesNotThrow(()=>mudarModoRT({actor:n,rt,map,modo:'defesa',agora:agora+1000}));
});
test('v183: o resolvedor da mesa aplica a atitude no ataque e em todas as defesas, e o histórico explica',()=>{
 const app=lerApp();
 assert.match(app,/\+modoA\.ataque-/);
 assert.match(app,/if\(modoB\.defesa\)\{o\.modifiers\.push\(\{name:modoB\.nome,value:modoB\.defesa\}\);o\.valor=Math\.max\(0,Math\.min\(100,o\.valor\+modoB\.defesa\)\);\}/);
 assert.match(app,/\[d\.nomeAtitude\|\|'atitude',Number\(d\.bonusAtitude\)\|\|0\]/);
 assert.match(app,/bonusAtitude:modoA\.ataque,nomeAtitude:modoA\.nome/);
 assert.match(app,/if\(map\.rtContext\)exigirAtitudeRT_\(actor,map\.rtContext,map\)/);
});
test('v183: tempo real respeita a atitude (recarga, reserva de defesas, velocidade, IA recua sem atacar) e o arrasto também',()=>{
 const trt=ler('js/mesa-tempo-real.js');
 assert.match(trt,/rtContext:rtAtual/);
 assert.match(trt,/\*perfilRT\(health\?\.actors\?\.\[t\.id\],estado,mapa\)\.intervalo/);
 assert.match(trt,/\*perfilRT\(atores\?\.\[id\],rt,mapa\)\.reserva/);
 assert.match(trt,/\*perfilRT\(health\?\.actors\?\.\[t\.id\],estado,mapa\)\.velocidade/);
 assert.match(trt,/if\(!atitude\.podeAtacar\)\{if\(atitude\.velocidade>1&&podeAndar\)/);
 assert.match(ler('js/nova-direta.js'),/mesaAtitudesRT\?\.velocidade\?\.\(h\.id\)/);
 const ui=ler('js/mesa-atitudes.js');
 assert.match(ui,/id='rtModos'/);assert.match(ui,/rt-atitude-selo/);assert.match(ui,/prefers-reduced-motion/);
 assert.match(ui,/QUEUE\+'\/'\+id/); // pedido do jogador vai pela fila combatesAtivos/mesaAtitudes/acoes, que as regras já cobrem
 assert.match(ler('firestore.rules'),/match \/combatesAtivos\/\{combateId\} \{[\s\S]*match \/acoes\/\{acaoId\}/);
});
