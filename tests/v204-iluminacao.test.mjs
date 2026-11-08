import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v204 — iluminação por níveis: o botão 🌫️ do mestre agora cicla claro → penumbra → escuro.
// Sem lanterna, a visão encolhe conforme a iluminação (penumbra ~10 m, escuro ~5 m); com
// lanterna, o cone (v202) projeta pelo menos 12 m mesmo no escuro. O campo luzV204 do mapa
// define o padrão até o mestre tocar no botão; chaves booleanas antigas viram 'penumbra'.
import {paramsLuz,gradeVisao,poligonoVisao,dentroPoligono} from '../js/mesa-nevoa.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const nevoa=fs.readFileSync(new URL('../js/mesa-nevoa.js',import.meta.url),'utf8');
const W=28,H=14,P={x:14,y:7};
const grade=gradeVisao([],W,H);
test('v204 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-mesa/);
});
test('paramsLuz: escuro ~5 m, penumbra ~10 m, claro ~16 m',()=>{
 assert.deepEqual(paramsLuz('escuro'),{alcance:5,perto:2});
 assert.deepEqual(paramsLuz('penumbra'),{alcance:10,perto:3});
 assert.equal(paramsLuz(false).alcance,16,'claro mantém o alcance antigo');
 assert.equal(paramsLuz('claro').alcance,16,'claro explícito também');
});
test('penumbra sem lanterna: vê ~8 m, não vê ~12 m',()=>{
 const Pn=paramsLuz('penumbra'),poli=poligonoVisao(grade,P,Pn.alcance,180,null,Math.PI*.42,Pn.perto);
 assert.ok(dentroPoligono({x:8,y:7},poli),'7 m a oeste visível em penumbra');
 assert.ok(!dentroPoligono({x:24.5,y:7},poli),'10,5 m a leste fora do alcance de penumbra');
});
test('escuro sem lanterna: vê ~4 m, não vê ~8 m',()=>{
 const Pe=paramsLuz('escuro'),poli=poligonoVisao(grade,P,Pe.alcance,180,null,Math.PI*.42,Pe.perto);
 assert.ok(dentroPoligono({x:11,y:7},poli),'3 m a oeste visível no escuro');
 assert.ok(!dentroPoligono({x:22,y:7},poli),'8 m a leste invisível no escuro');
});
test('escuro com lanterna: cone projeta pelo menos 12 m na direção olhada',()=>{
 const Pe=paramsLuz('escuro'),poli=poligonoVisao(grade,P,Math.max(Pe.alcance,12),180,0,Math.PI*.42,Pe.perto);
 assert.ok(dentroPoligono({x:24,y:7},poli),'10 m à frente dentro do cone no escuro');
 assert.ok(dentroPoligono({x:25.5,y:7},poli),'11,5 m à frente ainda no cone');
 assert.ok(!dentroPoligono({x:7,y:7},poli),'7 m atrás fora do cone (só proximidade de 2 m)');
});
test('névoa aplica paramsLuz, luz do mapa, modo AUTOMÁTICO (v205) e ciclo do mestre',()=>{
 assert.match(nevoa,/export function paramsLuz\(modo\)/);
 assert.match(nevoa,/const modoLuz=\(\)=>\{const v=escolhaDoMestre\(\);return v!==undefined\?v:automatico\(\);\}/,'automático por padrão');
 assert.match(nevoa,/v&&typeof v==='object'&&v\.v===2\?v\.m:undefined/,'valores antigos (sem v:2) são ignorados');
 assert.match(nevoa,/m\?\.luzV204&&m\.luzV204!=='claro'\)return m\.luzV204/);
 assert.match(nevoa,/m\?\.nevoaV145\)return 'penumbra'/);
 assert.match(nevoa,/ambiente==='noite'\|\|e\.clima==='neblina'\)return 'penumbra'/,'noite ou neblina ligam a névoa');
 assert.match(nevoa,/return false;\};\n const modoLuz/,'lugar claro de dia: sem névoa');
 assert.match(nevoa,/const P=paramsLuz\(modoLuz\(\)\)/);
 assert.match(nevoa,/dir!==null\?Math\.max\(P\.alcance,12\):P\.alcance/);
 assert.match(nevoa,/seq=\[undefined,false,'penumbra','escuro'\]/,'ciclo automático → claro → penumbra → escuro');
 assert.match(nevoa,/🌑 Escuro/);
});
