// Arrasta um móvel no mapa de teste (modo mestre) na horizontal e na vertical e mede o deslocamento. [harness local]
const {preparar}=require('./_mapa-reformado.cjs');
(async()=>{const {H,page,id}=await preparar({removerFauna:true,viewport:{width:1500,height:900}});
 await page.evaluate(()=>{window.__APP__.setMestre();const p=document.getElementById('novaSyncPersonagem');if(![...p.options].some(o=>o.value==='__mestre__')){const o=document.createElement('option');o.value='__mestre__';o.textContent='Mestre';p.append(o);}p.value='__mestre__';p.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(2500);
 // escolhe um móvel pequeno visível
 const alvo=await page.evaluate(()=>{const b=document.getElementById('novaSyncBoard');const c=window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.filter(o=>o.erTipo==='objeto'||o.camada===3&&o.imagem);for(const o of c){if(/Pico|Rocha|Pedra|Parede/i.test(o.nome||''))continue;const n=b.querySelector('[data-scene-object="'+CSS.escape(String(o.id))+'"]');if(!n)continue;const r=n.getBoundingClientRect();if(r.width>12&&r.height>12&&r.top>300&&r.bottom<600&&r.left>300&&r.right<1200)return {id:o.id,nome:o.nome,cx:r.left+r.width/2,cy:r.top+r.height/2,x:o.x,y:o.y};}return null;});
 console.log('alvo',JSON.stringify(alvo));
 const pos=()=>page.evaluate(i=>{const o=(window.mesaEditorRapidoV197?.objetos?.()||[]).find(o=>o.id===i)||window.__fs.get('combatesAtivos/mapaMesaSyncDiretaCena').objects.find(o=>o.id===i);return o?[+o.x.toFixed(3),+o.y.toFixed(3)]:null;},alvo.id);
 const centro=()=>page.evaluate(i=>{const n=document.querySelector('#novaSyncBoard [data-scene-object="'+CSS.escape(String(i))+'"]');const r=n.getBoundingClientRect();return {cx:r.left+r.width/2,cy:r.top+r.height/2};},alvo.id);
const arrasta=async(dx,dy)=>{Object.assign(alvo,await centro());const p0=await pos();await page.mouse.move(alvo.cx,alvo.cy);await page.mouse.down();await page.mouse.move(alvo.cx+dx/2,alvo.cy+dy/2,{steps:6});await page.mouse.move(alvo.cx+dx,alvo.cy+dy,{steps:6});await page.mouse.up();await page.waitForTimeout(700);const p1=await pos();console.log('arrasto',dx,dy,'->',JSON.stringify(p0),JSON.stringify(p1));};
 await arrasta(0,90);await arrasta(0,-90);await arrasta(0,90);await arrasta(0,-90);await arrasta(0,-60);await arrasta(0,60);
 await H.close();})();
