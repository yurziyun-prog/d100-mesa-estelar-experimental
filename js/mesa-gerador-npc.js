// Mesa Estelar v199 — Gerador de NPCs e criaturas do mestre (motor do MapForge) dentro do 🧭 Diretor de cena.
//
// • NPCs: papel, raça, carreira, nível de poder 1–6, quantidade e semente. Ficha completa pelas regras d100 do jogo (atributos por pool,
//   perícias, PV, sorte, pontos de magia, modificador de dano, traços, motivação, equipamento) — dados reais dos bancos do jogo.
// • Criaturas: espécie do bestiário de Calico (ou sorteio), habitat, poder mínimo, quantidade (matilhas) e semente.
// • Miniaturas artísticas novas (arte/miniaturas): cada ficha mostra a arte; "Colocar no mapa" já entra com as animações de movimento e ataque.
// • A mesma semente gera sempre o mesmo resultado (para repetir um encontro). Nada é gravado até o mestre clicar em Salvar/Colocar.
// O motor (js/mesa-npc-motor.js) é empacotado por scripts/empacotar-npc-motor.cjs a partir de fontes/mapforge.
import {spriteDePapel,grandeDePapel,spriteDeEspecie,grandeDeEspecie,SPRITE_POR_PAPEL} from './mesa-sprites-npc.js?v=199';

let M=null,carregando=null;
export const motorCarregado=()=>!!M;
/** baixa o motor só quando preciso (fica fora do carregamento inicial do site) */
export function carregarMotor(){return carregando||(carregando=import('./mesa-npc-motor.js?v=199').then(m=>{M=m;return m;}));}
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const slug=s=>sem(s).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'npc';
const NOME_ATR=['FOR','CON','TAM','DES','INT','POD','CAR'];

export const spriteDaFicha=f=>f.tipo==='criatura'?spriteDeEspecie(f.especieId):spriteDePapel(f.papel);
export const grandeDaFicha=f=>f.tipo==='criatura'?grandeDeEspecie(f.especieId):grandeDePapel(f.papel);
/** id do arquivo de arte usado pela ficha (vai marcado no token para ele usar a miniatura artística) */
export const idArteDaFicha=f=>f.tipo==='criatura'?String(f.especieId||''):(SPRITE_POR_PAPEL[f.papel]||'npc_combatente');

const pericias=f=>(f.pericias||[]).map(p=>`${p.nome}:${p.valor}`).join('|');
const especs=f=>(f.especializacoes||[]).map(p=>`${p.nome}:${p.valor}`).join('|');

/** Ficha gerada → modelo bruto de NPC do banco do site (o site normaliza e grava como qualquer NPC) */
export function fichaParaModeloNpc(f){
 const raca=M?.RACAS?.find(r=>r.nome===f.raca),a=f.atributos||{};
 const id='npc_'+slug(f.nome)+'_'+Math.floor(Math.random()*1e4);
 return {
  id,nome:f.nome,tipo:'NPC',raca:f.raca||'Humano',sexo:f.sexo||'',idade:String(f.idade||''),carreira:f.carreira||'',conceito:f.conceito||'',classeSocial:f.classeSocial||'',
  sociedade:raca?.sociedade||'',
  FOR:String(a.FOR),CON:String(a.CON),TAM:String(a.TAM),DES:String(a.DES),INT:String(a.INT),POD:String(a.POD),CAR:String(a.CAR),
  motivacao:f.motivacao||'',periciasTexto:pericias(f),especializacoesTexto:especs(f),
  armasTexto:(f.armas||[]).join('|'),inventarioTexto:(f.equipamento||[]).join('|'),equipamentoBaseTexto:(f.equipamento||[]).join('|'),
  descricao:`${f.descricao||''}${(f.tracos||[]).length?' Traços: '+f.tracos.join('; ')+'.':''}`.trim(),
  selecionavelCombate:'true',
  imagem:spriteDaFicha(f)
 };
}

