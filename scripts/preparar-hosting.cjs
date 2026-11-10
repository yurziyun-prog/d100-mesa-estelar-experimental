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

// v264: uma cópia do GitHub NÃO contém as artes locais ignoradas pelo Git.
// Nunca publicar um site sem texturas: isso apagaria as artes que já estão
// no Firebase Hosting e faria imagens, árvores e miniaturas virarem texto.
const extensao=/\.(webp|jpe?g|png|gif|svg|avif)$/i;
const pastasArte=['arte','imagens'];
function listarArtes(dir){
 if(!fs.existsSync(dir))return [];
 const achados=[];
 const visitar=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){
  const p=path.join(d,e.name);
  if(e.isDirectory())visitar(p);
  else if(e.isFile()&&extensao.test(e.name))achados.push(p);
 }};
 visitar(dir);return achados;
}
const porPasta=Object.fromEntries(pastasArte.map(n=>[n,listarArtes(path.join(root,n))]));
const totalArtes=Object.values(porPasta).reduce((n,files)=>n+files.length,0);
if(totalArtes<10){
 throw Error('PUBLICAÇÃO BLOQUEADA: apenas '+totalArtes+' arquivos de arte disponíveis. '+
 'Esta pasta veio do GitHub sem as texturas originais (pastas arte/ e imagens/). '+
 'Copie essas pastas de uma instalação completa do jogo ANTES de publicar. '+
 'O site que já está no ar foi preservado; nenhuma alteração foi enviada.');
}
console.log('Artes verificadas para publicação: '+
 pastasArte.map(n=>n+'='+porPasta[n].length).join(', '));
// 2) grava
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(path.join(dest,'js'),{recursive:true});
fs.writeFileSync(path.join(dest,'index.html'),index);
for(const name of ['favicon.svg','favicon.ico','favicon-32.png','apple-touch-icon.png']){const file=path.join(root,name);if(fs.existsSync(file))fs.copyFileSync(file,path.join(dest,name));}
for(const [n,codigo] of Object.entries(res.codigo))fs.writeFileSync(path.join(dest,'js',n),codigo);
// Imagens do jogo precisam acompanhar os scripts e o mapa publicado.
// Inclui as duas pastas que não estão no Git: arte/ e imagens/.
let nArte=0;
for(const pasta of pastasArte){
 const origem=path.join(root,pasta);
 if(!fs.existsSync(origem))continue;
 fs.cpSync(origem,path.join(dest,pasta),{recursive:true,filter:p=>{
  if(fs.statSync(p).isDirectory())return true;
  const ok=extensao.test(p);if(ok)nArte++;return ok;
 }});
}
const kb=Math.round(Object.values(res.codigo).reduce((s,c)=>s+Buffer.byteLength(c),0)/1024);
console.log(`Site preparado: ${Object.keys(res.codigo).length} módulos (${kb} KB), ${res.precarregar.length} pré-carregados, ${nArte} imagem(ns) de mapa, app.js montado de js/app/. Sintaxe e imports conferidos.`);
