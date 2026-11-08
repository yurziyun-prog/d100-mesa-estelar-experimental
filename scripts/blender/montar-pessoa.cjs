// Monta as folhas em camadas da pessoa vista de cima (saída de pessoa_cima.py) e registra "cima_pessoa" em js/mesa-sprites-3d-dados.js.
// Uso: node scripts/blender/montar-pessoa.cjs <pasta com uma subpasta por camada>
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..','..'),pasta=process.argv[2];
const DUR={parado:1.7,andar:1.1,atacar:.8,golpe:.55,morrer:1.1,deitado:3.2,sentado:3.2};
// v204: esqueleto real (pessoa_rig.py). A versão anterior (bonecos de esferas) fica no catálogo como cima_pessoa_v1; os arquivos novos levam o prefixo pessoa2_.
const PREFIXO=process.env.PESSOA_PREFIXO||'pessoa2_';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),page=await browser.newPage();
 const saida=path.join(raiz,'arte','miniaturas3d'),dados=path.join(raiz,'js','mesa-sprites-3d-dados.js'),t=fs.readFileSync(dados,'utf8');
 const o=JSON.parse(t.split('SPRITES_3D=')[1].replace(/;\s*$/,'')),camadas=process.env.MESCLAR&&o.cima_pessoa?.camadas?JSON.parse(JSON.stringify(o.cima_pessoa.camadas)):{};/* MESCLAR=1: só troca as camadas desta pasta (ex.: cabelos) e mantém as outras */
 for(const cam of fs.readdirSync(pasta,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name)){
  camadas[cam]=camadas[cam]&&!process.env.MESCLAR?camadas[cam]:{};
  for(const ad of fs.readdirSync(path.join(pasta,cam))){
   const arqs=fs.readdirSync(path.join(pasta,cam,ad)).filter(f=>/\.png$/.test(f)).sort();if(!arqs.length)continue;
   const imgs=arqs.map(f=>'data:image/png;base64,'+fs.readFileSync(path.join(pasta,cam,ad,f)).toString('base64'));
   const webp=await page.evaluate(async l=>{const ims=await Promise.all(l.map(u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;})));const w=ims[0].width,h=ims[0].height,c=document.createElement('canvas');c.width=w*ims.length;c.height=h;const x=c.getContext('2d');ims.forEach((im,k)=>x.drawImage(im,k*w,0));return c.toDataURL('image/webp',.92).split(',')[1];},imgs);
   const arq=`${PREFIXO}${cam}_${ad}.webp`;fs.writeFileSync(path.join(saida,arq),Buffer.from(webp,'base64'));
   camadas[cam][ad]={arquivo:arq,quadros:arqs.length,dur:DUR[ad.split('_')[0]]||1};
  }
 }
 await browser.close();
if(o.cima_pessoa&&!o.cima_pessoa_v1&&!/pessoa2_/.test(JSON.stringify(o.cima_pessoa).slice(0,3000)))o.cima_pessoa_v1={...o.cima_pessoa,nome:'Pessoa · de cima (bonecos de esferas, antiga)'};
 o.cima_pessoa={nome:'Pessoa · de cima (personalizável)',cima:true,pessoa:true,camadas,folhas:camadas.roupa};
 fs.writeFileSync(dados,t.split('SPRITES_3D=')[0]+'SPRITES_3D='+JSON.stringify(o)+';\n');console.log('registrado cima_pessoa',Object.keys(camadas).join(','));
})().catch(e=>{console.error(e);process.exit(1);});
