import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v208 — mecânicas MMO vistas de cima:
//  • Clique para mover: toque no chão (sem arrastar) faz o personagem CAMINHAR até o ponto,
//    desviando de paredes/portas (pathfinding caminho()/montarGrade() da IA do tempo real).
//  • Tempo real automático: um ataque fora de qualquer combate LIGA o tempo real na hora
//    (a hostilidade inicia o combate dinâmico); com combate por turnos ativo, segue o antigo.
//  • Interação por clique: 1º clique no token seleciona o alvo; 2º clique no MESMO abre as
//    ações dele (atacar, conversar, usar) — mesmo atalho do botão do controle.
const ler=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=ler('index.html'),direta=ler('js/nova-direta.js'),rt=ler('js/mesa-tempo-real.js'),ataques=ler('js/nova-ataques.js'),app22=ler('js/app/22-mesa-e-modulos.js');
test('v208 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-mesa/);
 assert.match(app22,/nova-direta\.js\?v=\d+/);
 assert.match(app22,/mesa-tempo-real\.js\?v=208/);
});
test('clique para mover: pathfinding e detecção de toque',()=>{
 assert.match(direta,/import \{montarGrade,caminho\} from '\.\/mesa-tempo-real-ia\.js\?v=133'/);
 assert.match(direta,/function computarRota\(t,destino28\)\{/);
 assert.match(direta,/pts=caminho\(grade,M\(t\),M\(destino28\)\)\|\|\[\]/);
 assert.match(direta,/o\.bloqueiaMovimento&&!o\.destruido&&!globalThis\.mesaPassavelV170_/);
 assert.match(direta,/function tapParaAndar\(e\)\{/);
 assert.match(direta,/h\.target=rota\[0\];h\.rota=rota\.slice\(1\);h\.pointer='rota'/);
 assert.match(direta,/if\(distance<\.08\)\{if\(h\.rota\?\.length\)\{h\.target=h\.rota\.shift\(\)/,'loop de movimento consome a rota');
 assert.match(direta,/if\(!tapParaAndar\(e\)\)release\(\)/,'toque no chão não solta o personagem: ele vai andando');
 assert.match(direta,/downPt:point\(e\)\}/,'ponto do toque registrado no pointerdown');
});
test('tempo real automático: iniciarRT reutilizável e gancho no ataque',()=>{
 assert.match(rt,/async function iniciarRT\(\)\{/);
 assert.match(rt,/if\(!ehMestre\(\)\)return false/,'só o mestre inicializa a autoridade');
 assert.match(rt,/if\(iniciandoRT\)return iniciandoRT/,'requisições concorrentes compartilham a inicialização');
 assert.match(rt,/estado=proximo/,'estado local acompanha a confirmação da transação');
 assert.match(rt,/iniciar:iniciarRT/,'ponte expõe iniciar');
 assert.match(ataques,/await globalThis\.mesaTempoRealV111\.iniciar\?\.\(\)/);
 assert.match(ataques,/await globalThis\.mesaTempoRealV111\.assumir\(id,command\)/);
});
test('interação: 2º clique no alvo abre as ações',()=>{
 assert.match(direta,/if\(selectedTarget===clicked\)\{try\{root\.defaultView\.mesaAcoesMapaAbrir_\?\.\(clicked\);\}catch\(_\)\{\}\}/);
 assert.match(direta,/else selectedTarget=clicked/,'1º clique continua só selecionando');
});
