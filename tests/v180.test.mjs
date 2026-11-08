import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {PINTURAS,CORES_LISAS,MATERIAIS,miraDe,giroAuto,limitarDesl,grupoDaPeca,alvoNaMira,deslocar,centroDe,parteDe,pintar,colorir,saidaPerto,chegadaDentro,montarPeca,PISOS} from '../js/mesa-construcao.js';
const W=40,H=30,S=(x,y,w,h,extra={})=>({x:x*28/W,y:y*14/H,larguraM:w,alturaM:h,forma:'rect',...extra});
test('v180 construtor: a peça aparece à frente e a parede fica de frente para quem constrói',()=>{
 const m=miraDe({x:10,y:10},0,2);assert.ok(m.x>11.5&&Math.abs(m.y-10)<1e-9);
 assert.deepEqual(miraDe({x:10,y:10},0,2,{x:-3,y:1}),{x:7,y:11});
 assert.equal(giroAuto(0),1);assert.equal(giroAuto(Math.PI),1);assert.equal(giroAuto(Math.PI/2),0);assert.equal(giroAuto(-Math.PI/2),0);
 const d=limitarDesl({x:30,y:40},8);assert.ok(Math.abs(Math.hypot(d.x,d.y)-8)<1e-9);
});
test('v180 construtor: quebrar/levar pega a peça inteira (com os blocos invisíveis) e não pega o chão do mapa',()=>{
 const pecas=montarPeca('parede_curva',{x:10,y:10},{M:2,mat:'tijolo',W,H});const vis=pecas[0];
 const fundo={id:'chao_mapa',...S(20,15,40,30),camada:0,nome:'Chão do mapa'};
 const objs=[fundo,...pecas];const bloco=pecas[3];
 const alvo=alvoNaMira(objs,{x:Number(bloco.x)*W/28,y:Number(bloco.y)*H/14},W,H);
 assert.equal(alvo.id,vis.id);assert.equal(grupoDaPeca(objs,alvo).length,pecas.length);
 assert.equal(alvoNaMira([fundo],{x:5,y:5},W,H),null);
 const parede={id:'p',...S(10,10,2,.3,{bloqueiaMovimento:true}),nome:'Parede'},teto={id:'t',...S(10,10,4,4,{camada:5,tetoV139:true})};
 assert.equal(alvoNaMira([teto,parede],{x:10,y:10.1},W,H).id,'p');
});
test('v180 construtor: levar desloca em metros e o centro acompanha',()=>{
 const l=[{id:'a',...S(10,10,2,.3)},{id:'b',...S(12,10,2,.3)}];const c=centroDe(l,W,H);assert.ok(Math.abs(c.x-11)<1e-6&&Math.abs(c.y-10)<1e-6);
 const n=deslocar(l,2,-1,W,H),c2=centroDe(n,W,H);assert.ok(Math.abs(c2.x-13)<1e-3&&Math.abs(c2.y-9)<1e-3);
});
test('v180 construtor: pintar troca a textura pela do material certo, ou põe cor lisa; imagem do banco não se pinta',()=>{
 assert.equal(PINTURAS.length,MATERIAIS.length+PISOS.length+CORES_LISAS.length);
 const par={id:'p',nome:'Parede',forma:'rect',oficina3:'parede',bloqueiaMovimento:true,textura:'x'};
 const m=pintar(par,'madeira');assert.equal(m.textura,'arte/materiais/madeira/parede.webp');assert.equal(m.parteV177,'parede');
 const c=pintar({...par,nome:'Chão · Tijolo',oficina3:'chao'},'cor:vermelho');assert.equal(c.textura,undefined);assert.equal(c.cor,'#a8322a');assert.equal(c.nome,'Chão · Vermelho');
 assert.equal(pintar({id:'img',imagem:'arte/pecas/x.webp'},'madeira'),null);
 assert.equal(parteDe({nome:'Porta'}),'porta');assert.equal(parteDe({tetoV139:true}),'teto');
 const nova=colorir(montarPeca('parede_janela',{x:5,y:5},{M:2,mat:'tijolo',W,H}),'cor:azul');assert.ok(nova.filter(o=>!o.invisivelV161).every(o=>o.cor==='#2f5f9e'&&!o.textura));
 for(const p of PINTURAS.filter(x=>!x.id.startsWith('cor:')&&!x.id.startsWith('piso:')))for(const parte of ['parede','chao','teto','porta','janela','escada'])assert.ok(existsSync(new URL(`../arte/materiais/${p.id}/${parte}.webp`,import.meta.url)),p.id+'/'+parte);
 // v196: pisos novos — só valem para peças de chão e as texturas existem
 for(const p of PISOS)assert.ok(existsSync(new URL('../'+p.src,import.meta.url)),'textura do piso '+p.id);
 const chaoP=pintar({id:'c',nome:'Chão · Tijolo',forma:'rect',oficina3:'chao'},'piso:areia');assert.equal(chaoP.textura,'arte/texturas/areia.webp');assert.equal(chaoP.nome,'Chão · Areia');assert.equal(chaoP.pisoV196,'piso:areia');
 assert.equal(pintar(par,'piso:areia'),null,'piso não pinta parede');
 const casa=colorir(montarPeca('casa_pequena',{x:5,y:5},{M:2,mat:'tijolo',W,H}),'piso:grama');assert.ok(casa.filter(o=>o.oficina3==='chao').every(o=>o.textura==='arte/texturas/grama.webp'),'chão da casa vira grama');assert.ok(casa.filter(o=>o.oficina3==='parede'&&!o.invisivelV161).every(o=>(o.textura||'').includes('arte/materiais/tijolo/')),'paredes continuam de tijolo');
});
test('v180 construtor: encostar numa saída leva ao outro mapa, chegando um pouco para dentro',()=>{
 const ligs=[{a:{mapa:'A',x:27.6,y:7},b:{mapa:'B',x:.4,y:7}}];
 assert.equal(saidaPerto(ligs,'A',{x:39,y:15},40,30,1.5)?.para.mapa,'B');
 assert.equal(saidaPerto(ligs,'A',{x:30,y:15},40,30,1.5),null);
 assert.equal(saidaPerto(ligs,'B',{x:.6,y:12},30,24,1.5)?.para.mapa,'A');
 const c=chegadaDentro({x:.4,y:7},30,24);assert.ok(c.x>1.5&&Math.abs(c.y-12)<.01);
});
test('v180 ligado no site: modo construtor na Oficina 3.0, câmera segue o construtor, controle passa a vez',()=>{
 const o=readFileSync(new URL('../js/mesa-oficina3.js',import.meta.url),'utf8');
 assert.match(o,/data-construtor/);assert.match(o,/data-teste/);assert.match(o,/padConstrutor/);assert.match(o,/mesaCameraFocoV180_/);
 const c=readFileSync(new URL('../js/mesa-camera.js',import.meta.url),'utf8');assert.match(c,/mesaCameraFocoV180_/);
 const k=readFileSync(new URL('../js/mesa-controle.js',import.meta.url),'utf8');assert.match(k,/mesaConstrucaoControleV177_/);
});
