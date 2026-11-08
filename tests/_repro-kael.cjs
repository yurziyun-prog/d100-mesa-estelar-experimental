// Repro: ficha no formato do Kael Teste (criarPersonagemTesteV138_) atacando criatura colada. Harness local.
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const D=await montarDuelo({criatura:'rastejante_de_cinzas',dist:.6,perfil:'forte'});const {H,page,erros,cid}=D;
 await page.evaluate(async cid=>{const S=window.__fs,f=S.get('personagens/'+cid);
  f.atributos={FOR:10,CON:10,TAM:10,DES:10,INT:10,POD:10,CAR:10};f.combate={hitLocations:{},armor:{},fadiga:'Fresh',armas:[],municao:[]};
  const pe={};for(const p of (window.__APP__.ev('periciasDB')||[]))pe[p.id]={investimentos:{origem:0,carreira:0,hobbie:0,xp:40}};f.pericias=pe;
  const es={};for(const p of (window.__APP__.ev('especializacoesDB')||[]))es[p.id]={investimentos:{origem:0,carreira:0,hobbie:0,xp:40}};f.especializacoes=es;
  window.__fsWrite('personagens/'+cid,f);},cid);
 await page.evaluate(async()=>{const c=window.__APP__.ctl();try{c.close?.();}catch(_){}await c.open();});await page.waitForTimeout(2200);
 await page.evaluate(cid=>{const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));},cid);await page.waitForTimeout(1800);
 const crId=D.criaturaId;
 await page.evaluate(id=>{const c=window.__APP__.ctl();if(c.alvo)c.alvo(id);},crId);
 for(let i=0;i<5;i++){
  const q=await page.evaluate(()=>window.mesaAcoesMapaV200?.disparar?.()??window.mesaAcoesMapa?.disparar?.());console.log('disparar ->',q);await page.waitForTimeout(2500);
  console.log('balao:',await page.evaluate(()=>[...document.querySelectorAll('[data-defense-bubble]')].map(x=>x.textContent).join('|')),'| tempo real:',await page.evaluate(()=>JSON.stringify(window.mesaTempoRealV111?.estado?.()||null)).then(x=>x.slice(0,120)));
  const r=await page.evaluate(()=>{const b=document.getElementById('novaSyncTest');const o=document.querySelector('[data-defense-bubble]')?.textContent||'';return {btn:b?.textContent,dis:b?.disabled,bol:o,res:document.querySelector('.nova-result')?.textContent?.slice(0,200)};});
  console.log(i,JSON.stringify(r));
  await page.evaluate(()=>{const ok=document.querySelector('#rtEscolha [data-ok]');if(ok)ok.click();const b=document.getElementById('novaSyncTest');if(b&&!b.disabled)b.click();});
  await page.waitForTimeout(4000);
 }
 const cmds=await page.evaluate(()=>[...window.__fs].filter(([p])=>/comandos\//.test(p)).map(([p,v])=>[p.slice(-8),v.status,v.message]));
 console.log('cmds',JSON.stringify(cmds));console.log('erros',erros.slice(0,5));
 await H.close();
})();
