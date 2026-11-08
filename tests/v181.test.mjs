import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {avaliar,avaliarCond,distAoAlvo,vistaDialogo,resolverOpcao,dialogoDoNpc,aplicarMissao,diario,sortear,proximaHora,conferir,historiaPronta,NPCS_HISTORIA,CIDADE,THERION,rolar,chance} from '../js/mesa-roteiros-dados.js';
const ctxBase=(x={})=>({pcs:[{id:'a',mapa:'M1',x:10,y:10},{id:'b',mapa:'M1',x:11,y:10},{id:'c',mapa:'M2',x:1,y:1}],hora:21,flags:{noite:true},missoes:{m:{estado:'ativa',etapa:'e2'}},objetos:m=>m==='M1'?[{nome:'Nave do grupo (caída)',x:20,y:10,w:10,h:4,ang:0}]:[],inimigos:m=>m==='M1'?0:2,...x});
test('v181 condições: mapa, perto da beirada de um objeto, hora que vira a noite, marca, missão, sem inimigos',()=>{
 const c=ctxBase();
 assert.deepEqual([...avaliarCond({tipo:'mapa',mapas:['M1','M9']},c)],['M1']);
 assert.equal(avaliarCond({tipo:'perto',mapa:'M1',alvo:'caída',raio:5},c)?.has('M1'),true); // beirada a 4 m
 assert.equal(avaliarCond({tipo:'perto',mapa:'M1',alvo:'caída',raio:3},c),null);
 assert.equal(Math.round(distAoAlvo({x:10,y:10},{x:20,y:10,w:10,h:4,ang:0})),5);
 assert.equal(avaliarCond({tipo:'hora',de:20,ate:5},c),'*');assert.equal(avaliarCond({tipo:'hora',de:20,ate:5},ctxBase({hora:12})),null);assert.equal(avaliarCond({tipo:'hora',de:6,ate:12},ctxBase({hora:6})),'*');
 assert.equal(avaliarCond({tipo:'flag',flag:'noite',valor:true},c),'*');assert.equal(avaliarCond({tipo:'flag',flag:'noite',valor:'nao'},c),null);
 assert.equal(avaliarCond({tipo:'missao',missao:'m',etapa:'e2'},c),'*');assert.equal(avaliarCond({tipo:'missao',missao:'x',etapa:'__nao'},c),'*');assert.equal(avaliarCond({tipo:'missao',missao:'m',etapa:'__concluida'},c),null);
 assert.equal(avaliarCond({tipo:'semInimigos',mapa:'M2'},c),null);
 assert.deepEqual(avaliar([{tipo:'mapa',mapas:['M1','M2']},{tipo:'semInimigos',mapa:'M1'}],c),{ok:true,mapa:'M1'});
 assert.equal(avaliar([{tipo:'mapa',mapas:['M2']},{tipo:'semInimigos',mapa:'M1'}],c).ok,false);
 assert.deepEqual(avaliar([{tipo:'hora',de:20,ate:5}],c),{ok:true,mapa:'M1'}); // sem mapa: onde está a maior parte do grupo
});
test('v181 diálogos: só o que pode aparecer; acertar/errar levam a falas diferentes; achar pelo nome do NPC',()=>{
 const d={id:'d',nome:'Varra',npc:'Varra',inicio:'n1',nos:[{id:'n1',fala:'Oi',opcoes:[{id:'a',texto:'A',umaVez:true,resposta:'r'},{id:'b',texto:'B',precisaFlag:'pista'},{id:'c',texto:'C',teste:{pericia:'Comércio',dif:'Padrão'},sucesso:'ok',falha:'não',vai:'n2',vaiFalha:'n1',efeitos:[{tipo:'flag',flag:'x'}],efeitosFalha:[]}]},{id:'n2',fala:'Sobe',opcoes:[]}]};
 const v=vistaDialogo(d,'n1',{flags:{}},{feitas:{a:1}});assert.deepEqual(v.opcoes.map(o=>o.id),['c']);assert.equal(v.opcoes[0].teste,'Comércio');assert.ok(!JSON.stringify(v).includes('efeitos'));
 assert.deepEqual(vistaDialogo(d,'n1',{flags:{pista:true}}).opcoes.map(o=>o.id),['a','b','c']);
 const c=d.nos[0].opcoes[2];
 assert.deepEqual(resolverOpcao(c,{sucesso:true,grau:'Sucesso'}),{ok:true,resposta:'ok',efeitos:[{tipo:'flag',flag:'x'}],vai:'n2'});
 assert.equal(resolverOpcao(c,{sucesso:false}).vai,'n1');assert.equal(resolverOpcao({resposta:'tchau',vai:'fim'}).vai,'');
 assert.equal(dialogoDoNpc([d],['NPC · Varra, a sucateira'],{pcs:[]})?.id,'d');assert.equal(dialogoDoNpc([d],['Cronam'],{pcs:[]}),null);
 const r=rolar(50,'Difícil',10);assert.equal(r.chance,chance(50,'Difícil'));assert.equal(r.chance,33);assert.ok(r.sucesso);
});
test('v181 missões e diário; sorteio; próxima hora',()=>{
 const ms=[{id:'m',nome:'M',etapas:[{id:'e1',texto:'um'},{id:'e2',texto:'dois'}]}];
 let e=aplicarMissao({},{missao:'m',acao:'iniciar'},ms);assert.equal(e.m.etapa,'e1');
 e=aplicarMissao(e,{missao:'m',acao:'etapa',etapa:'e2'},ms);assert.deepEqual(e.m.feitas,['e1']);
 assert.deepEqual(diario(ms,e)[0],{id:'m',nome:'M',descricao:'',estado:'ativa',atual:'dois',feitas:['um'],em:e.m.em});
 e=aplicarMissao(e,{missao:'m',acao:'concluir'},ms);assert.equal(e.m.estado,'concluida');assert.deepEqual(e.m.feitas,['e1','e2']);
 assert.equal(diario(ms,{}).length,0);
 assert.equal(sortear([{peso:1,k:1},{peso:3,k:2}],()=>.1).k,1);assert.equal(sortear([{peso:1,k:1},{peso:3,k:2}],()=>.5).k,2);
 const H=3600000;assert.equal(proximaHora(4*86400000+20*H,6),5*86400000+6*H);assert.equal(proximaHora(4*86400000+2*H,6),4*86400000+6*H);
});
test('v181 história pronta: tudo o que ela cita existe e as perícias são do jogo',()=>{
 const h=historiaPronta();
 const mapas=[{id:CIDADE},...THERION.map(id=>({id}))],criaturas=[{id:'rastejante_de_cinzas'}],npcs=NPCS_HISTORIA.map(n=>({id:n.id}));
 assert.deepEqual(conferir(h,{mapas,criaturas,npcs}),[]);
 assert.ok(conferir(h,{mapas:[],criaturas:[],npcs:[]}).length>0);
 const dados=['02-dados-padrao','01-nucleo'].map(f=>readFileSync(new URL('../js/app/'+f+'.js',import.meta.url),'utf8')).join('\n');
 for(const d of h.dialogos)for(const n of d.nos)for(const o of n.opcoes)if(o.teste?.pericia)assert.match(dados,new RegExp(`nome:\\s*['"]${o.teste.pericia}['"]`),o.teste.pericia);
 assert.ok(h.gatilhos.find(g=>g.id==='g_therion').efeitos.some(e=>e.tipo==='sortear'&&e.opcoes.length===2));
 assert.match(NPCS_HISTORIA.find(n=>n.id==='npc_roteiro_encapuzado').descricao,/Vaelkor/);
});
test('v181 ligado no site; roteiros só o mestre lê; mesa automática responde logo nas conversas',()=>{
 const m=readFileSync(new URL('../js/app/22-mesa-e-modulos.js',import.meta.url),'utf8');assert.match(m,/mesa-roteiros\.js/);
 const b=readFileSync(new URL('../js/mesa-barras.js',import.meta.url),'utf8');assert.match(b,/'rtBotao'/);assert.match(b,/'rtMissoes'/);
 const r=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');assert.match(r,/documento != 'roteirosV181' && documento != 'roteirosEstadoV181'/);assert.match(r,/documento == 'roteirosV181'.*ehMestre\(\)/);
 const c=readFileSync(new URL('../js/mesa-conversas.js',import.meta.url),'utf8');assert.match(c,/mesaAutomaticaV181_/);
});
