import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v209 — realismo no mapa (pedido do Yuri):
//  • Sem grade de batalha na mesa (o mapa fica limpo, estilo MMO visto de cima); a grade
//    volta apenas no editor de mapa (board.dataset.editing).
//  • Sem "aura": tokens perdem o anel ciano e o fundo escuro permanente (viram só a miniatura
//    com sombra de chão); nome do personagem some e reaparece no toque/seleção ou no hover.
//  • Objetos interativos (porta, cama, luz, baú) não têm mais emoji flutuante o tempo todo:
//    a arte do mapa é o objeto; ao CHEGAR PERTO aparece uma pílula contextual (Abrir, Deitar,
//    Ligar, Destrancar…). Item no chão é só a imagem do item, sem brilho dourado pulsante.
const ler=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=ler('index.html'),direta=ler('js/nova-direta.js'),obj=ler('js/mesa-objetos.js'),app22=ler('js/app/22-mesa-e-modulos.js');
test('v209 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-mesa/);
 assert.match(app22,/nova-direta\.js\?v=\d+/);
 assert.match(app22,/mesa-objetos\.js\?v=209/);
});
test('mesa sem grade de batalha (nem o editor mostra, v193)',()=>{
 assert.match(direta,/const editandoGrade=board\.dataset\.editing==='true'/);
 assert.match(direta,/for\(const r of layer\.querySelectorAll\('rect\[fill="url\(#novaGrid\)"\]'\)\)r\.style\.display=editandoGrade&&globalThis\.mesaGradeNaMesa===true\?'':'none'/);
 assert.doesNotMatch(direta,/pattern#novaGrid path/);
});
test('tokens sem aura: miniatura limpa, nome só no toque/hover',()=>{
 assert.match(direta,/border:3px solid transparent;background:'\+\(t\.imagem\?'transparent':'#263d62'\)\+'/);
 assert.match(direta,/node\.style\.filter='drop-shadow\(0 2px 3px rgba\(0,0,0,\.45\)\)'/);
 assert.match(direta,/label\.style\.opacity=\(t\.id===selectedTarget\|\|t\.id===select\.value\)\?'1':''/);
 assert.match(direta,/borderColor=t\.id===select\.value\?'#ffd447':t\.id===selectedTarget\?'#ff7855':'transparent'/);
 assert.match(direta,/ndCssV209/);
});
test('objetos: ação contextual ao perto, item no chão sem brilho',()=>{
 assert.match(obj,/if\(itemSolto\(o\)\)return true;/,'item no chão sempre visível (a imagem dele)');
 assert.match(obj,/if\(t\)return \(m&&todos\)\|\|perto\(o\);/,'interativo só aparece quando perto (ou mestre no modo todos)');
 assert.match(obj,/class="mo-vizinho( mo-quieto)?"/,'ação contextual (v205: existe para F/controle/clique no objeto, mas não é desenhada)');
 assert.match(obj,/Destrancar/);
 assert.match(obj,/moCssV209/);
 assert.match(obj,/#moCamada \.mo-item\{width:auto;height:auto;border:0;background:transparent;box-shadow:none;opacity:1;animation:none/);
 assert.match(obj,/data-scene-object="\$\{CSS\.escape\(String\(abertoId\)\)\}"/,'balão ancora na arte do objeto quando não há ícone');
 assert.match(obj,/closest\('\.mo-ic,\.mo-vizinho'\)/);
});
