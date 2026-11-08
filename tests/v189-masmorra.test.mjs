import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {gerarMasmorra,cenaMasmorra,rasterizar,aliviar,completarKael,reconstruir,resolverArmadilha,dentroDe,ehArmadilha,tipoArmadilha,armada,abrirJaula,jaulaFechada,miniaturaDe,modeloDe,metros,ITENS_KAEL,MAPA,SALAS,LINHAS,PORTAS,JAULAS,MONSTROS,MOBILIA,ESCADAS,ENTRADA,Q,QW,QH,W,H,PAREDE,GRADE,PORTA,ARMADILHAS,ID_MASMORRA,TELHADO} from '../js/mesa-masmorra.js';
import {FACCOES} from '../js/mesa-tempo-real-ia.js';
import {tipoInterativo,estadoDe,aplicarPedido,distanciaObjeto as distObj} from '../js/mesa-objetos.js';
import {ehMiniatura} from '../js/mesa-miniaturas.js';
import {PACOTE_NOVO} from '../js/mesa-arte-objetos.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
// Banco "realista": tudo o que a planta usa existe (como no site do Yuri, onde pk_* e as receitas entram sozinhos)
const idsBanco=[...new Set([...MOBILIA.map(m=>m[0]),'armadilha1','grade1','lampada','pk_feu_braseiro'])];
const banco=idsBanco.map(id=>({id,nome:PACOTE_NOVO.find(p=>p.id===id)?.nome||id,larguraM:1,alturaM:1,pvMax:10,imagem:'https://banco/'+id+'.svg'}));
const g=gerarMasmorra({objetos:banco}),cena=cenaMasmorra(g),R=rasterizar();
const por=n=>cena.objects.filter(o=>o.nome===n||String(o.nome).startsWith(n+' ·'));const mat=o=>o.oficinaElement?.material||'';
const q=(x,y)=>({x:x*Q,y:y*Q});

