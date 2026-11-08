import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {pontoDoPoco,ligacoesQuebradas,componentes,mapasSoltos,ligarSoltos,ligacoesMasmorra,pontoLivre,dentroDoMapa,auditar,ID_MASMORRA,PONTOS_MASMORRA,melhorVizinho} from '../js/mesa-estrutura.js';
import {efeitoDoItem,usosRestantes,gastarUso,itensUsaveis,curar,parteMaisFerida,melhorarFadiga,aplicarEfeito,protegidoContra,ESPERA_MS} from '../js/mesa-uso-itens.js';
import {ehMontaria,tipoDeVeiculo,candidatos,ocupadosPor,embarcar,posicaoConduzida,velocidadeDe,moveu,pontoAtras,VELOCIDADE} from '../js/mesa-transporte.js';
import {gerarMasmorra,ENTRADA,W,H,Q} from '../js/mesa-masmorra.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const mapa=id=>({id,nome:id,larguraM:28,alturaM:14});

// ---------------------------------------------------------------- estrutura dos mapas
test('v190: ligações quebradas (mapa que não existe, para si mesmo, ponto inválido) são achadas',()=>{
 const mapas=[mapa('a'),mapa('b')];
 const ok={id:'l1',a:{mapa:'a',x:1,y:1},b:{mapa:'b',x:2,y:2}};
 const ruins=[{id:'l2',a:{mapa:'a',x:1,y:1},b:{mapa:'zzz',x:2,y:2}},{id:'l3',a:{mapa:'a',x:1,y:1},b:{mapa:'a',x:2,y:2}},{id:'l4',a:{mapa:'a',x:'x',y:1},b:{mapa:'b',x:2,y:2}},{id:'l5',a:{x:1,y:1},b:{mapa:'b',x:2,y:2}}];
 assert.deepEqual(ligacoesQuebradas(mapas,[ok,...ruins]).map(l=>l.id).sort(),['l2','l3','l4','l5']);assert.deepEqual(ligacoesQuebradas(mapas,[ok]),[]);
});
test('v190: mapas soltos são ligados ao grupo principal até tudo ficar conexo (qualquer quantidade, qualquer ordem)',()=>{
 const mapas=['a','b','c','d','e','f'].map(mapa);
 const ligs=[{id:'x',a:{mapa:'a',x:1,y:1},b:{mapa:'b',x:2,y:2}}];
 assert.equal(componentes(mapas,ligs).length,5);assert.deepEqual(mapasSoltos(mapas,ligs).sort(),['c','d','e','f']);
 const novas=ligarSoltos(mapas,ligs);assert.equal(novas.length,4);
 assert.equal(componentes(mapas,[...ligs,...novas]).length,1,'grupo único');
 for(const l of novas){assert.ok(l.autoV190&&l.auto);for(const k of ['a','b']){assert.ok(l[k].x>0&&l[k].x<28&&l[k].y>0&&l[k].y<14);}assert.notEqual(l.a.mapa,l.b.mapa);}
 assert.deepEqual(ligarSoltos(mapas,[...ligs,...novas]),[],'idempotente: segunda vez não liga nada');
 assert.deepEqual(ligarSoltos([mapa('so')],[]),[]);assert.deepEqual(ligarSoltos([],[]),[]);
 const rascunho=[...mapas,{id:'__mesa_live__x',nome:'oculto'},{id:'r',hiddenMesaLive:true}];assert.equal(ligarSoltos(rascunho,[...ligs,...novas]).length,0,'mapas ocultos/rascunho não entram');
 assert.equal(melhorVizinho({nome:'Ruas Escavadas de Véspera'},[mapa('x'),{id:'p',nome:'Portão de Véspera'}]).id,'p','prefere o de nome parecido');
});
test('v190: a masmorra é ligada às Ruas Escavadas (entrada) e à superfície (saída); nada duplica',()=>{
 const mapas=[mapa('cenario_c002'),{id:'cenario_c001',nome:'Portão de Véspera'},{id:'v138_espacoporto',nome:'Espaço-porto de Véspera'},mapa(ID_MASMORRA)];
 mapas[0].nome='Ruas Escavadas de Véspera';
 const novas=ligacoesMasmorra(mapas,[]);assert.equal(novas.length,2);
 const ent=novas.find(l=>l.id==='lig_v190_masmorra_entrada'),sai=novas.find(l=>l.id==='lig_v190_masmorra_saida');
 assert.equal(ent.a.mapa,'cenario_c002');assert.equal(ent.b.mapa,ID_MASMORRA);assert.deepEqual({x:ent.b.x,y:ent.b.y},PONTOS_MASMORRA.entrada);
 assert.equal(sai.a.mapa,ID_MASMORRA);assert.equal(sai.b.mapa,'v138_espacoporto');assert.deepEqual({x:sai.a.x,y:sai.a.y},PONTOS_MASMORRA.saida);
 assert.deepEqual(ligacoesMasmorra(mapas,novas),[],'já ligada: nada novo');
 assert.deepEqual(ligacoesMasmorra(mapas.filter(m=>m.id!==ID_MASMORRA),[]),[],'sem masmorra, nada a ligar');
 assert.equal(componentes(mapas,novas).length,2,'masmorra e Ruas+Porto formam o grupo; Portão ainda solto até ligarSoltos');
 const todas=[...novas,...ligarSoltos(mapas,novas)];assert.equal(componentes(mapas,todas).length,1);
});
test('v190: a masmorra se liga à Cidade Sem Nome por um poço (beira do poço da Sala do poço ↔ poço da cidade)',()=>{
 const mapas=[{id:'c_snome',nome:'Cidade Sem Nome'},mapa(ID_MASMORRA),{id:'cenario_c002',nome:'Ruas Escavadas'}];
 const novas=ligacoesMasmorra(mapas,[]);const poco=novas.find(l=>l.id==='lig_v190_masmorra_poco');assert.ok(poco);assert.equal(poco.a.mapa,ID_MASMORRA);assert.equal(poco.b.mapa,'c_snome');assert.equal(poco.rotulo,'Poço');assert.ok(poco.pocoV190);
 const g=gerarMasmorra({objetos:[]}),px=poco.a.x*W/28,py=poco.a.y*H/14;assert.ok(g.andavel(px,py),'ponto no chão da planta');assert.equal(g.em(px,py).tipo,'sala');
 const sala=gerarMasmorra({objetos:[]}).salas.find(s=>s.nome==='Sala do poço');assert.ok(Math.abs(px-sala.x)<3&&Math.abs(py-sala.y)<3.5,'perto do poço');
 assert.deepEqual(ligacoesMasmorra(mapas,novas).map(l=>l.id),[],'não duplica');
 assert.deepEqual(ligacoesMasmorra([mapa(ID_MASMORRA),{id:'x',nome:'Cidade Baixa'}],[]).filter(l=>l.pocoV190),[],'só a Cidade Sem Nome');
 // poço da cidade: objeto de poço na cena; sem ele, o padrão
 assert.deepEqual(pontoDoPoco({objects:[]},mapa('c'),{x:14,y:7}),{x:14,y:7});
 const p=pontoDoPoco({objects:[{nome:'Poço antigo',x:5,y:4,larguraM:1.6,alturaM:1.6}]},mapa('c'),{x:14,y:7});assert.ok(Math.hypot(p.x-5,p.y-4)<3&&Math.hypot(p.x-5,p.y-4)>.5,'ao lado do poço');
});
test('v190: pontos de saída da masmorra caem no corredor da planta (não dentro de parede), e pontoLivre tira ponta de dentro de objeto',()=>{
 const g=gerarMasmorra({objetos:[]});
 for(const k of ['entrada','saida','poco']){const p=PONTOS_MASMORRA[k];assert.ok(g.andavel(p.x*W/28,p.y*H/14),'saída '+k+' em chão da planta');}
 assert.ok(Math.hypot(PONTOS_MASMORRA.entrada.x*W/28-9.5*Q,PONTOS_MASMORRA.entrada.y*H/14-3*Q)<2.5,'chegada de outros mapas perto do pé da escada');
 const cena={objects:[{x:10,y:7,larguraM:4,alturaM:4,bloqueiaMovimento:true,camada:3}]};
 const p=pontoLivre({x:10,y:7},cena,{larguraM:28,alturaM:14});assert.ok(Math.abs(p.x-10)>1||Math.abs(p.y-7)>1,'saiu de dentro do objeto');
 assert.deepEqual(pontoLivre({x:3,y:3},cena,{larguraM:28,alturaM:14}),{x:3,y:3},'ponto livre fica onde está');
 assert.deepEqual(dentroDoMapa({x:-5,y:99}),{x:.6,y:13.4});
 const r=auditar([mapa('a'),mapa('b')],[]);assert.equal(r.componentes,2);assert.deepEqual(r.soltos,['b']);
});

