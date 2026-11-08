// Mesa Estelar v204 — O que o personagem veste aparece na miniatura.
// Mochila, capacete, chapéu, coroa, capa e armadura equipados na ficha viram acessórios desenhados na miniatura de cima (e nas vistas do editor).
// A ficha só pode ser lida pelo dono e pelo mestre; por isso quem a lê (cada jogador para o seu, o mestre para todos) resume o que está
// equipado em letras e grava no próprio token (visualV203, chave z=…). Assim todos veem o mesmo, sem expor a ficha.
// Letras: M mochila · K capacete · C chapéu · O coroa · A capa · S ombreiras/armadura · E arma branca (espada, lança, machado…) · P pistola · G fuzil · L lanterna · T tocha · N espada de energia (luz).
// NPCs do bestiário (syncnpc:…) não têm ficha: o equipamento vem do próprio cadastro do NPC (armasTexto/inventarioTexto). Módulo à parte: se falhar, nada muda.
import {tipoMini} from './mesa-itens-mini.js?v=192';
import {lerVisual,textoVisual,ehPessoaTokenArte} from './mesa-arte3d.js?v=200';

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
/** letras dos itens EQUIPADOS que aparecem no desenho (puro): ex.: [mochila, capacete] → 'KM' */
export function letrasEquipadas(equipado){
 const s=new Set();
 for(const it of Array.isArray(equipado)?equipado:[]){
  if(!it)continue;
  const t=sem([it.nome,it.name,it.idBanco,it.id].join(' ')),tp=tipoMini(it);
  if(/mochila|backpack|alforje/.test(t))s.add('M');
  if(tp==='capacete'||/capacete|elmo|\bhelm/.test(t))s.add('K');
  else if(/chapeu|boina|gorro|bone\b/.test(t))s.add('C');
  if(/coroa|tiara|diadema/.test(t))s.add('O');
  if(/\bcapa\b|manto|capote|clamide|cloak/.test(t))s.add('A');
  if(tp==='armadura'&&!/escudo/.test(t))s.add('S');
  if(/espada|sabre|katana|lamina|lanca|machado|faca|adaga|cajado|bastao|martelo|picareta/.test(t)||tp==='espada'||tp==='espada_energia'||tp==='faca'||tp==='machado')s.add('E');
  if(tp==='pistola'||/pistola|revolver/.test(t))s.add('P');
  if(tp==='rifle'||/rifle|fuzil|carabina|escopeta/.test(t))s.add('G');
  // fontes de luz EMPUNHADAS (só o que está equipado; guardado na mochila não acende): L lanterna · T tocha · N espada de energia
  if(/lanterna|lamparina/.test(t))s.add('L');
  if(/tocha/.test(t))s.add('T');
  if(tp==='espada_energia'||/sabre de luz|espada de energia|espada laser|lamina de energia|katana de energia/.test(t))s.add('N');
 }
 return [...s].sort().join('');
}
/** letras a partir do texto do cadastro de um NPC ('Rifle Laser|Pistola Laser'): armas e itens vestíveis, separados por | */
export const letrasDoTexto=txt=>letrasEquipadas(String(txt||'').split(/[|;]/).map(x=>x.trim()).filter(Boolean).map(nome=>({nome})));
/** Roupa/acessórios continuam equipados; só a arma selecionada fica na mão. */
export function letrasComArmaAtiva(equipado,activeWeaponId){
 const items=(Array.isArray(equipado)?equipado:[]).filter(it=>it?.nome);
 if(activeWeaponId===undefined)return letrasEquipadas(items);
 const id=String(activeWeaponId||'');
 const chosen=items.find((it,i)=>String(it.instanciaId||it.instanceId||it.idInstancia||it.id||'equipado_'+i)===id);
 const worn=letrasEquipadas(items).replace(/[EPGN]/g,'');
 return [...new Set(worn+letrasEquipadas(chosen?[chosen]:[]).replace(/[^EPGN]/g,''))].sort().join('');
}
/** novo texto de visual com as letras equipadas (z), sem mexer no que a pessoa escolheu no editor */
export function visualComEquipamento(texto,id,letras){const v=lerVisual(texto,id);if(v.z===letras)return null;return textoVisual({...v,z:letras});}

export function instalarEquipVisual(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const POS='combatesAtivos/mapaMesaSyncDireta/posicoes',D=id=>dep.doc(dep.db,...POS.split('/'),id);
 const assinaturas=new Map(),inventarios=new Map(),gravando=new Set();
 async function gravar(id,texto){
  if(gravando.has(id))return;gravando.add(id);
  try{await dep.runTransaction(dep.db,async tx=>{const ref=D(id),s=await tx.get(ref);if(!s.exists())return;const d=s.data();if(d.visualV203===texto)return;tx.set(ref,{visualV203:texto,revision:Number(d.revision||0)+1},{merge:true});});}
  finally{gravando.delete(id);}
 }
 function sincronizar(t){const items=inventarios.get(t.id);if(!items)return;
  const novo=visualComEquipamento(t.visualV203,t.id,letrasComArmaAtiva(items,t.activeWeaponId));
  if(novo)void gravar(t.id,novo).catch(e=>console.warn('[Equip visual]',e?.code||e?.message||e));
 }
 function escutar(t){
  const id=t.id,raw=decodeURIComponent(String(id));
  if(raw.startsWith('syncnpc:')){   // NPC do bestiário: sem ficha; usa o cadastro do NPC (uma vez)
   const base=raw.slice(8).split('~')[0],m=(dep.npcs?.()||[]).find(n=>String(n.id)===base);if(!m)return;
   const letras=letrasDoTexto([m.armasTexto,m.inventarioTexto,m.equipamentoTexto].filter(Boolean).join('|')),novo=visualComEquipamento(t.visualV203,id,letras);
   assinaturas.set(id,()=>{});if(novo)gravar(id,novo).catch(e=>console.warn('[Equip visual]',e?.code||e?.message||e));return;
  }
  const fn=dep.onSnapshot(dep.doc(dep.db,'personagens/'+raw),s=>{
   if(!s.exists())return;
   inventarios.set(id,s.data()?.inventario?.equipado||[]);const atual=ctl()?.token?.(id)||ctl()?.tokensNoMapa?.().find(x=>x.id===id);if(atual)sincronizar(atual);
  },()=>{});
  assinaturas.set(id,fn);
 }
 function atualizar(){
  const c=ctl();if(!c?.tokensNoMapa)return;
  const mestre=!!c.mestre?.(),vivos=new Set();
  for(const t of c.tokensNoMapa()||[]){
   if(!ehPessoaTokenArte(t)||(!mestre&&!c.controla?.(t)))continue;
   vivos.add(t.id);if(!assinaturas.has(t.id)&&assinaturas.size<40)escutar(t);else sincronizar(t);
  }
  for(const [id,fn] of [...assinaturas]){if(!vivos.has(id)){try{fn();}catch(_){}assinaturas.delete(id);inventarios.delete(id);}}
 }
 const iv=setInterval(()=>{try{atualizar();}catch(e){console.warn('[Equip visual]',e);}},400);iv.unref?.();
 return {atualizar,parar(){clearInterval(iv);for(const fn of assinaturas.values()){try{fn();}catch(_){}}assinaturas.clear();}};
}
