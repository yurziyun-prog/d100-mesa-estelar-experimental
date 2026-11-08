// Gera as ÁRVORES INTEIRAS (uma por arquivo, fundo transparente) usadas pela ferramenta Copas do Editor rápido: arte/copas/*.webp
// Variações das árvores pintadas do Portão de Véspera/Therion (filtros de cor) + abetos/pinheiros desenhados ramo a ramo.
// Uso: node scripts/gerar-copas-v198.cjs   (usa o Chrome e o Playwright do ambiente)
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..'),saida=path.join(raiz,'arte','copas');
const b64=f=>'data:image/webp;base64,'+fs.readFileSync(path.join(raiz,f)).toString('base64');
(async()=>{
 fs.mkdirSync(saida,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();await page.setContent('<canvas id="c" width="512" height="512"></canvas>');
 const fontes={arvore:b64('arte/modelos/therion_arvore_oasis.webp'),palmeira:b64('arte/modelos/therion_palmeira_oasis.webp'),arbusto:b64('arte/pecas/arbusto.webp'),arbustoDeserto:b64('arte/modelos/therion_arbusto_deserto.webp')};
 const lista=await page.evaluate(async fontes=>{
  const cv=document.getElementById('c'),ctx=cv.getContext('2d'),out={};
  const img=async s=>{const i=new Image();i.src=s;await i.decode();return i;};
  const I={};for(const k of Object.keys(fontes))I[k]=await img(fontes[k]);
  const H=(i,j,k,s)=>{const t=Math.sin(i*127.1+j*311.7+k*74.7+s*19.19)*43758.5453;return t-Math.floor(t);};
  const mistura=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const filtro=(im,f)=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,512,512);ctx.filter=f||'none';ctx.drawImage(im,0,0,512,512);ctx.filter='none';return cv.toDataURL('image/webp',.95);};
  out.arvore_oasis=filtro(I.arvore);
  out.arvore_densa=filtro(I.arvore,'brightness(.82) saturate(1.1)');
  out.arvore_outono=filtro(I.arvore,'hue-rotate(-52deg) saturate(1.35) brightness(1.05)');
  out.arvore_sombria=filtro(I.arvore,'hue-rotate(35deg) saturate(.7) brightness(.62)');
  out.arvore_nevada=filtro(I.arvore,'grayscale(.6) brightness(1.75) contrast(.85)');
  out.arvore_tropical=filtro(I.arvore,'hue-rotate(42deg) saturate(1.5) brightness(.95)');
  out.palmeira=filtro(I.palmeira);
  out.palmeira_tropical=filtro(I.palmeira,'hue-rotate(38deg) saturate(1.4) brightness(.95)');
  out.arbusto=filtro(I.arbusto);
  out.arbusto_deserto=filtro(I.arbustoDeserto);
  /* abeto visto de cima: ramos em leque, agulhas inclinadas para fora, pontas claras; 3 variações de cada (verde e nevado) */
  const abeto=(R,neve,sem,prata)=>{const rn=(a,b)=>H(a,b,1,sem);
   const pal=neve?[[18,44,48],[52,88,92],[150,184,188]]:prata?[[90,110,90],[160,176,150],[222,230,214]]:[[3,20,12],[10,52,30],[52,108,58]];
   const cor=t=>{const c=t<.5?mistura(pal[0],pal[1],t*2):mistura(pal[1],pal[2],(t-.5)*2);return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';};
   const nb=15;
   ctx.fillStyle=neve?'#5d7b7e':prata?'#7a8f76':'#10341f';ctx.beginPath();ctx.arc(0,0,R*.52,0,6.3);ctx.fill();
   for(let L=0;L<3;L++)for(let b=0;b<nb;b++){const ang=b/nb*6.2832+L*.42+(rn(L,b)-.5)*.5,ca=Math.cos(ang),sa=Math.sin(ang),len=R*(.55+rn(b,L+4)*.55)*(1-L*.18);
    ctx.strokeStyle=neve?'#4a3e34':'#3a2a1a';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(ca*len,sa*len);ctx.stroke();
    for(let s=.12;s<1;s+=.04){const px=ca*len*s,py=sa*len*s,comp=len*.3*(1-s*.55)*(.8+rn(b,s*90+L)*.4);
     for(const lado of [-1,1]){const a2=ang+lado*(.5+rn(s*60,b)*.25),ex=px+Math.cos(a2)*comp,ey=py+Math.sin(a2)*comp;
      const t=Math.min(1,.12+s*.78+L*.08+(rn(b,s*70+lado)-.5)*.3);ctx.strokeStyle=cor(t);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(ex,ey);ctx.stroke();
      if(neve&&rn(s*77,b+lado*3)>.4){ctx.strokeStyle='rgba(248,252,255,.85)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(px+(ex-px)*.4,py+(ey-py)*.4);ctx.lineTo(ex,ey);ctx.stroke();}}}}
   ctx.fillStyle=neve?'#eef5f8':prata?'#e8eee0':'#b6d08a';ctx.beginPath();ctx.arc(0,0,R*.09,0,6.3);ctx.fill();};
  for(const neve of [false,true])for(let v=1;v<=3;v++){
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,512,512);ctx.translate(256,256);ctx.scale(5.4,5.4);
   ctx.filter='blur(3px)';ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(2.2,3,34,32,0,0,6.3);ctx.fill();ctx.filter='none';
   abeto(40,neve,40+v*17+(neve?9:0),v===3&&!neve);
   out['conifera'+(neve?'_neve':'')+'_'+v]=cv.toDataURL('image/webp',.95);
  }
  ctx.setTransform(1,0,0,1,0,0);
  return out;
 },fontes);
 for(const [id,url] of Object.entries(lista)){fs.writeFileSync(path.join(saida,id+'.webp'),Buffer.from(url.split(',')[1],'base64'));console.log('gerada',id+'.webp');}
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
