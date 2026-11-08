// Empacota apenas o Predador aprovado. Arquivos antigos ficam preservados.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),cinzas=process.argv.includes('--cinzas'),src=path.join(root,'arte-fonte',cinzas?'rastejante-cinzas':'predador-quitinoso');
(async()=>{
 const meta=JSON.parse(fs.readFileSync(path.join(src,'meta.json'),'utf8'));
 const file=path.join(root,'js/mesa-sprites-3d-dados.js'),text=fs.readFileSync(file,'utf8');
 const catalog=JSON.parse(text.split('SPRITES_3D=')[1].replace(/;\s*$/,''));
 const backup=path.join(src,'catalogo-antes-v215.json');if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify(catalog['cima_'+meta.id],null,2));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage();const sheets={},report=[];
 try{for(const [key,f] of Object.entries(meta.folhas)){
  const files=fs.readdirSync(path.join(src,key)).filter(n=>/^q_\d+\.png$/.test(n)).sort();assert.equal(files.length,f.quadros,key);
  const images=files.map(n=>'data:image/png;base64,'+fs.readFileSync(path.join(src,key,n)).toString('base64'));
  const result=await page.evaluate(async images=>{
   const ims=await Promise.all(images.map(src=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=src;})));
   const canvas=document.createElement('canvas');canvas.width=256*ims.length;canvas.height=256;const ctx=canvas.getContext('2d',{willReadFrequently:true});const bounds=[];
   for(let i=0;i<ims.length;i++){
    if(ims[i].width!==256||ims[i].height!==256)throw Error('Quadro inesperado');ctx.drawImage(ims[i],i*256,0);
    const d=ctx.getImageData(i*256,0,256,256).data;let minX=256,minY=256,maxX=0,maxY=0,count=0;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(d[(y*256+x)*4+3]>16){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++;}
    if(!count||minX<3||minY<3||maxX>252||maxY>252)throw Error('Miniatura vazia ou cortada '+i+' '+JSON.stringify({minX,minY,maxX,maxY}));
    bounds.push({minX,minY,maxX,maxY,count});
   }
   return {data:canvas.toDataURL('image/webp',.95).split(',')[1],bounds};
  },images);
  const name=(cinzas?'v216_rastejante_cinzas_':'v215_predador_quitinoso_')+key+'.webp';fs.writeFileSync(path.join(root,'arte/miniaturas3d',name),Buffer.from(result.data,'base64'));
  sheets[key]={arquivo:name,...f};report.push({acao:key,quadros:f.quadros,bounds:result.bounds});
 }
 catalog['cima_'+meta.id]={nome:cinzas?'Rastejante de Cinzas · artrópode de basalto':'Predador Quitinoso · conceito aprovado',cima:true,folhas:sheets};
 fs.writeFileSync(file,text.split('SPRITES_3D=')[0]+'SPRITES_3D='+JSON.stringify(catalog)+';\n');
 const measurements=path.join(root,'docs/escala-fisica-medidas.json'),all=JSON.parse(fs.readFileSync(measurements,'utf8'));
 const old=all.find(m=>m.id===meta.id);assert(old,'Medida da espécie existe');
 if(!fs.existsSync(path.join(src,'medida-antes-v215.json')))fs.writeFileSync(path.join(src,'medida-antes-v215.json'),JSON.stringify(old,null,2));
 Object.assign(old,{comp:meta.comp,larg:meta.larg,altura:meta.altura,ortho:meta.ortho});fs.writeFileSync(measurements,JSON.stringify(all,null,2)+'\n');
 fs.writeFileSync(path.join(src,'validacao-quadros.json'),JSON.stringify(report,null,2));
 console.log('PASS 64 quadros RGBA sem cortes, catálogo da espécie registrado; outras aparências preservadas');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
