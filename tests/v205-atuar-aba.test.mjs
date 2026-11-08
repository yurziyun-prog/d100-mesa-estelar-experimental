import {test} from 'node:test';
import assert from 'node:assert/strict';
import {idParaAba,urlParaAba} from '../js/mesa-atuar-aba.js';
test('atuar como: só personagens abrem aba (não "Mestre" nem automático)',()=>{
 assert.equal(idParaAba('__mestre__'),'');assert.equal(idParaAba('__automatico__'),'');assert.equal(idParaAba(''),'');
 assert.equal(idParaAba('synccriatura%3Arastejante_de_cinzas'),'synccriatura%3Arastejante_de_cinzas');
});

test('URL preserva ID de criatura codificado no contrato do modo diretor',()=>{
 const id='synccriatura%3Arastejante_de_cinzas~900';
 const url=new URL(urlParaAba('https://mesa.test/?antigo=1#mapa',id));
 assert.equal(decodeURIComponent(url.searchParams.get('verComo')),id);
 assert.equal(url.searchParams.has('antigo'),false);assert.equal(url.hash,'#mapa');
 assert.equal(urlParaAba(url.href,'__mestre__'),'');
});
