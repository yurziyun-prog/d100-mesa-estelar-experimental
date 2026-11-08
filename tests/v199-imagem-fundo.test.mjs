import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v199 — imagem importada como FUNDO do mapa (battlemap): estado, render, salvamento e publicação.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../js/app/17-oficina2-texturas-referencias.js',import.meta.url),'utf8');
test('v199 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
});
test('imagem de fundo: estado, render, salvamento e publicação',()=>{
 // estado carrega de mapa salvo (fundoImagem no documento) e de oficina2State
 assert.match(app,/bgImage:String\(m\.fundoImagem\|\|m\.oficina2State\?\.bgImage\|\|''\)/);
 // render do editor e da mesa incluem <image> com slice logo após o rect de fundo
 const ocorrencias=(app.match(/<image href="\$\{gm2esc\(gm2\.st\.bgImage\)\}"/g)||[]).length;
 assert.ok(ocorrencias>=2,'imagem de fundo no render do editor e no SVG estático da mesa');
 assert.match(app,/preserveAspectRatio="xMidYMid slice"/);
 // salvamento por referência: data URL sobe para o Storage e o documento leva fundoImagem
 assert.match(app,/st\.bgImage=await map803UploadImagem_\(st\.bgImage,mapId,cache,seq\)/);
 assert.match(app,/fundoImagem:slim\.state\.bgImage\|\|''/);
 // publicação na mesa leva o campo para o labEstado_
 assert.match(app,/labEstado_\.fundoImagem=gm2\.st\.bgImage\|\|''/);
 // UI: botão + input de arquivo da imagem de fundo
 assert.match(app,/id="gm2bgimage"/);
 assert.match(app,/id="gm2bgfile"/);
});
