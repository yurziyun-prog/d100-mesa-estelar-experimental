// Exercita o carregador real, inclusive SHA-256, sem substituir document.write.
const {chromium}=require('@playwright/test');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..',process.env.PUBLICATION_DIR||'.');
async function main(){
 let server,browser;
 try{
  let base=process.env.PUBLICATION_URL;
  if(!base){
   server=http.createServer((req,res)=>{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    if(!fs.existsSync(file)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.json')?'application/json':file.endsWith('.js')?'text/javascript':'text/plain');
    fs.createReadStream(file).pipe(res);
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   base='http://127.0.0.1:'+server.address().port;
  }
  browser=await chromium.launch({headless:true,...(process.env.ORLA_BROWSER?{channel:process.env.ORLA_BROWSER}:{})});
  for(const width of [1280,390]){
   const page=await browser.newPage({viewport:{width,height:800}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.goto(base+'/orla/?test=1&verify='+Date.now(),{waitUntil:'load'});
   await page.waitForFunction(()=>window.__orlaTest&&document.querySelector('#game'),{},{timeout:60000});
   await page.waitForTimeout(1000);
   if(errors.length)throw Error(errors.join('\n'));
   const canvas=await page.locator('#game').evaluate(c=>({width:c.width,height:c.height}));
   if(!canvas.width||!canvas.height)throw Error('Canvas vazio');
   console.log('PASS Orla: integridade, inicialização e canvas em '+width+'px');
   await page.close();
  }
  const broken=await browser.newPage();
  await broken.route('**/release-v062.json',route=>route.fulfill({contentType:'application/json',body:'{}'}));
  await broken.goto(base+'/orla/?verify=negative');
  await broken.locator('#status').filter({hasText:'Erro ao carregar:'}).waitFor({timeout:60000});
  if(await broken.locator('#game').count())throw Error('Pacote corrompido foi executado');
  await broken.close();
  console.log('PASS carregador recusa atualização incompleta');
  // O portal preserva as abas e encaminha cada escolha à mesa autenticada.
  const portal=await browser.newPage();
  await portal.goto(base+'/?verify='+Date.now());
  for(const area of ['escudo','mercado','regras','ficha','orla']){
   await portal.locator('nav [data-area="'+area+'"]').click();
   if(await portal.locator('nav [data-area="'+area+'"]').getAttribute('aria-selected')!=='true')throw Error('Aba não abriu: '+area);
  }
  await portal.close();
  console.log('PASS navegação pelas cinco abas do portal');
 }finally{await browser?.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
