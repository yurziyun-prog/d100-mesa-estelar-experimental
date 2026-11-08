import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ehImagemPesada,camposPesados,objetoMapaDocId,dataUrlParaBlob,COMANDO_CORS} from '../js/mesa-imagens.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=lerApp();

test('v104 cache e carregamento isolado da biblioteca',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
 assert.match(app,/import\('\.\/mesa-imagens\.js\?v=104'\)[\s\S]{0,600}\.catch\(/);
 assert.doesNotMatch(app,/^import .*mesa-imagens/m);
});
test('objetos de mapa são lidos em paralelo',()=>{
 assert.match(app,/const lidos=await Promise\.all\(idx\.ids\.map/);
});
test('ferramentas de recorte pedem CORS ao carregar imagens remotas',()=>{
 assert.equal((app.match(/if\(\/\^https\?:\/i\.test\(String\(src\)\)\)im\.crossOrigin='anonymous';/g)||[]).length,3);
});
test('só imagens raster pesadas são migradas',()=>{
 const grande='data:image/png;base64,'+'A'.repeat(7000);
 assert.ok(ehImagemPesada(grande));
 assert.ok(!ehImagemPesada('data:image/png;base64,AAAA'));
 assert.ok(!ehImagemPesada('data:image/svg+xml,'+'A'.repeat(9000)),'SVG fica como está');
 assert.ok(!ehImagemPesada('https://firebasestorage.googleapis.com/x.webp'));
 assert.deepEqual(camposPesados({nome:'x',imagem:grande,src:grande,outra:grande}),['imagem','src']);
 assert.equal(objetoMapaDocId('árvore 1'),'objetoMapa__rvore_1');
 assert.equal(dataUrlParaBlob('data:image/png;base64,AAAA').type,'image/png');
 assert.match(COMANDO_CORS,/gsutil cors set cors\.json gs:\/\/d100-mesa-estelar\.firebasestorage\.app/);
});
