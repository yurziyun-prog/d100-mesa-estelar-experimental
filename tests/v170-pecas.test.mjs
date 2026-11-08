import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {PECAS} from '../js/mesa-pecas-dados.js';
import {plantaPassavel,decorar,modeloDaPeca} from '../js/mesa-pecas.js';
test('v170 peças: imagens existem, tamanhos reais, sem veículos ainda',()=>{
 assert.ok(PECAS.length>=70);for(const p of PECAS)assert.ok(existsSync(new URL('../'+p.src,import.meta.url)),p.src);
 const t=id=>PECAS.find(p=>p.id===id);assert.ok(t('ia_barril').larguraM<=1.05&&t('ia_casa_retangular').larguraM>=7.5);assert.ok(PECAS.filter(p=>p.cat==='veiculo'||p.cat==='nave').length===32);const nv=PECAS.find(p=>p.id==='ia_veiculo_nave_cargueiro_dourado');assert.equal(nv.larguraM,15);assert.equal(nv.alturaM,24);
 assert.equal(modeloDaPeca(t('ia_arbusto')).bloqueiaMovimento,false);assert.ok(modeloDaPeca(t('ia_telhado_madeira')).tetoV139);
});
test('v170 plantas pequenas não barram; decorador não fecha corredor estreito',()=>{
 assert.ok(plantaPassavel({nome:'Planta',larguraM:1,alturaM:1}));assert.ok(!plantaPassavel({nome:'Palmeira gigante',larguraM:4,alturaM:4}));assert.ok(!plantaPassavel({nome:'Barril'}));
 // corredor de 2 m entre duas paredes: nada que barra cabe
 const cena={objects:[{x:14,y:3,larguraM:28,alturaM:6,bloqueiaMovimento:true},{x:14,y:11,larguraM:28,alturaM:6,bloqueiaMovimento:true}]};
 const out=decorar(cena,{W:28,H:14,pedidos:[{ids:['ia_barril','ia_caixa'],qtd:10,parede:true}]});assert.equal(out.length,0);
 const largo=decorar({objects:[{x:14,y:1,larguraM:28,alturaM:2,bloqueiaMovimento:true}]},{W:28,H:14,pedidos:[{ids:['ia_barril'],qtd:5,parede:true}]});assert.ok(largo.length>0);
 for(const f of ['js/nova-direta.js','js/mesa-tempo-real.js','js/mesa-vida.js'])assert.match(readFileSync(new URL('../'+f,import.meta.url),'utf8'),/mesaPassavelV170_/,f);
});
