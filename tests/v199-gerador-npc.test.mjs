// v199 — gerador de NPCs/criaturas (motor do MapForge) e miniaturas artísticas: motor, adaptador para o banco do site, sprites e estilos.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const raiz=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const motor=await import('../js/mesa-npc-motor.js');
const {fichaParaModeloNpc,textoFicha,spriteDaFicha,idArteDaFicha,carregarMotor,motorCarregado}=await import('../js/mesa-gerador-npc.js');
assert.equal(motorCarregado(),false,'o motor só carrega sob demanda');await carregarMotor();assert.equal(motorCarregado(),true);
const {spriteDoToken,spriteDeEspecie,SPRITES,SPRITE_POR_PAPEL,especieDoToken}=await import('../js/mesa-sprites-npc.js');

test('v199 motor: dados reais do jogo e semente repetível',()=>{
 assert.equal(motor.RACAS.length,16);assert.equal(motor.CARREIRAS.length,33);assert.equal(motor.CRIATURAS.length,29);assert.equal(motor.PAPEIS.length,7);assert.equal(motor.PODERES.length,6);
 const a=motor.gerarNpc({seed:99,papel:'combatente',poder:4,quantidade:3,racaId:'aleatoria'}).fichas,b=motor.gerarNpc({seed:99,papel:'combatente',poder:4,quantidade:3,racaId:'aleatoria'}).fichas;
 assert.deepEqual(a,b,'a mesma semente gera as mesmas fichas');assert.equal(a.length,3);
 for(const f of a){for(const k of ['FOR','CON','TAM','DES','INT','POD','CAR'])assert.ok(f.atributos[k]>=3&&f.atributos[k]<=18,'atributo dentro de 3–18 (poder 4): '+k+f.atributos[k]);assert.ok(f.atributos.TAM>=6&&f.atributos.INT>=6);assert.ok(f.pv>0&&f.sorte>0&&f.pericias.length>0);}
 const c=motor.gerarCriaturas({seed:5,quantidade:4,poderMin:3}).fichas;assert.equal(c.length,4);assert.ok(c.every(f=>f.tipo==='criatura'&&f.especieId));
});

test('v199 ficha de NPC vira modelo do banco do site (formato de perícias, atributos e arte)',()=>{
 const f=motor.gerarNpc({seed:1,papel:'profissional',poder:3,quantidade:1,racaId:'aleatoria'}).fichas[0],m=fichaParaModeloNpc(f);
 assert.match(m.id,/^npc_[a-z0-9_]+_\d+$/);assert.equal(m.tipo,'NPC');assert.equal(m.nome,f.nome);
 for(const k of ['FOR','CON','TAM','DES','INT','POD','CAR'])assert.equal(m[k],String(f.atributos[k]));
 assert.ok(m.periciasTexto.split('|').every(p=>/^.+:\d+$/.test(p)),'perícias Nome:valor|…');assert.ok(m.selecionavelCombate==='true');
 assert.equal(m.imagem,'arte/miniaturas/npc_medico.webp','profissional usa a médica');
 assert.match(textoFicha(f),/PV \d+/);assert.equal(idArteDaFicha(f),'npc_medico');assert.equal(spriteDaFicha(f),'arte/miniaturas/npc_medico.webp');
});

test('v199 miniaturas: papéis, espécies, apelidos, tokens do mapa e arquivos de verdade',()=>{
 for(const papel of Object.keys(SPRITE_POR_PAPEL))assert.ok(SPRITES.has(SPRITE_POR_PAPEL[papel]),'arte do papel '+papel);
 const ids=motor.CRIATURAS.map(c=>c.id);assert.ok(ids.every(id=>spriteDeEspecie(id)),'toda criatura do bestiário tem miniatura artística (inclui o macaco, que tem outro nome de arquivo)');
 assert.equal(spriteDoToken({id:'synccriatura%3Abesta_ululante~3'}),'arte/miniaturas/besta_ululante.webp');assert.equal(especieDoToken({id:'synccriatura:cila~2'}),'cila');
 assert.equal(spriteDoToken({id:'syncnpc:x',spriteIdV199:'npc_mercador'}),'arte/miniaturas/npc_mercador.webp');assert.equal(spriteDoToken({id:'syncnpc:x'}),'');assert.equal(spriteDoToken({id:'pj:fulano'}),'');
 for(const id of SPRITES){for(const p of ['arte/miniaturas/'+id+'.webp','arte/miniaturas/grande/'+id+'.webp'])assert.ok(fs.existsSync(path.join(raiz,p)),'arquivo '+p);
  assert.ok(fs.statSync(path.join(raiz,'arte/miniaturas/'+id+'.webp')).size<150*1024,'miniatura leve (<150 KB): '+id);}
});

test('v199 animações e sons: CSS das miniaturas, sons de golpe e passos, nada de gerador antigo pendurado no laboratório',()=>{
 const ef=fs.readFileSync(path.join(raiz,'js/mesa-efeitos.js'),'utf8');
 for(const k of ['efRespira','efPassada','efInvestida','efSacode','efDesvia','efSurge','efTomba','prefers-reduced-motion'])assert.ok(ef.includes(k),'CSS '+k);
 for(const s of ['passo()','passoPesado()','corte()','golpe()','mordida()','garra()','surgir()'])assert.ok(ef.includes(s),'som '+s);
 assert.ok(ef.includes('export function tipoCorpo'));
 assert.ok(!fs.existsSync(path.join(raiz,'js/app/25-gerador-rapido.js')),'o botão antigo preso ao Laboratório de Combate saiu');
 const dir=fs.readFileSync(path.join(raiz,'js/mesa-diretor.js'),'utf8');assert.ok(dir.includes("['npc','🎲 Gerador']")&&dir.includes('criarGeradorNpc'));
});
