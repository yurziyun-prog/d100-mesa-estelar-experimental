import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file=lerApp();
const start=file.indexOf('function novaValorPericiaTotal_');
const end=file.indexOf('async function novaPrepararAtaque_',start);
const source=file.slice(start,end);

function carregar(base=53){
 const c={
  Math,
  obterValorRegistroPericia_:()=>base,
  valorPericiaComArmadura_:(_,__,raw)=>({valor:Math.floor(raw*.85),pct:15}),
  obterItensEquipados_:()=>[],getNome:p=>p?.nome||'',
  batalhaPenalidadeFerimento_:()=>0,labPenalidadeFerimentoLab22_:()=>0,
  batalhaPenalidadeCaido_:()=>0,batalhaPenalidadeInfeccao_:()=>0,
  periciaCriaturaPodeAtacar_:()=>true,
  aplicarDificuldadeEFadiga_:(_,valor)=>({valor:Math.floor(valor*(2/3)),degrausFadiga:1,modificadorMestre:0,efetiva:{nome:'Difícil'}}),
  traduzirNomeFadiga_:()=> 'Ofegante'
 };
 vm.createContext(c);vm.runInContext(source,c);return c;
}

test('histórico explica 53 → 30 como armadura de 15% mais fadiga Difícil',()=>{
 const c=carregar(53),char={combate:{fadiga:'Winded'}},token={psiEffects:{},combateLab:{},supportRound:1},per={id:'pistolas_revolveres',nome:'Pistolas e Revólveres'};
 const d=c.novaDetalharValorPericia_(char,token,per,0);
 assert.equal(d.armaduraValor,45);assert.equal(d.aposDificuldade,30);assert.equal(d.valor,30);
 const txt=c.novaDescreverTesteAtaque_(d,33);
 assert.match(txt,/base 53/);assert.match(txt,/armadura −15% → 45/);assert.match(txt,/fadiga Ofegante → Difícil → 30/);assert.ok(!txt.includes('outros modificadores'));
});

test('histórico explica 58 → 32 pelo mesmo caminho sem inventar incompatibilidade',()=>{
 const c=carregar(58),char={combate:{fadiga:'Winded'}},token={psiEffects:{},combateLab:{},supportRound:1},per={id:'armas_energia_exoticas',nome:'Armas de Energia Exóticas'};
 const d=c.novaDetalharValorPericia_(char,token,per,0);
 assert.equal(d.armaduraValor,49);assert.equal(d.aposDificuldade,32);assert.equal(d.valor,32);assert.equal(d.grausCompatibilidade,0);
});
