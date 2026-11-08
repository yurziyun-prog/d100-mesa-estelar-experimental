import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('seleção atualiza cartão e ficha mesmo se mercado falhar e preferência não salvar',async()=>{
 const source=lerApp();
 const renderer=source.slice(source.indexOf('function renderizarListaPersonagens()'),source.indexOf('window.deletarPersonagem ='));
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{add(){},remove(){},toggle(){}}});return elements.get(id);};
 const context={currentCharId:'a',currentUserUid:'player',userCharacters:[{id:'a',nome:'Valery',dono:'player'},{id:'b',nome:'Desmond',dono:'player'}],userData:{role:'jogador'},idiomaAtual:'pt',traducoes:{pt:{myCharacters:'Meus Personagens',selectChar:'Selecionar',deleteChar:'Deletar'}},filtroPersonagensMestre_:'pm',document:{getElementById:element,querySelector:()=>null},ordemCriacaoPersonagem_:()=>0,escaparHtmlInventario_:String,atualizarVisualizacao:c=>{context.shown=c.nome;},preencherFormulario(){},renderizarDiaCampanhaFicha_(){},renderizarMercado(){throw Error('Mercado indisponível');},renderizarAlvosCombateJogador_(){},renderizarReacaoCombateJogador_(){},renderizarEfeitoEspecialJogador_(){},setDoc:async()=>{throw Error('Offline');},doc(){},db:{},console:{warn(){}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
 context.window={dispatchEvent:event=>{context.event=event;},renderizarVendaMercado_:()=>{},renderizarMercadoLocal_:()=>{}};vm.createContext(context);vm.runInContext(renderer,context);
 await context.window.selecionarPersonagem('b');assert.equal(context.currentCharId,'b');assert.equal(context.shown,'Desmond');assert.match(element('charList').innerHTML,/char-item active" onclick="selecionarPersonagem\('b'\)/);assert.equal(context.event.detail,'b');
});
