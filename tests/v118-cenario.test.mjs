import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {blocosMestre} from '../js/mesa-cenario-mapa.js';
const app=lerApp();
const mod=fs.readFileSync(new URL('../js/mesa-cenario-mapa.js',import.meta.url),'utf8');
test('blocos do mestre: ler em voz alta primeiro e só campos preenchidos',()=>{
 const b=blocosMestre({descricaoJogadores:'Texto',segredos:'S',eventos:'',objetivo:'O'});
 assert.deepEqual(b.map(x=>x[1]),['Ler para os jogadores','Objetivo','Segredos']);assert.equal(blocosMestre(null).length,0);
});
test('segredos só na conta do mestre; aba volta se o módulo falhar',()=>{
 assert.match(mod,/if\(!ehMestre\(\)\)\{if\(caixa\.innerHTML\)caixa\.innerHTML='';/);
 assert.match(app,/cenarioMestre:\(\)=>\{if\(userData\?\.role!=='mestre'\)return null;/);
 assert.match(mod,/aba\.style\.display='';const pub=el\('cenario-publico'\);if\(pub&&origem\?\.pai\)/);
 assert.match(app,/import\('\.\/mesa-cenario-mapa\.js\?v=1\d\d'\)[\s\S]{0,300}\.catch\(/);
});
