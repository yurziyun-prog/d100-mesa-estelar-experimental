import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {aparencia3DToken,folhaDe,lista3D} from '../js/mesa-arte3d.js';

test('combatente aprovado substitui apenas a arte correspondente e respeita a escolha do mestre',()=>{
 assert.equal(aparencia3DToken({spriteIdV199:'npc_combatente'}),'combatente_bege');
 assert.equal(aparencia3DToken({imagem:'arte/miniaturas/npc_combatente.webp'}),'combatente_bege');
 assert.equal(aparencia3DToken({spriteIdV199:'npc_combatente',arte3dV200:''}),'');
 assert.equal(aparencia3DToken({spriteIdV199:'npc_combatente',arte3dV200:'h_adventurer'}),'h_adventurer');
 for(const t of [null,{}, {spriteIdV199:'npc_medico'},{imagem:'arte/miniaturas/zumbi_1.webp'}])assert.equal(aparencia3DToken(t),'');
 assert.ok(lista3D().some(x=>x.id==='combatente_bege'));
});

test('combatente tem arte real de frente, costas e lado nas ações do jogo',()=>{
 for(const a of ['parado','andar','atacar','golpe','morrer']){
  const files=new Set();for(const d of ['lado','costas','frente']){
   const f=folhaDe('combatente_bege',a,d);assert.equal(f.quadros,12);assert.ok(f.dur>0);
   const bytes=fs.readFileSync(new URL('../arte/miniaturas3d/'+f.arquivo,import.meta.url));
   assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');files.add(f.arquivo);
  }assert.equal(files.size,3,'não usa a mesma imagem nas três direções');
 }
});
