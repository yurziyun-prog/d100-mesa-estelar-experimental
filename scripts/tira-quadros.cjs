// Tira de quadros de uma folha (para olhar a marcha/ataque): node scripts/tira-quadros.cjs <arquivo.webp> <saida.png> <quadros>
const fs=require('fs');const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const [,,arq,saida,n]=process.argv;const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),p=await b.newPage();
const d='data:image/webp;base64,'+fs.readFileSync(arq).toString('base64');
const png=await p.evaluate(async({d,n})=>{const i=await new Promise(r=>{const m=new Image();m.onload=()=>r(m);m.src=d;});const w=i.width/n,cv=document.createElement('canvas');cv.width=i.width;cv.height=i.height;const x=cv.getContext('2d');x.fillStyle='#6f7d5c';x.fillRect(0,0,cv.width,cv.height);x.drawImage(i,0,0);return cv.toDataURL('image/png').split(',')[1];},{d,n:+n});
fs.writeFileSync(saida,Buffer.from(png,'base64'));await b.close();})();
