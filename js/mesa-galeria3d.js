// Mesa Estelar v201 — 🎞️ Galeria 3D: o mestre vê TODAS as miniaturas 3D animadas (parado, andando, atacando, morrendo), marca as que gostou (👍)
// e escolhe quais criaturas/NPCs cada uma deve substituir. As marcas ficam salvas (configuracoes/galeria3dV201) e dá para exportar a lista.
// Só o mestre abre (botão "🎞️ Galeria 3D" em Ferramentas do mestre). Nada muda nas miniaturas do mapa: é só a ficha de avaliação.
import {SPRITES_3D} from './mesa-sprites-3d-dados.js?v=200';

export const DOC_GALERIA='configuracoes/galeria3dV201';
export const BASE_3D='arte/miniaturas3d/';
const ACOES=[['parado','🧍','Parado'],['andar','🚶','Andando'],['atacar','⚔️','Atacando'],['golpe','💥','Apanhando'],['morrer','💀','Morrendo']];

/** agrupa os modelos pela parte do nome antes de " · " (Monstro, Homem, Zumbi…); sem "·" vai para "Outros" */
export function agrupar(sprites=SPRITES_3D){
 const g={};
 for(const [id,v] of Object.entries(sprites)){const n=String(v.nome||id),i=n.indexOf(' · '),k=i>0?n.slice(0,i):'Outros';(g[k]=g[k]||[]).push({id,nome:i>0?n.slice(i+3):n,completo:n});}
 for(const k of Object.keys(g))g[k].sort((a,b)=>a.nome.localeCompare(b.nome,'pt'));
 return Object.fromEntries(Object.entries(g).sort((a,b)=>a[0].localeCompare(b[0],'pt')));
}
/** texto da lista de avaliação (para exportar/colar para o Claude): quem gostou e no lugar de quem */
export function resumoMarcas(marcas={},sprites=SPRITES_3D){
 const gostou=[],naoGostou=[];
 for(const [id,m] of Object.entries(marcas||{})){
  const nome=sprites[id]?.nome||id;
  if(m?.gostei)gostou.push(`- ${nome} (${id})${(m.para||[]).length?' → substitui: '+m.para.map(p=>p.nome||p.id).join(', '):' → (sem criatura escolhida)'}${m.nota?' · '+m.nota:''}`);
  else if(m?.naogostei)naoGostou.push(`- ${nome} (${id})`);
 }
 return `Miniaturas 3D que EU GOSTEI (${gostou.length}):\n${gostou.join('\n')||'(nenhuma)'}\n\nMiniaturas 3D que NÃO gostei (${naoGostou.length}):\n${naoGostou.join('\n')||'(nenhuma)'}\n`;
}
export const limparMarcas=m=>{const o={};for(const [id,v] of Object.entries(m||{})){if(v&&(v.gostei||v.naogostei||(v.para||[]).length||v.nota))o[id]={gostei:!!v.gostei,naogostei:!!v.naogostei,para:(v.para||[]).slice(0,12).map(p=>({id:String(p.id||''),nome:String(p.nome||'')})),nota:String(v.nota||'').slice(0,200)};}return o;};

const CSS=`#g3Fundo{position:fixed;inset:0;z-index:10050;background:rgba(5,8,18,.86);display:grid;place-items:center}
#g3Caixa{width:min(1280px,97vw);height:min(92vh,900px);background:#101828;border:1px solid #8ee7ff;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden}
#g3Topo{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid #26385a}
#g3Topo h3{margin:0;font-size:16px;color:#8ee7ff;flex:1 1 220px}#g3Topo select,#g3Topo button{flex:0 0 auto;background:#18233a;color:#e8eefc;border:1px solid #49668a;border-radius:8px;padding:5px 10px;font-size:12px}
#g3Topo button{cursor:pointer}#g3Topo .g3-n{color:#9fb3cc;font-size:12px}
#g3Corpo{overflow:auto;padding:10px 14px 18px;flex:1}
#g3Corpo h4{margin:14px 0 6px;color:#ffd58a;font-size:13px;border-bottom:1px solid #26385a;padding-bottom:3px}
.g3-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.g3-card{background:#16203a;border:1px solid #2c4166;border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px}
.g3-card.gostei{border-color:#57e3a1;box-shadow:0 0 0 1px #57e3a166}.g3-card.nao{opacity:.55}
.g3-vitrine{height:132px;display:grid;place-items:center;background:radial-gradient(circle at 50% 60%,#4a3f2e,#2a2418);border-radius:8px}
.g3-anim{width:128px;height:128px;background-repeat:no-repeat;background-size:1024px 128px;animation:g3x var(--dur,1s) steps(8) infinite}
@keyframes g3x{to{background-position-x:-1024px}}
.g3-nome{font-weight:700;font-size:12.5px}.g3-id{color:#8798b3;font-size:10.5px;margin-top:-4px}
.g3-acoes{display:flex;gap:3px;flex-wrap:wrap}.g3-acoes button{flex:1;background:#1d2b4a;color:#cfe0ff;border:1px solid #3a5380;border-radius:6px;padding:2px 0;font-size:12px;cursor:pointer}
.g3-acoes button[aria-pressed="true"]{background:#2f5ea8;border-color:#8ee7ff}
.g3-voto{display:flex;gap:10px;align-items:center;font-size:12px}.g3-voto label{cursor:pointer;display:flex;gap:4px;align-items:center}
.g3-para{display:flex;flex-wrap:wrap;gap:4px}.g3-chip{background:#26456f;border:1px solid #4f7fb8;border-radius:999px;padding:1px 8px;font-size:11px;cursor:pointer}
.g3-card input[type=text]{width:100%;box-sizing:border-box;background:#0d1426;color:#e8eefc;border:1px solid #3a5380;border-radius:6px;padding:4px 6px;font-size:12px}
#g3Exp{width:100%;height:160px;background:#0d1426;color:#cfe0ff;border:1px solid #3a5380;border-radius:8px;padding:8px;font:12px/1.4 Consolas,monospace;box-sizing:border-box}`;

