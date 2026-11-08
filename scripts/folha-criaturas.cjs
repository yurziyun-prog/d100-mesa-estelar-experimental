// Folha de contato das criaturas do mapa de teste: uma linha por espécie (parado, andar, atacar, golpe, morrer) no tamanho do jogo e ampliado.
// Uso: node scripts/folha-criaturas.cjs <saida.png> [id1,id2,...] [--zoom=1.5]
const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..');
const saida=process.argv[2]||'folha.png',zoom=Number((process.argv.find(a=>a.startsWith('--zoom='))||'--zoom=1').split('=')[1]);
const src=fs.readFileSync(path.join(raiz,'js','mesa-ecossistema.js'),'utf8');
const todos=[...new Set([...src.matchAll(/^ \['([^']+)',(\d+),/gm)].map(m=>m[1]))];
const so=process.argv[3]&&!process.argv[3].startsWith('--')?process.argv[3].split(','):todos;
const t=fs.readFileSync(path.join(raiz,'js','mesa-sprites-3d-dados.js'),'utf8'),dados=JSON.parse(t.split('SPRITES_3D=')[1].replace(/;\s*$/,''));
const sem=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),p=await b.newPage();
 const linhas=[];
 for(const id of so){const s=dados['cima_'+sem(id)];if(!s){linhas.push({id,falta:true});continue;}
  const q=[];for(const [a,fr] of [['parado',.0],['andar',.0],['andar',.5],['atacar',.5],['golpe',.5],['morrer',1]]){const f=s.folhas[a+'_lado'];if(!f)continue;q.push({arq:'data:image/webp;base64,'+fs.readFileSync(path.join(raiz,'arte','miniaturas3d',f.arquivo)).toString('base64'),n:f.quadros,i:Math.min(f.quadros-1,Math.round(fr*(f.quadros-1))),rot:a});}
  linhas.push({id,q});}
 const png=await p.evaluate(async({linhas,zoom})=>{
  const L=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const C=Math.round(128*zoom),cv=document.createElement('canvas');cv.width=C*6+150;cv.height=C*linhas.length;const x=cv.getContext('2d');x.fillStyle='#6f7d5c';x.fillRect(0,0,cv.width,cv.height);x.font='12px sans-serif';
  for(let r=0;r<linhas.length;r++){const l=linhas[r];x.fillStyle='#fff';x.fillText(l.id,6,r*C+16);if(l.falta){x.fillStyle='#ff9090';x.fillText('SEM SPRITE',6,r*C+34);continue;}
   for(let c=0;c<l.q.length;c++){const f=l.q[c],im=await L(f.arq),w=im.width/f.n;x.drawImage(im,f.i*w,0,w,im.height,150+c*C,r*C,C,C);}}
  return cv.toDataURL('image/png').split(',')[1];},{linhas,zoom});
 fs.writeFileSync(saida,Buffer.from(png,'base64'));await b.close();console.log('ok',so.length,'espécies');
})();
