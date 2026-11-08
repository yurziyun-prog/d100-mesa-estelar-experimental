// Monta as folhas das criaturas vistas de cima (saída de criaturas_cima.py) e registra todas em js/mesa-sprites-3d-dados.js (com cima:true).
// Uso: node scripts/blender/montar-cima.cjs <pasta com uma subpasta por criatura>
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..','..'),pasta=process.argv[2];
const DUR={parado:2,andar:.9,atacar:.9,golpe:.6,morrer:1.2};
const nomeBonito=id=>{const t=id.replace(/_\d+$/,'').replace(/_/g,' ');return t.charAt(0).toUpperCase()+t.slice(1)+' · de cima';};
(async()=>{
 const ids=fs.readdirSync(pasta,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),page=await browser.newPage();
 const saida=path.join(raiz,'arte','miniaturas3d'),dados=path.join(raiz,'js','mesa-sprites-3d-dados.js'),t=fs.readFileSync(dados,'utf8');
 const o=JSON.parse(t.split('SPRITES_3D=')[1].replace(/;\s*$/,''));
 for(const id of ids){
  const folhas={},sid='cima_'+id.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for(const ad of fs.readdirSync(path.join(pasta,id),{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name)){
   const arqs=fs.readdirSync(path.join(pasta,id,ad)).filter(f=>/\.png$/.test(f)).sort();if(!arqs.length)continue;
   const imgs=arqs.map(f=>'data:image/png;base64,'+fs.readFileSync(path.join(pasta,id,ad,f)).toString('base64'));
   const webp=await page.evaluate(async l=>{const ims=await Promise.all(l.map(u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;})));const w=ims[0].width,h=ims[0].height,c=document.createElement('canvas');c.width=w*ims.length;c.height=h;const x=c.getContext('2d');ims.forEach((im,k)=>x.drawImage(im,k*w,0));return c.toDataURL('image/webp',.9).split(',')[1];},imgs);
   const arq=`${sid}_${ad}.webp`;fs.writeFileSync(path.join(saida,arq),Buffer.from(webp,'base64'));
   folhas[ad]={arquivo:arq,quadros:arqs.length,dur:DUR[ad.split('_')[0]]||1};
  }
  o[sid]={nome:nomeBonito(id),cima:true,folhas};console.log('ok',sid,Object.keys(folhas).length);
 }
 // dragão-trombeta de cima já existente: marca como "cima"
 if(o.blender_dragao_trombeta_cima)o.blender_dragao_trombeta_cima.cima=true;
 await browser.close();
 fs.writeFileSync(dados,t.split('SPRITES_3D=')[0]+'SPRITES_3D='+JSON.stringify(o)+';\n');
})().catch(e=>{console.error(e);process.exit(1);});
