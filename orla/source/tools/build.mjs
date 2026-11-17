import fs from 'node:fs';
import { build } from 'esbuild';
const result = await build({entryPoints:['src/main.js'],bundle:true,format:'iife',target:'es2020',write:false,legalComments:'none'});
const js = result.outputFiles[0].text;
const css = fs.readFileSync('src/styles/game.css','utf8');
const shell = fs.readFileSync('src/shell.html','utf8');
fs.mkdirSync('dist',{recursive:true});
fs.writeFileSync('dist/orla.js', js);
fs.writeFileSync('dist/orla.css', css);
fs.writeFileSync('index.html', shell.replace('<!-- ORLA_STYLES -->','<link rel="stylesheet" href="dist/orla.css">').replace('<!-- ORLA_SCRIPT -->','<script src="dist/orla.js"></script>'));
fs.writeFileSync('Orla.html', shell.replace('<!-- ORLA_STYLES -->',()=>'<style>'+css+'</style>').replace('<!-- ORLA_SCRIPT -->',()=>'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>'));
console.log('Built index.html and standalone Orla.html (offline).');

await import('./build-online.mjs');
