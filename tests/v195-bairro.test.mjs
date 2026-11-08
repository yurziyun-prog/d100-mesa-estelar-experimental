import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {acharMapas,ligacoesBairro,estadoBairro,ENTRADAS,TAMANHO_BAIRRO,instalarBairro,ID_CIDADE} from '../js/mesa-bairro.js';
import {ligarSoltos} from '../js/mesa-estrutura.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const MAPAS=[{id:'cenario_c001',nome:'Portão de Véspera'},{id:'cenario_c002',nome:'Cidade Baixa de Véspera',larguraM:73.3,alturaM:53.65},{id:'v145_escadaria_alta',nome:'Escadaria da Cidade Alta'},{id:'v145_praca_cidade_alta',nome:'Praça da Cidade Superior'},{id:'x',nome:'Cidade Baixa · imagem IA'},{id:'porto',nome:'Espaço-porto'}];

test('v195 bairro: acha os três mapas pelo nome e não confunde com a imagem IA nem o Porto',()=>{
 const m=acharMapas(MAPAS);assert.equal(m.cidade.id,'cenario_c002');assert.equal(m.portao.id,'cenario_c001');assert.equal(m.escadaria.id,'v145_escadaria_alta');
 assert.equal(acharMapas([{id:'a',nome:'Outro'}]).cidade,null);
});
test('v195 bairro: estado vazio, pequeno, sem imagem nem grade',()=>{
 const e=estadoBairro();assert.deepEqual([e.w,e.h],[40,26]);assert.equal(e.elements.length,0);assert.equal(e.showGrid,false);assert.ok(!e.imagemV163&&!e.bgImage);assert.ok(e.w<73.3&&e.h<53.65);
});
test('v195 bairro: só duas ligações — Portão↔Cidade e Cidade↔Escadaria; o resto da Cidade Baixa é desfeito, o que não toca nela fica',()=>{
 const ligs=[{id:'1',a:{mapa:'cenario_c001',x:14,y:2},b:{mapa:'cenario_c002',x:3,y:3}},{id:'2',a:{mapa:'cenario_c002',x:9,y:9},b:{mapa:'v145_escadaria_alta',x:5,y:12}},
  {id:'3',a:{mapa:'cenario_c002',x:1,y:1},b:{mapa:'porto',x:1,y:1}},{id:'4',a:{mapa:'v145_praca_cidade_alta',x:1,y:1},b:{mapa:'v145_escadaria_alta',x:2,y:2}},{id:'5',a:{mapa:'cenario_c002',x:2,y:2},b:{mapa:'casa',x:2,y:2}}];
 const r=ligacoesBairro({ligs,idCidade:'cenario_c002',idPortao:'cenario_c001',idEscadaria:'v145_escadaria_alta'});
 const toca=r.ligs.filter(l=>l.a.mapa==='cenario_c002'||l.b.mapa==='cenario_c002');
 assert.equal(toca.length,2);assert.equal(r.removidas.length,4);assert.ok(r.ligs.some(l=>l.id==='4'),'ligação que não toca a Cidade Baixa continua');
 const p=toca.find(l=>l.id==='lig_v195_bairro_portao'),e=toca.find(l=>l.id==='lig_v195_bairro_escadaria'),en=ENTRADAS(40,26);
 assert.deepEqual([p.a.mapa,p.b.mapa],['cenario_c001','cenario_c002']);assert.deepEqual({x:p.a.x,y:p.a.y},{x:14,y:2},'a porta no portão fica onde já estava');assert.deepEqual({x:p.b.x,y:p.b.y},en.portao);
 assert.deepEqual([e.a.mapa,e.b.mapa],['cenario_c002','v145_escadaria_alta']);assert.deepEqual({x:e.b.x,y:e.b.y},{x:5,y:12});
 for(const q of [en.portao,en.escadaria]){assert.ok(q.x>0&&q.x<28&&q.y>0&&q.y<14);}
 assert.ok(en.portao.x<en.escadaria.x&&en.portao.y>en.escadaria.y,'portão embaixo à esquerda, escadaria em cima à direita');
 // refazer não duplica
 const de=ligacoesBairro({ligs:r.ligs,idCidade:'cenario_c002',idPortao:'cenario_c001',idEscadaria:'v145_escadaria_alta'});assert.equal(de.ligs.filter(l=>l.a.mapa==='cenario_c002'||l.b.mapa==='cenario_c002').length,2);
});
test('v195 bairro: a estrutura automática não religa mapas soltos quando o mestre cuida das ligações',()=>{
 const src=ler('js/mesa-estrutura.js');assert.match(src,/manualV195\?\[\]:ligarSoltos/);assert.match(src,/!x\.bairroV195&&re\.test/);
 assert.ok(Array.isArray(ligarSoltos([{id:'a',nome:'A'},{id:'b',nome:'B'}],[])));
});
test('v195 bairro: executar de ponta a ponta com banco simulado — backup, mapa novo sem imagem, ligações e confirmação',async()=>{
 const banco={'mapas/cenario_c002':{id:'cenario_c002',nome:'Cidade Baixa de Véspera',imagemV163:{src:'x'},cidadeBaixaV164:true,larguraM:73.3},'combatesAtivos/mesaLigacoes':{ligacoes:[{id:'1',a:{mapa:'cenario_c001',x:14,y:2},b:{mapa:'cenario_c002',x:3,y:3}},{id:'2',a:{mapa:'cenario_c002',x:9,y:9},b:{mapa:'v145_escadaria_alta',x:5,y:12}},{id:'3',a:{mapa:'cenario_c002',x:1,y:1},b:{mapa:'porto',x:1,y:1}}]},'combatesAtivos/mapaMesaSyncCena_cenario_c002':{objects:[{id:'casa'}]}};
 let salvo=null,perguntou=null;const avisos=[];
 const win={confirm:t=>{perguntou=t;return true;},alert:()=>{},mesaMapasV110_:{salvar:async o=>{salvo=o;return {id:o.id,comCena:true};}},location:{href:'http://x/'}};
 const root={defaultView:win,body:{append:n=>avisos.push(n.textContent)},createElement:()=>({style:{},remove(){},set textContent(v){this._t=v;},get textContent(){return this._t;}})};
 const mapas=JSON.parse(JSON.stringify(MAPAS));
 const dep={root,db:'db',doc:(d,p)=>p,setDoc:async(p,v,o)=>{banco[p]=o?.merge?{...(banco[p]||{}),...v}:v;},getDoc:async p=>({exists:()=>!!banco[p],data:()=>banco[p]}),runTransaction:async(d,fn)=>fn({get:async()=>({exists:()=>false}),set(){}}),ehMestre:()=>true,mapas:()=>mapas,controller:()=>({todosTokens:()=>[],mapaAtual:()=>'x',refreshView(){},openMap:async()=>{}})};
 const api=instalarBairro(dep);const r=await api.preparar();
 assert.equal(r.ok,true,JSON.stringify(r));assert.match(perguntou,/Portão de Véspera/);assert.match(perguntou,/Escadaria da Cidade Alta/);assert.match(perguntou,/cópia de segurança/);
 assert.equal(salvo.id,ID_CIDADE);assert.equal(salvo.state.w,40);assert.equal(salvo.state.elements.length,0);assert.equal(salvo.cenaDe('cenario_c002').objects.length,0);
 assert.equal(banco['mapas/cenario_c002'].imagemV163,null);assert.equal(banco['mapas/cenario_c002'].cidadeBaixaV164,false);assert.equal(banco['mapas/cenario_c002'].larguraM,40);assert.ok(banco['mapas/cenario_c002'].bairroV195);
 const ligs=banco['combatesAtivos/mesaLigacoes'].ligacoes;assert.equal(ligs.length,2);assert.ok(banco['combatesAtivos/mesaLigacoes'].bairroV195);
 for(const k of ['mapa','cena','ligacoes'])assert.ok(banco['combatesAtivos/backupBairro_'+k+'_v195'],'backup '+k);
 assert.equal(banco['combatesAtivos/backupBairro_cena_v195'].dados.objects.length,1,'a cena antiga ficou guardada');
 assert.equal(mapas.find(m=>m.id==='cenario_c002').bairroV195.W,40,'lista local atualizada (a estrutura automática vê a marca)');
});
test('v195 bairro: sem os três mapas não muda nada; cancelar não muda nada',async()=>{
 const gravou=[];const win={confirm:()=>false,mesaMapasV110_:{salvar:async()=>{gravou.push('salvar');}}};
 const root={defaultView:win,body:{append(){}},createElement:()=>({style:{},remove(){}})};
 const dep={root,db:'d',doc:(d,p)=>p,setDoc:async()=>{gravou.push('set');},getDoc:async()=>({exists:()=>false}),runTransaction:async()=>{},ehMestre:()=>true,mapas:()=>[{id:'cenario_c002',nome:'Cidade Baixa'}],controller:()=>null};
 let r=await instalarBairro(dep).preparar();assert.equal(r.ok,false);assert.deepEqual(r.falta,['Portão de Véspera','Escadaria da Cidade Alta']);assert.deepEqual(gravou,[]);
 const dep2={...dep,mapas:()=>MAPAS};r=await instalarBairro(dep2).preparar();assert.equal(r.motivo,'cancelado');assert.deepEqual(gravou,[]);
 const dep3={...dep2,ehMestre:()=>false};assert.equal((await instalarBairro(dep3).preparar()).ok,false);
});
test('v195 construtor: miniatura própria, do tamanho dos outros, aba própria',()=>{
 const o=ler('js/mesa-oficina3.js');assert.match(o,/const a=cons\.avatar,d=1(?:\.25)?;/);assert.match(o,/diametroM:1,camada:3/);assert.match(o,/SPEC_CONSTRUTOR=\{corpo:'humanoide',porte:1,[^}]*cabeca:'capacete'[^}]*mochila:true/);assert.match(o,/renderizarMiniatura\(SPEC_CONSTRUTOR\)/);assert.match(o,/export const NOME_CONSTRUTOR='Brunel Obras'/);
 const v=ler('js/mesa-vespera.js');assert.match(v,/searchParams\.set\('construtor','1'\)/);assert.match(v,/function abaConstrutor\(\)/);assert.match(v,/Começar o bairro/);
});

