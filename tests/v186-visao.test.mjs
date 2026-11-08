import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {linhaDeVisaoLivre,percebe,reacaoMs,ALCANCE_VISAO,MEMORIA_MS} from '../js/mesa-tempo-real-tatica.js';
import {perfilCombate} from '../js/mesa-tempo-real-ia.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const map={larguraM:28,alturaM:14};
const parede={id:'w',x:10,y:5,larguraM:.3,alturaM:4,bloqueiaMovimento:true,bloqueiaVisao:true,camada:3};
const grade={...parede,id:'g',bloqueiaVisao:false};
const porta={...parede,id:'p',nome:'Porta'};

test('v186: parede e porta fechada escondem; grade, porta aberta, parede destruída e telhado não',()=>{
 const a={x:5,y:5},b={x:15,y:5};
 assert.equal(linhaDeVisaoLivre(a,b,map,[]),true);
 assert.equal(linhaDeVisaoLivre(a,b,map,[parede]),false);
 assert.equal(linhaDeVisaoLivre(a,b,map,[grade]),true);
 assert.equal(linhaDeVisaoLivre(a,b,map,[porta]),false);
 assert.equal(linhaDeVisaoLivre(a,b,map,[{...porta,bloqueiaMovimento:false,estadoInterativo:{aberto:true}}]),true);
 assert.equal(linhaDeVisaoLivre(a,b,map,[{...parede,destruido:true}]),true);
 assert.equal(linhaDeVisaoLivre(a,b,map,[{...parede,camada:5}]),true);
 assert.equal(linhaDeVisaoLivre(a,b,map,[{...parede,bloqueiaVisao:false,oficinaElement:{bloqueiaVisao:true}}]),false,'forma da Oficina guarda a visão no elemento');
 assert.equal(linhaDeVisaoLivre(a,b,map,[{...parede,bloqueiaVisao:false,bloqueiaMovimento:false,oficinaElement:{bloqueiaVisao:true}}]),true,'piso (não barra o passo) não esconde');
 assert.equal(linhaDeVisaoLivre(a,{x:9,y:5},map,[parede]),true,'parede atrás do alvo não atrapalha');
 assert.equal(linhaDeVisaoLivre(a,b,{larguraM:56,alturaM:28},[{...parede,x:10,y:5}]),false,'mapa maior: a parede continua no caminho');
});
test('v186: a criatura só conta com quem vê; reage depois do tempo do perfil; lembra por 20 s; atacada sabe na hora',()=>{
 const mem=new Map();
 assert.equal(percebe(mem,'k',{visivel:false,agora:1000,reacao:600}),false,'nunca viu');
 assert.equal(percebe(mem,'k',{visivel:true,agora:1000,reacao:600}),false,'acabou de ver: ainda reagindo');
 assert.equal(percebe(mem,'k',{visivel:true,agora:1700,reacao:600}),true);
 assert.equal(percebe(mem,'k',{visivel:false,agora:1700+MEMORIA_MS-1,reacao:600}),true,'lembra');
 assert.equal(percebe(mem,'k',{visivel:false,agora:1700+MEMORIA_MS+1,reacao:600}),false,'esqueceu');
 assert.equal(mem.has('k'),false);
 const m2=new Map([['k',{desde:-99999,visto:5000}]]);assert.equal(percebe(m2,'k',{visivel:false,agora:5000,reacao:1800}),true,'quem foi atacado reage na hora');
 assert.equal(ALCANCE_VISAO,14);
});
test('v186: tempo de reação por perfil',()=>{
 assert.equal(reacaoMs(perfilCombate({texto:'zumbi',int:2,mov:4})),0);
 assert.equal(reacaoMs(perfilCombate({texto:'Alfa predador',int:6,mov:8})),0,'chefe reage na hora');
 assert.equal(reacaoMs(perfilCombate({texto:'soldado',int:12,mov:6,tipo:'npc'})),1200);
 assert.equal(reacaoMs(perfilCombate({texto:'galinha domesticada',int:3,mov:6})),1800);
 assert.equal(reacaoMs(perfilCombate({texto:'besta predador',int:5,mov:8})),600);
 assert.equal(reacaoMs(),600);
});
test('v186: IA filtra inimigos pela visão, aprende pela luta (e vizinhos a 10 m ouvem), neutro atacado vira "cada um por si"',()=>{
 const rt=ler('js/mesa-tempo-real.js');
 assert.match(rt,/const alerta=new Map\(\);/);
 assert.match(rt,/for\(let i=inimigos\.length-1;i>=0;i--\)\{const o=inimigos\[i\],vis=distanciaBordas\(t,o,W,H\)<=ALCANCE_VISAO&&linhaDeVisaoLivre\(t,o,mapa,objs\);if\(!percebe\(mem,o\.id,\{visivel:vis,agora,reacao\}\)\)inimigos\.splice\(i,1\);\}/);
 assert.match(rt,/function agredido\(alvoId,agressorId\)\{[\s\S]*if\(distanciaBordas\(alvo,o,W,H\)<=10\)lembrar\(o\.id,agressorId,agora\);/);
 assert.match(rt,/faccaoDe\(alvo,estado\?\.faccoes\|\|\{\}\)==='neutros'\)\{[\s\S]*gravarEstado\(\{faccoes:\{\[alvoId\]:'selvagens'\}\}\)/);
 assert.equal((rt.match(/agredido\(/g)||[]).length,3,'chamado nos dois lugares em que um ataque conecta');
 assert.match(rt,/👁️ em alerta/);
});
