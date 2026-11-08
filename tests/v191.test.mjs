import test from 'node:test';import assert from 'node:assert/strict';
import {gerarMasmorra,cenaMasmorra,SALAS,Q,W,H,ENTRADA,MONSTROS,ITENS_PREPARO,ITENS_KAEL,metros,svgItem} from '../js/mesa-masmorra.js';
import {destinoSemColisao} from '../js/nova-colisao.js';
import {itemSolto,tipoInterativo} from '../js/mesa-objetos.js';
import {tripulacaoDe,horasAteChegada} from '../js/mesa-viagem.js';
const g=gerarMasmorra({objetos:[]}),cena=cenaMasmorra(g),map={larguraM:W,alturaM:H};
const naSala=(k,x,y)=>{const s=SALAS.find(z=>z.k===k);return x>=s.x*Q&&x<(s.x+s.w)*Q&&y>=s.y*Q&&y<(s.y+s.h)*Q;};

test('v191: Kael começa sozinho no Quarto: nenhum monstro na sala (nem nas vizinhas imediatas), só ele e os itens',()=>{
 assert.ok(naSala('quarto',ENTRADA.x,ENTRADA.y),'Kael nasce no Quarto');
 for(const m of g.monstros.filter(m=>!m.jaula)){assert.ok(!naSala('quarto',m.x,m.y),m.id+' não pode estar no Quarto');assert.ok(!naSala('deposito',m.x,m.y)&&!naSala('altar',m.x,m.y),m.id+' longe da sala inicial');}
 assert.ok(!MONSTROS.some(m=>m.id==='carrapato_de_ferro'&&naSala('deposito',m.x*Q,m.y*Q)),'carrapatos saíram do Depósito');
 assert.equal(g.monstros.filter(m=>m.id==='carrapato_de_ferro').length,2,'continuam no jogo, mas na caverna do sul');
 for(const m of g.monstros.filter(m=>m.id==='carrapato_de_ferro'))assert.equal(g.em(m.x,m.y).tipo,'caverna');
});
test('v191: no Quarto há itens para pegar: Pistola Laser e Sabre de energia (Espada de Força), com munição, armadura e kit',()=>{
 const soltos=cena.objects.filter(o=>o.preparoV191);assert.equal(soltos.length,ITENS_PREPARO.length);
 const ids=soltos.map(o=>itemSolto(o).idBanco);for(const id of ['pistola_laser','espada_forca','celula_lamina','bateria','armadura_leve','kit_medico'])assert.ok(ids.includes(id),id);
 assert.match(soltos.find(o=>itemSolto(o).idBanco==='espada_forca').nome,/Sabre de energia/);
 for(const o of soltos){const it=itemSolto(o);assert.equal(it.tipo,'item');assert.ok(it.uid&&it.nome&&it.imagem);assert.equal(o.camada,1);assert.equal(o.bloqueiaMovimento,false);assert.ok(naSala('quarto',o.x*W/28,o.y*H/14),'dentro do Quarto: '+o.nome);assert.match(o.imagem,/^data:image\/svg/);}
 // não ficam em cima dos móveis nem da porta
 for(const o of soltos){const x=o.x*W/28,y=o.y*H/14;for(const m of cena.objects.filter(m=>m.bloqueiaMovimento&&m.imagem!==undefined&&!m.oficinaElement)){const dx=Math.abs(x-m.x*W/28),dy=Math.abs(y-m.y*H/14);assert.ok(dx>m.larguraM/2||dy>m.alturaM/2,o.nome+' em cima de '+m.nome);}}
 assert.deepEqual(ITENS_KAEL.map(([,id])=>id).sort(),['kit_ferramentas_mecanicas','kit_primeiros_socorros'],'Kael não já nasce armado: as armas estão no chão');
 assert.match(svgItem('🔫'),/^data:image\/svg/);
});
test('v191: com a COLISÃO REAL do jogo, do Quarto chega-se a todas as salas e monstros (portas abertas); só arsenal, cripta e celas ficam fechados',()=>{
 const ABRIR=o=>/porta/i.test(o.oficina3||'')&&!o.estadoInterativo?.trancado;
 const objs=cena.objects.filter(o=>o.bloqueiaMovimento&&!ABRIR(o));
 const passo=.75,gx=Math.round(W/passo),gy=Math.round(H/passo),pos=(i,j)=>({x:i*passo+passo/2,y:j*passo+passo/2});
 const tok=p=>({id:'k',...metros(p.x,p.y),diametroM:1,camada:3});
 const anda=(a,b)=>{const t=tok(a),d=tok(b),r=destinoSemColisao(t,{x:d.x,y:d.y},[],map,objs);return Math.hypot(r.x-d.x,r.y-d.y)<1e-6;};
 const ini=[Math.floor(ENTRADA.x/passo),Math.floor(ENTRADA.y/passo)],vis=new Set([ini.join()]),fila=[ini];
 assert.ok(anda(pos(...ini),{x:pos(...ini).x+.3,y:pos(...ini).y}),'o ponto onde o Kael nasce não está preso');
 while(fila.length){const [i,j]=fila.shift();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=gx||nj>=gy||vis.has(ni+','+nj))continue;if(!anda(pos(i,j),pos(ni,nj)))continue;vis.add(ni+','+nj);fila.push([ni,nj]);}}
 const celulasNaSala=s=>[...vis].filter(k=>{const [i,j]=k.split(',').map(Number),p=pos(i,j);return p.x>=s.x*Q&&p.x<(s.x+s.w)*Q&&p.y>=s.y*Q&&p.y<(s.y+s.h)*Q;}).length;
 for(const s of SALAS){const n=celulasNaSala(s);if(['arsenal','cripta'].includes(s.k))assert.equal(n,0,s.nome+' trancada');else assert.ok(n>=20,s.nome+' alcançável ('+n+' células)');}
 const alc=(x,y)=>[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]].some(([a,b])=>vis.has((Math.floor(x/passo)+a)+','+(Math.floor(y/passo)+b)));
 for(const m of g.monstros.filter(m=>!m.jaula)){if(naSala('cripta',m.x,m.y))continue;assert.ok(alc(m.x,m.y),'monstro alcançável: '+m.id+' em '+m.x+','+m.y);}
 for(const j of g.jaulas)assert.ok(!alc(j.x,j.y),'cela fechada não se alcança');
 for(const a of g.armadilhas)assert.ok(alc(a.x,a.y),'armadilha alcançável');
});
test('v191: portas vedam o vão inteiro (sem fresta ao lado) e continuam interativas',()=>{
 const portas=cena.objects.filter(o=>/porta/i.test(o.oficina3||''));assert.equal(portas.length,12);
 for(const p of portas){assert.equal(tipoInterativo(p),'porta');assert.ok(Math.abs(Math.max(p.larguraM,p.alturaM)-(Q-.3))<.01,'porta de '+(Q-.3)+' m: '+p.larguraM+'×'+p.alturaM);}
});
test('v191 viagem: a tripulação é a do mapa de partida; sem ninguém ali, vão todos os jogadores do jogo',()=>{
 const toks=[{id:'a',nome:'A',donoUid:'u1',mapaId:'m1'},{id:'b',nome:'B',donoUid:'u2',mapaId:'m2'},{id:encodeURIComponent('syncnpc:x'),nome:'NPC',donoUid:'',mapaId:'m1'},{id:'c',nome:'C',donoUid:'',mapaId:'m1'}];
 let r=tripulacaoDe(toks,'m1');assert.deepEqual(r.lista.map(t=>t.id),['a']);assert.equal(r.deOutroMapa,false);
 r=tripulacaoDe(toks,'mX');assert.deepEqual(r.lista.map(t=>t.id).sort(),['a','b']);assert.equal(r.deOutroMapa,true,'ninguém no mapa: vão todos, e o aviso aparece');
 r=tripulacaoDe([],'m1');assert.deepEqual(r.lista,[]);assert.equal(r.deOutroMapa,false);
 assert.equal(horasAteChegada(20,8*3600000),12);assert.equal(horasAteChegada(10,9*3600000),25,'chegada em menos de 3 h ganha um dia');assert.equal(horasAteChegada(undefined,undefined),12);
});
