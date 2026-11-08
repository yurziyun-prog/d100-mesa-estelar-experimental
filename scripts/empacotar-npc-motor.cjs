// Empacota o motor de NPCs/criaturas (TypeScript copiado do MapForge, em fontes/mapforge/) num único módulo para o navegador: js/mesa-npc-motor.js
// Uso: node scripts/empacotar-npc-motor.cjs   (usa o esbuild que já está no node_modules do MapForge)
const path=require('path');
const esbuild=require('C:/Users/yurzi/Saved Games/projeto mapas/mesa-estelar-mapforge/node_modules/esbuild');
const raiz=path.join(__dirname,'..');
esbuild.build({entryPoints:[path.join(raiz,'fontes/mapforge/entrada.ts')],bundle:true,format:'esm',target:'es2020',minify:false,legalComments:'none',
 banner:{js:'/* GERADO por scripts/empacotar-npc-motor.cjs a partir de fontes/mapforge (MapForge, MIT). Não edite aqui. */'},
 outfile:path.join(raiz,'js/mesa-npc-motor.js')}).then(()=>console.log('js/mesa-npc-motor.js gerado')).catch(e=>{console.error(e.message);process.exit(1);});
