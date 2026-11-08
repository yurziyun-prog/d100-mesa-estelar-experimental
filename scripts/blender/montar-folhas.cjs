// Monta as folhas de quadros (arte/miniaturas3d/<id>_<acao>_<dir>.webp) a partir dos PNG renderizados pelo Blender e registra o modelo em js/mesa-sprites-3d-dados.js.
// Uso: node scripts/blender/montar-folhas.cjs <pasta de quadros> <id> "<nome exibido>" [escala]
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..','..');
const [,, pasta, id, nome, escala]=process.argv;
const DUR={parado:2,andar:1,atacar:.9,golpe:.6,morrer:1.3};
(async()=>{
 const dirs=fs.readdirSync(pasta,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage();
 const saida=path.join(raiz,'arte','miniaturas3d'),folhas={};
 for(const ad of dirs){
  const arqs=fs.readdirSync(path.join(pasta,ad)).filter(f=>/\.png$/.test(f)).sort();if(!arqs.length)continue;
  const imgs=arqs.map(f=>'data:image/png;base64,'+fs.readFileSync(path.join(pasta,ad,f)).toString('base64'));
  const webp=await page.evaluate(async lista=>{const ims=await Promise.all(lista.map(u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;})));const w=ims[0].width,h=ims[0].height,c=document.createElement('canvas');c.width=w*ims.length;c.height=h;const x=c.getContext('2d');ims.forEach((im,k)=>x.drawImage(im,k*w,0));return c.toDataURL('image/webp',.9).split(',')[1];},imgs);
  const arq=`${id}_${ad}.webp`;fs.writeFileSync(path.join(saida,arq),Buffer.from(webp,'base64'));
  folhas[ad]={arquivo:arq,quadros:arqs.length,dur:DUR[ad.split('_')[0]]||1};
 }
 await browser.close();
 const dados=path.join(raiz,'js','mesa-sprites-3d-dados.js'),t=fs.readFileSync(dados,'utf8'),o=JSON.parse(t.split('SPRITES_3D=')[1].replace(/;\s*$/,''));
 o[id]={nome,folhas,...(escala?{escala:Number(escala)}:{})};
 fs.writeFileSync(dados,t.split('SPRITES_3D=')[0]+'SPRITES_3D='+JSON.stringify(o)+';\n');
 console.log('registrado',id,Object.keys(folhas).join(', '));
})().catch(e=>{console.error(e);process.exit(1);});