/** texto da ficha, pronto para copiar */
export function textoFicha(f){
 const a=f.atributos||{},L=[];
 L.push(`${f.nome} — ${f.tipo==='criatura'?'criatura':'NPC'} · ${f.poderRotulo} (poder ${f.poder})`);
 if(f.tipo!=='criatura')L.push(`${f.raca||''} · ${f.carreira||''}${f.conceito?' ('+f.conceito+')':''}${f.idade?' · '+f.idade+' anos':''}${f.sexo?' · '+f.sexo:''}`);
 else L.push(`${f.habitat||''} · ${f.comportamento||''} · ${f.tamanho||''}`);
 L.push(NOME_ATR.map(k=>`${k} ${a[k]}`).join(' · ')+` · PV ${f.pv} · Sorte ${f.sorte} · PM ${f.pontosMagia} · Dano ${f.modDano}`);
 if((f.pericias||[]).length)L.push('Perícias: '+f.pericias.map(p=>`${p.nome} ${p.valor}%`).join(', '));
 if((f.especializacoes||[]).length)L.push('Especializações: '+f.especializacoes.map(p=>`${p.nome} ${p.valor}%`).join(', '));
 if((f.armas||[]).length)L.push('Ataques/armas: '+f.armas.join(', '));
 if((f.habilidades||[]).length)L.push('Habilidades: '+f.habilidades.join(', '));
 if((f.equipamento||[]).length)L.push('Equipamento: '+f.equipamento.join(', '));
 if((f.tracos||[]).length)L.push('Traços: '+f.tracos.join('; '));
 if(f.motivacao)L.push('Motivação: '+f.motivacao);
 if(f.descricao)L.push(f.descricao);
 return L.join('\n');
}

/**
 * Painel do gerador. api: {esc, status(texto), salvarNpc(modeloBruto, idArte, colocar)→Promise<texto>, colocarCriatura(ficha)→Promise<texto>}
 * Devolve {html(), ligar(raiz, redesenhar)}.
 */
