// Exploração do duelo (harness local, mestre simulado): ataca repetidamente com o botão do painel e imprime o andamento.
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const D=await montarDuelo({criatura:process.env.CRIATURA||'zumbi_1',perfil:process.env.PERFIL||'forte'});const {H,page,cid,criaturaId}=D;
 await page.evaluate(async()=>{const c=window.__APP__.ctl();try{c.close?.();}catch(_){}await c.open();});await page.waitForTimeout(2500);
 await page.evaluate(cid=>{const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));},cid);await page.waitForTimeout(2500);
 const tk=await page.evaluate(id=>{const n=document.querySelector('#novaSyncBoard [data-token="'+id+'"]');n.scrollIntoView({block:'center',inline:'center'});const r=n.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];},criaturaId);
 await page.mouse.click(tk[0],tk[1]);await page.waitForTimeout(800);
 console.log('perícias:',await page.evaluate(()=>[...document.getElementById('novaSyncSkill').options].map(o=>o.textContent+'['+o.value+']')),'armas:',await page.evaluate(()=>[...document.getElementById('novaSyncWeapon').options].map(o=>o.textContent)));
 if(process.env.SKILL)await page.evaluate(v=>{const s=document.getElementById('novaSyncSkill');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));},process.env.SKILL);
 const estado=()=>page.evaluate(([c,k])=>{const h=window.__fs.get('combatesAtivos/mapaMesaSyncSaude');const a=h?.actors||{};const f=x=>{const v=a[x]?.combateLab;return v?{pv:Object.values(v.hit||{}).reduce((s,n)=>s+Number(n||0),0)+'/'+Object.values(v.hitMax||{}).reduce((s,n)=>s+Number(n||0),0),morto:!!v.morto,inc:!!v.inconsciente}:null;};return {kael:f(c),zumbi:f(k),pausado:window.mesaTempoRealV111?.estado?.()?.pausado,res:(document.querySelector('.nova-result')?.textContent||'').slice(0,140)};},[cid,criaturaId]);
 for(let i=1;i<=45;i++){
  const e=await estado();console.log('['+i+']',JSON.stringify(e));
  if((e.zumbi&&(e.zumbi.morto||e.zumbi.inc))||(e.kael&&(e.kael.morto||e.kael.inc))){console.log('FIM');break;}
  await page.evaluate(()=>{const b=document.getElementById('novaSyncTest');if(b&&!b.disabled)b.click();const ok=document.querySelector('#rtEscolha [data-ok]');if(ok&&!ok.disabled)ok.click();});
  await page.waitForTimeout(2200);
 }
 console.log('acoes:');for(const l of await page.evaluate(()=>[...window.__fs].filter(([p])=>/mapaMesaSyncDireta\/acoes\//.test(p)).map(([p,v])=>v.kind+' '+v.status+' '+(v.message||'').slice(0,170))))console.log('  '+l);
 await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