// ---------------------------------------------------------------- itens com efeito
const ferido=()=>({combateLab:{hitMax:{Peito:10,Cabeça:6,'Braço':4},hit:{Peito:10,Cabeça:6,'Braço':1},ferimentos:{'Braço':'Grave'},sangrando:true}});
test('v190: cada item do Banco com efeito é reconhecido (cura, antídoto, estanque, fadiga, proteção, luz) e o resto não',()=>{
 const casos={nanogel:'cura',kit_medico:'cura',kit_medico_avancado:'cura',kit_primeiros_socorros:'cura',antidoto_universal:'antidoto',espuma_selante:'estanque',respirador:'protecao',reserva_oxigenio:'protecao',lanterna:'luz',holofote_portatil:'luz',cafe:'fadiga',agua_potavel:'fadiga',racao_viagem:'fadiga',refeicao_comum:'fadiga',cerveja:'fadiga',racao_7_dias:'fadiga'};
 for(const [id,t] of Object.entries(casos))assert.equal(efeitoDoItem({id,nome:id.replace(/_/g,' ')})?.tipo,t,id);
 for(const id of ['espada_longa','pistola_laser','armadura_leve','cartucho_9mm','bateria','drone_reconhecimento','comlink'])assert.equal(efeitoDoItem({id,nome:id.replace(/_/g,' ')}),null,id);
 assert.equal(efeitoDoItem({nome:'Kit Médico Avançado'}).pontos,4);assert.equal(efeitoDoItem({nome:'Kit Médico Básico'}).pontos,2);assert.equal(efeitoDoItem(null),null);
});
test('v190: usos: kits gastam um por vez e somem ao acabar; nanogel é de uso único; lanterna não gasta',()=>{
 const kit={id:'kit_medico',nome:'Kit Médico Básico',uso:'3'};const ef=efeitoDoItem(kit);assert.equal(usosRestantes(kit,ef),3);
 let k=gastarUso(kit,ef);assert.equal(k.usosRestantes,2);k=gastarUso(k,ef);k=gastarUso(k,ef);assert.equal(k,null);
 const ng={id:'nanogel',nome:'Nanogel Regenerativo',uso:'1'};assert.equal(gastarUso(ng),null);
 const l={id:'lanterna',nome:'Lanterna',uso:'24'};assert.equal(gastarUso(l),l);assert.equal(usosRestantes(l),Infinity);
 const comida={id:'refeicao_comum',nome:'Refeição Comum'};assert.equal(gastarUso(comida),null);
 const inv={equipado:[{id:'espada_longa',nome:'Espada'},null],bolso:[kit],mochila:[ng,{id:'cartucho_9mm',nome:'Cartuchos 9 mm',uso:'20'},{...kit,usosRestantes:0}]};
 assert.deepEqual(itensUsaveis(inv).map(u=>u.comp+':'+u.index),['bolso:0','mochila:0']);
});
test('v190: curar devolve PV à parte mais ferida, sem passar do máximo, e fecha a ferida',()=>{
 const a=ferido();assert.equal(parteMaisFerida(a.combateLab),'Braço');
 const r=curar(a.combateLab,2);assert.equal(r.local,'Braço');assert.equal(r.ganho,2);assert.equal(r.combateLab.hit['Braço'],3);assert.equal(r.combateLab.ferimentos['Braço'],undefined,'com PV acima de zero a ferida aberta fecha');
 const fundo=curar({hitMax:{Peito:10},hit:{Peito:-3},ferimentos:{Peito:'Grave'}},2);assert.equal(fundo.combateLab.hit.Peito,-1);assert.equal(fundo.combateLab.ferimentos.Peito,'Grave','ainda negativo: continua ferido');
 const cheio=curar({hitMax:{Peito:10},hit:{Peito:10}},5);assert.equal(cheio.ganho,0);assert.equal(curar(ferido().combateLab,99).combateLab.hit['Braço'],4,'nunca passa do máximo');
});
test('v190: efeitos aplicados: cura+estanque, antídoto, espuma, fadiga com espera, proteção por tempo, luz liga e desliga',()=>{
 const agora=1_000_000;
 let r=aplicarEfeito({ef:efeitoDoItem({nome:'Kit Médico Básico'}),ator:ferido(),agora,nome:'Kael'});assert.ok(r.ok);assert.equal(r.ator.combateLab.hit['Braço'],3);assert.equal(r.ator.combateLab.sangrando,false);assert.match(r.msg,/Kael usa Kit Médico Básico: \+2 PV em Braço · estancou o sangramento/);
 assert.equal(aplicarEfeito({ef:efeitoDoItem({nome:'Nanogel'}),ator:{combateLab:{hitMax:{Peito:10},hit:{Peito:10}}}}).ok,false,'sem ferida: não gasta');
 const veneno={combateLab:{hitMax:{Peito:10},hit:{Peito:10},envenenado:true,atordoado:true},psiEffects:{atordoado:{until:9}}};
 r=aplicarEfeito({ef:efeitoDoItem({nome:'Antídoto Universal'}),ator:veneno,agora,nome:'Kael'});assert.ok(r.ok);assert.equal(r.ator.combateLab.envenenado,false);assert.equal(r.ator.combateLab.atordoado,false);assert.equal(r.ator.psiEffects.atordoado,undefined);
 assert.equal(aplicarEfeito({ef:efeitoDoItem({nome:'Antídoto Universal'}),ator:{combateLab:{}}}).ok,false);
 r=aplicarEfeito({ef:efeitoDoItem({nome:'Espuma Selante'}),ator:ferido(),agora});assert.equal(r.ator.combateLab.sangrando,false);assert.equal(aplicarEfeito({ef:efeitoDoItem({nome:'Espuma Selante'}),ator:{combateLab:{}}}).ok,false);
 const cafe=efeitoDoItem({nome:'Café'});r=aplicarEfeito({ef:cafe,ator:{},fadiga:'Tired',agora,nome:'Kael'});assert.ok(r.ok);assert.equal(r.fadiga,'Winded');assert.match(r.msg,/Cansado → Ofegante/);
 const r2=aplicarEfeito({ef:cafe,ator:r.ator,fadiga:'Winded',agora:agora+1000});assert.equal(r2.ok,false);assert.match(r2.erro,/Já usou café/);
 assert.equal(aplicarEfeito({ef:cafe,ator:r.ator,fadiga:'Winded',agora:agora+ESPERA_MS.cafe+1}).ok,true,'depois da espera pode de novo');
 assert.equal(aplicarEfeito({ef:cafe,ator:{},fadiga:'Fresh',agora}).ok,false,'já descansado');
 assert.equal(melhorarFadiga('Fresh'),'Fresh');assert.equal(melhorarFadiga('Comatose'),'Semi-Conscious');
 r=aplicarEfeito({ef:efeitoDoItem({nome:'Respirador'}),ator:{},agora,nome:'Kael'});assert.ok(protegidoContra(r.ator,agora+1000));assert.ok(!protegidoContra(r.ator,agora+700000));assert.ok(!protegidoContra({}));
 const lan=efeitoDoItem({nome:'Lanterna'});r=aplicarEfeito({ef:lan,ator:{},agora,nome:'Kael'});assert.equal(r.ator.luzPortatilV190.ligada,true);assert.equal(r.ator.luzPortatilV190.raio,4);r=aplicarEfeito({ef:lan,ator:r.ator,agora});assert.equal(r.ator.luzPortatilV190.ligada,false);
 assert.equal(aplicarEfeito({ef:cafe,ator:{combateLab:{inconsciente:true}},fadiga:'Tired',agora}).ok,false,'inconsciente não bebe');assert.equal(aplicarEfeito({ef:cafe,ator:{combateLab:{morto:true}}}).ok,false);
 assert.equal(aplicarEfeito({ef:efeitoDoItem({nome:'Nanogel'}),ator:{combateLab:{inconsciente:true,...ferido().combateLab}},agora}).ok,true,'curar inconsciente é permitido');
});