export function criarGeradorNpc(api){
 const E=api.esc;
 let tipo='npc',res=[],ultimaSemente=0;
 const op={papel:'combatente',raca:'aleatoria',carreira:'',poder:3,qtd:1,seed:'',esp:'',hab:'',pmin:0,cqtd:1};
 let racas=[],carreiras=[],especies=[],habitats=[],PAPEIS=[],PODERES=[];
 function preparar(){racas=M.RACAS.map(r=>r.nome).sort((a,b)=>a.localeCompare(b,'pt'));carreiras=[...new Set(M.CARREIRAS.map(c=>c.nome))].sort((a,b)=>a.localeCompare(b,'pt'));especies=[...M.CRIATURAS].sort((a,b)=>a.nome.localeCompare(b.nome,'pt'));habitats=M.habitatsDeCriaturas();PAPEIS=M.PAPEIS;PODERES=M.PODERES;}
 const sel=(k,lista,atual,vazio)=>`<select data-g="${k}">${vazio?`<option value="">${E(vazio)}</option>`:''}${lista.map(([v,t])=>`<option value="${E(v)}"${String(v)===String(atual)?' selected':''}>${E(t)}</option>`).join('')}</select>`;

 function cartao(f,i){
  const a=f.atributos||{},sp=spriteDaFicha(f),top=[...(f.pericias||[])].sort((x,y)=>y.valor-x.valor).slice(0,6);
  const meta=f.tipo==='criatura'?`${E(f.habitat||'')} · ${E(f.comportamento||'')}`:`${E(f.raca||'')} · ${E(f.carreira||'')}${f.idade?' · '+E(f.idade)+' anos':''}`;
  const ia=f.tipo==='criatura'?(()=>{try{const x=M.aiDaFicha(f);return x?`<div style="margin-top:4px;color:#9fb3cc;font-size:12px">Conduta: ${E(x.conduta||x.tipo||'')}</div>`:'';}catch(_){return '';}})():'';
  return `<div class="md-cartao" data-fi="${i}">
   <div style="display:flex;gap:10px"><div class="md-mini" style="flex:none;width:76px;height:76px">${sp?`<img src="${E(sp)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain">`:''}</div>
    <div style="min-width:0"><h4 style="margin:0 0 2px">${E(f.nome)}</h4><div style="color:#c6d3e6;font-size:12px">${meta}</div><div style="color:#9fb3cc;font-size:12px">${E(f.poderRotulo)} · poder ${f.poder}${f.tamanho?' · '+E(f.tamanho):''}</div></div></div>
   <div style="margin-top:6px;font-size:12px;color:#c6d3e6">${NOME_ATR.map(k=>`${k} ${a[k]}`).join(' · ')}<br>PV ${f.pv} · Sorte ${f.sorte} · PM ${f.pontosMagia} · Dano ${E(f.modDano)}${f.armaduraNatural?' · Armadura '+f.armaduraNatural:''}</div>
   ${top.length?`<div style="margin-top:4px;font-size:12px;color:#9fb3cc">${top.map(p=>`${E(p.nome)} ${p.valor}%`).join(' · ')}</div>`:''}
   ${(f.armas||[]).length?`<div style="margin-top:4px;font-size:12px;color:#c6d3e6">⚔ ${E(f.armas.join(', '))}</div>`:''}
   ${(f.habilidades||[]).length?`<div style="margin-top:4px;font-size:12px;color:#c6d3e6">✨ ${E(f.habilidades.join(', '))}</div>`:''}
   ${(f.tracos||[]).length?`<div style="margin-top:4px;font-size:12px;color:#9fb3cc;font-style:italic">${E(f.tracos.join('; '))}</div>`:''}
   ${f.motivacao?`<div style="margin-top:4px;font-size:12px;color:#9fb3cc">Motivação: ${E(f.motivacao)}</div>`:''}
   ${ia}
   <div class="md-linha" style="margin-top:8px;flex-wrap:wrap"><button type="button" class="btn-small btn-select" data-gcolocar="${i}">📍 Colocar no mapa</button>${f.tipo==='criatura'?'':`<button type="button" class="btn-small" data-gsalvar="${i}">💾 Salvar no banco</button>`}<button type="button" class="btn-small" data-garte="${i}" title="Ver a arte grande">🔍 Arte</button><button type="button" class="btn-small" data-gcopiar="${i}" title="Copiar a ficha como texto">📋</button></div>
  </div>`;
 }
 function html(){
  if(!M){carregarMotor().then(()=>{preparar();api.redesenhar?.();}).catch(e=>{console.warn('[Gerador]',e);api.status?.('Não consegui carregar o gerador: '+(e.message||e));});return '<div class="md-cartao">⏳ Carregando o gerador…</div><div data-st style="color:#9fb3cc;min-height:1.2em"></div>';}
  if(!PAPEIS.length)preparar();
  const poderes=PODERES.map(p=>[p.nivel,`${p.nivel} · ${p.rotulo}`]);
  const npc=`<div class="md-linha">${sel('papel',PAPEIS.map(p=>[p.id,p.rotulo]),op.papel)}${sel('raca',racas.map(r=>[r,r]),op.raca==='aleatoria'?'':op.raca,'Raça aleatória')}</div>
   <div class="md-linha">${sel('carreira',carreiras.map(c=>[c,c]),op.carreira,'Carreira do papel')}${sel('poder',poderes,op.poder)}</div>
   <div class="md-linha"><label style="display:flex;align-items:center;gap:6px">Quantidade <input type="number" data-g="qtd" min="1" max="8" value="${op.qtd}" style="width:56px"></label><input type="text" data-g="seed" value="${E(op.seed)}" placeholder="semente (opcional)" style="flex:1;min-width:0"></div>`;
  const cri=`<div class="md-linha">${sel('esp',especies.map(c=>[c.id,c.nome]),op.esp,'Espécie aleatória')}${sel('hab',habitats.map(h=>[h,h]),op.hab,'Qualquer habitat')}</div>
   <div class="md-linha">${sel('pmin',[[2,'poder 2+'],[3,'poder 3+'],[4,'poder 4+'],[5,'poder 5+'],[6,'poder 6']],op.pmin||'','Qualquer poder')}<label style="display:flex;align-items:center;gap:6px">Qtd <input type="number" data-g="cqtd" min="1" max="8" value="${op.cqtd}" style="width:56px"></label></div>
   <div class="md-linha"><input type="text" data-g="seed" value="${E(op.seed)}" placeholder="semente (opcional)" style="flex:1;min-width:0"></div>`;
  return `<div class="md-linha"><button type="button" class="btn-small" data-gtipo="npc" aria-pressed="${tipo==='npc'}">🧑 NPC</button><button type="button" class="btn-small" data-gtipo="criatura" aria-pressed="${tipo==='criatura'}">👾 Criatura</button></div>
   ${tipo==='npc'?npc:cri}
   <div class="md-linha"><button type="button" class="btn-small btn-select" data-ggerar>🎲 Gerar</button>${res.length>1?`<button type="button" class="btn-small" data-gtodos>📍 Todos no mapa (${res.length})</button>`:''}</div>
   ${res.length?`<div style="font-size:11px;color:#9fb3cc;margin:2px 0 4px">semente ${ultimaSemente} — repita o número para gerar o mesmo resultado</div>`:''}
   ${res.map(cartao).join('')}
   <div data-st style="color:#9fb3cc;min-height:1.2em"></div>`;
 }
 function gerar(raiz){
  const v=k=>raiz.querySelector(`[data-g="${k}"]`)?.value;
  const lerNum=(k,min,max,pad)=>Math.max(min,Math.min(max,Math.round(Number(v(k)))||pad));
  op.seed=String(v('seed')||'').trim();
  const bruto=op.seed?Number(op.seed):NaN;
  const seed=Number.isFinite(bruto)&&bruto>=0?Math.floor(bruto)%2147483647:Math.floor(Math.random()*2147483647);
  ultimaSemente=seed;
  if(tipo==='npc'){
   op.papel=v('papel')||op.papel;op.raca=v('raca')||'aleatoria';op.carreira=v('carreira')||'';op.poder=lerNum('poder',1,6,3);op.qtd=lerNum('qtd',1,8,1);
   res=M.gerarNpc({seed,papel:op.papel,poder:op.poder,quantidade:op.qtd,racaId:op.raca,carreira:op.carreira||undefined}).fichas;
  }else{
   op.esp=v('esp')||'';op.hab=v('hab')||'';op.pmin=Number(v('pmin'))||0;op.cqtd=lerNum('cqtd',1,8,1);
   res=M.gerarCriaturas({seed,quantidade:op.cqtd,criaturaId:op.esp||undefined,habitat:op.hab||undefined,poderMin:op.pmin||undefined}).fichas;
  }
 }
 async function colocarFicha(f,silencio=false){
  const msg=f.tipo==='criatura'?await api.colocarCriatura(f):await api.salvarNpc(fichaParaModeloNpc(f),idArteDaFicha(f),true);
  if(!silencio)api.status(msg);return msg;
 }
 function verArte(f,raiz){
  const g=grandeDaFicha(f);if(!g)return;
  const doc=raiz.ownerDocument;let m=doc.getElementById('mdArteGrande');m?.remove();
  m=doc.createElement('div');m.id='mdArteGrande';m.style.cssText='position:fixed;inset:0;z-index:10050;background:rgba(5,8,16,.9);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;cursor:zoom-out';
  m.innerHTML=`<img src="${E(g)}" alt="" style="max-width:min(92vw,900px);max-height:84vh;object-fit:contain;filter:drop-shadow(0 8px 24px #000)"><div style="color:#e8eefc;font:600 14px 'Segoe UI',Arial,sans-serif">${E(f.nome)} — toque para fechar</div>`;
  m.addEventListener('click',()=>m.remove());doc.body.append(m);
 }
 function ligar(raiz,redesenhar){
  const manter=()=>{for(const k of ['papel','raca','carreira','poder','qtd','esp','hab','pmin','cqtd','seed']){const el=raiz.querySelector(`[data-g="${k}"]`);if(el&&el.value!==undefined){if(k==='raca')op.raca=el.value||'aleatoria';else if(k==='poder'||k==='qtd'||k==='cqtd'||k==='pmin')op[k]=Number(el.value)||(k==='pmin'?0:1);else op[k]=el.value;}}};
  raiz.querySelectorAll('[data-gtipo]').forEach(b=>b.addEventListener('click',()=>{manter();tipo=b.dataset.gtipo;res=[];redesenhar();}));
  raiz.querySelector('[data-ggerar]')?.addEventListener('click',()=>{try{gerar(raiz);}catch(e){console.warn('[Gerador]',e);api.status('Não consegui gerar: '+(e.message||e));return;}redesenhar();});
  const busy=new Set();
  const acao=(sel,fn)=>raiz.querySelectorAll(sel).forEach(b=>b.addEventListener('click',async()=>{const i=Number(b.dataset[Object.keys(b.dataset).find(k=>/^g(colocar|salvar|arte|copiar)$/.test(k))]);const f=res[i];if(!f||busy.has(sel+i))return;busy.add(sel+i);try{await fn(f,i);}catch(e){console.warn('[Gerador]',e);api.status('Falhou: '+(e.message||e));}finally{busy.delete(sel+i);}}));
  acao('[data-gcolocar]',async f=>{api.status('Colocando…');await colocarFicha(f);});
  acao('[data-gsalvar]',async f=>{api.status('Salvando…');api.status(await api.salvarNpc(fichaParaModeloNpc(f),idArteDaFicha(f),false));});
  acao('[data-garte]',async f=>verArte(f,raiz));
  acao('[data-gcopiar]',async f=>{const t=textoFicha(f);try{await navigator.clipboard.writeText(t);api.status('Ficha copiada.');}catch(_){api.status('Não consegui copiar (o navegador bloqueou).');}});
  raiz.querySelector('[data-gtodos]')?.addEventListener('click',async()=>{api.status('Colocando todos…');let n=0;for(const f of res){try{await colocarFicha(f,true);n++;}catch(e){console.warn('[Gerador]',e);}}api.status(`${n} no mapa.`);});
 }
 return {html,ligar,fichas:()=>res,gerarDireto:(opcoes)=>{Object.assign(op,opcoes);}};
}
