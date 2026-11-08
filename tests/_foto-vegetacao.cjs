// Foto da vegetação do pântano no zoom normal do mapa. MODO=velha (arte reprovada) | nova (peças refeitas) | nenhuma. Põe as peças por cima do mapa de teste (só na cena do harness).
// Uso: MODO=nova PREFIXO=comp node tests/_foto-vegetacao.cjs     -> docs/antes-depois/veg-<PREFIXO>-<modo>.png
const path=require('path'),fs=require('fs');const {preparar,root}=require('./_mapa-reformado.cjs');const aj=require('./_ajudas-percurso.cjs');
const cat=Object.fromEntries(require('../scripts/blender/_catalogo-pecas.json').map(x=>[x.id,x]));
const COMP={ // [peça velha, peça nova, dx, dy, ang] em células (80x50) em volta do jogador
 tronco:['sl_tronco_caido','sl_tronco_quebrado',-3.2,-1.6,8],raiz:['sl_raiz_pantano','sl_raiz_assimetrica',2.6,-1.2,200],
 junco:['sl_junco_agua','sl_touceira_junco',-1.2,2.4,0],planta:['sl_lirio_agua','sl_planta_alien',3.2,2.6,30]};
const COMPV={tronco:['','sl_tronco_curvo',-3.4,-1.8,8],raiz:['','sl_raiz_arco',3.0,-1.4,200],junco:['','sl_tronco_bifurcado',-3.0,2.2,0],planta:['','sl_tronco_oco',3.0,2.4,20]};if(process.env.VARIANTES)Object.assign(COMP,COMPV); // VARIANTES=1: mostra as variantes novas
(async()=>{const {H,page,id}=await preparar({viewport:{width:1280,height:800},removerFauna:true});const {colocar}=aj(page,id);
 const modo=process.env.MODO||'nova',[px,py]=(process.env.SPOT||'48,41').split(',').map(Number);
 await colocar(px,py);await page.waitForTimeout(1500);
 if(modo!=='nenhuma')await page.evaluate(({COMP,cat,modo,px,py})=>{const k='combatesAtivos/mapaMesaSyncDiretaCena',c=window.__fs.get(k),base=c.objects.find(o=>o.erTipo==='objeto');
  const novos=Object.entries(COMP).map(([n,[v,nv,dx,dy,a]],i)=>{const m=cat[modo==='velha'?v:nv];return {...base,id:'veg_teste_'+n,nome:m.nome,modeloId:m.id,objetoBancoId:m.id,imagem:'https://mesa.test/'+m.src,x:+((px+dx)*28/80).toFixed(3),y:+((py+dy)*14/50).toFixed(3),larguraM:m.larguraM,alturaM:m.alturaM,angulo:a,ordemOficina:9000+i};});
  window.__fsWrite(k,{...c,objects:[...c.objects,...novos]});},{COMP,cat,modo,px,py});
 await page.waitForTimeout(2500);
 const f=path.join(root,'docs','antes-depois','veg-'+(process.env.PREFIXO||'comp')+'-'+modo+'.png');await page.screenshot({path:f});console.log(f);await H.close();})();
