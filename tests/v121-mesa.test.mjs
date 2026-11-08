import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const barra=readFileSync(new URL('../js/mesa-barra.js',import.meta.url),'utf8');
test('v121: ficha rápida fica numa gaveta logo depois do mapa e antes do histórico',()=>{
 const iMapa=html.indexOf('class="nova-board-scroll"'),iGav=html.indexOf('id="novaSyncFichaGaveta"'),iPainel=html.indexOf('id="novaSyncActionPanel"'),iHist=html.indexOf('id="novaSyncHistorySection"');
 assert.ok(iMapa>0&&iMapa<iGav&&iGav<iPainel&&iPainel<iHist);
 assert.equal(html.split('id="novaSyncActionPanel"').length,2);
 assert.match(html,/mesa:fichaRapida/);
});
test('v121: Oficina em abas e recolhível',()=>{
 for(const k of ['gm2-maprow','gm2-stylerow','data-ofi-fechar','mb-ofi-oculta','arrumarOficina'])assert.ok(barra.includes(k),k);
});
