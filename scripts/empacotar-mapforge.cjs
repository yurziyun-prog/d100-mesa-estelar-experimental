// Empacota os geradores de MAPA do MapForge (masmorra, cidade, exterior; TypeScript em fontes/mapforge/) em js/mesa-mapforge-motor.js.
// Uso: node scripts/empacotar-mapforge.cjs   (usa o esbuild do node_modules do MapForge). Fica fora do app.js: só carrega quando o gerador é aberto.
const path=require('path');
const esbuild=require('C:/Users/yurzi/Saved Games/projeto mapas/mesa-estelar-mapforge/node_modules/esbuild');
const raiz=path.join(__dirname,'..');
esbuild.build({entryPoints:[path.join(raiz,'fontes/mapforge/entrada-mapas.ts')],bundle:true,format:'esm',target:'es2020',minify:true,legalComments:'none',
 banner:{js:'/* GERADO por scripts/empacotar-mapforge.cjs a partir de fontes/mapforge (MapForge, MIT). Não edite aqui. */'},
 outfile:path.join(raiz,'js/mesa-mapforge-motor.js')}).then(()=>console.log('js/mesa-mapforge-motor.js gerado')).catch(e=>{console.error(e.message);process.exit(1);});
