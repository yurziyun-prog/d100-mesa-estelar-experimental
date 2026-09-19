import fs from 'node:fs';import vm from 'node:vm';
import {aplicarTreinos,migrarTreinos,vinculosCriatura} from '../js/nova-criaturas.js';
import test from 'node:test';import assert from 'node:assert/strict';
test('atributos da criatura são persistidos uma vez e reutilizados entre leituras',async()=>{
 const file=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8'),source=file.slice(file.indexOf('async function novaFicha_'),file.indexOf('function novaEquipamentos_'));
 let saved=null,rolls=0,writes=0;const model={id:'besta',FOR:28,DES:16,CON:20,periciasTexto:'Combate Desarmado:69'};
 const c={structuredClone,labEstado_:{tokens:[]},batalhaCharLocal_:()=>null,criaturaBancoPorId_:()=>model,doc:()=>'',db:{},getDoc:async()=>({data:()=>saved}),batalhaEhMestre_:()=>true,runTransaction:async(_,fn)=>fn({get:async()=>({data:()=>saved}),set:(_,data)=>{saved=data;writes++;}}),atributosIndividuoDoModelo_:()=>{rolls++;return {FOR:28,DES:16,CON:20};},criarCriaturaCombateDoBanco_:(m,p)=>({__criaturaTemporaria:true,atributos:p.atributosIndividuo,pericias:{},armasNaturais:[]}),aplicarTreinos,novaBaseCriatura_:(a)=>a.FOR+a.DES,npcIdPericiaSistema_:()=> 'combate_desarmado'};
 vm.createContext(c);vm.runInContext(source,c);const a=await c.novaFicha_({id:'synccriatura%3Abesta'}),b=await c.novaFicha_({id:'synccriatura%3Abesta'});assert.equal(rolls,1);assert.equal(writes,1);assert.equal(a.pericias.combate_desarmado.totalNova,69);assert.deepEqual(a.atributos,b.atributos);
});

test('CSV antigo preserva fórmulas e total; CSV novo preserva treino sem migrar duas vezes',()=>{
 const file=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8'),start=file.indexOf("    if(tipo==='criaturas'){",file.indexOf('function normalizarLinhaImportacao_')),end=file.indexOf("    if (tipo === 'itens')",start);
 const c={structuredClone,criaturasDB:[{id:'besta_ululante',atributosRolados:true,formulasAtributos:{FOR:'3d6+8'}}],parseNumero_:(x,d)=>x==null?d:Number(x),parseBoolean_:x=>x===true||x==='true',migrarTreinos,vinculosCriatura,novaBaseCriatura_:a=>a.FOR+a.DES};vm.createContext(c);vm.runInContext('function importar(bruto){const tipo="criaturas",comum={id:bruto.id};'+file.slice(start,end)+'}',c);
 const raw={id:'besta_ululante',FOR:28,DES:16,periciasTexto:'Combate Desarmado:69',vinculosAtaquesPericias:'Eco da Matilha:Vontade'};
 const model=c.importar(raw);assert.equal(model.formulasAtributos.FOR,'3d6+8');assert.equal(model.atributosRolados,true);assert.equal(model.periciasTreino[0].treino,25);assert.equal(model.vinculosAtaquesPericias,'Eco da Matilha:Combate Desarmado');
 const fresh=c.importar({...raw,periciasSchema:2,periciasTreino:JSON.stringify(model.periciasTreino),atributosRolados:'false',FOR_formula:''});assert.equal(fresh.periciasTreino[0].treino,25);assert.equal(fresh.atributosRolados,false);assert.equal(Object.keys(fresh.formulasAtributos).length,0);
});
