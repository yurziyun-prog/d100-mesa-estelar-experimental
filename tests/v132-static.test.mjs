import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {pesoRaio,escolherAtingido,inflamavel,temMetal,abrigoEf,tipoArma} from '../js/mesa-efeitos.js';
import {normalizarConfig,climaEfetivo,CLIMAS,ABRIGOS} from '../js/mesa-visual.js';
import {npcTemCopias} from '../js/mesa-barra.js';
import {gerarTaverna} from '../js/mesa-gerador-mapas.js';
const ler=f=>/(^|\/)app\.js$/.test(f)?lerApp():readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
test('v132: raio ≠ relâmpago; grandes e metálicos atraem mais',()=>{
 assert.ok(pesoRaio({diametroM:4},'Cila')>pesoRaio({diametroM:1},'humano'));
 assert.ok(pesoRaio({diametroM:1},'UR-17 Robô administrador')>=3*pesoRaio({diametroM:1},'Kara Venn')-1e-9);
 assert.ok(temMetal('soldado de armadura'));assert.ok(!temMetal('Kara Venn'));
 assert.equal(escolherAtingido([{t:'a',peso:1}],.99,8),null); // quase sempre cai no chão
 assert.equal(escolherAtingido([{t:'a',peso:1}],.01,8),'a');
 const ef=ler('mesa-efeitos.js');assert.match(ef,/Math\.random\(\)<\.08\*int\*ab\.raio/);assert.match(ef,/natureza:'clima'/);
});
test('v132: abrigo, tempestade de areia e meteoros',()=>{
 assert.ok(CLIMAS.areia&&CLIMAS.meteoros);assert.equal(ABRIGOS.length,5);
 assert.equal(normalizarConfig({abrigo:9}).abrigo,4);assert.equal(normalizarConfig({}).abrigo,0);
 assert.equal(climaEfetivo({abrigo:2,clima:'chuva'},{ativo:true,clima:'tempestade'}).abrigo,2);
 assert.equal(abrigoEf(1).raio,.3);assert.equal(abrigoEf(4).raio,0);assert.ok(abrigoEf(4).meteoro>0);
 assert.equal(tipoArma('Meteoro'),'explosao');
 assert.ok(inflamavel({nome:'Mesa de madeira'}));assert.ok(!inflamavel({nome:'Cápsula de aluguel'}));assert.ok(!inflamavel({nome:'Console de metal'}));
});
test('v132: NPC com nome tem uma miniatura só',()=>{
 assert.ok(!npcTemCopias({nome:'UR-17'}));assert.ok(!npcTemCopias({nome:'Kara Venn'}));
 assert.ok(npcTemCopias({nome:'Guarda da Casa'}));assert.ok(npcTemCopias({nome:'Qualquer',generico:true}));
 assert.match(ler('mesa-barra.js'),/instancia:a\.copias!==false/);
});
test('v132: taverna do UR-17 com quartos-cápsula',()=>{
 const ids=['pk_fut_porta','pk_fut_capsula','pk_fut_armario','pk_fut_console','pk_fut_neon','pk_fut_cadeira','pk_retro_mesa','pk_retro_poltrona','pk_retro_radio','pk_retro_luminaria','pk_retro_sofa'];
 const st=gerarTaverna({objetos:ids.map(id=>({id,nome:id,larguraM:1,alturaM:1})),nome:'A Última Bateria'});
 const nomes=st.elements.map(e=>e.nome||e.name);
 assert.equal(nomes.filter(n=>/^Cápsula de aluguel/.test(n)).length,6);
 assert.equal(nomes.filter(n=>/^Porta da cápsula/.test(n)).length,6);
 assert.ok(nomes.includes('Caixa registradora de UR-17'));assert.ok(st.tavernaV132);
 const app=ler('app.js');assert.match(app,/mesa-elenco\.js\?v=1\d\d/);assert.match(app,/mesa-efeitos\.js\?v=1\d\d/);
});
test('v132: Cila — seis cabeças independentes, não sai do lugar; Trombeta em cone a partir do atacante',async()=>{
 const {cabecasDe,alvoDaCabeca}=await import('../js/mesa-tempo-real-ia.js');
 assert.equal(cabecasDe({comportamento:'Territorial e séssil; seis pescoços caçam independentemente'}),6);
 assert.equal(cabecasDe({descricao:'Uma besta comum'}),0);
 assert.equal(alvoDaCabeca(4,['a','b','c']),'b');
 const rt=ler('mesa-tempo-real.js');assert.match(rt,/if\(prep\.area\)return resolverArea/);assert.match(rt,/if\(!\(Number\(d\?\.mov\)>0\)\)return false;/);
 const app=ler('app.js');assert.match(app,/cone_sonoro/);assert.match(app,/mesa-cabecas\.js\?v=132/);
});
