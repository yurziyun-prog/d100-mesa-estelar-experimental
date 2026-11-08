import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v207 — o modo diretor entra no combate em tempo real: o token escolhido luta MANUALMENTE
// como um PJ (ataques e psi da própria aba, com a recarga do personagem), a IA solta ele
// em todas as abas (auto=false persistido — o mestre devolve à IA marcando 🤖 no painel ⚙️),
// e as escolhas de crítico/consciência e a barra de recarga passam a ser dele. Combate por
// turnos continua proibido ao mesmo tempo (mapa.combat.active barra os comandos).
const ler=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=ler('index.html'),rt=ler('js/mesa-tempo-real.js'),app22=ler('js/app/22-mesa-e-modulos.js');
test('v207 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-mesa/);
 assert.match(app22,/mesa-tempo-real\.js\?v=208/);
});
test('automatico: token do diretor é manual nesta aba; regra antiga preservada',()=>{
 assert.match(rt,/const dirV207=\(\)=>String\(win\.mesaDiretorV206_\|\|''\)/);
 assert.match(rt,/const automatico=t=>\{if\(t&&dirV207\(\)&&String\(t\.id\)===dirV207\(\)\)return false;return automaticoRaw\(t\);\};/);
 assert.match(rt,/const automaticoRaw=t=>\{const v=estado\?\.auto\?\.\[t\.id\]/,'regra auto/🤖/jogador inalterada');
});
test('comandos de ataque/psi do diretor saem da aba dele, sem ser mestre local',()=>{
 assert.match(rt,/const dir=dirV207\(\)&&String\(command\.personagemId\)===dirV207\(\)/);
 assert.match(rt,/if\(\(!ehMestre\(\)&&!dir\)\|\|!estado\?\.ativo\|\|mapa\?\.combat\?\.active\)return false/);
 assert.equal((rt.match(/if\(\(!ehMestre\(\)&&!dir\)\|\|!estado\?\.ativo\|\|mapa\?\.combat\?\.active\)return false/g)||[]).length,2,'assumir e assumirPsi');
});
test('IA solta o token do diretor em todas as abas (auto=false, uma vez)',()=>{
 assert.match(rt,/autoDirGravadoV207=true;void dep\.setDoc\(D\(ESTADO\),\{auto:\{\[dir\]:false\}/);
 assert.match(rt,/estado\?\.auto\?\.\[dir\]!==false/);
});
test('escolhas de crítico/consciência e barra de recarga são do diretor',()=>{
 assert.match(rt,/\|\|\(dirV207\(\)&&String\(e\.actorId\)===dirV207\(\)\)/,'escolha de crítico');
 assert.match(rt,/\|\|\(dirV207\(\)&&String\(x\.actorId\)===dirV207\(\)\)/,'teste de consciência');
 assert.match(rt,/function meuToken\(\)\{\s*const dir=dirV207\(\);/);
});
