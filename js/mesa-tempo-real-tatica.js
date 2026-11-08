// Mesa Estelar v133 — Tática do combate automático: recuperação, primeiros socorros e posição.
// Regras puras (sem DOM/Firestore), usadas pelo tempo real no navegador do mestre.

import {classificarTeste} from './nova-regras.js?v=46';
import {emComa,locaisDoComa} from './nova-coma.js?v=134';
export {emComa};

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

// Quão grave está alguém (0 = nada a tratar).
export function gravidade(st){
 if(!st||st.morto)return 0;
 const fer=Object.values(st.ferimentos||{}).map(String);
 const max=st.hitMax||{},hit=st.hit||{};
 const pior=Object.keys(max).reduce((m,k)=>Math.min(m,(Number(hit[k]??max[k]))/Math.max(1,Number(max[k]))),1);
 let g=0;
 if(fer.includes('Grave')||pior<=0)g=2;else if(fer.includes('Sério')||pior<.5)g=1;else if(pior<1)g=.4;
 if(st.inconsciente)g=Math.max(g,1)+1.2;
 if(emComa(st))g+=1; // coma: só sai com socorro
 if(st.sangrando||st.sangramentoAtivo)g+=.6;
 return g;
}
// Parte do corpo a tratar: a mais ferida.
export function localParaTratar(st){
 const max=st?.hitMax||{},hit=st?.hit||{};
 const lista=Object.keys(max).filter(k=>Number(hit[k]??max[k])<Number(max[k]));
 const coma=new Set(locaisDoComa(st));const fr=k=>Number(hit[k]??max[k])/Math.max(1,Number(max[k]))-(st?.ferimentos?.[k]==='Grave'?2:st?.ferimentos?.[k]==='Sério'?1:0)-(coma.has(k)?3:0);
 return lista.sort((a,b)=>fr(a)-fr(b))[0]||'';
}
// Médico de verdade: perícia alta ou profissão de cura.
export function ehMedico(d){return Number(d?.primeirosSocorros)>=60||/medic|doutor|enfermeir|curandeir|cirurgi|paramedic|socorrist|curador/.test(sem(d?.texto));}
// Chance de preferir socorrer um aliado a atacar.
export function vontadeDeSocorrer({valor=0,medico=false,gravidade:g=0,ameacado=false,temKit=false}={}){
 if(!(valor>0)||g<=0)return 0;
 if(ameacado&&!(medico&&g>=2.2))return 0; // primeiro se protege
 let p=.08+g*.16+(valor/100)*.3+(medico?.45:0)+(temKit?.05:0);
 if(ameacado)p*=.35;
 return Math.max(0,Math.min(.97,p));
}
// Papel na luta para quem pensa (NPCs e personagens no automático).
//  linha: vai para o corpo a corpo · atirador: fica atrás atirando · psiquico: fica atrás usando psi · escondido: protege-se.
export function papelTatico(d){
 const corpo=Number(d?.corpoACorpo)||0,longe=Number(d?.aDistancia)||0;
 const psi=(d?.psi?.poderes||[]).some(p=>p.id!=='cura_psi')&&Number(d?.psi?.max)>0;
 if(longe>0&&longe>=corpo-5)return 'atirador';
 if(corpo<40&&psi)return 'psiquico';
 if(corpo<30&&!longe&&!psi)return 'escondido';
 return 'linha';
}
// Distância (m) que cada papel tenta manter do inimigo mais próximo.
export const DISTANCIA_SEGURA={linha:0,atirador:4,psiquico:5,escondido:8};
// Teste de consciência (Resistência + 5 por PV curado enquanto desacordado).
export function testeConsciencia({resistencia=0,curas=[]},die){
 const bonus=(curas||[]).reduce((n,c)=>n+5*(Number(c?.pv)||0),0),valor=Math.max(0,Math.min(100,Number(resistencia)+bonus));
 return {valor,bonus,die,...classificarTeste(valor,die)};
}
// Quanto falta (ms) num relógio de inconsciência, contando o tempo de relógio também para relógios de rodada.
export function restanteRelogio(clock,agora=Date.now()){
 if(!clock)return 0;return Math.max(0,Number(clock.remaining||0)-Math.max(0,agora-Number(clock.at||agora)));
}
// Poder psíquico a usar (ou nada): grito se pega 2+ inimigos, senão atordoar/medo no alvo.
export function escolherPsi(d,{psiLivre=0,distAlvo=99,noCone=1,alvoAtordoado=false}={}){
 const ps=(d?.psi?.poderes||[]).filter(p=>p.id!=='cura_psi'&&Number(p.custo)<=psiLivre&&Number(p.valor)>0);
 const grito=ps.find(p=>p.id==='grito_psiquico');if(grito&&noCone>=2&&distAlvo<=8)return grito;
 const at=ps.filter(p=>['atordoar_psi','medo'].includes(p.id)&&distAlvo<=(Number(p.alcance)||20)).sort((a,b)=>b.valor-a.valor)[0];
 if(at&&!alvoAtordoado)return at;
 if(grito&&distAlvo<=8)return grito;
 return null;
}

