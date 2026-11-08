// Mesa Estelar v148 — Retrato de perfil gerado para NPCs sem imagem (dados puros, sem DOM).
// Usa a mesma “ficha visual” das miniaturas (specDeNpc: pele, cabelo, roupa, armadura, espécie) e desenha um busto
// de perfil em SVG: humanos, reptilianos (focinho), insetoides (antenas, mandíbulas, carapaça), greys (crânio grande),
// nymari (orelhas longas), robôs (cabeça de metal com visor), crianças, guardas de capacete, capuzes e capas.

import {specDeNpc} from './mesa-miniaturas.js?v=194';

const F=n=>(+n).toFixed(1);
function tom(hex,d){const h=String(hex||'#888888').replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h.slice(0,6),16)||0;
 const f=c=>Math.max(0,Math.min(255,Math.round(d>=0?c+(255-c)*d:c*(1+d))));return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(c=>c.toString(16).padStart(2,'0')).join('');}
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};

// SVG (string) do retrato de perfil; s = spec das miniaturas (ou do specDeNpc).
export function svgRetrato(s={},{nome='',semente=''}={}){
 const r=hash(semente||nome),W=120,H=150,pele=s.pele||'#d9a47c',cab=s.corCabelo||'#3a2a1a',roupa=s.roupa||'#34507a',roupa2=s.roupa2||tom(roupa,-.35);
 const tr=s.tracos||{},robo=s.corpo==='robo',crianca=(Number(s.porte)||1)<.85&&!tr.cabecaGrande,esc=crianca?.82:1;
 const fundo=['#2a3550','#3a2a40','#2a403a','#40342a','#2a3a48'][r%5];
 const p=[];const add=x=>p.push(x);
 add(`<defs><radialGradient id="bg" cx=".4" cy=".35" r=".9"><stop offset="0" stop-color="${tom(fundo,.25)}"/><stop offset="1" stop-color="${tom(fundo,-.45)}"/></radialGradient>
<linearGradient id="pl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${tom(pele,-.25)}"/><stop offset=".6" stop-color="${pele}"/><stop offset="1" stop-color="${tom(pele,.12)}"/></linearGradient>
<linearGradient id="rp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tom(roupa,.12)}"/><stop offset="1" stop-color="${roupa2}"/></linearGradient></defs>`);
 add(`<rect width="${W}" height="${H}" fill="url(#bg)"/>`);
 // ombros e roupa (de perfil, virado para a direita)
 const oy=crianca?120:112;
 if(s.capa)add(`<path d="M2 ${H} C8 ${oy-6} 30 ${oy-14} 58 ${oy-12} C88 ${oy-12} 110 ${oy-2} 118 ${H}Z" fill="${tom(s.capa,-.1)}"/>`);
 add(`<path d="M10 ${H} C14 ${oy} 34 ${oy-8} 60 ${oy-8} C86 ${oy-8} 104 ${oy+2} 110 ${H}Z" fill="url(#rp)" stroke="${tom(roupa,-.5)}" stroke-width="1.5"/>`);
 if(s.armadura)add(`<path d="M26 ${oy+2} C40 ${oy-6} 76 ${oy-6} 92 ${oy+4} L88 ${oy+18} C72 ${oy+12} 46 ${oy+12} 30 ${oy+18}Z" fill="${s.corArmadura||'#6f7c8f'}" stroke="#20262e" stroke-width="1.5"/><path d="M34 ${oy+8} Q60 ${oy+2} 86 ${oy+10}" stroke="#ffffff" stroke-width="1.2" opacity=".35" fill="none"/>`);
 else add(`<path d="M52 ${oy-8} L60 ${oy+14} L70 ${oy-8}" fill="${tom(roupa,.25)}" stroke="${tom(roupa,-.5)}" stroke-width="1"/>`);
 if(s.capa)add(`<path d="M40 ${oy-10} Q60 ${oy-2} 82 ${oy-10} L80 ${oy-4} Q60 ${oy+4} 42 ${oy-4}Z" fill="${tom(s.capa,.15)}"/>`);
 if(tr.quatroBracos)add(`<path d="M24 ${oy+10} q-10 14 -6 ${H-oy}" stroke="${tom(pele,-.2)}" stroke-width="7" fill="none" stroke-linecap="round"/>`);
 // pescoço
 add(`<g transform="translate(60 ${crianca?78:70}) scale(${esc}) translate(-60 -70)">`);
 add(`<path d="M48 78 L50 100 Q60 106 72 100 L70 76Z" fill="${robo?'#5a6472':tom(pele,-.12)}"/>`);
 if(robo){
  const c=s.corArmadura||'#8d99ab',olho=s.corOlhos||'#57e3ff';
  add(`<path d="M34 30 Q36 10 62 10 Q90 10 92 34 L92 62 Q90 80 66 82 L46 82 Q34 78 34 62Z" fill="${c}" stroke="#1a2028" stroke-width="2"/>`);
  add(`<rect x="66" y="36" width="28" height="12" rx="5" fill="#0c1218" stroke="#1a2028" stroke-width="1.5"/><rect x="70" y="39" width="22" height="6" rx="3" fill="${olho}" opacity=".9"/>`);
  add(`<circle cx="46" cy="46" r="7" fill="${tom(c,-.25)}" stroke="#1a2028" stroke-width="1.5"/><path d="M40 66 H84 M44 72 H80" stroke="${tom(c,-.35)}" stroke-width="2"/><path d="M50 12 L48 2" stroke="#1a2028" stroke-width="2"/><circle cx="48" cy="2" r="2.5" fill="${olho}"/>`);
  add('</g>');add(nomeTxt(nome));return wrap(p,W,H);
 }
 if(tr.cabecaGrande){ // grey
  add(`<path d="M28 34 Q30 4 62 4 Q96 6 96 40 Q96 58 86 70 Q78 82 66 84 Q56 86 50 80 Q34 66 28 34Z" fill="url(#pl)" stroke="${tom(pele,-.45)}" stroke-width="1.6"/>`);
  add(`<path d="M74 40 Q90 38 92 50 Q86 60 74 56 Q68 48 74 40Z" fill="#0b0d10"/><path d="M80 44 q4 0 6 3" stroke="#fff" stroke-width="1.4" opacity=".6" fill="none"/><path d="M86 72 q-6 2 -10 0" stroke="${tom(pele,-.5)}" stroke-width="1.4" fill="none"/>`);
  add('</g>');add(nomeTxt(nome));return wrap(p,W,H);
 }
 // cabeça (perfil para a direita): crânio + rosto com testa, nariz, lábios e queixo
 const focinho=!!tr.focinho,inseto=!!tr.carapaca;
 const rosto=focinho?`M36 40 Q36 14 60 12 Q80 12 86 28 L104 40 Q108 46 102 50 L92 56 Q96 60 90 64 L80 68 Q72 82 58 82 Q42 80 38 64 Q34 54 36 40Z`
  :`M38 42 Q36 14 62 12 Q82 12 86 30 Q88 36 87 40 L92 50 Q93 53 88 54 L88 58 Q90 60 87 62 L86 66 Q86 70 82 72 Q76 82 64 82 Q48 82 42 70 Q38 58 38 42Z`;
 add(`<path d="${rosto}" fill="url(#pl)" stroke="${tom(pele,-.45)}" stroke-width="1.6"/>`);
 if(inseto){
  add(`<path d="M40 30 Q50 10 74 14 Q86 18 88 30 Q70 22 52 30Z" fill="${tom(pele,.18)}" stroke="${tom(pele,-.5)}" stroke-width="1.3"/><path d="M42 44 Q52 38 64 44" stroke="${tom(pele,-.4)}" stroke-width="1.3" fill="none"/>`);
  add(`<ellipse cx="77" cy="40" rx="8" ry="10" fill="#1a1f12" stroke="${tom(pele,-.5)}" stroke-width="1"/><path d="M74 35 q4 -1 6 3" stroke="#d8f0a0" stroke-width="1.2" opacity=".6" fill="none"/>`);
  add(`<path d="M80 18 Q92 2 106 4 M72 14 Q78 -2 96 -2" stroke="${tom(pele,-.3)}" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="106" cy="4" r="2.5" fill="${tom(pele,.2)}"/>`);
  if(tr.mandibulas)add(`<path d="M84 64 Q98 66 98 74 Q90 72 84 70Z M80 70 Q90 78 86 84 Q80 80 78 74Z" fill="${tom(pele,-.25)}" stroke="${tom(pele,-.55)}" stroke-width="1.2"/>`);
 }else{
  // olho, sobrancelha, boca, orelha
  const olho=tr.olhosBrilho?(s.corOlhos||'#ff3b3b'):'#1a1410';
  add(`<path d="M74 42 Q80 39 84 43" stroke="${tom(cab,-.2)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  add(`<path d="M75 47 Q79 45 83 47 Q79 49 75 47Z" fill="#f4efe6"/><circle cx="80" cy="47" r="1.8" fill="${olho}"/>${tr.olhosBrilho?`<circle cx="80" cy="47" r="4" fill="${olho}" opacity=".35"/>`:''}`);
  add(focinho?`<path d="M92 60 L80 62" stroke="${tom(pele,-.55)}" stroke-width="1.4"/><circle cx="100" cy="44" r="1.3" fill="${tom(pele,-.6)}"/>`:`<path d="M84 64 Q80 65 77 64" stroke="${tom(pele,-.55)}" stroke-width="1.4" fill="none"/>`);
  if(focinho){for(let i=0;i<6;i++)add(`<path d="M${44+i*7} ${30+(i%2)*6} q3 2 6 0" stroke="${tom(pele,-.35)}" stroke-width="1.1" fill="none" opacity=".7"/>`);}
  if(tr.orelhasLongas)add(`<path d="M52 44 Q30 22 20 8 Q36 26 52 56Z" fill="${tom(pele,-.08)}" stroke="${tom(pele,-.45)}" stroke-width="1.4"/>`);
  else if(!focinho)add(`<path d="M52 46 Q46 46 46 54 Q46 62 54 62" fill="${tom(pele,-.1)}" stroke="${tom(pele,-.45)}" stroke-width="1.4"/>`);
  // cabelo
  const c=s.cabelo||'curto';
  if(s.cabeca==='capacete')add(`<path d="M34 42 Q32 8 62 8 Q90 8 92 36 L92 40 L60 40 L58 50 L34 52Z" fill="${s.corArmadura||'#6f7c8f'}" stroke="#20262e" stroke-width="2"/><path d="M40 22 Q60 12 84 20" stroke="#fff" stroke-width="1.4" opacity=".35" fill="none"/>`);
  else if(s.cabeca==='capuz')add(`<path d="M28 70 Q22 20 56 6 Q86 0 94 30 L88 34 Q78 18 60 18 Q42 20 40 46 Q40 64 46 80Z" fill="${s.capa||'#22252e'}" stroke="#0e1014" stroke-width="1.8"/>`);
  else if(focinho||c==='careca'){}
  else if(c==='longo'||c==='rabo')add(`<path d="M36 46 Q30 10 62 8 Q86 8 88 28 Q74 18 58 22 Q48 26 46 40 Q46 70 ${c==='rabo'?'40 74 Q30 92 22 98 Q28 80 34 70':'54 96 Q36 98 30 86 Q30 64 36 46'}Z" fill="${cab}" stroke="${tom(cab,-.4)}" stroke-width="1.4"/>`);
  else if(c==='coque')add(`<path d="M38 42 Q34 10 62 9 Q86 9 88 28 Q74 18 56 22 Q46 28 44 44Z" fill="${cab}" stroke="${tom(cab,-.4)}" stroke-width="1.4"/><circle cx="38" cy="22" r="11" fill="${cab}" stroke="${tom(cab,-.4)}" stroke-width="1.4"/>`);
  else if(c==='crespo')add(`<path d="M34 46 Q24 22 40 10 Q58 -2 78 6 Q94 14 90 30 Q76 20 60 24 Q48 28 46 46Z" fill="${cab}" stroke="${tom(cab,-.4)}" stroke-width="1.4"/>${[0,1,2,3,4].map(i=>`<circle cx="${38+i*11}" cy="${12+(i%2)*4}" r="7" fill="${cab}"/>`).join('')}`);
  else if(c==='moicano')add(`<path d="M44 20 Q56 0 80 8 L84 16 Q66 12 50 26Z" fill="${cab}" stroke="${tom(cab,-.4)}" stroke-width="1.4"/>`);
  else add(`<path d="M38 44 Q34 12 62 10 Q84 10 88 26 Q72 18 58 22 Q48 26 46 44Z" fill="${cab}" stroke="${tom(cab,-.4)}" stroke-width="1.4"/>`);
 }
 add('</g>');add(nomeTxt(nome));
 return wrap(p,W,H);
}
function nomeTxt(nome){return nome?`<rect x="0" y="134" width="120" height="16" fill="#000" opacity=".45"/><text x="60" y="146" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#e8dcc0">${String(nome).replace(/[&<>"]/g,'').slice(0,22)}</text>`:'';}
function wrap(p,W,H){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W*2}" height="${H*2}">${p.join('')}</svg>`;}
export const dataUrl=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
// Retrato de um NPC do banco (sem imagem própria).
export function retratoDoNpc(npc={}){let s;try{s=specDeNpc(npc);}catch(_){s={};}
 const t=String([npc.raca,npc.carreira,npc.conceito,npc.descricao].join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(!/guarda|soldado|mercenari|seguranca|cavaleir|vigia|sentinela|militar/.test(t))s={...s,armadura:null};return dataUrl(svgRetrato(s,{nome:String(npc.nome||'').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,''),semente:npc.id||npc.nome}));}