export async function abrirGaleria3D({root=document,dep={},esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}={}){
 root.getElementById('g3Fundo')?.remove();
 if(!root.getElementById('g3Css')){const st=root.createElement('style');st.id='g3Css';st.textContent=CSS;root.head.append(st);}
 const D=p=>dep.doc(dep.db,...p.split('/'));
 let marcas={};try{const s=await dep.getDoc(D(DOC_GALERIA));if(s.exists())marcas=s.data()?.marcas||{};}catch(e){console.warn('[Galeria 3D] ler',e);}
 const bichos=()=>{const out=[];for(const [lista,tipo] of [[dep.criaturas?.()||[],'criatura'],[dep.npcs?.()||[],'NPC']])for(const c of lista)if(c?.id)out.push({id:String(c.id),nome:String(c.nome||c.id),tipo});return out.sort((a,b)=>a.nome.localeCompare(b.nome,'pt'));};
 const todos=bichos();
 const f=root.createElement('div');f.id='g3Fundo';f.setAttribute('role','dialog');f.setAttribute('aria-label','Galeria de miniaturas 3D');
 f.innerHTML=`<div id="g3Caixa"><div id="g3Topo"><h3>🎞️ Galeria 3D — marque as que gostou e diga no lugar de quem</h3>
  <select data-g3-filtro><option value="todos">Mostrar: todas</option><option value="gostei">Só as que gostei 👍</option><option value="nao">Só as que não gostei 👎</option><option value="sem">Ainda sem marca</option></select>
  <span class="g3-n" data-g3-n></span><button type="button" data-g3-exp>📋 Exportar lista</button><button type="button" data-g3-x>✕ Fechar</button></div>
  <div id="g3Corpo"></div><datalist id="g3Bichos">${todos.map(b=>`<option value="${esc(b.nome)} [${esc(b.id)}]">${esc(b.tipo)}</option>`).join('')}</datalist></div>`;
 root.body.append(f);
 const corpo=f.querySelector('#g3Corpo'),nEl=f.querySelector('[data-g3-n]');
 let salvarT=null,acaoDe={};const filtro=()=>f.querySelector('[data-g3-filtro]').value;
 const salvar=()=>{clearTimeout(salvarT);salvarT=setTimeout(async()=>{try{await dep.setDoc(D(DOC_GALERIA),{marcas:limparMarcas(marcas),atualizadoEm:Date.now()});nEl.textContent=resumoN()+' · ✔ salvo';}catch(e){nEl.textContent='⚠️ não salvou: '+(e?.code||e?.message||e);}},600);};
 const resumoN=()=>{const v=Object.values(marcas);return `${v.filter(m=>m?.gostei).length} 👍 · ${v.filter(m=>m?.naogostei).length} 👎 · de ${Object.keys(SPRITES_3D).length} modelos`;};
 const m=id=>marcas[id]||(marcas[id]={gostei:false,naogostei:false,para:[],nota:''});
 const sheet=(id,acao)=>{const o=SPRITES_3D[id]?.folhas?.[acao+'_lado'];return o?{u:BASE_3D+o.arquivo,dur:o.dur||1}:null;};
 const cartao=({id,nome,completo})=>{
  const mk=marcas[id]||{},ac=acaoDe[id]||'andar',sh=sheet(id,ac)||sheet(id,'parado');
  const chips=(mk.para||[]).map(p=>`<span class="g3-chip" data-g3-chip="${esc(id)}|${esc(p.id)}" title="Tirar">${esc(p.nome||p.id)} ✕</span>`).join('');
  return `<div class="g3-card${mk.gostei?' gostei':''}${mk.naogostei?' nao':''}" data-g3="${esc(id)}"><div class="g3-vitrine"><div class="g3-anim" style="background-image:url('${sh?sh.u:''}');--dur:${sh?Math.max(.4,sh.dur):1}s"></div></div>
   <div class="g3-nome">${esc(nome)}</div><div class="g3-id">${esc(id)}</div>
   <div class="g3-acoes">${ACOES.map(([a,ic,t])=>`<button type="button" data-g3-acao="${esc(id)}|${a}" aria-pressed="${ac===a}" title="${t}">${ic}</button>`).join('')}</div>
   <div class="g3-voto"><label><input type="checkbox" data-g3-gostei="${esc(id)}"${mk.gostei?' checked':''}> 👍 gostei</label><label><input type="checkbox" data-g3-nao="${esc(id)}"${mk.naogostei?' checked':''}> 👎 não</label></div>
   <div class="g3-para">${chips}</div><input type="text" list="g3Bichos" data-g3-add="${esc(id)}" placeholder="Usar no lugar de… (digite a criatura e Enter)">
   <input type="text" data-g3-nota="${esc(id)}" value="${esc(mk.nota||'')}" maxlength="200" placeholder="Observação (opcional)"></div>`;};
 const desenhar=()=>{
  const g=agrupar(),flt=filtro();let html='';
  for(const [grupo,lista] of Object.entries(g)){
   const vis=lista.filter(x=>{const k=marcas[x.id]||{};return flt==='todos'||(flt==='gostei'&&k.gostei)||(flt==='nao'&&k.naogostei)||(flt==='sem'&&!k.gostei&&!k.naogostei);});
   if(vis.length)html+=`<h4>${esc(grupo)} (${vis.length})</h4><div class="g3-grade">${vis.map(cartao).join('')}</div>`;
  }
  const rol=corpo.scrollTop;corpo.innerHTML=html||'<p>Nada para mostrar com este filtro.</p>';corpo.scrollTop=rol;nEl.textContent=resumoN();
 };
 // eventos (delegados): marcar não redesenha tudo para a página não pular
 f.addEventListener('pointerdown',e=>e.stopPropagation());
 f.addEventListener('click',e=>{
  if(e.target===f||e.target.closest('[data-g3-x]')){f.remove();return;}
  const ex=e.target.closest('[data-g3-exp]');if(ex){corpo.insertAdjacentHTML('afterbegin',`<div data-g3-expbox><h4>Lista para exportar (copie e cole para o Claude)</h4><textarea id="g3Exp" readonly></textarea></div>`);const ta=corpo.querySelector('#g3Exp');ta.value=resumoMarcas(limparMarcas(marcas));ta.select();try{root.execCommand?.('copy');}catch(_){}return;}
  const ac=e.target.closest('[data-g3-acao]');if(ac){const [id,a]=ac.dataset.g3Acao.split('|');acaoDe[id]=a;const card=ac.closest('.g3-card'),sh=sheet(id,a)||sheet(id,'parado'),an=card.querySelector('.g3-anim');if(sh&&an){an.style.backgroundImage=`url('${sh.u}')`;an.style.setProperty('--dur',Math.max(.4,sh.dur)+'s');}card.querySelectorAll('[data-g3-acao]').forEach(b=>b.setAttribute('aria-pressed',String(b===ac)));return;}
  const ch=e.target.closest('[data-g3-chip]');if(ch){const [id,pid]=ch.dataset.g3Chip.split('|');m(id).para=(m(id).para||[]).filter(p=>p.id!==pid);ch.remove();salvar();nEl.textContent=resumoN();}
 });
 f.addEventListener('change',e=>{
  const t=e.target;
  if(t.matches('[data-g3-filtro]')){desenhar();return;}
  const gi=t.dataset?.g3Gostei,na=t.dataset?.g3Nao,no=t.dataset?.g3Nota,ad=t.dataset?.g3Add;
  if(gi!==undefined){m(gi).gostei=t.checked;if(t.checked)m(gi).naogostei=false;const c=t.closest('.g3-card');c.classList.toggle('gostei',t.checked);if(t.checked){c.classList.remove('nao');c.querySelector('[data-g3-nao]').checked=false;}salvar();nEl.textContent=resumoN();}
  else if(na!==undefined){m(na).naogostei=t.checked;if(t.checked)m(na).gostei=false;const c=t.closest('.g3-card');c.classList.toggle('nao',t.checked);if(t.checked){c.classList.remove('gostei');c.querySelector('[data-g3-gostei]').checked=false;}salvar();nEl.textContent=resumoN();}
  else if(no!==undefined){m(no).nota=t.value;salvar();}
  else if(ad!==undefined){const v=String(t.value||'').trim();if(!v)return;const mm=/\[([^\]]+)\]\s*$/.exec(v),b=mm?todos.find(x=>x.id===mm[1]):todos.find(x=>x.nome.toLowerCase()===v.toLowerCase());
   const par=b?{id:b.id,nome:b.nome}:{id:v,nome:v};const lista=m(ad).para=m(ad).para||[];if(!lista.some(p=>p.id===par.id)){lista.push(par);m(ad).gostei=true;m(ad).naogostei=false;}t.value='';desenhar();salvar();}
 });
 desenhar();
 return {fechar:()=>f.remove(),marcas:()=>marcas};
}
