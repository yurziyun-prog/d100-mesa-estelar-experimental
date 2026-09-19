import test from 'node:test';import assert from 'node:assert/strict';
import {migrarTreinos,aplicarTreinos,periciaDoAtaque,vinculosCriatura} from '../js/nova-criaturas.js';
import {moverInventario} from '../js/nova-inventario.js';import {iniciarIniciativa} from '../js/nova-turnos.js';
const base=(attrs,name)=>name==='Resistência'?attrs.CON*2:attrs.FOR+attrs.DES;
test('migração preserva total legado e não soma a base duas vezes nem migra duas vezes',()=>{
 const model={id:'besta_ululante',FOR:28,DES:16,CON:20,periciasTexto:'Combate Desarmado:69|Resistência:68',especializacoesTexto:'Mordida:70',vinculosAtaquesPericias:'Eco da Matilha:Vontade'};
 const schema=migrarTreinos(model,base);assert.equal(schema.periciasTreino[0].treino,25);assert.equal(schema.especializacoesTreino[0].treino,26);assert.equal(schema.legadoPericias.periciasTexto,model.periciasTexto);
 assert.deepEqual(migrarTreinos({...model,...schema,FOR:50},base),schema);
 const a=aplicarTreinos({atributos:{FOR:28,DES:16,CON:20},armasNaturais:[{nome:'Eco da Matilha'}]},model,base);assert.equal(a.pericias.combate_desarmado.totalNova,69);assert.equal(periciaDoAtaque('Eco da Matilha',a.vinculosAtaquesPericias),'Combate Desarmado');
 const b=aplicarTreinos({atributos:{FOR:24,DES:16,CON:18}},model,base);assert.equal(b.pericias.combate_desarmado.totalNova,65);
 assert.equal(migrarTreinos({...model,periciasTexto:'Combate Desarmado:10'},base).periciasTreino[0].treino,0);
});
test('vínculos próprios e formato inverso são respeitados; padrão é desarmado',()=>{
 assert.equal(periciaDoAtaque('Mordida','Mordida:Furtividade'),'Furtividade');assert.equal(periciaDoAtaque('Mordida','Furtividade:Mordida,Garras'),'Furtividade');assert.equal(periciaDoAtaque('Patada',''),'Combate Desarmado');
 assert.equal(vinculosCriatura({id:'outro',vinculosAtaquesPericias:'Eco da Matilha:Vontade'}),'Eco da Matilha:Vontade');
});
function args(){return {sheet:{inventario:{equipado:[null],mochila:[{instanciaId:'kit',nome:'Kit Médico',usosRestantes:3}],bolso:[null],casa:[null]}},actor:{},map:{combat:iniciarIniciativa([{id:'a',nome:'A',initiative:10,actions:3}],'s',()=>1)},cmd:{personagemId:'a',turnId:'s:0',fromComp:'mochila',toComp:'equipado',fromIndex:0,toIndex:0,itemKey:'kit',targetKey:''}};}
test('equipar qualquer item custa uma ação e preserva usos; operação inválida não altera fonte',()=>{
 const p=args(),out=moverInventario(p);assert.equal(out.cost,1);assert.equal(out.combat.actors.a.remaining,2);assert.equal(out.inventory.equipado[0].usosRestantes,3);assert.equal(out.inventory.mochila[0],null);assert.equal(p.sheet.inventario.mochila[0].usosRestantes,3);
 assert.throws(()=>moverInventario({...p,sheet:{inventario:out.inventory}}),/inventário mudou/);
 assert.throws(()=>moverInventario({...p,validarPeso:()=>false}),/capacidade/);
 for(const toComp of ['casa','veiculo'])assert.throws(()=>moverInventario({...p,cmd:{...p.cmd,toComp}}),/não estão acessíveis/);
 assert.throws(()=>moverInventario({...p,actor:{combateLab:{inconsciente:true}}}),/não pode/);
});
