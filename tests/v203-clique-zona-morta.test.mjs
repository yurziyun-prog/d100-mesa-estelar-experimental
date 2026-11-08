import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v203 — zona morta de clique no editor da mesa: clicar (mesmo com jitter de pixel) só
// seleciona; estrutura/token só move se o arrasto passar do limiar. Antes, qualquer clique
// com 1 px de tremor já persistia a "movimentação" da estrutura no Firestore.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const editor=fs.readFileSync(new URL('../js/nova-editor.js',import.meta.url),'utf8');
const direta=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');
test('v203 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
});
test('pointerup do editor tem zona morta e devolve o elemento ao lugar',()=>{
 // limiar aplicado a objeto, elemento nativo e token
 assert.match(editor,/\['object','native','token'\]\.includes\(edit\.kind\)/);
 assert.match(editor,/Math\.hypot\(Number\(edit\.dx\)\|\|0,Number\(edit\.dy\)\|\|0\)<\.06/);
 // sem commit no clique: restaura posição visual e chama changed() sem commit
 assert.match(editor,/edit\.element\.style\.left=edit\.left/);
 const iDead=editor.indexOf("['object','native','token']");
 const iCommit=editor.indexOf('commit(edit);else changed();});',iDead);
 assert.ok(iDead>-1&&iCommit>iDead,'zona morta vem antes do commit');
});
test('arrasto de verdade continua comitando',()=>{
 // o commit ainda exige deslocamento (dx||dy) para token/objeto
 assert.match(editor,/edit\.kind==='draw'\?edit\.stroke\.points\.length>1:edit\.dx\|\|edit\.dy/);
});
test('import do editor atualizado',()=>{
 assert.match(direta,/nova-editor\.js\?v=203/);
});