test('v189: planta copiada da referência: 30×18 quadros de 2 m, caverna com abismo e duas pontes, 11 salas, escada de entrada e de saída',()=>{
 assert.equal(MAPA.length,QH);for(const l of MAPA)assert.equal(l.length,QW);assert.equal(W,QW*Q);assert.equal(H,QH*Q);assert.equal(Q,2,'quadros de 2 m (v191)');
 const cont=c=>MAPA.join('').split(c).length-1;assert.ok(cont('.')>150&&cont(',')>50&&cont('~')>15);assert.equal(cont('='),3);assert.equal(cont('S'),3);
 assert.equal(SALAS.length,11);for(const s of SALAS)for(let j=s.y;j<s.y+s.h;j++)for(let i=s.x;i<s.x+s.w;i++)assert.ok(R.andavel((i+.5)*Q,(j+.5)*Q),s.nome+' tem chão em '+i+','+j);
 assert.ok(R.andavel(ENTRADA.x,ENTRADA.y));assert.ok(!R.andavel(10.5*Q,5.5*Q),'abismo');assert.ok(R.andavel(10.5*Q,7.5*Q),'ponte');
 assert.equal(JSON.stringify(g.state.elements),JSON.stringify(gerarMasmorra({objetos:banco}).state.elements),'determinístico');
 assert.ok(por('Escada da entrada').length===1&&por('Escada de saída').length===1&&por('Degraus').length===4);
});
test('v189: portas e linhas internas caem em arestas entre dois quadros de chão; 12 portas, duas trancadas (arsenal e cripta)',()=>{
 const T=(i,j)=>MAPA[j]?.[i]||'#',chao=c=>'.S,='.includes(c);
 for(const p of PORTAS){const a=p.hor?T(p.x,p.y-1):T(p.x-1,p.y),b=T(p.x,p.y);assert.ok(chao(a)&&chao(b),'porta entre chão e chão: '+JSON.stringify(p));}
 for(const l of LINHAS){if(l.hor)for(let i=l.x0;i<l.x1;i++)assert.ok(chao(T(i,l.y-1))&&chao(T(i,l.y)),'linha '+JSON.stringify(l));else for(let j=l.y0;j<l.y1;j++)assert.ok(chao(T(l.x-1,j))&&chao(T(l.x,j)),'linha '+JSON.stringify(l));}
 const portas=cena.objects.filter(o=>/porta/i.test(o.oficina3||''));assert.equal(portas.length,PORTAS.length);assert.equal(PORTAS.length,12);
 for(const p of portas){assert.equal(tipoInterativo(p),'porta');assert.ok(p.bloqueiaMovimento&&p.bloqueiaVisao&&p.destrutivel);assert.equal(p.pvMax,PORTA.pv);}
 const tranc=portas.filter(p=>p.estadoInterativo?.trancado);assert.deepEqual(tranc.map(p=>p.nome).sort(),['Porta da cripta','Porta do arsenal']);assert.equal(g.trancadas.length,2);
 for(const p of tranc)assert.equal(estadoDe(p).aberto,false);
});
test('v189: paredes claras de pedra (como a referência) nos limites das salas, rochas só na caverna, pisos por material, telhado como camada de cima, arandelas que iluminam',()=>{
 const paredes=por('Parede de pedra');assert.ok(paredes.length>100&&paredes.length===g.paredes);
 for(const p of paredes){assert.equal(mat(p),'pedra');assert.equal(p.oficinaElement.fill,'#b5b1a4');assert.ok(p.bloqueiaMovimento&&p.oficinaElement.bloqueiaVisao&&p.destrutivel);assert.equal(p.pvMax,PAREDE.pv);assert.ok(Math.min(p.larguraM,p.alturaM)<=.31&&Math.max(p.larguraM,p.alturaM)<=3.31);}
 const rochas=por('Rocha da caverna');assert.ok(rochas.length>=15&&rochas.length===g.rochas);
 for(const r of rochas){assert.equal(mat(r),'rocha');assert.ok(r.bloqueiaMovimento&&r.oficinaElement.bloqueiaVisao);const e=R.em(r.x*W/28,r.y*H/14);assert.ok(!e||e.tipo!=='sala','rocha nunca sobre sala/corredor');}
 const pisos=cena.objects.filter(o=>/^Piso|^Chão da caverna|^Ponte/.test(o.nome));assert.ok(pisos.length>20);for(const p of pisos){assert.equal(p.camada,1);assert.equal(p.bloqueiaMovimento,false);assert.ok(['lajota','madeira','trilha'].includes(mat(p)),mat(p));}
 assert.equal(por('Ponte de madeira').length,2);assert.ok(por('Abismo').length>=4);for(const a of por('Abismo'))assert.ok(a.bloqueiaMovimento&&!a.oficinaElement.bloqueiaVisao);
 const teto=por('Telhado');assert.equal(teto.length,1);assert.ok(teto[0].tetoV139);assert.equal(teto[0].camada,5);assert.equal(teto[0].bloqueiaMovimento,false);const s=SALAS.find(z=>z.k===TELHADO.sala);assert.ok(dentroDe(metros((s.x+s.w/2)*Q,(s.y+s.h/2)*Q),teto[0],W,H),'telhado cobre o quarto');
 const ar=por('Arandela luminária');assert.ok(ar.length>=16&&ar.length===g.luzes);for(const a of ar){assert.equal(tipoInterativo(a),'luz');assert.equal(a.camada,4);assert.equal(a.bloqueiaMovimento,false);assert.equal(a.modeloId,'lampada');}
 assert.ok(por('Luz da arandela').length===ar.length);for(const l of por('Luz da arandela'))assert.ok(l.oficinaElement.fillOpacity<.2);
 assert.equal(mat(por('Poço de água')[0]),'agua');assert.ok(cena.objects.filter(o=>/^Entulho|^Rachadura/.test(o.nome)).length>=20);
});
test('v189: mobília da referência nas salas certas, do Banco quando existe; sem o Banco a cena ainda cabe na mesa',()=>{
 const em=(n,k)=>por(n).filter(o=>R.sala(o.x*W/28,o.y*H/14)?.k===k).length;
 assert.equal(em('Cama de solteiro','quartel'),4);assert.equal(em('Cama de solteiro','dormitorio'),3);assert.equal(em('Cama de solteiro','quarto'),1);
 assert.equal(em('Mesa redonda','refeitorio'),1);assert.equal(em('Cadeira','refeitorio'),4);assert.ok(em('Barril','refeitorio')>=6);assert.ok(em('Barril','deposito')>=4);assert.ok(em('Barril','poco')>=6);
 assert.equal(em('Sarcófago','cripta'),4);assert.equal(em('Trono estelar','torre'),1);assert.equal(em('Altar iluminado','altar'),1);assert.equal(em('Poço de água','poco'),1);
 for(const o of g.objects)assert.ok(o.forma||o.imagem||o.modeloId,'sem visual: '+o.nome);
 for(const [id,x,y] of MOBILIA)assert.ok(R.andavel(x*Q,y*Q),'mobília fora do chão: '+id+' '+x+','+y);
 for(const e of ESCADAS)assert.ok(R.andavel(e.x*Q,e.y*Q),'escada fora do chão: '+e.nome);
 assert.equal(tipoInterativo(por('Baú brasonado')[0]),'recipiente');
 const semBanco=gerarMasmorra({objetos:[]}),c2=cenaMasmorra(semBanco);assert.ok(JSON.stringify(c2).length<650000,'cabe na mesa mesmo com tudo desenhado');
 assert.equal(aliviar(g.objects,650000,0).aliviados,0,'com o Banco nada precisa ser simplificado');
 assert.ok(JSON.stringify(cena).length<420000,'com o Banco a cena é leve');
});
test('v189: celas com grade (arsenal e anfiteatro), alavanca emperrada, armadilha que liberta, armadilhas nos corredores',()=>{
 const grades=cena.objects.filter(o=>o.jaulaV186);assert.equal(grades.length,4);for(const gr of grades){assert.ok(gr.bloqueiaMovimento&&!gr.bloqueiaVisao);assert.equal(gr.pvMax,GRADE.pv);}
 assert.ok(jaulaFechada(cena.objects,'j1')&&jaulaFechada(cena.objects,'j2'));
 const al=cena.objects.find(o=>o.alavancaV186);assert.equal(al.alavancaV186,'j1');assert.equal(al.emperradaV189,true);assert.equal(al.nome,'Alavanca emperrada');assert.equal(R.sala(al.x*W/28,al.y*H/14)?.k,'arsenal');
 assert.equal(cena.objects.filter(o=>o.libertaV186==='j2'&&ehArmadilha(o)).length,1);
 const tr=cena.objects.filter(ehArmadilha);assert.equal(tr.length,6);for(const t of tr){assert.ok(ARMADILHAS[tipoArmadilha(t)]);assert.ok(t.opacity<.5&&armada(t)&&!t.bloqueiaMovimento);const e=R.em(t.x*W/28,t.y*H/14);assert.equal(e.tipo,'sala');assert.equal(R.sala(t.x*W/28,t.y*H/14),null,'armadilhas só nos corredores');}
 const ab=abrirJaula(cena.objects,'j1');assert.equal(jaulaFechada(ab,'j1'),false);assert.equal(jaulaFechada(ab,'j2'),true);
});
test('v189: monstros em facções diferentes, sobre o chão, nas celas; o baú abre e a porta trancada só com teste (regras do módulo de objetos)',()=>{
 assert.ok(g.monstros.length>=14);const fac=new Set(g.monstros.map(m=>m.faccao));assert.ok(fac.size>=5);for(const f of fac)assert.ok(FACCOES[f]);
 for(const m of g.monstros)assert.ok(R.andavel(m.x,m.y),'monstro no chão: '+m.id);
 for(const j of g.jaulas){const m=g.monstros.find(x=>x.jaula===j.id);assert.ok(m);assert.equal(m.x,j.x);}
 assert.ok(new Set(g.monstros.filter(m=>m.sala).map(m=>m.sala)).size>=6,'em salas diferentes');assert.ok(g.monstros.some(m=>!m.sala&&!m.jaula),'na caverna');
 const bau=por('Baú brasonado')[0];const r=aplicarPedido(bau,{acao:'alternar',nome:'Kael'});assert.equal(estadoDe(r.objeto).aberto,true);assert.match(r.msg,/Kael abriu/);
 const porta=cena.objects.find(o=>o.nome==='Porta da cripta');assert.throws(()=>aplicarPedido(porta,{acao:'alternar',nome:'Kael'}),/trancad/);
 const falha=aplicarPedido(porta,{acao:'teste',nome:'Kael',personagemId:'k',teste:{pericia:'Mecanismos',die:80,valor:50,grau:'Falha',sucesso:false}});assert.equal(estadoDe(falha.objeto).trancado,true);
 const ok=aplicarPedido(porta,{acao:'teste',nome:'Kael',personagemId:'k',teste:{pericia:'Mecanismos',die:20,valor:50,grau:'Sucesso',sucesso:true}});assert.equal(estadoDe(ok.objeto).trancado,false);assert.equal(estadoDe(ok.objeto).aberto,true);
});
test('v189: da entrada chega-se a todas as salas destrancadas pela caverna e pelas pontes; arsenal e cripta só depois de abrir as portas',()=>{
 const bloq=(o,destrancar)=>o.bloqueiaMovimento&&!o.destruido&&(o.oficinaElement||o.jaulaV186||o.estadoInterativo?.trancado)&&!(tipoInterativo(o)==='porta'&&(!o.estadoInterativo?.trancado||destrancar))&&o.camada<5;
 const cruza=(a,b,o)=>{const hw=o.larguraM/2,hh=o.alturaM/2,ox=o.x*W/28,oy=o.y*H/14;return Math.min(a.x,b.x)<=ox+hw&&Math.max(a.x,b.x)>=ox-hw&&Math.min(a.y,b.y)<=oy+hh&&Math.max(a.y,b.y)>=oy-hh;};
 const alcance=(destrancar,objs=cena.objects)=>{const barra=(a,b)=>objs.some(o=>bloq(o,destrancar)&&cruza(a,b,o));const P=Q/2,ch=(x,y)=>Math.round(x/P)+':'+Math.round(y/P);
  const vis=new Set([ch(ENTRADA.x,ENTRADA.y)]),fila=[[ENTRADA.x,ENTRADA.y]];
  while(fila.length){const [x,y]=fila.shift();for(const [dx,dy] of [[P,0],[-P,0],[0,P],[0,-P]]){const nx=+(x+dx).toFixed(3),ny=+(y+dy).toFixed(3),k=ch(nx,ny);if(vis.has(k)||!R.andavel(nx,ny)||barra({x,y},{x:nx,y:ny}))continue;vis.add(k);fila.push([nx,ny]);}}
  return (x,y)=>[x-P/2,x,x+P/2].some(px=>[y-P/2,y,y+P/2].some(py=>vis.has(ch(Math.round(px/P)*P,Math.round(py/P)*P))));};
 const ponto=s=>s.k==='arsenal'?q(15.5,2.5):q(s.x+s.w/2,s.y+s.h/2); // no arsenal o centro cai dentro da cela
 const chega=alcance(false);
 for(const s of SALAS){const c=ponto(s);if(s.k==='arsenal'||s.k==='cripta')assert.ok(!chega(c.x,c.y),s.nome+' trancada');else assert.ok(chega(c.x,c.y),s.nome);}
 for(const a of g.armadilhas)assert.ok(chega(a.x,a.y),'armadilha '+a.x+','+a.y);
 for(const m of g.monstros.filter(m=>!m.jaula&&!['arsenal','cripta'].includes(SALAS[m.sala-1]?.k)))assert.ok(chega(m.x,m.y),'monstro '+m.id);
 const chega2=alcance(true);for(const s of SALAS){const c=ponto(s);assert.ok(chega2(c.x,c.y),s.nome+' com as portas abertas');}
 for(const j of g.jaulas)assert.ok(!chega2(j.x,j.y),'cela fechada não se alcança');
 const chega3=alcance(true,abrirJaula(abrirJaula(cena.objects,'j1'),'j2'));for(const j of g.jaulas)assert.ok(chega3(j.x,j.y),'cela aberta se alcança');
 const saida=ESCADAS.find(e=>e.nome==='Escada de saída');assert.ok(chega(saida.x*Q-Q,saida.y*Q),'corredor da saída');
});
test('v189: regras que não mudaram (armadilha, salto, reconstrução, Kael, miniaturas) e instalação',()=>{
 assert.equal(resolverArmadilha('estacas',50,20).evitou,true);assert.equal(resolverArmadilha('laminas',50,45).chance,40);assert.equal(resolverArmadilha('estacas',50,99).fator,2);
 const quebrada={id:'w',destrutivel:true,pvMax:24,pvAtual:0,destruido:true,bloqueiaMovimento:false,bloqueiosOriginais:{movimento:true,visao:true}};assert.equal(reconstruir(quebrada,'Sucesso').object.pvAtual,12);
 const itens=ITENS_KAEL.map(([,id])=>({id,nome:id,pv:5}));assert.equal(completarKael({inventario:{equipado:[],bolso:[],mochila:[]}},itens,it=>({...it,idBanco:it.id})).adicionados.length,ITENS_KAEL.length);
 assert.ok(ehMiniatura(miniaturaDe({id:'zumbi_1'})));assert.equal(modeloDe([{id:'vampiro_psiquico'}],JAULAS[1].monstro).id,'vampiro_psiquico');
 const mod=ler('js/mesa-masmorra.js');
 assert.match(mod,/if\(o\.emperradaV189\)\{/);assert.match(mod,/\['força bruta','forca bruta'\],\['mecanismos'\]/);
 assert.match(mod,/if\(campo\(o,'reveladaV184'\)&&t\.donoUid\)\{let atl=0;/);assert.match(mod,/salta por cima da/);
 assert.match(mod,/Number\(f\.data\(\)\?\.versao\|\|0\)<195/);assert.doesNotMatch(mod,/versao:1[89]0/);
 assert.match(lerApp(),/import\('\.\/mesa-masmorra\.js\?v=\d+'\)\.then\(m=>\{window\.mesaMasmorraMod=m\.instalarMasmorra\(/);
 assert.match(ler('js/mesa-controle.js'),/#maCamada button/);
});
