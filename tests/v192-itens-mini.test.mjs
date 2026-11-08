import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {tipoMini,svgMini,miniaturaDeItem,TIPOS_MINI} from '../js/mesa-itens-mini.js';
import {moverItem,pesoAceito,acoesDoItem,primeiroLivre,listaDoCompartimento,COMPARTIMENTOS} from '../js/mesa-equipar.js';
import {lerApp} from './_app.mjs';
const csv=readFileSync(new URL('../dados/banco_itens_2026-09-22.csv',import.meta.url),'utf8').replace(/^﻿/,'').trim().split('\n');
const cab=csv[0].split(';'),iId=cab.indexOf('id'),iNome=cab.indexOf('nome'),iCat=cab.indexOf('categoria');
const itens=csv.slice(1).map(l=>l.split(';')).filter(c=>c[iId]).map(c=>({id:c[iId],nome:c[iNome],categoria:c[iCat]}));

test('v192 miniaturas: todo item do mercado tem desenho e quase nenhum cai na caixa genérica',()=>{
 assert.ok(itens.length>80,'banco de itens lido: '+itens.length);
 const tipos={};for(const it of itens){const t=tipoMini(it);assert.ok(TIPOS_MINI.includes(t),it.id+' → '+t);tipos[t]=(tipos[t]||0)+1;}
 const genericos=itens.filter(i=>tipoMini(i)==='caixa').map(i=>i.id);
 assert.ok(genericos.length<=Math.ceil(itens.length*.12),'caixa genérica demais ('+genericos.length+'): '+genericos.join(', '));
 assert.ok(Object.keys(tipos).length>=18,'variedade de desenhos: '+Object.keys(tipos).length);
});
test('v192 miniaturas: itens que o Yuri pediu e exemplos do banco têm o desenho certo',()=>{
 const t=(id,nome='',categoria='')=>tipoMini({id,nome,categoria});
 assert.equal(t('pistola_laser','Pistola Laser','Armas'),'pistola');assert.equal(t('espada_forca','Espada de Força','Armas'),'espada_energia');assert.equal(t('celula_lamina','Célula de Lâmina','Munição'),'bateria');
 assert.equal(t('sabre','Sabre','Armas'),'espada');assert.equal(t('espada_longa','Espada Longa'),'espada');assert.equal(t('faca_utilitaria','Faca Utilitária'),'faca');assert.equal(t('carabina_laser','Carabina Laser','Armas'),'rifle');assert.equal(t('rifle_gauss','Rifle Gauss'),'rifle');
 assert.equal(t('bateria','Bateria','Munição'),'bateria');assert.equal(t('cartucho_9mm','Cartuchos 9 mm','Munição'),'municao');
 assert.equal(t('kit_medico','Kit Médico Básico','Itens Médicos'),'kit_medico');assert.equal(t('nanogel','Nanogel Regenerativo'),'nanogel');assert.equal(t('antidoto_universal','Antídoto Universal'),'antidoto');
 assert.equal(t('armadura_leve','Armadura Corporal Leve','Armaduras'),'armadura');assert.equal(t('capacete_blast','Capacete Blast'),'capacete');assert.equal(t('colete_blast','Colete Blast'),'armadura');
 assert.equal(t('cafe','Café'),'cafe');assert.equal(t('agua_potavel','Água Potável'),'agua');assert.equal(t('cerveja','Cerveja'),'cerveja');assert.equal(t('racao_viagem','Ração de Viagem'),'racao');
 assert.equal(t('lanterna','Lanterna'),'lanterna');assert.equal(t('drone_reconhecimento','Drone de Reconhecimento'),'drone');assert.equal(t('respirador','Respirador'),'respirador');assert.equal(t('reserva_oxigenio','Reserva de Oxigênio'),'oxigenio');
 assert.equal(t('picareta','Picareta'),'picareta');assert.equal(t('machado_utilitario','Machado Utilitário'),'machado');assert.equal(t('comlink','Comlink'),'comunicador');assert.equal(t('mochila_avancada','Mochila Avançada'),'mochila');
 assert.equal(t('extintor_portatil','Extintor Portátil'),'extintor');assert.equal(t('xyz_estranho','Coisa qualquer'),'caixa');
});
test('v192 miniaturas: SVG bem formado, mesmo traço (contorno escuro e sombra), sem NaN; data URL em cache; bilhete sem miniatura',()=>{
 for(const tp of TIPOS_MINI){const s=svgMini(tp);assert.match(s,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="64" height="64" viewBox="0 0 64 64">/);for(const tag of s.match(/<[a-zA-Z][^>]*>/g)){const nomes=[...tag.matchAll(/s([w-]+)=/g)].map(x=>x[1]);assert.equal(new Set(nomes).size,nomes.length,"atributo repetido em "+tp+": "+tag);}assert.ok(s.endsWith('</svg>'));assert.doesNotMatch(s,/NaN|undefined|null/);assert.match(s,/feDropShadow dx="2" dy="3"/,'sombra para sudeste: '+tp);assert.match(s,/stroke="#15110d"/,'contorno escuro: '+tp);
  assert.equal((s.match(/<(rect|polygon|circle|path|g|filter|defs|feDropShadow)\b/g)||[]).length>=5,true,tp);}
 const a=miniaturaDeItem({id:'pistola_laser',nome:'Pistola Laser'}),b=miniaturaDeItem({id:'pistola_9mm',nome:'Pistola 9 mm'});assert.match(a,/^data:image\/svg\+xml/);assert.equal(a,b,'mesmo desenho, cache');
 assert.notEqual(miniaturaDeItem({id:'espada_forca',nome:'Espada de Força'}),miniaturaDeItem({id:'espada_longa',nome:'Espada Longa'}),'sabre de energia ≠ espada comum');
 assert.equal(miniaturaDeItem({tipo:'nota'}),'');assert.equal(miniaturaDeItem(null),'');
});
test('v192 equipar: mover item entre compartimentos (puro), peso e ações',()=>{
 const inv={equipado:[{nome:'Faca'},{nome:'Mochila Avançada'},null],mochila:[null,{nome:'Pistola'},{nome:'Kit'}],bolso:[]};
 let r=moverItem(inv,'mochila',1,'equipado');assert.equal(r.erro,undefined);assert.equal(r.para,2);assert.equal(r.inv.equipado[2].nome,'Pistola');assert.equal(r.inv.mochila[1],null);assert.equal(inv.mochila[1].nome,'Pistola','original intacto');assert.equal(r.inv.equipado.length,12,'slots completados');
 r=moverItem(inv,'equipado',0,'mochila');assert.equal(r.para,0,'primeiro espaço vazio da mochila');
 r=moverItem(inv,'mochila',2,'bolso');assert.equal(r.para,0);
 assert.ok(moverItem(inv,'mochila',0,'equipado').erro,'espaço vazio');assert.ok(moverItem(inv,'mochila',1,'mochila').erro);assert.ok(moverItem(inv,'x',0,'equipado').erro);
 assert.match(moverItem({equipado:[{nome:'Faca'}],mochila:[null]},'equipado',0,'mochila').erro,/Equipe uma mochila/,'sem mochila equipada a aba Mochila está trancada');
 const cheio={equipado:Array.from({length:12},()=>({nome:'x'})),mochila:[{nome:'y'}]};assert.match(moverItem(cheio,'mochila',0,'equipado').erro,/cheio/);
 assert.equal(primeiroLivre([1,2,null],3),2);assert.equal(primeiroLivre([1,2,3],3),-1);assert.equal(primeiroLivre(undefined,2),0);
 assert.deepEqual(listaDoCompartimento(inv,'mochila').map(x=>x.indice),[1,2]);assert.equal(COMPARTIMENTOS.length,3);
 // peso: tirar de uma mochila que já passa do limite nunca é recusado; aumentar acima do limite é
 assert.equal(pesoAceito(30,32.2,20),true,'diminuiu: aceito mesmo acima do limite');assert.equal(pesoAceito(33,32.2,20),false,'aumentou acima do limite');assert.equal(pesoAceito(19,10,20),true);assert.equal(pesoAceito(32.2,32.2,20),true,'não mudou');assert.equal(pesoAceito(99,1,Infinity),true);
 assert.deepEqual(acoesDoItem('mochila',true).map(a=>a.id),['equipado','bolso','usar']);assert.deepEqual(acoesDoItem('equipado',false).map(a=>a.id),['mochila']);assert.deepEqual(acoesDoItem('bolso',true).map(a=>a.id),['equipado','mochila','usar']);
});
test('v192: correção do peso e do painel instaladas; tooltip do inventário cabe na tela',()=>{
 const app=lerApp();
 assert.match(app,/function validarPesoCompartimento_\(char, inv, comp, mensagem = true, pesoAntes = null\)/);assert.match(app,/pesoAntesDestino = pesoEfetivoCompartimento_\(char, inv, destinoComp\), pesoAntesOrigem/);
 assert.match(app,/validarPesoCompartimento_\(char, inv, destinoComp, true, pesoAntesDestino\) \|\| !validarPesoCompartimento_\(char, inv, origemComp, true, pesoAntesOrigem\)/);
 assert.match(app,/validarPesoCompartimento_\(sourceChar,inv,comp,false,pesoEfetivoCompartimento_\(sourceChar,sourceChar\.inventario\|\|\{\},comp\)\)/);
 assert.match(app,/import\('\.\/mesa-equipar\.js\?v=\d+'\)\.then\(m=>\{window\.mesaEquiparMod=m\.instalarEquipar\(/);
 assert.match(readFileSync(new URL('../js/mesa-controle.js',import.meta.url),'utf8'),/const JANELAS=\['#eqPainel'/);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/\.item-tooltip\s*\{[^}]*max-width:\s*min\(300px,\s*calc\(100vw - 24px\)\)/);assert.match(app,/addEventListener\('mouseover'[\s\S]{0,400}\.inventory-slot/);
});
test('v193 miniaturas: lê a descrição (abrigo, kits, aparelhos) e desenha os animais da loja',()=>{
 const t=(id,nome,categoria,descricao)=>tipoMini({id,nome,categoria,descricao});
 assert.equal(t('abrigo_ambiental_portatil','Abrigo Ambiental Portátil','Sobrevivência','Abrigo compacto contra vento'),'abrigo');
 assert.equal(t('kit_eletronica','Kit de Eletrônica','Ferramentas','Ferramentas para diagnóstico e reparo de circuitos'),'eletronica');
 assert.equal(t('kit_escalada','Kit de Escalada','Exploração','Equipamento para escalada, rapel'),'escalada');
 assert.equal(t('soldador_portatil','Soldador Portátil','Ferramentas','Ferramenta para solda'),'soldador');
 assert.equal(t('gerador_portatil','Gerador Portátil','Energia','Fonte portátil para alimentar ou recarregar equipamentos'),'gerador');
 assert.equal(t('kit_coleta_amostras','Kit de Coleta de Amostras','Científico','Permite coletar amostras biológicas'),'amostras');
 assert.equal(t('lanca_choque','Lança de Choque','Armas','Lança de guarda com emissor elétrico'),'lanca');
 assert.equal(t('lobo_companheiro','Lobo companheiro','Animal'),'lobo');assert.equal(t('galinha_domestica','Galinha doméstica','Animal'),'galinha');assert.equal(t('dragao_trombeta_domesticado','Dragão Trombeta domesticado','Criatura'),'dragao');assert.equal(t('drone_auxiliar_zk4','Drone auxiliar ZK-4','Drone'),'drone');
});