test('v196 bairro: roda SOZINHO uma vez para o mestre (sem confirmação), não repete, e a cópia de segurança original nunca é sobrescrita',async()=>{
 const banco={'mapas/cenario_c002':{id:'cenario_c002',nome:'Cidade Baixa de Véspera',imagemV163:{src:'x'},larguraM:73.3},'combatesAtivos/mesaLigacoes':{ligacoes:[{id:'1',a:{mapa:'cenario_c001',x:14,y:2},b:{mapa:'cenario_c002',x:3,y:3}}]},'combatesAtivos/mapaMesaSyncCena_cenario_c002':{objects:[{id:'casa'}]}};
 let salvos=0,perguntou=0;const win={confirm:()=>{perguntou++;return true;},alert(){},mesaMapasV110_:{salvar:async o=>{salvos++;return {id:o.id,comCena:true};}},location:{href:'http://x/'}};
 const root={defaultView:win,body:{append(){}},createElement:()=>({style:{},remove(){},set textContent(v){},get textContent(){return '';}})};
 const dep={root,db:'db',doc:(d,p)=>p,setDoc:async(p,v,o)=>{banco[p]=o?.merge?{...(banco[p]||{}),...v}:v;},getDoc:async p=>({exists:()=>!!banco[p],data:()=>banco[p]}),runTransaction:async()=>{},ehMestre:()=>true,mapas:()=>JSON.parse(JSON.stringify(MAPAS)),controller:()=>({todosTokens:()=>[],mapaAtual:()=>'x',refreshView(){},openMap:async()=>{}})};
 const api=instalarBairro(dep);try{
  await api.automatico();
  assert.equal(salvos,1,'refez o mapa');assert.equal(perguntou,0,'sem janela de confirmação');assert.equal(banco['mapas/cenario_c002'].larguraM,40);assert.equal(banco['configuracoes/bairroV196'].ok,true);
  assert.equal(banco['combatesAtivos/mesaLigacoes'].ligacoes.length,2);
  const bk=JSON.stringify(banco['combatesAtivos/backupBairro_mapa_v195']);assert.match(bk,/73\.3/,'backup guarda o mapa original');
  await api.automatico();assert.equal(salvos,1,'não repete');
  banco['mapas/cenario_c002']={...banco['mapas/cenario_c002'],larguraM:99};await api.preparar({confirmar:false});
  assert.equal(JSON.stringify(banco['combatesAtivos/backupBairro_mapa_v195']),bk,'cópia original intacta numa segunda execução');
 }finally{api.parar();}
});
test('v196 bairro: jogador não dispara a mudança',async()=>{
 const gravou=[];const win={mesaMapasV110_:{salvar:async()=>gravou.push('s')},confirm:()=>true,location:{href:'http://x/'}};const root={defaultView:win,body:{append(){}},createElement:()=>({style:{},remove(){}})};
 const api=instalarBairro({root,db:'d',doc:(d,p)=>p,setDoc:async()=>gravou.push('set'),getDoc:async()=>({exists:()=>false}),runTransaction:async()=>{},ehMestre:()=>false,mapas:()=>MAPAS,controller:()=>({todosTokens:()=>[]})});
 try{await api.automatico();assert.deepEqual(gravou,[]);}finally{api.parar();}
});
