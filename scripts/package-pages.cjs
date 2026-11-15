// Montagem multiplataforma do experimental, sem tocar no Firebase.
const fs=require('node:fs'),path=require('node:path');
const {lerModulos,carimbar,conferirSintaxe,prepararIndex}=require('./montar.cjs');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'dist');
if(fs.existsSync(dest)&&fs.lstatSync(dest).isSymbolicLink())throw Error('dist não pode ser link');
const modules=carimbar(lerModulos(root));conferirSintaxe(modules.codigo);
const mesa=prepararIndex(fs.readFileSync(path.join(root,'mesa.html'),'utf8'),modules);
fs.mkdirSync(dest,{recursive:true});
for(const name of ['index.html','favicon.ico','favicon.svg','favicon-32.png','apple-touch-icon.png','oficina-mesa-56.png','suporte-57.png']){
 const file=path.join(root,name);if(fs.existsSync(file))fs.copyFileSync(file,path.join(dest,name));
}
for(const name of ['dados','fontes','orla','arte','imagens']){
 const folder=path.join(root,name);if(fs.existsSync(folder))fs.cpSync(folder,path.join(dest,name),{recursive:true});
}
fs.mkdirSync(path.join(dest,'js'),{recursive:true});
for(const [name,code] of Object.entries(modules.codigo))fs.writeFileSync(path.join(dest,'js',name),code);
fs.writeFileSync(path.join(dest,'mesa.html'),mesa);
fs.writeFileSync(path.join(dest,'_headers'),'/publication.json\n  Cache-Control: no-store\n/orla/index.html\n  Cache-Control: no-cache\n/mesa.html\n  Cache-Control: no-cache\n');
require('./publication-manifest.cjs');
console.log('Pacote experimental preparado em dist, com app.js montado e artes originais.');
