import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file=lerApp();
const start=file.indexOf('function normalizarAcesso_');
const end=file.indexOf('function badgeAcesso_',start);
const context={origensDB:[],carreirasDB:[],getNome:item=>item?.nome||''};
vm.createContext(context);vm.runInContext(file.slice(start,end),context);

test('carreira médica pode comprar Analisador Biomédico restrito sem liberar restritos alheios',()=>{
 const medica={nome:'Dra. Ilya Nemer',carreira:'medica'};
 const analisador={nome:'Analisador Biomédico',categoria:'Itens Médicos',nivelAcesso:'Restrito'};
 const arma={nome:'Rifle pesado',categoria:'Armas',nivelAcesso:'Restrito'};
 assert.equal(context.acessoPermitidoItem_(medica,analisador),true);
 assert.equal(context.acessoPermitidoItem_(medica,arma),false);
});
