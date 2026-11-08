// Mesa Estelar v203 — Editor de personagem (jogador e mestre): cores da pele, roupa, detalhes e cabelo, corte de cabelo e capa.
// A miniatura de cima (cima_pessoa) é pintada na hora; o resultado fica no campo visualV203 do token (texto curto). O mestre edita qualquer pessoa; o jogador, só a dele.
import {lerVisual,textoVisual,PALETAS_PESSOA,CABELOS_PESSOA,ordemCamadas,ESTILOS_PESSOA,ORELHAS_PESSOA,ACESSORIOS_PESSOA,PADROES_CAPA,CAMADAS_PESSOA,corCamadasPessoa,camadaVisivel,ehPessoaTokenArte,existe3D} from './mesa-arte3d.js?v=200';
import {SPRITES_3D} from './mesa-sprites-3d-dados.js?v=200';
const BASE='arte/miniaturas3d/';
const CSS=`#pedBotao{position:absolute;right:8px;top:8px;z-index:36;/* v205: dentro do canto superior direito do mapa (antes: fixo embaixo à esquerda, por cima dos botões de ação) */background:#1b2a46;color:#fff;border:1px solid #3e5a8f;border-radius:999px;padding:8px 14px;font:600 13px system-ui;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)}
#pedBotao[hidden],#pedPainel[hidden]{display:none}
#pedBotao.ped-na-barra{position:static;height:36px;padding:0 12px;border-radius:999px;box-shadow:none;white-space:nowrap}
#pedPainel{position:fixed;left:12px;bottom:120px;z-index:70;width:min(340px,calc(100vw - 24px));background:#0f1a2e;color:#e8eefb;border:1px solid #3e5a8f;border-radius:14px;padding:12px;font:13px system-ui;box-shadow:0 6px 24px rgba(0,0,0,.55)}
#pedPainel h3{margin:0 0 8px;font-size:14px;display:flex;justify-content:space-between;align-items:center}
#pedPainel .ped-topo{display:flex;gap:10px;align-items:stretch}#pedPainel .ped-vistas{display:flex;flex-direction:column;gap:5px;flex:1}#pedPainel .ped-vistas button{padding:6px;border-radius:8px;border:1px solid #3e5a8f;background:#16253f;color:#fff;cursor:pointer;font-size:12px}#pedPainel .ped-vistas button[aria-pressed=true]{background:#2d6cdf;border-color:#2d6cdf}
#pedPainel .ped-prev{position:relative;width:158px;height:158px;background:#1c2d4a;border-radius:10px;overflow:hidden}
#pedPainel .ped-prev .a3dc{position:absolute;inset:0;isolation:isolate}#pedPainel .ped-prev i{position:absolute;inset:0;background-repeat:no-repeat}#pedPainel .ped-prev .som{mix-blend-mode:multiply}
#pedPainel .ped-cores{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px}
#pedPainel label{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12px}
#pedPainel input[type=color]{width:36px;height:24px;padding:0;border:1px solid #3e5a8f;border-radius:6px;background:none}
#pedPainel select{background:#16253f;color:#fff;border:1px solid #3e5a8f;border-radius:6px;padding:3px 6px;font-size:12px}
#pedPainel .ped-lin{display:flex;gap:8px;align-items:center;margin-top:8px}#pedPainel .ped-lin button{flex:1;padding:7px;border-radius:8px;border:1px solid #3e5a8f;background:#1b2a46;color:#fff;cursor:pointer;font-size:12px}
#pedPainel .ped-lin button.pri{background:#2d6cdf;border-color:#2d6cdf}#pedPainel .ped-aviso{font-size:11px;opacity:.8;min-height:14px;margin-top:6px}
#pedPainel{max-height:calc(100vh - 140px);overflow:auto}#pedPainel .ped-cores{margin-top:8px}#pedPainel .ped-acs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 8px;margin-top:8px}#pedPainel .ped-vista{position:absolute;left:4px;bottom:2px;font-size:10px;opacity:.7;z-index:3}`;
export function instalarEditorPersonagem(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 if(!root.getElementById('pedCss')){const st=root.createElement('style');st.id='pedCss';st.textContent=CSS;root.head.append(st);}
 const POS='combatesAtivos/mapaMesaSyncDireta/posicoes';
 const D=id=>dep.doc(dep.db,...POS.split('/'),id);
 let alvoId='',vis=null,painel=null,botao=null;
 function alvoPossivel(){const c=ctl();if(!c||!c.tokensNoMapa)return null;const mestre=!!c.mestre?.();
  const ator=c.ator?.();if(ator&&ehPessoaTokenArte(ator)&&(mestre||c.controla?.(ator)))return ator;
  if(mestre)return null;return (c.tokensNoMapa()||[]).find(t=>ehPessoaTokenArte(t)&&c.controla?.(t))||null;}
 async function gravar(id,dados){let ult=null;for(let i=0;i<4;i++){try{const s=await dep.getDoc(D(id)),rev=Number((s.exists()?s.data():{}).revision||0);await dep.setDoc(D(id),{...dados,revision:rev+1},{merge:true});return true;}catch(e){ult=e;if(!/permission|aborted|conflict/i.test(String(e?.code||e?.message||e)))throw e;await new Promise(r=>setTimeout(r,120+Math.random()*180));}}throw ult;}
 const SUF={cima:'lado',frente:'frente',costas:'costas',lado:'perfil'};
 let ed={vista:'cima',acao:'parado'},animEd=null;
 /** prévia do personagem em qualquer vista; nas vistas de frente/lado/costas só existem parado e andar */
 function camadasPrev(host,v,vista){const cam=SPRITES_3D.cima_pessoa?.camadas;if(!cam)return;host.innerHTML='';
  const cor=corCamadasPessoa(v);
  for(const c of ordemCamadas(vista)){if(!cam[c]||!camadaVisivel(v,c))continue;const ac=(vista==='cima'||ed.acao==='parado'||ed.acao==='andar')?ed.acao:'parado',f=cam[c][ac+'_'+SUF[vista]]||cam[c]['parado_'+SUF[vista]];if(!f)continue;const url='url("'+BASE+f.arquivo+'")',tam=(f.quadros*100)+'% 100%';
   const g=root.createElement('div');g.className='a3dc';g.innerHTML='<i class="cor"></i><i class="som"></i>';const a=g.querySelector('.cor'),b=g.querySelector('.som');
   a.style.cssText='background-color:'+cor[c]+';-webkit-mask-image:'+url+';mask-image:'+url+';-webkit-mask-size:'+tam+';mask-size:'+tam+';-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:0 0;mask-position:0 0';g.dataset.q=String(f.quadros);g.dataset.dur=String(f.dur||1);g.dataset.ciclo=/^(parado|andar|deitado|sentado)$/.test(ac)?'1':'';
   b.style.cssText='background-image:'+url+';background-size:'+tam+';background-position:0 0';host.append(g);}
  const rot=root.createElement('span');rot.className='ped-vista';rot.textContent={cima:'de cima',frente:'frente',costas:'costas',lado:'lado'}[vista];host.append(rot);}
 /** avança os quadros da prévia (o mesmo ritmo do mapa) */
 function animaPrev(){const host=painel?.querySelector('.ped-prev');if(!host||painel.hidden)return;const agora=Date.now();for(const g of host.querySelectorAll('.a3dc')){const n=Number(g.dataset.q)||1;if(n<2)continue;const ciclo=(Number(g.dataset.dur)||1)*1000,i=g.dataset.ciclo?Math.floor((agora%ciclo)/ciclo*n)%n:Math.min(n-1,Math.floor((agora%(ciclo+900))/ciclo*n)),pos=(i/(n-1)*100)+'% 0';for(const k of g.querySelectorAll('i')){k.style.backgroundPosition=pos;k.style.webkitMaskPosition=k.style.maskPosition=pos;}}}
 function abrir(t){
  alvoId=t.id;vis=lerVisual(t.visualV203,t.id);
  if(!painel){painel=root.createElement('div');painel.id='pedPainel';root.body.append(painel);}
  const C=(k,r)=>`<label>${r}<input type="color" data-k="${k}" value="${vis[k]}"></label>`;
  painel.innerHTML=`<h3>🧑 Personagem <button type="button" data-x style="background:none;border:0;color:#fff;cursor:pointer;font-size:16px">✕</button></h3>
   <div class="ped-topo"><div class="ped-prev"></div><div class="ped-vistas"><button type="button" data-vista="cima" aria-pressed="true">⬇️ De cima</button><button type="button" data-vista="frente" aria-pressed="false">🧍 Frente</button><button type="button" data-vista="lado" aria-pressed="false">➡️ Lado</button><button type="button" data-vista="costas" aria-pressed="false">🔙 Costas</button><select data-acao><option value="parado">Parado</option><option value="andar">Andando</option><option value="atacar">Atacando</option><option value="golpe">Levando golpe</option><option value="morrer">Caindo</option><option value="sentado">Sentado</option><option value="deitado">Deitado</option></select></div></div>
   <div class="ped-lin"><label style="flex:1">Estilo pronto <select data-estilo><option value="">— escolher —</option>${ESTILOS_PESSOA.map(([c,n])=>`<option value="${c}">${n}</option>`).join('')}</select></label></div>
   <div class="ped-cores">${C('p','Pele')}${C('r','Roupa')}${C('q','Calça')}${C('d','Detalhes')}${C('k','Cabelo')}${C('c','Capa')}${C('e','Desenho da capa')}${C('a','Acessórios')}</div>
   <div class="ped-lin"><label style="flex:1">Arma na mão <select data-arma-vis><option value="">Sem arma</option><option value="E">Espada de energia</option><option value="P">Pistola</option><option value="G">Fuzil</option></select></label><span style="flex:1;font-size:11px;color:#9fb3cc" data-arma-dica>A arma escolhida aparece na miniatura e no golpe.</span></div>
   <div class="ped-lin" data-aviso-capacete hidden style="color:#ffd27a;font-size:12px">⚠️ Há um capacete equipado ou marcado: ele esconde o cabelo. Desmarque "Capacete" e tire o capacete da ficha para ver o cabelo.</div>
   <div class="ped-lin"><label style="flex:1">Cabelo <select data-h>${CABELOS_PESSOA.map(([c,n])=>`<option value="${c}">${n}</option>`).join('')}</select></label><label style="flex:1"><input type="checkbox" data-capa> Usar capa</label></div>
   <div class="ped-lin"><label style="flex:1">Desenho da capa <select data-m>${PADROES_CAPA.map(([c,n])=>`<option value="${c}">${n}</option>`).join('')}</select></label><label style="flex:1">Orelhas <select data-o>${ORELHAS_PESSOA.map(([c,n])=>`<option value="${c}">${n}</option>`).join('')}</select></label></div>
   <div class="ped-acs">${ACESSORIOS_PESSOA.map(([c,n])=>`<label><input type="checkbox" data-ac="${c}"> ${n}</label>`).join('')}</div>
   <div class="ped-lin"><button type="button" data-sorteio>🎲 Sortear</button><button type="button" data-orig>🖼️ Imagem original</button></div>
   <div class="ped-lin"><button type="button" data-cancelar>Cancelar</button><button type="button" class="pri" data-salvar>💾 Salvar</button></div><div class="ped-aviso" data-aviso>O que o personagem equipa (mochila, capacete, capa…) aparece sozinho na miniatura.</div>`;
  painel.hidden=false;painel.querySelector('[data-h]').value=vis.h;painel.querySelector('[data-m]').value=vis.m;painel.querySelector('[data-o]').value=vis.o;painel.querySelectorAll('[data-ac]').forEach(i=>{i.checked=vis.x.includes(i.dataset.ac);});painel.querySelector('[data-capa]').checked=!!vis.capa;
  const aviso=m=>{painel.querySelector('[data-aviso]').textContent=m;};
  const atualiza=()=>{{const av=painel.querySelector('[data-aviso-capacete]');if(av)av.hidden=!(String(vis.x||'').includes('K')||String(vis.z||'').includes('K'));}camadasPrev(painel.querySelector('.ped-prev'),vis,ed.vista);animaPrev();try{win.mesaArte3dV200?.previaVisual(t.id,textoVisual(vis));}catch(_){}};
  painel.querySelectorAll('input[type=color]').forEach(i=>i.oninput=()=>{vis[i.dataset.k]=i.value;atualiza();});
  painel.querySelectorAll('[data-vista]').forEach(b=>b.onclick=()=>{ed.vista=b.dataset.vista;painel.querySelectorAll('[data-vista]').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));const s=painel.querySelector('[data-acao]');for(const o of s.options)o.disabled=ed.vista!=='cima'&&!/^(parado|andar)$/.test(o.value);if(s.selectedOptions[0]?.disabled){s.value='parado';ed.acao='parado';}atualiza();});
  painel.querySelector('[data-acao]').onchange=e=>{ed.acao=e.target.value;atualiza();};
  clearInterval(animEd);animEd=setInterval(()=>{try{animaPrev();}catch(_){}},70);
  painel.querySelector('[data-h]').onchange=e=>{vis.h=e.target.value;atualiza();};
  {const sel=painel.querySelector('[data-arma-vis]'),dica=painel.querySelector('[data-arma-dica]');
   const letra=txt=>/fuzil|rifle|carabina|metralh/i.test(txt)?'G':/pistola|rev[oó]lver|laser|blaster|arma de fogo/i.test(txt)?'P':/espada|l[aâ]mina|sabre|katana|faca|machado/i.test(txt)?'E':'';
   const atual=String(vis.z||'').replace(/[^EPG]/g,'')[0]||'';let sug='';
   try{sug=letra(String(document.querySelector('#novaSyncWeapon')?.selectedOptions?.[0]?.textContent||''));}catch(_){}
   sel.value=atual||sug||'';
   if(!atual&&sug){vis.z=String(vis.z||'')+sug;if(dica)dica.textContent='Sugerida pela arma escolhida na barra de ação. Salve para aplicar.';}
   sel.onchange=()=>{vis.z=String(vis.z||'').replace(/[EPG]/g,'')+sel.value;atualiza();};}
  painel.querySelector('[data-o]').onchange=e=>{vis.o=e.target.value;atualiza();};
  painel.querySelectorAll('[data-ac]').forEach(i=>i.onchange=()=>{vis.x=[...painel.querySelectorAll('[data-ac]')].filter(z=>z.checked).map(z=>z.dataset.ac).join('');atualiza();});
  painel.querySelector('[data-estilo]').onchange=e=>{const est=ESTILOS_PESSOA.find(x=>x[0]===e.target.value);if(!est)return;Object.assign(vis,est[2]);painel.querySelectorAll('input[type=color]').forEach(i=>{i.value=vis[i.dataset.k];});atualiza();};
  painel.querySelector('[data-m]').onchange=e=>{vis.m=e.target.value;atualiza();};
  painel.querySelector('[data-capa]').onchange=e=>{vis.capa=e.target.checked?1:0;atualiza();};
  painel.querySelector('[data-sorteio]').onclick=()=>{const p=l=>l[Math.floor(Math.random()*l.length)];vis.p=p(PALETAS_PESSOA.pele);vis.r=p(PALETAS_PESSOA.roupa);vis.q=p(PALETAS_PESSOA.calca);vis.d=p(PALETAS_PESSOA.detalhe);vis.k=p(PALETAS_PESSOA.cabelo);vis.c=p(PALETAS_PESSOA.capa);vis.e=p(PALETAS_PESSOA.detalhe);vis.h=p(CABELOS_PESSOA.map(x=>x[0]));vis.m=p(PADROES_CAPA.map(x=>x[0]));vis.o=p(ORELHAS_PESSOA.map(x=>x[0]));vis.a=p(PALETAS_PESSOA.detalhe);painel.querySelectorAll('input[type=color]').forEach(i=>{i.value=vis[i.dataset.k];});painel.querySelector('[data-h]').value=vis.h;painel.querySelector('[data-m]').value=vis.m;painel.querySelector('[data-o]').value=vis.o;atualiza();};
  const fechar=()=>{painel.hidden=true;clearInterval(animEd);try{win.mesaArte3dV200?.previaVisual(t.id,null);}catch(_){}};
  painel.querySelector('[data-x]').onclick=fechar;painel.querySelector('[data-cancelar]').onclick=fechar;
  painel.querySelector('[data-salvar]').onclick=async()=>{try{aviso('⏳ Salvando…');await gravar(t.id,{visualV203:textoVisual(vis),arte3dV200:'cima_pessoa'});win.mesaArte3dV200?.previaVisual(t.id,null);aviso('✔ Salvo');}catch(e){aviso('⚠️ Não salvou: '+(e?.code||e?.message||e));}};
  painel.querySelector('[data-orig]').onclick=async()=>{try{aviso('⏳ Trocando…');await gravar(t.id,{arte3dV200:''});aviso('✔ Voltou para a imagem original (salve de novo para usar o desenho de cima)');}catch(e){aviso('⚠️ '+(e?.code||e?.message||e));}};
  atualiza();
 }
 function tick(){
  if(!existe3D('cima_pessoa'))return;
  if(!botao){botao=root.createElement('button');botao.id='pedBotao';botao.type='button';botao.hidden=true;botao.textContent='🧑 Editar personagem';botao.onclick=()=>{const t=alvoPossivel();if(t)abrir(t);};}
  {const barra=root.getElementById('mbMais')?.parentElement;if(barra){if(botao.parentElement!==barra)barra.insertBefore(botao,root.getElementById('mbMais'));botao.classList.add('ped-na-barra');}else{const sc=root.getElementById('novaSyncBoard')?.parentElement||root.body;if(botao.parentElement!==sc)sc.append(botao);}}
  let t=null;try{t=alvoPossivel();}catch(_){}botao.hidden=!t;if(!t&&painel&&!painel.hidden&&alvoId&&!ctl()?.token?.(alvoId))painel.hidden=true;
 }
 const iv=setInterval(()=>{try{tick();}catch(e){console.warn('[Personagem]',e);}},1000);iv.unref?.();
 const api={abrir,tick,alvoPossivel,parar:()=>clearInterval(iv)};win.mesaPersonagemEditor=api;return api;
}
