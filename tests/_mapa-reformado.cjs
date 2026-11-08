// Preparação comum dos testes de navegador: mapa de teste reformado + jogadora no acampamento. VALIDAÇÃO: harness local (Firestore simulado, papel simulado).
const fs=require('fs'),path=require('path');
const {abrirApp,root,carregarBancoDePecas}=require('./_harness-app.cjs');
async function preparar({viewport={width:1500,height:950},removerFauna=true,papel='jogador',simples=false}={}){
 const H=await abrirApp({viewport}),{page,erros}=H;
 const csv=fs.readFileSync(path.join(root,'dados','banco_criaturas_2026-09-26.csv'),'utf8');
 const lin=csv.replace(/^﻿/,'').split(/\r?\n/).filter(Boolean),cab=lin[0].split(';');
 const todas=lin.slice(1).map(x=>x.split(';')).map(c=>Object.fromEntries(cab.map((h,i)=>[h,c[i]])));
 await page.evaluate(({todas})=>{
  const A=window.__APP__;A.setMestre();A.setBancos(todas,[{id:'engenheira',nome:'Engenheira Vela',carreira:'Engenheira'}]);
  const S=window.__fs,M='mapa_real';
  S.set('combatesAtivos/mapaMesaSyncDireta',{mapId:M,nome:'Pátio',larguraM:28,alturaM:14,fundo:''});S.set('mapas/'+M,{nome:'Pátio',larguraM:28,alturaM:14});
  S.set('combatesAtivos/mapaMesaSyncDiretaCena',{mapId:M,objetoSchema:1,objects:[]});
  window.confirm=()=>true;window.__ready=A.ctl().open();
 },{todas});
 await page.evaluate(()=>{const p=document.getElementById('sincronizacao-nova');p.classList.add('active');for(let n=p;n&&n!==document.body;n=n.parentElement){n.hidden=false;n.classList.remove('hidden');if(getComputedStyle(n).display==='none')n.style.display='block';}document.getElementById('loginScreen')&&(document.getElementById('loginScreen').style.display='none');});
 await page.waitForSelector('#novaSyncBoard',{timeout:20000});await page.waitForTimeout(2500);
 if(simples)return {H,page,erros,id:'mapa_real',r:null}; // mapa vazio 28×14 (sem a reforma do ecossistema): testes de combate mais leves e estáveis
 await page.waitForFunction(()=>window.mesaReformaTeste&&window.mesaEditorRapidoV197?.construir,null,{timeout:20000});await carregarBancoDePecas(page);
 const id=await page.evaluate(async()=>{const E=window.mesaEditorRapidoV197;const id=await E.criarMapa('🌿 Ecossistema (teste)',80,50,'');for(let i=0;i<80&&!E.pronto(id);i++)await new Promise(r=>setTimeout(r,100));return id;});
 const r=await page.evaluate(async id=>{
  const R=window.mesaReformaTeste;const out=await R.aplicar(id);const S=window.__fs;
  // personagem do jogador comum 'jog1': token + ficha (equipamento) no acampamento seguro
  S.set('personagens/jogador_teste_1',{nome:'Jogadora de teste',dono:'jog1',inventario:{equipado:[],bolso:[],mochila:[]}});
  S.set('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1',{nome:'Jogadora de teste',imagem:'',donoUid:'jog1',x:+(46/80*28).toFixed(3),y:+(26/50*14).toFixed(3),revision:0,facing:0,camada:3,mapaId:id,diametroM:1,visualV203:'',arte3dV200:'cima_pessoa'});
  return {criaturas:out.depois.criaturas,obj:out.depois.objetos,falhas:out.falhas};},id);
 if(removerFauna)await page.evaluate(()=>{const S=window.__fs;window.__moldes=[...S].filter(([p,v])=>/posicoes[/]synccriatura/.test(p)).map(([p,v])=>[p,JSON.parse(JSON.stringify(v))]);for(const [p,v] of [...S]){if(!/posicoes[/]/.test(p)||/jogador_teste_1/.test(p))continue;S.delete(p);}});
 await page.evaluate(id=>{window.__APP__.setJogador('jog1');window.__APP__.setPersonagem({id:'jogador_teste_1',nome:'Jogadora de teste',dono:'jog1',localizacaoMapaId:id,fichaAprovada:true});},id);
 await page.evaluate(async()=>{const c=window.__APP__.ctl();try{c.close?.();}catch(_){}await c.open();});
 await page.waitForTimeout(2500);
 return {H,page,erros,id,r};
}
module.exports={preparar,root};
