// Mesa Estelar v200 — aba "👾 Criaturas" do Diretor: adicionar criaturas/NPCs e classificar (agressiva, sanguinária, defensiva, aliada).
//
// • Adicionar: escolhe a criatura (ou NPC), quantidade, atitude, grupo e personalidade → entra no mapa já classificada.
// • A primeira classificação de uma ESPÉCIE vira o padrão dela (as outras da espécie herdam); cada uma pode ser trocada depois.
// • NPC que não é criatura: padrão defensivo (só ataca se atacado).
// • Lista do mapa: troca atitude/grupo/personalidade de cada miniatura; "padrão" devolve ao padrão da espécie.
import {tamanhoMiniaturaM} from './mesa-tamanhos.js?v=134';
import {lista3D,aparencia3DToken,lerAjuste,textoAjuste} from './mesa-arte3d.js?v=200';
import {DIETAS} from './mesa-exploracao.js?v=200';
import {ARMAS_RAPIDAS,DEFESAS_RAPIDAS,srcIcone} from './mesa-icones-itens.js?v=201';
import {ATITUDES,CONFIANCA,AJUDA,GRUPOS_ALIADOS,PERSONALIDADES,rotuloGrupo,TERRITORIO_PADRAO_M,especieDe,ehCriaturaToken} from './mesa-atitudes-ia.js?v=200';

const opt=(obj,sel,f)=>Object.entries(obj).map(([k,v])=>`<option value="${k}"${k===sel?' selected':''}>${f(v)}</option>`).join('');
const dec=id=>{try{return decodeURIComponent(String(id||''));}catch(_){return String(id||'');}};

