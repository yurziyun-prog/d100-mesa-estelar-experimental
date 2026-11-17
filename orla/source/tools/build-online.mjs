import fs from 'node:fs';
import {build} from 'esbuild';
fs.mkdirSync('dist/online',{recursive:true});
await build({entryPoints:['src/online/client.js'],bundle:true,format:'iife',target:'es2020',outfile:'dist/online/online.js',legalComments:'none'});
for(const name of ['index.html','online.css'])fs.copyFileSync('src/online/'+name,'dist/online/'+name);
console.log('Sessão online 3D compilada.');
