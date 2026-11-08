// Roda sozinho antes de cada deploy (firebase.json → predeploy). Monta a pasta .firebase-public com o site.
// Publica somente o site, nunca os bancos CSV, testes, documentos ou anexos de trabalho.
const fs=require('node:fs'),path=require('node:path');
const {lerModulos,carimbar,conferirSintaxe,prepararIndex}=require('./montar.cjs');
const root=path.resolve(__dirname,'..'),dest=path.resolve(root,'.firebase-public');
if(path.dirname(dest)!==root||path.basename(dest)!=='.firebase-public')throw Error('Destino de publicação inválido');
if(fs.existsSync(dest)&&fs.lstatSync(dest).isSymbolicLink())throw Error('Destino não pode ser um link');

// 1) monta e confere tudo ANTES de mexer na pasta publicada (se algo falhar, o deploy é cancelado e o site no ar não muda)
const mods=lerModulos(root);
const res=carimbar(mods,'app.js');
conferirSintaxe(res.codigo);
const index=prepararIndex(fs.readFileSync(path.join(root,'index.html'),'utf8'),res);

// 2) grava
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(path.join(dest,'js'),{recursive:true});
fs.writeFileSync(path.join(dest,'index.html'),index);
for(const name of ['favicon.svg','favicon.ico','favicon-32.png','apple-touch-icon.png']){const file=path.join(root,name);if(fs.existsSync(file))fs.copyFileSync(file,path.join(dest,name));}
for(const [n,codigo] of Object.entries(res.codigo))fs.writeFileSync(path.join(dest,'js',n),codigo);
// arte dos mapas pintados (imagens de fundo)
const arte=path.join(root,'arte');let nArte=0;
if(fs.existsSync(arte))fs.cpSync(arte,path.join(dest,'arte'),{recursive:true,filter:p=>{const ok=fs.statSync(p).isDirectory()||/\.(webp|jpe?g|png)$/i.test(p);if(ok&&!fs.statSync(p).isDirectory())nArte++;return ok;}});
const kb=Math.round(Object.values(res.codigo).reduce((s,c)=>s+Buffer.byteLength(c),0)/1024);
console.log(`Site preparado: ${Object.keys(res.codigo).length} módulos (${kb} KB), ${res.precarregar.length} pré-carregados, ${nArte} imagem(ns) de mapa, app.js montado de js/app/. Sintaxe e imports conferidos.`);
