// Tira da lista de miniaturas 3D os ANIMAIS DA TERRA (o jogo se passa em outro planeta): ficam só lobo, cães e galinha.
// Os demais serão adaptados (alienígenas) no futuro. Remove do js/mesa-sprites-3d-dados.js e apaga os .webp deles. Uso: node scripts/remover-3d-terrestres.cjs
const fs=require('fs'),path=require('path');
const raiz=path.join(__dirname,'..'),arq=path.join(raiz,'js','mesa-sprites-3d-dados.js');
const REMOVER=['a_alpaca','a_bull','a_cow','a_deer','a_donkey','a_fox','a_horse','a_stag','a_white_horse','d_apatosaurus','d_parasaurolophus','d_stegosaurus','d_t_rex','d_triceratops','d_velociraptor','en_snake','en_spider','en_frog','en_rat','fz_cow','fz_horse','fz_zebra','mo_bunny','mo_frog','mo_dino'];
const t=fs.readFileSync(arq,'utf8'),o=JSON.parse(t.split('SPRITES_3D=')[1].replace(/;\s*$/,''));
let n=0;const dir=path.join(raiz,'arte','miniaturas3d');
for(const id of REMOVER){if(o[id]){delete o[id];n++;}for(const f of fs.readdirSync(dir).filter(f=>f.startsWith(id+'_')))fs.rmSync(path.join(dir,f));}
fs.writeFileSync(arq,t.split('SPRITES_3D=')[0]+'SPRITES_3D='+JSON.stringify(o)+';\n');
console.log('removidos',n,'restam',Object.keys(o).length);
