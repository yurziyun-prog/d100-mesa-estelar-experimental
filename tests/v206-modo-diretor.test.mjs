import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v206 — modo diretor: aba separada onde o mestre joga como um PJ/NPC/criatura que acompanha
// o grupo, com visão de jogador (névoa, escuridão, lanterna em cone) e sem poderes de mestre.
// A janela principal continua sendo a do mestre. Base: v138 (?verComo=jogador → Kael Teste);
// agora ?verComo=<id de token> atua como aquele token. Em combate nada muda (turnos do mestre).
const ler=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=ler('index.html'),nucleo=ler('js/app/01-nucleo.js'),sync=ler('js/app/20-sincronizacao.js'),vespera=ler('js/mesa-vespera.js'),app22=ler('js/app/22-mesa-e-modulos.js');
test('v206 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-mesa/);
 assert.match(app22,/mesa-vespera\.js\?v=206/);
});
test('núcleo: qualquer verComo vira sessão de jogador; id vira token diretor',()=>{
 assert.match(nucleo,/const vc=new URLSearchParams\(location\.search\)\.get\('verComo'\)/);
 assert.match(nucleo,/if\(vc!=='jogador'\)window\.mesaDiretorV206_=decodeURIComponent\(vc\)/);
 assert.match(nucleo,/role:'jogador',mestreReal:true/);
 assert.match(nucleo,/if\(window\.mesaModoJogadorV138_&&!window\.mesaDiretorV206_\)\{/,'filtro do Kael Teste não prende o diretor');
 assert.match(nucleo,/if\(window\.mesaDiretorV206_\)\{const m=String\(window\.mesaDiretorV206_\)/,'ficha ativa acompanha o token quando o mestre a possui');
});
test('sincronização: ator efetivo é o token diretor; controle fora de combate',()=>{
 assert.match(sync,/const dirTok=window\.mesaDiretorV206_\?labTokenPorId_\(window\.mesaDiretorV206_\):null/);
 assert.match(sync,/if\(dirTok\)return dirTok/);
 assert.match(sync,/if\(window\.mesaDiretorV206_&&labEstado_\.fase!=='combate'&&String\(t\.id\)===String\(window\.mesaDiretorV206_\)\)return true/);
 assert.match(sync,/labPodeControlarTokenE6Base_\(t\)/,'caminho de jogador comum preservado');
});
test('véspera: botão 🎬, painel de escolha e aba com verComo=<token>',()=>{
 assert.match(vespera,/id='mesaDiretor'/);
 assert.match(vespera,/function painelDiretor\(\)/);
 assert.match(vespera,/mesaDiretorSel/);
 assert.match(vespera,/u\.searchParams\.set\('verComo',encodeURIComponent\(String\(id\)\)\)/);
 assert.match(vespera,/win\.open\(u\.toString\(\),'_blank'\)/);
 assert.match(vespera,/botaoDiretor\(\)/);
});
test('véspera: faixa mostra quem você está atuando; recomeçar só no Kael',()=>{
 assert.match(vespera,/const dirTok=win\.mesaDiretorV206_\?\(ctl\(\)\?\.todosTokens\?\.\(\)\|\|\[\]\)\.find/);
 assert.match(vespera,/Modo diretor: você está atuando como/);
 assert.match(vespera,/if\(!win\.mesaDiretorV206_\)\{const rb=/,'recomeçar no espaço-porto só para o Kael Teste');
});
