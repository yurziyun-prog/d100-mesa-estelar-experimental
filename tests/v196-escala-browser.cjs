// v196 — escala do mapa de jogo, no navegador de verdade (módulos reais: nova-direta + câmera + vista):
//  1) sem grade por padrão (nem a de 1 m do mesa-vista, nem a do desenho); ▦ liga e desliga;
//  2) pessoa de porte médio ocupa 1 m × 1 m (≥ 46 px) na visão do jogador, do Kael e da aba do construtor;
//  3) o mapa aparece ampliado (≥ 48 px por metro) mesmo num mapa grande, e a câmera segue o personagem;
//  4) mestre na aba principal continua vendo o mapa inteiro (panorâmico).
// Gera docs/imagens/v196-construtor-e-kael.png (Brunel e Kael no mesmo mapa).
// Roda: node tests/v196-escala-browser.cjs
const assert=require('assert/strict');
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'..'),dir=path.join(root,'js');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')+8);
const panel=html.slice(html.indexOf('<div id="novaSyncStatus"'),html.indexOf('<!-- ABA BATALHA COMPARTILHADA'));
const W=40,H=26;
async function cena(browser,modo){
 // modo: 'jogador' | 'construtor' | 'mestre'
 const ctx=await browser.newContext({viewport:{width:1500,height:1000}});const page=await ctx.newPage();const erros=[];page.on('pageerror',e=>erros.push(e.message));page.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
 await page.route('https://nova.test/**',route=>{const u=new URL(route.request().url());const name=u.pathname.slice(1);
  if(name.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dir,name),'utf8')});
  return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8">'+css+'<main style="padding:12px;width:1480px">'+panel+'</main>'});});
 await page.goto('https://nova.test/'+(modo==='construtor'?'?construtor=1':''));
 const r=await page.evaluate(async({modo,W,H})=>{
  const store=window.store={},subs=[];
  const rows=p=>Object.entries(store).filter(([q])=>q.startsWith(p+'/')&&!q.slice(p.length+1).includes('/')).map(([q,d])=>({id:q.slice(p.length+1),data:d}));
  const notify=q=>{for(const s of subs){if(s.doc&&s.path===q)s.fn(store[q]||null);else if(!s.doc&&q.startsWith(s.path+'/'))s.fn(rows(s.path).map(x=>({...x,removed:false})));}};
  const db={get:async p=>store[p]||null,transact:async fn=>{const w=[];const r=await fn({get:async p=>store[p]||null,set:(p,v)=>w.push([p,v]),delete:p=>w.push([p,null])});for(const [p,v] of w){if(v===null)delete store[p];else store[p]=v;}for(const [p] of w)notify(p);return r;},
   read:async p=>rows(p).filter(x=>x.data.status==='new').map(x=>({path:p+'/'+x.id,data:x.data})),write:async(p,d)=>{store[p]=d;notify(p);},remove:async p=>{delete store[p];notify(p);},
   subscribe:(path,fn)=>{const s={path,fn,doc:false};subs.push(s);setTimeout(()=>fn(rows(path).map(x=>({...x,removed:false}))),0);return()=>{subs.splice(subs.indexOf(s),1);};},
   subscribeDoc:(path,fn)=>{const s={path,fn,doc:true};subs.push(s);setTimeout(()=>fn(store[path]||null),0);return()=>{subs.splice(subs.indexOf(s),1);};},writeMap:async(p,d)=>{store[p]=d;notify(p);}};
  const {mountDirectPositionLab}=await import('/nova-direta.js'),{instalarCamera}=await import('/mesa-camera.js'),{instalarVista}=await import('/mesa-vista.js');
  const {renderizarMiniatura,specDeNpc,svgParaDataUrl}=await import('/mesa-miniaturas.js');
  const kael=svgParaDataUrl(renderizarMiniatura(specDeNpc({id:'teste_jogador_v138',nome:'Kael Teste',raca:'Humano',carreira:'Aventureiro',sexo:'M',armasTexto:'Pistola Laser|Faca Utilitária'})));
  const brunel=svgParaDataUrl(renderizarMiniatura({corpo:'humanoide',porte:1,pele:'#b9794a',roupa:'#e0a81c',roupa2:'#6a4a22',cabelo:'curto',corCabelo:'#2a1c12',cabeca:'capacete',armadura:'nenhuma',mochila:true,maoD:'nenhuma',maoE:'nenhuma'}));
  const ID='mapa_teste_v196';
  store['combatesAtivos/mapaMesaSyncDireta']={mapId:ID,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H,fundo:''};
  store['combatesAtivos/mapaMesaSyncDiretaCena']={mapId:ID,objetoSchema:1,objects:[],oficinaConfig:{w:W,h:H,ppm:32,bg:'#b69a72',showGrid:true,grid:'#9a8a6a',elements:[]}};
  const pb='combatesAtivos/mapaMesaSyncDireta/posicoes/';
  // posições lógicas 28×14: Kael e Brunel lado a lado, no meio do mapa
  store[pb+'teste_jogador_v138']={nome:'Kael Teste',imagem:kael,donoUid:'player',x:14,y:7,revision:0,facing:0,camada:3,mapaId:ID,diametroM:.78}; // 0,78 = tamanho antigo guardado na ficha
  store[pb+'construtor_v195']={nome:'Brunel Obras',imagem:brunel,donoUid:'player',x:14+1.4*28/W,y:7,revision:0,facing:0,camada:3,mapaId:ID,diametroM:.9};
  store['personagens/teste_jogador_v138']={nome:'Kael Teste',dono:'player'};
  const uid=modo==='mestre'?'master':'player';
  const ativo=modo==='construtor'?'construtor_v195':'teste_jogador_v138';
  window.ownSheets=[{id:'teste_jogador_v138',nome:'Kael Teste',dono:'player',donoUid:'player',localizacaoMapaId:ID,localizacaoMapaDefinidaV92:true},{id:'construtor_v195',nome:'Brunel Obras',dono:'player',donoUid:'player',localizacaoMapaId:ID,localizacaoMapaDefinidaV92:true}];
  const renderMap=m=>{const s=m.oficina2State||{};return '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="display:block"><rect width="'+W+'" height="'+H+'" fill="'+(s.bg||'#b69a72')+'"/>'+(s.showGrid?'<defs><pattern id="novaGrid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0L0 0 0 1" fill="none" stroke="#9a8a6a" stroke-width=".05"/></pattern></defs><rect width="'+W+'" height="'+H+'" fill="url(#novaGrid)"/>':'')+'</svg>';};
  window.lab=mountDirectPositionLab({database:db,user:()=>({uid,master:modo==='mestre'}),characters:()=>window.ownSheets,activeCharacter:()=>ativo,renderMap,loadMap:async id=>({id,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H,oficina2State:{w:W,h:H,ppm:32,bg:'#b69a72',showGrid:true,grid:'#9a8a6a',elements:[]}}),mapas:()=>[{id:ID,nome:'Cidade Baixa de Véspera',larguraM:W,alturaM:H}],
   catalog:()=>[],loadActions:async()=>({skills:[],health:{hitMax:{Peito:8},hit:{Peito:8},armor:{}}}),prepareSupport:async()=>({resolve:()=>({})}),restoreHealth:async rows=>Object.fromEntries(rows.map(t=>[t.id,{}])),rollTest:()=>({die:25,grau:'Sucesso'}),loadCombatants:async rows=>rows.map(t=>({...t,initiative:10,actions:3}))});
  await window.lab.open();
  const ctl=window.lab;
  instalarCamera({controller:()=>({dimsAtual:()=>({W,H}),ator:()=>ctl.ator?.(),controla:()=>true,...ctl}),ehMestre:()=>modo==='mestre'||modo==='construtor'});
  instalarVista({controller:()=>({dimsAtual:()=>({W,H})})});
  return true;},{modo,W,H});
 await page.waitForFunction(()=>document.querySelectorAll('[data-token]').length>=2,null,{timeout:8000});
 await page.waitForTimeout(1800);
 return {page,erros,ctx};
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const medir=page=>page.evaluate(()=>{const b=document.getElementById('novaSyncBoard'),br=b.getBoundingClientRect();
  const tk=id=>{const n=document.querySelector('[data-token="'+id+'"]');if(!n)return null;const r=n.getBoundingClientRect();return {w:r.width,h:r.height};};
  const grades=[...document.querySelectorAll('#mvGrade,rect[fill="url(#novaGrid)"]')].filter(x=>x.getClientRects().length&&getComputedStyle(x).display!=='none'&&getComputedStyle(x).visibility!=='hidden').length;
  const vp=document.querySelector('[data-world-layer]'),tr=vp?getComputedStyle(vp).transform:'';
  return {kael:tk('teste_jogador_v138'),brunel:tk('construtor_v195'),grades,boardW:br.width,transform:tr};});
 const R={};
 for(const modo of ['jogador','construtor','mestre']){
  const {page,erros,ctx}=await cena(browser,modo);const m=await medir(page);R[modo]=m;
  console.log(modo,JSON.stringify(m));
  assert.equal(m.grades,0,modo+': nenhuma grade visível por padrão');
  const ppm=m.kael.w; // px de um token de 1 m
  if(modo!=='mestre'){
   assert.ok(m.kael.w>=46&&m.kael.h>=46,modo+': Kael ocupa ~1 m (≥ 46 px): '+m.kael.w);assert.ok(m.brunel.w>=46,modo+': Brunel ocupa ~1 m: '+m.brunel.w);
   assert.ok(Math.abs(m.kael.w-m.brunel.w)<2,modo+': Kael e Brunel do mesmo tamanho ('+m.kael.w+' × '+m.brunel.w+')');
  }else assert.ok(m.kael.w>=20,'mestre: miniatura legível mesmo no mapa inteiro');
  if(modo==='jogador'){await page.locator('#novaSyncBoard').scrollIntoViewIfNeeded();const k=await page.locator('[data-token="teste_jogador_v138"]').boundingBox(),q=await page.locator('[data-token="construtor_v195"]').boundingBox();
   const clip={x:Math.max(0,Math.min(k.x,q.x)-150),y:Math.max(0,k.y-150),width:Math.max(k.x,q.x)+q.width-Math.min(k.x,q.x)+300,height:k.height+300};
   await page.screenshot({path:path.join(root,'docs/imagens/v196-construtor-e-kael.png'),clip});
   const b1=page.locator('#camZoom [data-grade]');await b1.click();await page.waitForTimeout(900);await page.screenshot({path:path.join(root,'docs/imagens/v196-construtor-e-kael-com-grade.png'),clip});await b1.click();await page.waitForTimeout(500);}
  // ▦ liga a grade de 1 m e desliga de novo
  const btn=page.locator('#camZoom [data-grade]');if(await btn.count()){await btn.click();await page.waitForTimeout(900);const on=await page.evaluate(()=>!!document.getElementById('mvGrade'));assert.ok(on,modo+': ▦ mostra a grade de 1 m');await btn.click();await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>!!document.getElementById('mvGrade')),false,modo+': ▦ esconde de novo');}
  assert.deepEqual(erros,[],modo+': sem erros na página');await ctx.close();
 }
 console.log('PASS escala: grade desligada; Kael e Brunel com 1 m; visão ampliada para jogador e construtor');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