export function criarPainelCriaturas({esc,api,listarTokens,colocar,criaturas,npcs,registrar}){
 let form={tipo:'criaturas',modelo:'',qtd:1,atitude:'defensiva',grupo:'a',terr:0,pers:'comum',conf:'',ajuda:'',dieta:''},lista=[];
 const A=()=>api();
 const optModelos=()=>{const l=(form.tipo==='criaturas'?criaturas():npcs())||[];return l.slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt')).map(m=>`<option value="${esc(m.id)}"${String(m.id)===String(form.modelo)?' selected':''}>${esc(m.nome||m.id)}</option>`).join('');};
 const selConf=(sel,vazio)=>`<option value="">${vazio||'Confiança: padrão'}</option>${opt(CONFIANCA,String(sel),v=>v.icone+' '+v.nome)}`;
 const selAjuda=(sel,vazio)=>`<option value="">${vazio||'Ajuda: padrão'}</option>${opt(AJUDA,String(sel),v=>'🫂 '+v.nome)}`;
 const selDieta=(sel,vazio)=>`<option value="">${vazio||'Alimentação: padrão'}</option>${opt(DIETAS,String(sel),v=>(v.icone?v.icone+' ':'')+v.nome)}`.replace('<option value="" selected>','<option value="">');
 const nomeConf=c=>c===null||c===undefined?'Cautelosa':CONFIANCA[c].nome,nomeAjuda=a=>AJUDA[a??0].nome;
 const selAtitude=(sel,vazio)=>`${vazio?`<option value="">${vazio}</option>`:''}${opt(ATITUDES,sel,v=>v.icone+' '+v.nome)}`;
 const rotuloAtitude=a=>a?`${ATITUDES[a.id].icone} ${ATITUDES[a.id].nome}${a.id==='aliada'?' · '+rotuloGrupo(a.grupo):''}`:'—';
 function html(){
  const mod=A();
  if(!mod)return '<div style="color:#9fb3cc;padding:8px 0">As atitudes ainda estão carregando… feche e abra a gaveta em alguns segundos.</div>';
  const padroes=mod.padroes(),especies=Object.keys(padroes);
  const dica=form.tipo==='npcs'?'NPC comum é <b>defensivo</b> por padrão (só ataca se atacado).':`A primeira classificação desta espécie vira o <b>padrão</b> de todas as outras dela${padroes[especieDeModelo()]?' (já existe: '+ATITUDES[padroes[especieDeModelo()].atitude].nome+')':''}.`;
  return `<div class="md-sep">Adicionar ao mapa</div>
  <div class="md-linha"><select data-cr-tipo style="flex:0 0 112px"><option value="criaturas"${form.tipo==='criaturas'?' selected':''}>Criatura</option><option value="npcs"${form.tipo==='npcs'?' selected':''}>NPC</option></select>
   <select data-cr-modelo>${optModelos()}</select><input type="number" min="1" max="12" value="${form.qtd}" data-cr-qtd style="flex:0 0 56px" title="Quantidade"></div>
  <div class="md-linha"><select data-cr-atitude title="Atitude">${selAtitude(form.atitude)}</select>
   <select data-cr-grupo title="Grupo de aliados" style="flex:0 0 120px"${form.atitude==='aliada'?'':' hidden'}>${GRUPOS_ALIADOS.map(g=>`<option value="${g}"${g===form.grupo?' selected':''}>${esc(rotuloGrupo(g))}</option>`).join('')}</select></div>
  <div class="md-linha"><select data-cr-pers title="Personalidade">${opt(PERSONALIDADES,form.pers,v=>v.icone+' '+v.nome)}</select>
   <input type="number" min="0" max="30" value="${form.terr||''}" placeholder="Território (m)" data-cr-terr title="Raio do território, em metros (0 = ${TERRITORIO_PADRAO_M} m)" style="flex:0 0 120px"${form.atitude==='agressiva'?'':' hidden'}></div>
  <div class="md-linha"><select data-cr-conf title="Confiança: ${esc(Object.values(CONFIANCA).map(v=>v.nome+' ('+v.desc+')').join(' · '))}">${selConf(form.conf)}</select>
   <select data-cr-dieta title="Alimentação: ${esc(Object.values(DIETAS).map(v=>v.nome+' ('+v.desc+')').join(' · '))}">${selDieta(form.dieta,'Alimentação: nenhuma')}</select>
   <select data-cr-ajuda title="Ajuda: ${esc(Object.values(AJUDA).map(v=>v.nome+' ('+v.desc+')').join(' · '))}">${selAjuda(form.ajuda)}</select></div>
  <div style="color:#9fb3cc;font-size:11px;margin:2px 0 6px">${ATITUDES[form.atitude].desc}. ${dica}</div>
  <div class="md-linha"><button type="button" class="btn-small btn-select" data-cr-add style="flex:1">➕ Colocar no mapa</button></div>
  <div data-cr-st style="color:#9fb3cc;min-height:1.2em"></div>
  ${(()=>{const e=tamanhosErrados();return e.length?`<div class="md-sep">Tamanhos pelo bestiário (${e.length} diferentes)</div><div class="md-cartao" style="padding:6px 8px">${e.slice(0,12).map(x=>`<div class="md-linha" style="margin:2px 0"><span style="flex:1">${esc(x.t.nome||dec(x.t.id))}</span><span>${String(x.atual).replace('.',',')} → <b>${String(x.sug).replace('.',',')} m</b></span></div>`).join('')}<button type="button" class="btn-small btn-select" data-cr-tamanhos style="width:100%;margin-top:6px">📏 Ajustar todos pelo bestiário</button></div>`:'';})()}
  <div class="md-sep">No mapa (${lista.length})</div>
  ${lista.map(t=>{const a=mod.atitudeDe(t);const esp=especieDe(t);return `<div class="md-cartao" style="padding:6px 8px;margin:4px 0">
    <div style="font-weight:600">${esc(t.nome||dec(t.id))}${t.atitudeV200?'':' <small style="color:#9fb3cc;font-weight:400">· padrão</small>'}</div>
    <div class="md-linha" style="margin:4px 0 0"><select data-cr-tk="${esc(t.id)}" data-campo="atitude">${selAtitude(t.atitudeV200||'',a?'↺ padrão ('+rotuloAtitude(a)+')':'— sem atitude —')}</select>
    <select data-cr-tk="${esc(t.id)}" data-campo="pers" style="flex:0 0 128px">${opt(PERSONALIDADES,t.personalidadeV200||'comum',v=>v.icone+' '+v.nome)}</select></div>
    <div class="md-linha" style="margin:4px 0 0"><select data-cr-tk="${esc(t.id)}" data-campo="conf">${selConf(t.confiancaV200??'','↺ confiança ('+nomeConf(a?.confianca)+')')}</select><select data-cr-tk="${esc(t.id)}" data-campo="ajuda">${selAjuda(t.ajudaV200??'','↺ ajuda ('+nomeAjuda(a?.ajuda)+')')}</select><select data-cr-tk="${esc(t.id)}" data-campo="dieta">${selDieta(t.dietaV200??'','↺ alimentação ('+(DIETAS[A()?.padraoDe?.(especieDe(t))?.dieta||'']?.nome||'—')+')')}</select></div></div>`;}).join('')||'<div style="color:#9fb3cc">Nenhuma criatura ou NPC neste mapa.</div>'}
  <div class="md-sep">Padrões por espécie (${especies.length})</div>
  ${especies.map(e=>`<div class="md-linha"><span style="flex:1">${esc(e.replace(/_/g,' '))}</span><select data-cr-esp="${esc(e)}" style="flex:0 0 150px">${selAtitude(padroes[e].atitude)}</select></div><div class="md-linha" style="margin-top:0"><select data-cr-esp-conf="${esc(e)}">${selConf(padroes[e].confianca??'','Confiança: Cautelosa')}</select><select data-cr-esp-ajuda="${esc(e)}">${selAjuda(padroes[e].ajuda??'','Ajuda: padrão da atitude')}</select></div>`).join('')||'<div style="color:#9fb3cc">Nenhum ainda — a primeira classificação cria o padrão.</div>'}`;
 }
 /** tokens cujo tamanho no mapa difere do bestiário (≥ 25%) */
 function tamanhosErrados(){
  const out=[];for(const t of lista){const m=/^sync(criatura|npc):(.+)$/.exec(dec(t.id));if(!m)continue;const base=m[2].replace(/~\d+$/,''),mod=(m[1]==='criatura'?criaturas():npcs()).find(x=>String(x.id)===base);if(!mod)continue;
   const sug=tamanhoMiniaturaM(mod),atual=Number(t.diametroM)||1;if(Math.abs(sug-atual)/Math.max(.1,sug)>=.25)out.push({t,sug,atual});}
  return out;
 }
 function especieDeModelo(){return String(form.modelo||'');}
 async function recarregar(){try{lista=(await listarTokens()).filter(t=>!t.donoUid&&/^sync(npc|criatura):/.test(dec(t.id)));}catch(_){lista=[];}}
 function ligar(gaveta,redesenhar){
  const $=q=>gaveta.querySelector(q),st=t=>{const e=$('[data-cr-st]');if(e)e.textContent=t||'';};
  const ler=()=>{form.tipo=$('[data-cr-tipo]').value;form.modelo=$('[data-cr-modelo]').value;form.qtd=Math.max(1,Math.min(12,Number($('[data-cr-qtd]').value)||1));form.atitude=$('[data-cr-atitude]').value;form.grupo=$('[data-cr-grupo]').value;form.pers=$('[data-cr-pers]').value;form.terr=Number($('[data-cr-terr]').value)||0;form.conf=$('[data-cr-conf]').value;form.ajuda=$('[data-cr-ajuda]').value;form.dieta=$('[data-cr-dieta]').value;};
  if(!A())return;
  if(!form.modelo)form.modelo=String(((form.tipo==='criaturas'?criaturas():npcs())||[])[0]?.id||'');
  const quando=(sel,fn)=>gaveta.querySelectorAll(sel).forEach(el=>el.addEventListener('change',async()=>{try{await fn(el);}catch(e){st('⚠️ '+(e?.code||e?.message||e));}}));
  quando('[data-cr-tipo]',()=>{ler();form.modelo='';if(form.tipo==='npcs')form.atitude='defensiva';redesenhar();}); // NPC comum: defensivo por padrão
  quando('[data-cr-modelo],[data-cr-atitude]',()=>{ler();redesenhar();}); // só estes mudam o desenho (dica e campos extras)
  quando('[data-cr-grupo],[data-cr-pers],[data-cr-terr],[data-cr-qtd],[data-cr-conf],[data-cr-ajuda],[data-cr-dieta]',()=>ler()); // sem redesenhar: não pode trocar o botão debaixo do clique
  $('[data-cr-add]')?.addEventListener('click',async()=>{
   try{
    ler();const modelos=(form.tipo==='criaturas'?criaturas():npcs())||[],modelo=modelos.find(m=>String(m.id)===String(form.modelo));
    if(!modelo)return st('Escolha o que colocar.');
    const mod=A(),esp=form.tipo==='criaturas'?String(modelo.id):'';
    // primeira classificação da espécie = padrão; depois só vale para as novas se for diferente do padrão
    let extra={};
    if(esp&&!mod.padraoDe(esp))await mod.definirPadrao(esp,{atitude:form.atitude,grupo:form.grupo,territorioM:form.terr,confianca:form.conf,ajuda:form.ajuda,dieta:form.dieta});
    else{const p=esp?mod.padraoDe(esp):null;if(!esp&&form.atitude==='defensiva'){/* NPC defensivo = padrão, nada a gravar */}else if(!p||p.atitude!==form.atitude||(form.atitude==='aliada'&&p.grupo!==form.grupo)||(form.atitude==='agressiva'&&(Number(p.territorioM)||0)!==form.terr))extra={atitudeV200:form.atitude,grupoV200:form.grupo,territorioMV200:form.atitude==='agressiva'?form.terr:0};}
    if(form.pers!=='comum')extra.personalidadeV200=form.pers;
    {const p=esp?mod.padraoDe(esp):null; // confiança e ajuda: só grava no token se foi escolhido e é diferente do padrão da espécie
     if(form.conf!==''&&String(p?.confianca??'')!==form.conf)extra.confiancaV200=Number(form.conf);
     if(form.ajuda!==''&&String(p?.ajuda??'')!==form.ajuda)extra.ajudaV200=Number(form.ajuda);
     if(form.dieta!==''&&String(p?.dieta??'')!==form.dieta)extra.dietaV200=form.dieta;}
    await colocar([{tipo:form.tipo,modelo,qtd:form.qtd,extra}]);
    st(`✔ ${form.qtd} × ${modelo.nome} colocad${form.qtd>1?'as':'a'}.`);registrar?.(`👾 ${form.qtd} × ${modelo.nome} (${ATITUDES[form.atitude].nome})`);
    await recarregar();setTimeout(redesenhar,400);
   }catch(e){st('⚠️ '+(e?.code||e?.message||e));}
  });
  $('[data-cr-tamanhos]')?.addEventListener('click',async()=>{try{let n=0;for(const x of tamanhosErrados()){if(await A().definirTamanho(x.t,x.sug))n++;}st('✔ '+n+' tamanho(s) ajustado(s).');await recarregar();setTimeout(redesenhar,400);}catch(e){st('⚠️ '+(e?.code||e?.message||e));}});
  quando('[data-cr-tk]',async el=>{
   const t=lista.find(x=>x.id===el.dataset.crTk);if(!t)return;
   if(el.dataset.campo==='pers')await A().definirToken(t,{personalidade:el.value});
   else if(el.dataset.campo==='conf')await A().definirToken(t,{confianca:el.value});
   else if(el.dataset.campo==='ajuda')await A().definirToken(t,{ajuda:el.value});
   else if(el.dataset.campo==='dieta')await A().definirToken(t,{dieta:el.value});
   else if(el.value==='')await A().definirToken(t,{atitude:null});
   else await A().definirToken(t,{atitude:el.value,grupo:t.grupoV200||'a',territorioM:t.territorioMV200||0});
   await recarregar();redesenhar();
  });
  quando('[data-cr-esp]',async el=>{await A().definirPadrao(el.dataset.crEsp,{...(A().padraoDe(el.dataset.crEsp)||{}),atitude:el.value});redesenhar();});
  quando('[data-cr-esp-conf]',async el=>{const e=el.dataset.crEspConf,p=A().padraoDe(e);if(p)await A().definirPadrao(e,{...p,confianca:el.value});redesenhar();});
  quando('[data-cr-esp-ajuda]',async el=>{const e=el.dataset.crEspAjuda,p=A().padraoDe(e);if(p)await A().definirPadrao(e,{...p,ajuda:el.value});redesenhar();});
 }
 return {html,ligar,recarregar};
}

// ======================================================================================================================
// Cartão "Comportamento": aparece sozinho quando o mestre SELECIONA uma criatura/NPC no mapa, e quando entra uma criatura NOVA
// (sem padrão da espécie) — por qualquer caminho: catálogo, Diretor, gerador, encontro. Mesmos campos do painel 👾.
// ======================================================================================================================
const CSS_CARTAO=`#mdCartao .mc-visual{margin:2px 0 4px;border:1px solid #243651;border-radius:10px;padding:4px 8px}#mdCartao .mc-visual summary{cursor:pointer;font-size:12px}#mdCartao .mc-visual .mc-reg{display:grid;grid-template-columns:78px 1fr 40px;gap:6px;align-items:center;font-size:12px;margin:3px 0}#mdCartao .mc-visual .mc-reg span:last-child{text-align:right;opacity:.8}#mdCartao .mc-visual .mc-linha{margin-top:4px}
#mdCartao .mc-salvar{display:flex;gap:8px;align-items:center;margin:8px 0 4px}#mdCartao .mc-salvar .mc-info{margin:0}#mdCartao .mc-escolha{margin:4px 0 6px;padding:8px;border:1px solid #ffb86b;border-radius:10px;background:#1b1408}#mdCartao .mc-escolha[hidden]{display:none}#mdCartao .mc-tam{display:flex;align-items:center;gap:6px;font-size:12px}#mdCartao .mc-tam input{width:70px}#mdCartao .mc-diag{border-top:1px solid #243651;padding-top:5px}
#mdCartao{position:fixed;left:72px;bottom:12px;width:390px;z-index:9985;background:#101828;border:1px solid #8ee7ff;border-radius:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.6);padding:10px 12px 12px}
#mdCartao[hidden]{display:none}
#mdCartao .mc-topo{display:flex;align-items:center;gap:8px;margin-bottom:6px}#mdCartao .mc-topo b{flex:1;color:#8ee7ff;font-size:13px}
#mdCartao .mc-aviso{color:#ffd58a;font-size:11px;margin:0 0 6px}#mdCartao .mc-linha{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:5px 0}
#mdCartao select{width:100%;min-width:0;font-size:12px}#mdCartao .mc-info{color:#9fb3cc;font-size:11px;margin-top:6px}`;
export function criarCartaoComportamento({root,esc,api,ctl,criaturas,npcs}){
 let el=null,alvoId='',fechadoPara='',vistos=null,fila=[],dispensaNovos=false,abertoFicha=false,pend={},pendId='',msgSalvo='',abertoAjuste=false;
 const opt=(obj,sel,f)=>Object.entries(obj).map(([k,v])=>`<option value="${k}"${String(k)===String(sel)?' selected':''}>${f(v)}</option>`).join('');
 const dec=id=>{try{return decodeURIComponent(String(id||''));}catch(_){return String(id||'');}};
 const ehBicho=t=>t&&!t.donoUid&&/^sync(criatura|npc):/.test(dec(t.id));
 const modeloDe=t=>{const m=/^sync(criatura|npc):(.+)$/.exec(dec(t.id));if(!m)return null;const base=m[2].replace(/~\d+$/,'');return (m[1]==='criatura'?criaturas():npcs()).find(x=>String(x.id)===base)||null;};
 function montar(){
  if(el)return el;
  if(!root.getElementById('mdCartaoCss')){const st=root.createElement('style');st.id='mdCartaoCss';st.textContent=CSS_CARTAO;root.head.append(st);}
  el=root.createElement('aside');el.id='mdCartao';el.hidden=true;el.addEventListener('pointerdown',e=>e.stopPropagation());root.body.append(el);return el;
 }
 function desenhar(t,novo){
  const mod=api();if(!mod||!t){fechar();return;}
  const A=mod.atitudeDe(t),esp=especieDe(t),eh=ehCriaturaToken(t),padrao=eh?mod.padraoDe(esp):null,m=modeloDe(t);
  if(pendId!==t.id){pend={};pendId=t.id;msgSalvo='';}
  const ps=(k,d)=>k in pend?pend[k]:d,nPend=Object.keys(pend).length;
  const dietaPad=padrao?.dieta||'';
  const dg=mod.diagnostico?mod.diagnostico(t):null,rotAt=dg&&dg.atitude?ATITUDES[dg.atitude]:null;
  const dr=(()=>{try{return globalThis.mesaTempoRealV111?.diagnosticoCriatura?.(t.id)||null;}catch(_){return null;}})(),drTxt=dr?(' · motor: '+(dr.auto?'age sozinha':'NÃO age sozinha')+(dr.dados?', dados ok ('+dr.ataques+' ataque(s), anda '+String(dr.mov??0).replace('.',',')+' m)':', carregando dados da ficha…')+(dr.imovel?', parada por perfil':'')+(dr.fila?', ação na fila':'')+', vê '+dr.viu+' alvo(s)'+(dr.fugindo?', fugindo':'')):'';
  const diagTxt=dg?('Agora: '+(rotAt?rotAt.icone+' '+rotAt.nome+(dg.origem==='token'?' (deste personagem)':dg.origem==='especie'?' (da espécie)':''):'sem atitude')+' · tempo real '+dg.rt+' · alvos hostis: '+dg.alvos.length+(dg.alvos.length?' (mais perto: '+dg.alvos[0].nome+', '+String(dg.alvos[0].m).replace('.',',')+' m)':'')+drTxt):'';
  const sug=m?tamanhoMiniaturaM(m):null,diam=Number(t.diametroM)||1,difTam=!!sug&&Math.abs(sug-diam)/Math.max(.1,sug)>=.25;
  const vir=n=>String(n).replace('.',',');
  const cl=ctl()?.saude?.(t.id)||null,ks=Object.keys(cl?.hitMax||{}),pvMax=ks.reduce((n,k)=>n+Math.max(0,Number(cl.hitMax[k])||0),0),pvAt=ks.reduce((n,k)=>n+Number(cl.hit?.[k]??cl.hitMax[k]),0);
  el.innerHTML=`<div class="mc-topo"><b>👾 ${esc(t.nome||dec(t.id))}</b><button type="button" class="btn-small" data-mc="x" title="Fechar">✕</button></div>
   ${novo?'<div class="mc-aviso">Criatura nova: escolha como ela se comporta. A primeira escolha vira o padrão de toda a espécie.</div>':''}
   <div class="mc-linha"><select data-mc="atitude" title="Agressão">${A?'':'<option value="">— sem atitude —</option>'}${t.atitudeV200?'<option value="">↺ padrão ('+esc(A?ATITUDES[A.id].nome:'—')+')</option>':''}${opt(ATITUDES,ps('atitude',t.atitudeV200||A?.id||''),v=>v.icone+' '+v.nome)}</select>
    <select data-mc="pers" title="Personalidade">${opt(PERSONALIDADES,ps('pers',mod.personalidadeDe?mod.personalidadeDe(t):(t.personalidadeV200||'comum')),v=>v.icone+' '+v.nome)}</select></div>
   <div class="mc-linha"><select data-mc="conf" title="Confiança"><option value="">Confiança: padrão (${A?.confianca==null?'Cautelosa':CONFIANCA[A.confianca].nome})</option>${opt(CONFIANCA,ps('conf',t.confiancaV200??''),v=>v.icone+' '+v.nome)}</select>
    <select data-mc="ajuda" title="Ajuda"><option value="">Ajuda: padrão (${AJUDA[A?.ajuda??0].nome})</option>${opt(AJUDA,ps('ajuda',t.ajudaV200??''),v=>'🫂 '+v.nome)}</select></div>
   <div class="mc-linha"><select data-mc="dieta" title="Alimentação"><option value="">Alimentação: ${esc(DIETAS[dietaPad]?.nome||'não precisa')}</option>${opt(DIETAS,ps('dieta',t.dietaV200??''),v=>(v.icone?v.icone+' ':'')+v.nome)}</select>
    <label class="mc-tam" title="Diâmetro da miniatura no mapa, em metros">📏 Tamanho <input type="number" data-mf="tam" min="0.3" max="12" step="0.1" value="${diam}"> m</label></div>
   ${difTam?`<div class="mc-linha" style="grid-template-columns:1fr"><button type="button" class="btn-small" data-mc="tam" title="Tamanho pelo bestiário">📏 Usar o do bestiário: ${vir(diam)} → ${vir(sug)} m</button></div>`:''}
   ${dr&&!dr.auto?'<div class="mc-aviso">Esta criatura está sob controle manual e não inicia ataques sozinha. <button type="button" class="btn-small" data-mc="ia">🤖 Devolver à IA</button></div>':''}
   <div class="mc-salvar"><button type="button" class="btn-small" data-mc="salvar" ${nPend?'':'disabled'} title="Salva atitude, personalidade, confiança, ajuda e alimentação">💾 Salvar comportamento</button><span class="mc-info" data-mc="aviso-salvo">${esc(msgSalvo||(nPend?'Mudanças ainda não salvas.':''))}</span></div>
   <div class="mc-escolha" hidden><div class="mc-info" style="margin:0 0 6px">Aplicar a quem?</div><div class="mc-linha"><button type="button" class="btn-small" data-mc="so-este">👤 Alterar só este personagem</button><button type="button" class="btn-small" data-mc="toda-especie" ${eh&&esp?'':'disabled title="Este não tem espécie: só vale para ele"'}>🧬 Alterar toda a espécie${eh&&esp?' ('+esc(esp)+')':''}</button></div><button type="button" class="btn-small" data-mc="cancelar-salvar">Cancelar</button></div>
   <div class="mc-linha" style="grid-template-columns:1fr"><select data-mc="arte3d" title="Aparência 3D animada (andar, atacar, morrer)"><option value="">🎭 Aparência: arte de antes</option>${(()=>{const g={};for(const o of lista3D()){const i=o.nome.indexOf(' · '),k=i>0?o.nome.slice(0,i):'Outros';(g[k]=g[k]||[]).push(o);}return Object.entries(g).map(([k,l])=>`<optgroup label="${esc(k)}">${l.map(o=>`<option value="${o.id}"${aparencia3DToken(t)===o.id?' selected':''}>🎬 ${esc(o.nome)}</option>`).join('')}</optgroup>`).join('');})()}</select></div>
   ${aparencia3DToken(t)?(()=>{const aj=lerAjuste(t.arte3dAjusteV203),R=(k,r,mn,mx,st)=>`<label class="mc-reg"><span>${r}</span><input type="range" data-av="${k}" min="${mn}" max="${mx}" step="${st}" value="${aj[k]}"><span data-avv="${k}">${aj[k]}</span></label>`;return `<details class="mc-visual" ${abertoAjuste?'open':''}><summary>🎨 Ajustar visual (cor, brilho, tamanho)</summary>${R('h','Cor',-180,180,5)}${R('s','Saturação',0,250,5)}${R('b','Brilho',50,160,5)}${R('z','Tamanho %',50,200,5)}${R('g','Giro °',-180,180,5)}<div class="mc-linha"><button type="button" class="btn-small" data-av-salvar="1">👤 Salvar só este</button><button type="button" class="btn-small" data-av-salvar="esp" ${eh&&esp?'':'disabled'}>🧬 Salvar na espécie</button></div><div class="mc-linha"><button type="button" class="btn-small" data-av-restaurar="1">↺ Restaurar original</button><span class="mc-info" data-av-aviso="1" style="align-self:center"></span></div></details>`;})():''}
   <details class="mc-ficha" ${abertoFicha?'open':''}><summary style="cursor:pointer;color:#8ee7ff;margin:6px 0">📋 Ficha rápida (nome, vida, ataque, defesa)</summary>
    <div class="mc-linha" style="grid-template-columns:1fr"><label>Nome <input type="text" data-mf="nome" value="${esc(t.nome||'')}" maxlength="60" style="width:100%"></label></div>
    <div class="mc-linha"><label>Vida máx. <input type="number" data-mf="pv" min="1" max="9999" value="${pvMax||''}" placeholder="?" style="width:100%"></label><button type="button" class="btn-small" data-mf="curar" title="Enche a vida e levanta se estava caído" style="align-self:end">❤️ Curar tudo${pvMax?' ('+Math.max(0,Math.round(pvAt))+'/'+Math.round(pvMax)+')':''}</button></div>
    <div class="mc-linha"><label>Ataque % <input type="number" data-mf="atq" min="-60" max="60" value="${Number(t.bonusAtaqueV200||0)}" style="width:100%"></label><label>Defesa % <input type="number" data-mf="def" min="-60" max="60" value="${Number(t.bonusDefesaV200||0)}" style="width:100%"></label></div>
    <div class="mc-linha mc-equipa"><label>⚔️ Arma <select data-me="arma">${ARMAS_RAPIDAS.map(a=>`<option value="${a.id}"${a.bonus===Number(t.bonusAtaqueV200||0)?' selected':''}>${esc(a.nome)}${a.bonus?' (+'+a.bonus+'%)':''}</option>`).join('')}</select></label><label>🛡️ Proteção <select data-me="defesa">${DEFESAS_RAPIDAS.map(a=>`<option value="${a.id}"${a.bonus===Number(t.bonusDefesaV200||0)?' selected':''}>${esc(a.nome)}${a.bonus?' (+'+a.bonus+'%)':''}</option>`).join('')}</select></label></div>
    <div class="mc-linha mc-equipa"><div class="mc-icone" data-mi="arma" style="min-height:40px"></div><div class="mc-icone" data-mi="defesa" style="min-height:40px"></div></div>
    <div class="mc-info">Vale só para esta criatura. Ataque e defesa somam pontos percentuais à perícia (de −60 a +60). Escolher arma ou proteção preenche o bônus.</div></details>
   <div class="mc-info">${eh?(padrao?'Padrão da espécie: '+ATITUDES[padrao.atitude].nome:'Sem padrão ainda para esta espécie.'):'NPC comum: defensivo por padrão.'}</div>
   <div class="mc-info mc-diag">${esc(diagTxt)}</div>`;
  el.hidden=false;
  el.querySelector('[data-mc="x"]').onclick=()=>{fechadoPara=alvoId;fechar();};
  const aplicar=async(campo,v)=>{
   if(['atitude','pers','conf','ajuda','dieta'].includes(campo)){pend[campo]=v;msgSalvo='';const b=el.querySelector('[data-mc="salvar"]');if(b)b.disabled=false;const i=el.querySelector('[data-mc="aviso-salvo"]');if(i)i.textContent='Mudanças ainda não salvas.';el.querySelector('.mc-escolha').hidden=true;return;}
   try{
    if(campo==='arte3d')await mod.definirArte3d(t,v);
    else if(campo==='tam'&&sug)await mod.definirTamanho(t,sug);
   }catch(e){const i=el.querySelector('.mc-info');if(i)i.textContent='⚠️ '+(e?.code||e?.message||e);return;}
   setTimeout(()=>{if(alvoId!==t.id)return;const nt=ctl()?.token?.(t.id)||{...t};desenhar(nt,false);},500);
  };
  el.querySelectorAll('select[data-mc]').forEach(s=>{s.onchange=()=>aplicar(s.dataset.mc,s.value);});
  const mapaPend=()=>{const c={};if('atitude' in pend)c.atitude=pend.atitude;if('pers' in pend)c.personalidade=pend.pers;if('conf' in pend)c.confianca=pend.conf;if('ajuda' in pend)c.ajuda=pend.ajuda;if('dieta' in pend)c.dieta=pend.dieta;return c;};
  const salvarPend=async especie=>{const i=el.querySelector('[data-mc="aviso-salvo"]');try{if(i)i.textContent='⏳ Salvando…';const c=mapaPend();const r=especie?await mod.aplicarEspecie(t,c):await mod.aplicarToken(t,c);msgSalvo=especie?'✔ Salvo para toda a espécie'+(r?.total?' ('+r.total+' no mapa)':''):'✔ Salvo só para este personagem';pend={};try{mod.verificarAgora?.();}catch(_){}}catch(e){msgSalvo='⚠️ Não salvou: '+(e?.code||e?.message||e);}setTimeout(()=>{if(alvoId!==t.id)return;const nt=ctl()?.token?.(t.id)||{...t};desenhar(nt,false);},500);};
  {const det=el.querySelector('.mc-visual');if(det){det.addEventListener('toggle',()=>{abertoAjuste=det.open;});
   const lerR=()=>{const a={};el.querySelectorAll('[data-av]').forEach(r=>{a[r.dataset.av]=Number(r.value);});return textoAjuste(lerAjuste(Object.entries(a).map(([k,v])=>k+'='+v).join(';')));};
   const aviso=m=>{const i=el.querySelector('[data-av-aviso]');if(i)i.textContent=m;};
   el.querySelectorAll('[data-av]').forEach(r=>r.addEventListener('input',()=>{const v=el.querySelector('[data-avv="'+r.dataset.av+'"]');if(v)v.textContent=r.value;try{window.mesaArte3dV200?.previa(t.id,lerR());}catch(_){}}));
   el.querySelectorAll('[data-av-salvar]').forEach(b=>b.onclick=async()=>{try{aviso('⏳ Salvando…');const n=await mod.definirArteAjuste(t,lerR(),b.dataset.avSalvar==='esp');window.mesaArte3dV200?.previa(t.id,null);aviso(n>1?'✔ Salvo em '+n+' no mapa':'✔ Salvo');}catch(e){aviso('⚠️ '+(e?.code||e?.message||e));}});
   el.querySelector('[data-av-restaurar]').onclick=async()=>{try{await mod.definirArteAjuste(t,'',false);window.mesaArte3dV200?.previa(t.id,null);el.querySelectorAll('[data-av]').forEach(r=>{const p={h:0,s:100,b:100,z:100,g:0}[r.dataset.av];r.value=p;const v=el.querySelector('[data-avv="'+r.dataset.av+'"]');if(v)v.textContent=p;});aviso('✔ Voltou ao original');}catch(e){aviso('⚠️ '+(e?.code||e?.message||e));}};}}
  el.querySelector('[data-mc="salvar"]').onclick=()=>{el.querySelector('.mc-escolha').hidden=false;};
  el.querySelector('[data-mc="cancelar-salvar"]').onclick=()=>{el.querySelector('.mc-escolha').hidden=true;};
  el.querySelector('[data-mc="so-este"]').onclick=()=>salvarPend(false);
  el.querySelector('[data-mc="toda-especie"]').onclick=()=>salvarPend(true);
  el.querySelector('input[data-mf="tam"]')?.addEventListener('change',async ev=>{const v=Math.max(.3,Math.min(12,Number(ev.target.value)||1));try{await mod.definirTamanho(t,v);}catch(e){const i=el.querySelector('.mc-info');if(i)i.textContent='⚠️ '+(e?.code||e?.message||e);}setTimeout(()=>{if(alvoId!==t.id)return;const nt=ctl()?.token?.(t.id)||{...t};desenhar(nt,false);},500);});
  el.querySelector('[data-mc=ia]')?.addEventListener('click',async()=>{try{await globalThis.mesaTempoRealV111?.definirAutomatico(t.id,true);desenhar(ctl()?.token?.(t.id)||t,false);}catch(e){msgSalvo=e.message;desenhar(t,false);}});
  const fichaApl=async(campo,v)=>{try{abertoFicha=true;if(campo==='nome')await mod.definirFicha(t,{nome:v});else if(campo==='atq')await mod.definirFicha(t,{bonusAtaque:v});else if(campo==='def')await mod.definirFicha(t,{bonusDefesa:v});else if(campo==='pv')await mod.definirVida(t,v);else if(campo==='curar')await mod.definirVida(t,Number(el.querySelector('[data-mf="pv"]')?.value)||pvMax||10,{curar:true});}catch(e){const i=el.querySelector('.mc-info');if(i)i.textContent='⚠️ '+(e?.code||e?.message||e);return;}
   setTimeout(()=>{if(alvoId!==t.id)return;const nt=ctl()?.token?.(t.id)||{...t};desenhar(nt,false);},500);};
  el.querySelectorAll('input[data-mf]').forEach(i=>{i.addEventListener('change',()=>fichaApl(i.dataset.mf,i.value));});
  el.querySelector('button[data-mf="curar"]')?.addEventListener('click',()=>fichaApl('curar'));
  el.querySelectorAll('select[data-me]').forEach(sel=>{sel.addEventListener('change',()=>{const tipo=sel.dataset.me,lista=tipo==='arma'?ARMAS_RAPIDAS:DEFESAS_RAPIDAS,it=lista.find(x=>x.id===sel.value)||lista[0],box=el.querySelector('[data-mi="'+tipo+'"]');if(box)box.innerHTML=it.id?'<img src="'+srcIcone(it.id)+'" alt="" width="40" height="40" style="vertical-align:middle"> <span class="mc-info">'+esc(it.nome)+'</span>':'';const campo=el.querySelector('input[data-mf="'+(tipo==='arma'?'atq':'def')+'"]');if(campo){campo.value=it.bonus;fichaApl(tipo==='arma'?'atq':'def',String(it.bonus));}});});
  el.querySelector('[data-mc="tam"]')?.addEventListener('click',()=>aplicar('tam'));
 }
 function fechar(){if(el)el.hidden=true;}
 /** chamado a cada ~2 s pelo Diretor (só mestre) */
 function tick(){
  const c=ctl();if(!c||!api())return;montar();
  if(alvoId&&pendId===alvoId&&Object.keys(pend).length)return; // há mudança por salvar: não troca de criatura no meio da edição
  let noMapa=[];try{noMapa=(c.tokensNoMapa?.()||[]).filter(ehBicho);}catch(_){}
  const ids=new Set(noMapa.map(t=>t.id));
  if(vistos===null){vistos=ids;return;} // o que já estava no mapa não vira pergunta
  for(const t of noMapa){if(!vistos.has(t.id)){vistos.add(t.id);const mod=api(),esp=especieDe(t);
    if(!dispensaNovos&&ehCriaturaToken(t)&&!t.atitudeV200&&!mod.padraoDe(esp))fila.push(t.id);}}
  for(const id of [...vistos])if(!ids.has(id))vistos.delete(id);
  // 1) criatura NOVA ainda sem comportamento: pergunta primeiro (vale para a espécie inteira)
  while(fila.length){const id=fila[0],t=c.token?.(id);if(!t||t.atitudeV200||api().padraoDe(especieDe(t))){fila.shift();continue;}
   if(alvoId!==id){alvoId=id;fechadoPara='';desenhar(t,true);}return;}
  // 2) o que o mestre selecionou
  let sel=null;try{const s=c.selecao?.();if(s?.id)sel=c.token?.(s.id)||null;if(!sel){const a=c.ator?.();if(a?.id)sel=c.token?.(a.id)||a;}}catch(_){}
  if(sel&&ehBicho(sel)){if(sel.id!==alvoId){alvoId=sel.id;fechadoPara='';desenhar(c.token?.(sel.id)||sel,false);}return;}
  if(alvoId&&!sel){alvoId='';fechar();}
 }
 return {tick,fechar,mostrar:t=>{montar();alvoId=t.id;fechadoPara='';desenhar(t,false);},dispensarNovos:()=>{dispensaNovos=true;fila=[];}};
}
