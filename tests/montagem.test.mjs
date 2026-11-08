import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs';
const require=createRequire(import.meta.url);const M=require('../scripts/montar.cjs');
const root=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1');
test('app.js vem só das partes em js/app/ (sem arquivo solto)',()=>{
 assert.ok(!fs.existsSync(new URL('../js/app.js',import.meta.url)),'js/app.js solto não deve existir');
 assert.ok(M.partesDoApp(root).length>=20);assert.match(M.montarApp(root),/^import /);
});
test('publicação: todo import existe, um endereço por módulo e pré-carregamento',()=>{
 const mods=M.lerModulos(root),res=M.carimbar(mods,'app.js');
 const urls={};for(const c of Object.values(res.codigo))for(const m of c.matchAll(/\.\/([\w.-]+\.js)\?h=(\w+)/g))(urls[m[1]]=urls[m[1]]||new Set()).add(m[2]);
 for(const [f,s] of Object.entries(urls))assert.equal(s.size,1,f+' com mais de um endereço');
 assert.ok(res.precarregar.includes('nova-direta.js'));
 const html=M.prepararIndex(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),res);
 assert.match(html,/<link rel="modulepreload" href="js\/nova-direta\.js\?h=\w+">/);assert.match(html,/src="js\/app\.js\?h=\w+"/);
});
test('import para arquivo inexistente cancela a publicação',()=>{
 assert.throws(()=>M.carimbar({'app.js':"import {x} from './nao-existe.js?v=1';"}),/inexistente/);
});
test('cache: js longo (endereço muda com o conteúdo), página sempre conferida',()=>{
 const f=JSON.parse(fs.readFileSync(new URL('../firebase.json',import.meta.url),'utf8')),h=f.hosting.headers;
 assert.match(JSON.stringify(h.find(x=>x.source==='**/*.js')),/immutable/);assert.match(JSON.stringify(h.find(x=>x.source==='/')),/no-cache/);
 assert.deepEqual(f.hosting.predeploy,['node scripts/preparar-hosting.cjs']);
});
