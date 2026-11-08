// Serve a pasta do projeto, abre docs/demo-pessoa-rig.html no Edge, grava um vídeo e tira capturas (para mostrar o movimento).
// Uso: node scripts/demo-pessoa.cjs <pasta de saída>
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..'),saida=path.resolve(process.argv[2]||'demo-saida');fs.mkdirSync(saida,{recursive:true});
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const srv=http.createServer((q,r)=>{const f=path.join(raiz,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(raiz)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(0,async()=>{
 const porta=srv.address().port;
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const ctx=await b.newContext({viewport:{width:1280,height:1000},recordVideo:{dir:saida,size:{width:1280,height:1000}}}),p=await ctx.newPage();
 const erros=[];p.on('console',m=>{if(m.type()==='error')erros.push(m.text());});p.on('pageerror',e=>erros.push(String(e)));
 await p.goto(`http://localhost:${porta}/docs/demo-pessoa-rig.html`);await p.waitForFunction(()=>window.__pronto===true,null,{timeout:20000});
 for(let i=0;i<6;i++){await p.waitForTimeout(450);await p.screenshot({path:path.join(saida,`quadro-${i}.png`)});}
 await p.waitForTimeout(3000);await ctx.close();await b.close();srv.close();console.log('erros:',erros.length?erros.join(' | '):'nenhum');
});
