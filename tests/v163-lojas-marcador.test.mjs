import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {itensDoRamo,estoqueDaLoja,lojaDoToken,lojaPadrao,idLoja,tokenDaLoja,RAMOS} from '../js/mesa-lojas.js';
import {elementosDeMarcas,gradeDeMarcas,retangulosDaGrade,contem,bitsParaTexto,ETIQUETAS} from '../js/mesa-marcas.js';
import {PORTAO_IA,gerarPortaoIA,portaoNIA} from '../js/mesa-mapa-ia.js';
import {inundar,celulasDeMascara} from '../js/mesa-marcador.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const ITENS=[{id:'agua_potavel',nome:'Água Potável',categoria:'Alimentos e Bebidas',preco:1},{id:'racao_viagem',nome:'Ração de Viagem',categoria:'Alimentos e Bebidas',preco:5},
 {id:'bolsa_agua',nome:'Bolsa de Água',categoria:'Comida',preco:8},{id:'pistola_laser',nome:'Pistola Laser',categoria:'Armas',preco:500,nivelAcesso:'Restrito'},{id:'rifle_laser',nome:'Rifle Laser',categoria:'Armas',preco:1200,nivelAcesso:'Militar'},
 {id:'comlink',nome:'Comlink',categoria:'Comunicação',preco:100},{id:'capacete_blast',nome:'Capacete Blast',categoria:'Armaduras',preco:250},{id:'capa_viajante',nome:'Capa de Viajante',categoria:'Roupas',preco:40},
 {id:'cartucho_9mm',nome:'Cartuchos 9 mm',categoria:'Munição',preco:20,disponivelCampanha:'false'},{id:'drone1',nome:'drone1',categoria:'Diversos',preco:0}];
