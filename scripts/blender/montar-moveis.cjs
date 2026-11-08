// Pega as peças renderizadas por moveis_cima.py, põe uma sombra suave, grava em arte/pecasbl/<id>.webp e gera js/mesa-pecas-blender-dados.js (catálogo para o Banco de Objetos).
// Uso: node scripts/blender/montar-moveis.cjs <pasta com os PNG e _medidas.json>
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..','..'),pasta=process.argv[2],pre=process.argv[3]||'bl',estilo=process.argv[4]||'classico',med=JSON.parse(fs.readFileSync(path.join(pasta,'_medidas.json'),'utf8')),saida=path.join(raiz,'arte','pecasbl'),catPath=path.join(__dirname,'_catalogo-pecas.json');
fs.mkdirSync(saida,{recursive:true});
const INFL={Madeira:3,Tecido:3,Vegetal:4};
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),p=await b.newPage(),lista=[];
 for(const [id,m] of Object.entries(med)){
  const f=path.join(pasta,id+'.png');if(!fs.existsSync(f))continue;
  const webp=await p.evaluate(async u=>{const im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');
   x.shadowColor='rgba(0,0,0,.42)';x.shadowBlur=Math.max(3,im.width/90);x.shadowOffsetX=Math.max(1,im.width/160);x.shadowOffsetY=Math.max(2,im.width/110);x.drawImage(im,0,0);return c.toDataURL('image/webp',.92).split(',')[1];},'data:image/png;base64,'+fs.readFileSync(f).toString('base64'));
  fs.writeFileSync(path.join(saida,pre+'_'+id+'.webp'),Buffer.from(webp,'base64'));
  const infl=INFL[m.material]||0;
  lista.push({id:pre+'_'+id,estilo,nome:m.nome,src:'arte/pecasbl/'+pre+'_'+id+'.webp',larguraM:m.larguraM,alturaM:m.alturaM,cat:m.cat,bloq:m.bloq,camada:m.camada,material:m.material,pvMax:m.pvMax,dureza:m.dureza,...(infl&&m.pvMax?{inflamabilidade:infl}:{})});
 }
 await b.close();
 let todas=[];try{todas=JSON.parse(fs.readFileSync(catPath,'utf8'));}catch(_){}
 const novos=new Set(lista.map(x=>x.id));todas=[...todas.filter(x=>!novos.has(x.id)),...lista];fs.writeFileSync(catPath,JSON.stringify(todas));
 fs.writeFileSync(path.join(raiz,'js','mesa-pecas-blender-dados.js'),'// Gerado por scripts/blender/montar-moveis.cjs — móveis, equipamentos e veículos modelados no Blender e vistos de cima (arte/pecasbl). Estilos: retrofuturista (padrão do cenário), hiboriano/gótico e clássico (guardado para outras campanhas). Autoria: feitos aqui no Blender.\nexport const PECAS_BLENDER='+JSON.stringify(todas)+';\n');
 console.log('peças desta rodada:',lista.length,'| catálogo:',todas.length);
})().catch(e=>{console.error(e);process.exit(1);});