// v133: manobras entre um ataque e outro (para ninguém "estacionar"): todos os pontos em metros.
//  corpo a corpo: rodeia/flanqueia o alvo ou recua um passo e volta; atiradores e psíquicos andam de lado
//  mantendo a distância; ferido que pensa recua para trás de um aliado. Retorna {x,y,ms} ou null (fica onde está).
export function planejarManobra({eu,alvo,contato=1.3,papel='linha',pensa=false,semMente=false,frac=1,aliados=[],inimigos=[],alcance=1.5,W=28,H=14,rnd=Math.random}){
 if(semMente)return null;
 const clamp=p=>({x:Math.max(.6,Math.min(W-.6,p.x)),y:Math.max(.6,Math.min(H-.6,p.y))});
 const dx=eu.x-alvo.x,dy=eu.y-alvo.y,dist=Math.hypot(dx,dy)||.01,ux=dx/dist,uy=dy/dist;
 // ferido e esperto: vai para trás do aliado mais próximo (em relação ao inimigo)
 if(pensa&&frac<.5&&aliados.length){
  const al=aliados.slice().sort((a,b)=>Math.hypot(a.x-eu.x,a.y-eu.y)-Math.hypot(b.x-eu.x,b.y-eu.y))[0];
  const ex=al.x-alvo.x,ey=al.y-alvo.y,el=Math.hypot(ex,ey)||1;
  return {...clamp({x:al.x+ex/el*1.6,y:al.y+ey/el*1.6}),ms:2600,tipo:'recuar'};
 }
 if(papel==='atirador'||papel==='psiquico'){
  const lado=rnd()<.5?-1:1,passo=1.5+rnd()*1.5,seg=Math.max(3,papel==='psiquico'?5:4);
  let r=dist;if(dist<seg)r=seg+.5;else if(dist>alcance*.9)r=Math.max(seg,alcance*.8);
  const ang=Math.atan2(uy,ux)+lado*passo/Math.max(2,r);
  return {...clamp({x:alvo.x+Math.cos(ang)*r,y:alvo.y+Math.sin(ang)*r}),ms:1800+rnd()*1600,tipo:'reposicionar'};
 }
 // corpo a corpo
 const q=rnd();
 if(q<.45){const lado=rnd()<.5?-1:1,ang=Math.atan2(uy,ux)+lado*(.5+rnd()*.6);return {...clamp({x:alvo.x+Math.cos(ang)*contato,y:alvo.y+Math.sin(ang)*contato}),ms:1500+rnd()*1200,tipo:'flanquear'};}
 if(q<.62&&pensa)return {...clamp({x:eu.x+ux*1.6,y:eu.y+uy*1.6}),ms:1100,tipo:'recuar um passo'};
 return null;
}

