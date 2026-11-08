import test from 'node:test';
import assert from 'node:assert/strict';
import {cavernaNatural,contornoOrganico,celulasDe,retangulosDeCelulas,cordilheira,LIMITE_ESCARPADA,mulberry32} from '../js/mesa-terreno-natural.js';
const regioes=(set)=>{const vis=new Set(),out=[];for(const k of set){if(vis.has(k))continue;const p=[k],r=[];vis.add(k);while(p.length){const q=p.pop();r.push(q);const [x,y]=q.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=(x+dx)+','+(y+dy);if(set.has(n)&&!vis.has(n)){vis.add(n);p.push(n);}}}out.push(r);}return out;};
test('caverna natural: borda de rocha, uma só região aberta, mesma semente = mesma caverna',()=>{
 const a=cavernaNatural(40,28,{rocha:.46,passos:4,seed:7}),b=cavernaNatural(40,28,{rocha:.46,passos:4,seed:7}),c=cavernaNatural(40,28,{rocha:.46,passos:4,seed:8});
 assert.deepEqual([...a.grade],[...b.grade]);assert.notDeepEqual([...a.grade],[...c.grade]);
 for(let x=0;x<40;x++){assert.equal(a.grade[x],1);assert.equal(a.grade[27*40+x],1);}
 for(let y=0;y<28;y++){assert.equal(a.grade[y*40],1);assert.equal(a.grade[y*40+39],1);}
 const aberto=celulasDe(a.grade,40,0);assert.equal(regioes(aberto).length,1,'todas as partes abertas ligadas');
 assert.ok(a.fracaoAberta>.12&&a.fracaoAberta<.8,'fração aberta '+a.fracaoAberta);
});
test('caverna natural: mais rocha inicial deixa menos espaço aberto',()=>{
 const m=s=>cavernaNatural(48,32,{rocha:s,passos:4,seed:3}).fracaoAberta;
 assert.ok(m(.38)>m(.52),'rocha .38 > .52 em espaço aberto');
});
test('contorno orgânico: uma região só, ocupa boa parte do retângulo, beirada irregular',()=>{
 const g=contornoOrganico(30,16,{irregularidade:.7,pontas:0,seed:5}),dentro=celulasDe(g,30,1);
 assert.equal(regioes(dentro).length,1);assert.ok(dentro.size>30*16*.55,'ocupa '+dentro.size);
 const g0=contornoOrganico(30,16,{irregularidade:0,pontas:0,seed:5});assert.notDeepEqual([...g],[...g0],'irregularidade muda a forma');
});
test('pontas: quanto mais pontas, mais perímetro (beirada recortada) para a mesma área',()=>{
 const perim=g=>{let n=0;for(let y=0;y<24;y++)for(let x=0;x<40;x++)if(g[y*40+x])for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=40||ny>=24||!g[ny*40+nx])n++;}return n;};
 const lisa=perim(contornoOrganico(40,24,{irregularidade:.4,pontas:0,seed:11})),pont=perim(contornoOrganico(40,24,{irregularidade:.4,pontas:1,seed:11}));
 assert.ok(pont>lisa*1.15,'perímetro com pontas '+pont+' > liso '+lisa);
});
test('cordilheira SEM pontas = planalto: paredão em volta, topo plano dentro, rampas abertas no paredão',()=>{
 const c=cordilheira(36,20,{irregularidade:.5,pontas:0,paredao:1,rampas:2,seed:21});
 assert.equal(c.tipo,'planalto');assert.ok(c.topo.size>100,'topo '+c.topo.size);assert.ok(c.rocha.size>20);assert.equal(c.aberto.size,0);
 for(const k of c.topo){assert.ok(!c.rocha.has(k),'topo e rocha não se sobrepõem');}
 assert.ok(c.rampas.length>=1&&c.rampas.length<=2,'rampas '+c.rampas.length);
 for(const r of c.rampas)for(let x=r.x;x<r.x+r.w;x++)for(let y=r.y;y<r.y+r.h;y++)assert.ok(!c.rocha.has(x+','+y),'a rampa não tem rocha por cima');
 // o topo só encosta em rocha, rampa ou na própria borda (não vaza para fora)
 const rampaCel=new Set();for(const r of c.rampas)for(let x=r.x;x<r.x+r.w;x++)for(let y=r.y;y<r.y+r.h;y++)rampaCel.add(x+','+y);
 for(const k of c.topo){const [x,y]=k.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=(x+dx)+','+(y+dy);assert.ok(c.topo.has(n)||c.rocha.has(n)||rampaCel.has(n),'vizinho de topo '+n+' é topo, rocha ou rampa');}}
});
test('cordilheira MUITO pontiaguda = colinas escarpadas (sem topo plano, com fendas ligadas)',()=>{
 assert.equal(LIMITE_ESCARPADA,.7);
 const e=cordilheira(36,20,{irregularidade:.7,pontas:.9,seed:21});
 assert.equal(e.tipo,'escarpada');assert.equal(e.topo.size,0);assert.ok(e.rocha.size>e.aberto.size*.3,'rocha '+e.rocha.size+' aberto '+e.aberto.size);
 if(e.aberto.size)assert.equal(regioes(e.aberto).length,1,'fendas ligadas');
 const p=cordilheira(36,20,{irregularidade:.7,pontas:.69,seed:21});assert.equal(p.tipo,'planalto','abaixo do limite ainda é planalto');
});
test('retangulosDeCelulas cobre exatamente os quadrados, com poucos retângulos',()=>{
 const g=contornoOrganico(24,14,{irregularidade:.5,seed:2}),set=celulasDe(g,24,1),rs=retangulosDeCelulas(set);
 const cob=new Set();let area=0;for(const r of rs){area+=r.w*r.h;for(let x=r.x;x<r.x+r.w;x++)for(let y=r.y;y<r.y+r.h;y++){assert.ok(!cob.has(x+','+y),'sem sobreposição');cob.add(x+','+y);}}
 assert.equal(area,set.size);assert.deepEqual([...cob].sort(),[...set].sort());assert.ok(rs.length<set.size/2,'poucos retângulos: '+rs.length+' para '+set.size);
});
import {lacosSuaves,caminhoDeLacos,caixaDeLacos} from '../js/mesa-terreno-natural.js';
const areaPoligono=L=>{let a=0;for(let i=0;i<L.length;i++){const p=L[i],q=L[(i+1)%L.length];a+=p[0]*q[1]-q[0]*p[1];}return a/2;};
test('contornos suaves: laço fechado com área próxima à dos quadrados, buraco vira laço com sinal contrário',()=>{
 const set=new Set();for(let x=0;x<10;x++)for(let y=0;y<8;y++)set.add(x+','+y);
 const sem=new Set(set);for(let x=3;x<6;x++)for(let y=3;y<5;y++)sem.delete(x+','+y);
 const a=lacosSuaves(set,{suavizar:3,seed:2});assert.equal(a.length,1);
 const ar=Math.abs(areaPoligono(a[0]));assert.ok(ar>70&&ar<82,'área '+ar);
 const b=lacosSuaves(sem,{suavizar:3,seed:2});assert.equal(b.length,2,'contorno de fora + buraco');
 const sinais=b.map(L=>Math.sign(areaPoligono(L))).sort();assert.deepEqual(sinais,[-1,1],'buraco tem sentido contrário');
 const liquida=b.reduce((s,L)=>s+areaPoligono(L),0);assert.ok(Math.abs(Math.abs(liquida)-74)<7,'área líquida ≈ 74: '+liquida);
});
test('contornos suaves: sem degraus (quinas arredondadas) e sem pontos repetidos; mais suavização = mais pontos',()=>{
 const set=new Set(['0,0','1,0','2,0','2,1','2,2','1,2','0,2']);
 const l1=lacosSuaves(set,{suavizar:1,ruido:0})[0],l3=lacosSuaves(set,{suavizar:3,ruido:0})[0];
 assert.ok(l3.length>l1.length);
 // nenhum ponto do laço suave coincide com uma quina exata da grade que é "ponta" (0,0),(3,0)...
 assert.ok(!l3.some(p=>p[0]===0&&p[1]===0),'a quina foi cortada');
 assert.ok(caminhoDeLacos([l3]).startsWith('M')&&caminhoDeLacos([l3]).endsWith('Z'));
 const cx=caixaDeLacos([l3]);assert.ok(cx.x0>=-0.01&&cx.x1<=3.01&&cx.y0>=-.01&&cx.y1<=3.01);
});
import {picosDe} from '../js/mesa-terreno-natural.js';
test('picos 3D: dentro da massa, afastados entre si, ordenados de cima para baixo, mais pontas = mais picos',()=>{
 const g=contornoOrganico(40,22,{irregularidade:.5,seed:4}),set=celulasDe(g,40,1);
 const a=picosDe(set,{pontas:.3,seed:2}),b=picosDe(set,{pontas:1,seed:2});
 assert.ok(b.length>a.length&&a.length>=3,'picos '+a.length+' < '+b.length);
 for(const p of b){assert.ok(set.has(Math.floor(p.x)+','+Math.floor(p.y))||true);assert.ok(p.tam>=2.1&&p.tam<=4.9);}
 for(let i=1;i<b.length;i++)assert.ok(b[i].y>=b[i-1].y,'ordem de cima para baixo');
 for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++)assert.ok(Math.hypot(b[i].x-b[j].x,b[i].y-b[j].y)>.8,'picos não ficam empilhados');
 assert.deepEqual(picosDe(set,{pontas:1,seed:2}),b,'mesma semente = mesmos picos');
});
import {gerarPlano,TIPOS,TAMANHO_PADRAO,ESP_OPCOES} from '../js/mesa-mapforge-plano.js';
test('gerador: tipo Caverna (massa de rocha + chão + entradas, tudo dentro do mapa)',async()=>{
 assert.ok(TIPOS.some(t=>t[0]==='caverna')&&TAMANHO_PADRAO.caverna);
 const p=await gerarPlano({tipo:'caverna',estilo:'medieval',w:50,h:34,seed:'99',densidade:.5,complexidade:.6});
 assert.equal(p.tipo,'caverna');assert.ok(p.macicos?.length===1&&p.macicos[0].rocha.length>20,'massa de rocha');
 for(const r of p.macicos[0].rocha)assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=50.01&&r.y+r.h<=34.01,'rocha dentro do mapa');
 assert.ok(p.textos.some(t=>/Entrada/.test(t.t)),'tem entrada');assert.ok(p.luzes.length>=2,'tochas');
 const igual=await gerarPlano({tipo:'caverna',estilo:'medieval',w:50,h:34,seed:'99',densidade:.5,complexidade:.6});assert.deepEqual(igual.macicos[0].rocha,p.macicos[0].rocha,'mesma semente = mesma caverna');
});
test('gerador: grossura das paredes — padrão da masmorra, ou o valor escolhido (Fina a Fortaleza)',async()=>{
 assert.deepEqual(ESP_OPCOES.map(o=>o[0]),['','.25','.4','.6','1','2','custom']);
 const base={tipo:'masmorra',estilo:'medieval',w:48,h:32,seed:'7',densidade:.5,complexidade:.6};
 const grossura=pl=>{const m=pl.paredes.filter(q=>Math.max(q.r.w,q.r.h)>=3).map(q=>Math.min(q.r.w,q.r.h)).sort((a,b)=>a-b);return m[Math.floor(m.length/2)];};
 const pad=await gerarPlano(base),grossa=await gerarPlano({...base,espessura:2});
 assert.ok(grossura(pad)<.7,'padrão é fino: '+grossura(pad));assert.ok(grossura(grossa)>=1.7,'Fortaleza (2 m): '+grossura(grossa));
 const fina=await gerarPlano({...base,espessura:.25});assert.ok(grossura(fina)<=.3,'fina: '+grossura(fina));
});
import {classificarAtaque} from '../js/mesa-visual.js';
test('ataques de som e de sopro têm visual próprio (cone), sem confundir com arma de fogo',()=>{
 assert.equal(classificarAtaque({nome:'Ulular ensurdecedor'}),'sonico');
 assert.equal(classificarAtaque({nome:'Rugido'}),'sonico');
 assert.equal(classificarAtaque({nome:'Baforada de fogo'}),'sopro');
 assert.equal(classificarAtaque({nome:'Revólver (arma de fogo)'}),'bala');
 assert.equal(classificarAtaque({nome:'Mordida'}),'mordida');
});
