const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {lerModulos,carimbar,conferirSintaxe}=require('./montar.cjs');
const root=path.resolve(__dirname,'..');
const modules=lerModulos(root);carimbar(modules);conferirSintaxe(modules);
for(const name of ['index.html','mesa.html','orla/index.html']){
 const html=fs.readFileSync(path.join(root,name),'utf8');
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/\bsrc=|type=["'](?:module|application\/)/i.test(match[1]))new vm.Script(match[2],{filename:name});
 }
}
console.log('PASS sintaxe e imports dos módulos e carregadores');
