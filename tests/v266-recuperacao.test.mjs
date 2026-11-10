import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ler=p=>fs.readFileSync(path.join(raiz,p),'utf8');

test('barra mestre permite múltiplas linhas e não recorta comandos',()=>{
 const source=ler('js/mesa-barra.js');
 assert.match(source,/#mbBarra\{[^}]*flex-wrap:wrap/);
 assert.match(source,/#mbBarra\{[^}]*height:auto/);
 assert.doesNotMatch(source,/#mbBarra\{[^}]*overflow-x:auto/);
 assert.match(source,/id='mbFerramentasV264'/);
});

test('barra do mapa possui uma única ação Salvar no cabeçalho',()=>{
 const html=ler('index.html');
 assert.equal((html.match(/id="mesaSaveButtonV263"/g)||[]).length,1);
 assert.equal((html.match(/id="mesaTopBarV265"/g)||[]).length,1);
 const h=html.indexOf('id="mesaTopBarV265"');
 const b=html.indexOf('id="mesaSaveBarV263"');
 const s=html.indexOf('id="novaSyncStatus"');
 assert.ok(h>=0&&b>h&&s>b&&s-h<1300);
});

test('publicação exige textura, copas e objetos originais',()=>{
 const builder=ler('scripts/preparar-hosting.cjs');
 for(const p of ['arte/texturas/grama.webp','arte/texturas/madeira.webp','arte/texturas/tijolo.webp','arte/pecas','arte/copas']) assert.ok(builder.includes(p),p);
 assert.match(builder,/PUBLICAÇÃO BLOQUEADA/);
});

test('editor só confirma salvamento se o Firebase confirmar',()=>{
 const rapido=ler('js/mesa-editor-rapido.js');
 assert.ok(rapido.includes("resultado?.estado==='confirmado'"));
 assert.ok(rapido.includes('O mapa NÃO foi salvo'));
});