// ---------------------------------------------------------------- montaria e veículos
test('v190: montaria só se for domesticada ou de montar; veículo terrestre e espacial pelo nome do Banco; plataforma e torre não',()=>{
 for(const m of [{id:'dragao_trombeta_corredor_domesticado',nome:'Dragão-Trombeta Corredor Domesticado'},{id:'dragao_trombeta_alado_domesticado'},{id:'cavalgante_prismatico',nome:'Cavalgante Prismático'},{id:'montariapterodatil'}])assert.ok(ehMontaria(m),m.id);
 for(const m of [{id:'dragao_trombeta_corredor_selvagem',nome:'Dragão-Trombeta Corredor Selvagem'},{id:'besta_ululante',nome:'Besta Ululante'},{id:'zumbi_1'},{id:'galinha_do_sergio'}])assert.ok(!ehMontaria(m),m.id);
 for(const n of ['Aerocarro turquesa','Carro vermelho','Cargueiro flutuante','Carroça das areias','Caminhão','Scooter'])assert.equal(tipoDeVeiculo({nome:n}),'terrestre',n);
 for(const n of ['Nave do grupo','Caça estelar','Saltador em disco','Transporte de passageiros','Cargueiro enferrujado','Nave exploradora azul'])assert.equal(tipoDeVeiculo({nome:n}),'espacial',n);
 for(const n of ['Plataforma de pouso','Torre de controle','Telhado da nave','Barril','Mesa'])assert.equal(tipoDeVeiculo({nome:n}),'',n);
 assert.ok(VELOCIDADE.espacial>VELOCIDADE.terrestre&&VELOCIDADE.terrestre>VELOCIDADE.montaria&&VELOCIDADE.montaria>1);assert.equal(velocidadeDe(null),1);assert.equal(velocidadeDe({tipo:'montaria'}),2);
});
test('v190: candidatos perto de quem controla, ocupados saem da lista, mais perto primeiro',()=>{
 const ator={id:'k',x:10,y:7,diametroM:1};
 const tokens=[{id:'synccriatura:dragao_trombeta_corredor_domesticado',x:10.8,y:7,diametroM:2.2,nome:'Dragão-Trombeta'},{id:'synccriatura:zumbi_1',x:10.3,y:7,diametroM:1,nome:'Zumbi'},{id:'synccriatura:dragao_trombeta_corredor_domesticado~2',x:25,y:7,diametroM:2.2}];
 const objetos=[{id:'o1',nome:'Aerocarro rubi',x:11.5,y:7,larguraM:2.6,alturaM:1.4},{id:'o2',nome:'Nave do grupo',x:10,y:12,larguraM:13,alturaM:18},{id:'o3',nome:'Barril',x:10.5,y:7,larguraM:1,alturaM:1}];
 const modeloDe=t=>({id:decodeURIComponent(t.id).replace('synccriatura:','').split('~')[0]});
 const c=candidatos({ator,tokens,objetos,modeloDe});assert.deepEqual(c.map(x=>x.tipo+':'+x.alvoId),['montaria:synccriatura:dragao_trombeta_corredor_domesticado','terrestre:o1','espacial:o2'].filter(x=>c.some(y=>y.tipo+':'+y.alvoId===x)));
 assert.ok(c.find(x=>x.tipo==='montaria')&&c.find(x=>x.tipo==='terrestre'));assert.ok(!c.some(x=>/zumbi|o3|~2/.test(x.alvoId)),'longe/zumbi/barril não');
 for(let i=1;i<c.length;i++)assert.ok(c[i-1].dist<=c[i].dist);
 const oc=ocupadosPor({outro:{transporteV190:{tipo:'terrestre',alvoId:'o1'}},k:{transporteV190:{tipo:'montaria',alvoId:'synccriatura:dragao_trombeta_corredor_domesticado'}}},'k');
 assert.ok(oc.has('o:o1')&&!oc.has('t:synccriatura:dragao_trombeta_corredor_domesticado'));
assert.ok(!candidatos({ator,tokens,objetos,modeloDe,ocupados:oc}).some(x=>x.alvoId==='o1'&&x.tipo!=='passageiro'),'veículo ocupado só oferece vaga de passageiro (não o volante)');
 assert.ok(candidatos({ator,tokens,objetos,modeloDe,ocupados:oc}).some(x=>x.alvoId==='o1'&&x.tipo==='passageiro'),'veículo com motorista aceita passageiro');
 assert.ok(!candidatos({ator,tokens,objetos,modeloDe,ocupados:oc,passageiros:new Map([['o1',99]])}).some(x=>x.alvoId==='o1'),'veículo lotado some da lista');
});
test('v190: o conduzido vai debaixo do condutor (veículo vira para onde ele olha); rastro fica atrás; movimento detectado',()=>{
 const p=posicaoConduzida({x:5.123456,y:3,facing:Math.PI/2},{tipo:'terrestre'});assert.equal(p.x,5.123);assert.equal(p.y,3);assert.equal(p.angulo,90);assert.equal(posicaoConduzida({x:1,y:1},{}).angulo,0);
 const tr=embarcar({tipo:'espacial',alvoId:'n1',nome:'Caça',larguraM:5},123);assert.deepEqual({t:tr.tipo,id:tr.alvoId,d:tr.desde},{t:'espacial',id:'n1',d:123});
 assert.ok(moveu({x:1,y:1},{x:1.1,y:1}));assert.ok(!moveu({x:1,y:1},{x:1.01,y:1}));assert.ok(!moveu(null,{x:1,y:1}));
 const a=pontoAtras({x:10,y:7,facing:0},1);assert.ok(a.x<10&&Math.abs(a.y-7)<1e-9);
});
test('v190: módulos instalados, velocidade do transporte entra no arrasto e no tempo real, fila de pedidos coberta pelas regras',()=>{
 const app=lerApp();
 for(const [mod,fn] of [['estrutura','instalarEstrutura'],['uso-itens','instalarUsoItens'],['transporte','instalarTransporte']])assert.match(app,new RegExp(`import\\('\\./mesa-${mod}\\.js\\?v=\\d+'\\)\\.then\\(m=>\\{window\\.[a-zA-Z]+=m\\.${fn}\\(`));
 assert.match(ler('js/nova-direta.js'),/mesaTransporteVelocidadeV190\?\.\(h\.id\)/);assert.match(ler('js/mesa-tempo-real.js'),/mesaTransporteVelocidadeV190\?\.\(t\.id\)/);
 const rules=ler('firestore.rules');assert.match(rules,/match \/combatesAtivos\/\{combateId\} \{[\s\S]*match \/acoes\/\{acaoId\}[\s\S]*request\.resource\.data\.personagemId is string/);
 for(const m of ['mesa-uso-itens','mesa-transporte'])assert.match(ler('js/'+m+'.js'),/donoUid:uid\(\),personagemId:/);
 assert.match(ler('js/mesa-uso-itens.js'),/PEDIDOS='combatesAtivos\/mesaItens\/acoes'/);assert.match(ler('js/mesa-transporte.js'),/PEDIDOS='combatesAtivos\/mesaTransporte\/acoes'/);
 assert.match(ler('js/mesa-transporte.js'),/prefers-reduced-motion/);assert.match(ler('js/mesa-uso-itens.js'),/gastarAcao/);
});
