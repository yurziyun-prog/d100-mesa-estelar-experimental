// Prepara as miniaturas artísticas (arte nova das criaturas e NPCs) para o site: arte/miniaturas/<id>.webp (384 px, para o token no mapa)
// e arte/miniaturas/grande/<id>.webp (1024 px, para ver a ficha). Recorta a margem transparente e centraliza (o personagem ocupa o quadro todo).
// Origem: imagens/sprites/*.png (originais de 1024 px; não vão para o hospedagem). Uso: node scripts/gerar-miniaturas-npc.cjs
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..'),origem=path.join(raiz,'imagens','sprites'),saida=path.join(raiz,'arte','miniaturas');
(async()=>{
 fs.mkdirSync(path.join(saida,'grande'),{recursive:true});
 const arqs=fs.readdirSync(origem).filter(f=>/\.png$/i.test(f));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();let kbP=0,kbG=0;
 for(const f of arqs){
  const id=f.replace(/\.png$/i,''),b64=fs.readFileSync(path.join(origem,f)).toString('base64');
  const r=await page.evaluate(async b64=>{
   const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();
   const W=img.width,H=img.height,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);
   const d=x.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=0,y1=0;
   for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++)if(d[(y*W+xx)*4+3]>14){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(y<y0)y0=y;if(y>y1)y1=y;}
   const bw=x1-x0+1,bh=y1-y0+1,lado=Math.round(Math.max(bw,bh)*1.06),cx=(x0+x1)/2,cy=(y0+y1)/2;
   const fazer=T=>{const o=document.createElement('canvas');o.width=T;o.height=T;const q=o.getContext('2d');q.imageSmoothingQuality='high';q.drawImage(img,cx-lado/2,cy-lado/2,lado,lado,0,0,T,T);return o.toDataURL('image/webp',T>500?.9:.88);};
   return {p:fazer(384),g:fazer(1024),bbox:[bw,bh]};
  },b64);
  const wp=Buffer.from(r.p.split(',')[1],'base64'),wg=Buffer.from(r.g.split(',')[1],'base64');
  fs.writeFileSync(path.join(saida,id+'.webp'),wp);fs.writeFileSync(path.join(saida,'grande',id+'.webp'),wg);kbP+=wp.length>>10;kbG+=wg.length>>10;
  console.log(id,'->',(wp.length>>10)+' KB / '+(wg.length>>10)+' KB');
 }
 console.log('total:',arqs.length,'arquivos;',kbP,'KB de miniaturas +',kbG,'KB de arte grande');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