test('v163 lojas: ramos puxam os itens certos (água, comida, armas sem militar, sem indisponíveis)',()=>{
 const ids=r=>itensDoRamo(r,ITENS).map(i=>i.id);
 assert.deepEqual(ids('agua'),['agua_potavel','bolsa_agua']);assert.deepEqual(ids('comida'),['racao_viagem']);
 assert.deepEqual(ids('armas'),['pistola_laser']); // comunicação não é munição; militar e indisponível ficam fora
 assert.ok(ids('mantimentos').includes('capa_viajante')&&!ids('mantimentos').includes('capacete_blast'));
 assert.deepEqual(estoqueDaLoja({ramos:['armas'],militares:true,incluir:['comlink'],excluir:['pistola_laser']},ITENS).sort(),['comlink','rifle_laser']);
});
test('v163 lojas: padrão por loja do portão, caravana e rodízio (comida e água primeiro); o mestre manda',()=>{
 assert.deepEqual(lojaDoToken('syncnpc:comerciante_generico_insetoide~5',{lojaV161:'agua'}).ramos,['agua','comida']);
 assert.deepEqual(lojaDoToken('syncnpc:comerciante_generico_humano~9',{caravanaV160:'oeste'}).ramos,['mantimentos']);
 assert.deepEqual(lojaPadrao('syncnpc:comerciante_generico_robo~1',{}).ramos,['comida']);assert.deepEqual(lojaPadrao('syncnpc:comerciante_generico_robo~2',{}).ramos,['agua']);
 assert.equal(lojaDoToken('syncnpc:ur17',{}),null);
 assert.deepEqual(lojaDoToken('syncnpc:comerciante_generico_robo~1',{lojaV161:'agua',loja:{ramos:['pecas']}}).ramos,['pecas']);
 assert.equal(tokenDaLoja(idLoja('syncnpc%3Acomerciante_generico_robo~3')),'syncnpc:comerciante_generico_robo~3');
 assert.ok(Object.keys(RAMOS).length>=10);
});
test('v163 integração: loja por token, Denzel abre o pedágio (não a loja) e avisa quando o mestre não responde',()=>{
 const i=ler('js/mesa-interacoes.js');assert.match(i,/mesaLojasV163\?\.paraToken/);assert.match(i,/mesaPedagio\?\.ehDenzel/);
 const a=ler('js/app/23-radio-ficha-naves.js');assert.match(a,/mesaLojasV163\?\.porId/);
 const p=ler('js/mesa-pedagio.js');assert.match(p,/Esperando o mestre/);assert.match(p,/Ver o que o Denzel vende/);assert.match(p,/ehDenzel\}/);
 const m=ler('js/app/22-mesa-e-modulos.js');assert.match(m,/mesa-lojas\.js/);assert.match(m,/mesa-marcador\.js/);
 assert.match(ler('js/mesa-barras.js'),/'ljBotao','mkBotao'/);assert.match(ler('js/mesa-vida.js'),/Denzel fica no portão/);
});
test('v163 marcas: paredes viram retângulos invisíveis, porta abre, por cima vira uma imagem só, teto abre',()=>{
 const M=[{id:'a',tipo:'parede',forma:'ret',x:1,y:1,w:4,h:3},{id:'b',tipo:'porta',forma:'ret',x:2.5,y:3.5,w:1,h:.6},{id:'c',tipo:'planta',forma:'ret',x:6,y:1,w:1,h:1},{id:'d',tipo:'teto',forma:'poli',pts:[[8,1],[10,1],[10,3],[8,3]]},{id:'e',tipo:'agua',forma:'ret',x:0,y:6,w:2,h:1}];
 const g=gradeDeMarcas(M,{W:12,H:8,tipos:['parede']});const rs=retangulosDaGrade(g);
 assert.ok(rs.length>=2);const area=rs.reduce((s,r)=>s+r.w*r.h,0);assert.ok(Math.abs(area-(12-1*.25))<.6,'porta tira um pedaço da parede: '+area);
 const els=elementosDeMarcas(M,{W:12,H:8,acimaSrc:'x.webp',tetos:{d:{src:'t.webp'}}});
 assert.ok(els.filter(e=>e.invisivelV161&&e.bloqueiaVisao).length>=2);assert.ok(els.some(e=>e.invisivelV161&&e.bloqueiaMovimento&&!e.bloqueiaVisao),'água bloqueia só o andar');
 assert.equal(els.filter(e=>e.acimaV163).length,1);assert.ok(els.some(e=>e.tetoV139&&/^Telhado · /.test(e.nome)));assert.ok(els.every(e=>e.marcaV163));
 assert.ok(contem(M[3],9,2)&&!contem(M[3],11,2));assert.ok(Object.keys(ETIQUETAS).length>=10);
});
test('v163 varinha: pega a área de cor parecida, com alcance; células compactas',()=>{
 const w=20,h=10,px=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4,dentro=x<8;px[k]=dentro?200:20;px[k+1]=dentro?60:20;px[k+2]=20;px[k+3]=255;}
 const m=inundar(px,w,h,2,2,30);let n=0;for(const v of m)n+=v;assert.equal(n,80);
 const lim=inundar(px,w,h,2,2,30,2);let n2=0;for(const v of lim)n2+=v;assert.ok(n2<20);
 const c=celulasDeMascara(m,w,h,8,.25);assert.equal(c.w,4);assert.equal(c.h,5);assert.equal(c.bits,bitsParaTexto(new Array(20).fill(1)));
});
test('v163 mapa da imagem IA: arte no lugar, primeiro reconhecimento, portão, Denzel e 7 vendedores',()=>{
 assert.ok(existsSync(new URL('../'+PORTAO_IA.arte,import.meta.url))&&existsSync(new URL('../'+PORTAO_IA.acima,import.meta.url)));
 const st=gerarPortaoIA();assert.equal(st.w,32);assert.equal(st.h,48);assert.ok(st.elements[0].fundoV161);
 assert.ok(st.elements.filter(e=>e.invisivelV161).length>20);assert.equal(st.elements.filter(e=>e.acimaV163).length,1);
 const pn=portaoNIA();assert.ok(pn.dentro.y<pn.y&&pn.fora.y>pn.y);assert.equal(PORTAO_IA.vendedores.length,7);
 assert.ok(PORTAO_IA.vendedores.some(v=>v.loja.ramos.includes('agua'))&&PORTAO_IA.vendedores.some(v=>v.loja.ramos.includes('comida')));
 const r=ler('js/mesa-remodelagem.js');assert.match(r,/portaoIAV163/);assert.match(r,/Comida da travessia/);assert.doesNotMatch(r.slice(r.indexOf('async function montar163'),r.indexOf('async function montar164')),/portaoV138:true/);
});
