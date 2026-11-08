// Gera as peças de enfeite da lagoa (SVG de cima, leves): vitória-régia (3), junco (3), pedra molhada com musgo (3). Rodar: node scripts/gerar-decor-agua.mjs
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','arte','decor');fs.mkdirSync(dir,{recursive:true});
let s=7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
const salva=(n,svg)=>fs.writeFileSync(path.join(dir,n+'.svg'),svg);
const f=x=>+x.toFixed(2);
// vitória-régia: disco verde com entalhe, nervuras e sombra suave sobre a água; a 3ª tem flor
for(let k=0;k<3;k++){const R=44,ent=.25+r()*.3,a0=r()*6.28;let d='M64,64';for(let i=0;i<=48;i++){const a=a0+ent+(6.28-ent*2)*i/48,rr=R*(1+.04*Math.sin(a*5+k));d+=` L${f(64+Math.cos(a)*rr)},${f(64+Math.sin(a)*rr)}`;}d+=' Z';
 let nerv='';for(let i=0;i<9;i++){const a=a0+ent+(6.28-ent*2)*i/8;nerv+=`<line x1="64" y1="64" x2="${f(64+Math.cos(a)*R*.92)}" y2="${f(64+Math.sin(a)*R*.92)}" stroke="#2f6a2a" stroke-opacity=".45" stroke-width="1.2"/>`;}
 const flor=k===2?`<g transform="translate(70 60)">${[0,1,2,3,4,5,6,7].map(i=>`<ellipse cx="0" cy="-8" rx="4.2" ry="9" fill="#f2b8d0" stroke="#d98aae" stroke-width=".6" transform="rotate(${i*45})"/>`).join('')}<circle r="3.4" fill="#f6d45a"/></g>`:'';
 salva('lirio_'+(k+1),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><radialGradient id="g" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#6fc25a"/><stop offset="1" stop-color="#2f7a38"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation="2.2"/></filter></defs><path d="${d}" fill="#0a2a30" opacity=".35" transform="translate(3 4)" filter="url(#b)"/><path d="${d}" fill="url(#g)" stroke="#245a2a" stroke-width="1.4"/>${nerv}${flor}</svg>`);}
// junco: touceira vista de cima (lâminas radiais curvas) com 2–3 espigas marrons
for(let k=0;k<3;k++){let m='';const n=22+k*3;for(let i=0;i<n;i++){const a=i/n*6.28+r()*.3,L=22+r()*30,c=(r()-.5)*14,x2=64+Math.cos(a)*L,y2=64+Math.sin(a)*L,mx=64+Math.cos(a+.3)*L*.5+c,my=64+Math.sin(a+.3)*L*.5+c;m+=`<path d="M64,64 Q${f(mx)},${f(my)} ${f(x2)},${f(y2)}" stroke="${i%3?'#4f8a3a':'#7aa84a'}" stroke-width="${f(2+r()*2.2)}" fill="none" stroke-linecap="round" opacity=".92"/>`;}
 let e='';for(let i=0;i<2+k;i++){const a=r()*6.28,L=8+r()*14;e+=`<ellipse cx="${f(64+Math.cos(a)*L)}" cy="${f(64+Math.sin(a)*L)}" rx="3.2" ry="7" fill="#6a4426" stroke="#3a2412" stroke-width=".8" transform="rotate(${f(a*57.3+90)} ${f(64+Math.cos(a)*L)} ${f(64+Math.sin(a)*L)})"/>`;}
 salva('junco_'+(k+1),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><filter id="b"><feGaussianBlur stdDeviation="2.6"/></filter></defs><circle cx="66" cy="68" r="30" fill="#0a2a30" opacity=".28" filter="url(#b)"/>${m}${e}</svg>`);}
// pedra molhada: polígono irregular, luz no alto, borda escura molhada, musgo
for(let k=0;k<3;k++){const n=11;let p='';const R=40+k*3;for(let i=0;i<n;i++){const a=i/n*6.28+.2,rr=R*(.78+r()*.34);p+=(i?'L':'M')+f(64+Math.cos(a)*rr)+','+f(64+Math.sin(a)*rr*.88);}p+='Z';
 let mu='';for(let i=0;i<9;i++)mu+=`<ellipse cx="${f(40+r()*48)}" cy="${f(46+r()*40)}" rx="${f(4+r()*7)}" ry="${f(3+r()*5)}" fill="#5f8a3a" opacity="${f(.25+r()*.3)}"/>`;
 salva('pedra_agua_'+(k+1),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><radialGradient id="g" cx=".38" cy=".32" r=".85"><stop offset="0" stop-color="#b9b3a4"/><stop offset=".6" stop-color="#7d786c"/><stop offset="1" stop-color="#4a463e"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation="2.6"/></filter></defs><path d="${p}" fill="#06222a" opacity=".42" transform="translate(4 6)" filter="url(#b)"/><path d="${p}" fill="url(#g)" stroke="#3a362f" stroke-width="2"/>${mu}<path d="${p}" fill="none" stroke="#1d3a40" stroke-opacity=".5" stroke-width="5" transform="scale(1)"/><ellipse cx="50" cy="48" rx="14" ry="7" fill="#fff" opacity=".18"/></svg>`);}
console.log('decor gerado em',dir);
