import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file=lerApp();
const start=file.indexOf('const penalidadeCompatibilidadeArma481Base_');
const end=file.indexOf('// Som próprio de lâmina energética',start);
const source=file.slice(start,end);
const normalizar=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function carregar(){
 const c={
  penalidadeCompatibilidadeArma_:()=>2,
  familiasArmaCompatV46471_:()=>new Set(['energia','pistola','energia_pistola']),
  labEhLaminaEnergia481_:()=>false,
  normalizarTextoCombate_:normalizar,
  getNome:value=>value?.nome||''
 };
 vm.createContext(c);vm.runInContext(source,c);return c;
}

test('Armas de Energia Exóticas reconhece Blaster de Palma como compatível sem +2 graus',()=>{
 const c=carregar();
 assert.equal(c.penalidadeCompatibilidadeArma_({id:'armas_energia_exoticas',nome:'Armas de Energia Exóticas'},{nome:'Blaster de Palma'}),0);
});

test('correção de energia exótica não libera uma perícia não energética',()=>{
 const c=carregar();
 assert.equal(c.penalidadeCompatibilidadeArma_({id:'outra_pericia',nome:'Outra Perícia'},{nome:'Blaster de Palma'}),2);
});