// v185: atitude da criatura no tempo real, como um jogador escolheria (Normal, Defesa total, Ataque total, Recuo).
//  • fugindo por moral: Recuo (anda mais rápido, defende melhor, não ataca); encurralada, volta ao Normal e luta;
//  • em choque pela ferida: Defesa total (quem não tem mente só fica no Normal);
//  • quase morta (≤30%) mas destemida: chefes e furiosos partem para o Ataque total, os outros para a Defesa total;
//  • predadores, animais e chefes com vida alta (≥70%) e alvo colado: Ataque total (mantém até 50% da vida);
//  • o resto fica no Normal. Quem não tem mente (zumbis, limos, enxames) só usa o Normal.
export function escolherAtitude({perfil={},frac=1,emChoque=false,fugindo=false,encurralado=false,distAlvo=99,alcance=1.5,atual='normal'}={}){
 const tipo=sem(perfil.tipo||''),semMente=/sem mente/.test(tipo),chefe=/chefe|furia|frenesi|berserk/.test(tipo),agressivo=/predador|animal|chefe|furia|teimos/.test(tipo);
 if(fugindo)return encurralado?'normal':(perfil.imovel?'defesa':'fuga');
 if(emChoque)return semMente?'normal':'defesa';
 if(frac<=.3&&!(perfil.fuga>0)&&chefe)return 'ataque'; // frenesi do chefe (mesmo sem mente)
 if(semMente)return 'normal';
 if(frac<=.3&&!(perfil.fuga>0))return 'defesa';
 if(atual==='defesa'&&frac<=.4)return 'defesa';
 const colado=distAlvo<=Number(alcance||1.5)+.3;
 if(agressivo&&!perfil.imovel&&colado&&(frac>=.7||(atual==='ataque'&&frac>=.5)))return 'ataque';
 return 'normal';
}

// v186: visão das criaturas. Paredes e portas fechadas (bloqueiaVisao) escondem; grades, muretas e telhados não.
import {impactoObjeto,camadaEntidade} from './nova-camadas.js?v=48';
export const ALCANCE_VISAO=14,MEMORIA_MS=20000; // metros; segundos que a criatura lembra de quem viu
export function linhaDeVisaoLivre(a,b,map={},objs=[]){
 const sx=(Number(map?.larguraM)||28)/28,sy=(Number(map?.alturaM)||14)/14,s={x:Number(a?.x||0)*sx,y:Number(a?.y||0)*sy},e={x:Number(b?.x||0)*sx,y:Number(b?.y||0)*sy};
 for(const o of objs||[]){const visao=o?.bloqueiaVisao||(o?.oficinaElement?.bloqueiaVisao&&o?.bloqueiaMovimento);if(!o||o.destruido||!visao||Number(o.camada??3)>=5||camadaEntidade(o)!==3||(o.estadoInterativo?.aberto&&!o.bloqueiaMovimento))continue;
  if(impactoObjeto(s,e,0,{...o,x:Number(o.x||0)*sx,y:Number(o.y||0)*sy})<1-1e-6)return false;}
 return true;
}
// tempo de reação ao ver um inimigo: sem mente e chefes reagem na hora; inteligentes e presas hesitam
export function reacaoMs(perfil={}){const t=sem(perfil.tipo||'');if(/sem mente|chefe/.test(t))return 0;if(/inteligente/.test(t))return 1200;if(/presa/.test(t))return 1800;return 600;}
// memória de uma criatura: Map(id do inimigo → {desde, visto}). Devolve se ela "conta" com esse inimigo agora.
export function percebe(mem,oid,{visivel=false,agora=Date.now(),reacao=0,memoria=MEMORIA_MS}={}){
 let r=mem.get(oid);
 if(visivel){if(!r){r={desde:agora,visto:agora};mem.set(oid,r);}else r.visto=agora;}
 if(!r)return false;if(agora-r.visto>memoria){mem.delete(oid);return false;}
 return agora-r.desde>=reacao;
}
