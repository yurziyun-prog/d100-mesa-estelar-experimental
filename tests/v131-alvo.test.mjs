import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {chanceDeTrocar} from '../js/mesa-tempo-real-ia.js';
const rt=readFileSync(new URL('../js/mesa-tempo-real.js',import.meta.url),'utf8');
test('v131: troca de alvo para quem atacou — mais provável se for ameaça maior',()=>{
 const base=chanceDeTrocar({poderAtual:50,poderAgressor:50,distAtual:1,distAgressor:2});
 assert.ok(base>.5&&base<.7);
 assert.ok(chanceDeTrocar({poderAtual:40,poderAgressor:70,distAtual:1,distAgressor:2})>base);
 assert.ok(chanceDeTrocar({poderAtual:70,poderAgressor:30,distAtual:1,distAgressor:2})<base);
 assert.ok(chanceDeTrocar({poderAtual:50,poderAgressor:50,distAtual:1,distAgressor:12})<base);
 assert.ok(chanceDeTrocar({poderAtual:50,poderAgressor:50,perfil:{alvo:'vinganca'}})>base);
});
test('v131: o tamanho da miniatura não se perde quando ela ataca no tempo real',()=>{
 assert.match(rt,/const CHAVES_POS=\[[^\]]*'diametroM'/);assert.match(rt,/provocacao\.set\(info\.targetId,info\.actorId\)/);
});
