import test from 'node:test';
import {lerApp} from './_app.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizarConfig,CONFIG_PADRAO,poligonoVisao,pontoNoRetangulo,luzDoObjeto,classificarAtaque,fracaoPV,tipoToken,caminhoConfig} from '../js/mesa-visual.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=lerApp();
const direct=fs.readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');

test('v103 cache e carregamento isolado da camada visual',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-/);
 assert.match(app,/nova-direta\.js\?v=\d+/);
 // import dinâmico com catch: se o módulo faltar, o mapa clássico continua
 assert.match(direct,/import\('\.\/mesa-visual\.js\?v=1\d\d'\)[\s\S]{0,400}\.catch\(/);
 // efeito antigo continua como reserva quando a camada nova não trata o ataque
 assert.match(direct,/if\(!novo\)mostrarAtaque\(board,event\)/);
 // nenhum import estático do módulo novo (um import estático quebraria o mapa se o arquivo faltasse)
 assert.doesNotMatch(direct,/^import .*mesa-visual/m);
});

test('configuração padrão não muda nada no mapa',()=>{
 assert.deepEqual(normalizarConfig(null),{...CONFIG_PADRAO});
 assert.equal(CONFIG_PADRAO.ambiente,'dia');assert.equal(CONFIG_PADRAO.nevoa,false);assert.equal(CONFIG_PADRAO.clima,'nenhum');
 assert.deepEqual(normalizarConfig({ambiente:'xx',clima:'tornado',nevoa:'sim',luzPersonagens:99}),{...CONFIG_PADRAO,luzPersonagens:12});
 assert.equal(caminhoConfig('A Última/1'),'combatesAtivos/mesaVisual_A%20%C3%9Altima%2F1');
});

test('visão é bloqueada por parede e não passa através dela',()=>{
 const parede={cx:10,cy:7,w:.5,h:10,ang:0};
 const poli=poligonoVisao({x:5,y:7},[parede],30,28,14);
 const maxX=Math.max(...poli.filter(p=>Math.abs(p.y-7)<2).map(p=>p.x));
 assert.ok(maxX<=9.76,'a visão atravessou a parede: '+maxX);
 const semParede=poligonoVisao({x:5,y:7},[],30,28,14);
 assert.ok(Math.max(...semParede.map(p=>p.x))>27.9);
});

test('raio limita a luz e bloqueio que contém a origem é ignorado',()=>{
 const poli=poligonoVisao({x:14,y:7},[{cx:14,cy:7,w:1,h:1,ang:0}],3,28,14);
 for(const p of poli)assert.ok(Math.hypot(p.x-14,p.y-7)<=3.0001);
 assert.ok(Math.max(...poli.map(p=>Math.hypot(p.x-14,p.y-7)))>2.9);
 assert.ok(pontoNoRetangulo({cx:0,cy:0,w:2,h:1,ang:90},{x:0,y:.9}));
 assert.ok(!pontoNoRetangulo({cx:0,cy:0,w:2,h:1,ang:0},{x:0,y:.9}));
});

test('fontes de luz automáticas',()=>{
 assert.equal(luzDoObjeto({nome:'Lâmpada de parede'}).cor,'#ffd9a0');
 assert.ok(luzDoObjeto({modeloId:'tocha1'}).tremula>0);
 assert.ok(luzDoObjeto({nome:'Caixa',pegandoFogo:true}).fogo);
 assert.equal(luzDoObjeto({nome:'Caixa de madeira'}),null);
 assert.equal(luzDoObjeto({nome:'Lâmpada',destruido:true}),null);
 assert.equal(luzDoObjeto({nome:'Lâmpada',luz:false}),null);
});

test('classificação de ataques, tipos e PV',()=>{
 assert.equal(classificarAtaque({nome:'Pistola Laser'}),'laser');
 assert.equal(classificarAtaque({nome:'Revólver .38'}),'bala');
 assert.equal(classificarAtaque({nome:'Mordida'}),'mordida');
 assert.equal(classificarAtaque({nome:'Eco da Matilha'}),'sonico');
 assert.equal(classificarAtaque({nome:'Sabre de luz'}),'lamina');
 assert.equal(classificarAtaque({}),'impacto');
 assert.equal(tipoToken({id:'syncnpc%3Avampiro'}),'npc');
 assert.equal(tipoToken({id:'synccriatura:besta'}),'monstro');
 assert.equal(tipoToken({id:'abc123'}),'personagem');
 assert.equal(fracaoPV({hitMax:{a:10,b:10},hit:{a:5,b:10}}),.75);
 assert.equal(fracaoPV({hitMax:{a:10},hit:{a:-4}}),0);
 assert.equal(fracaoPV({morto:true,hitMax:{a:10},hit:{a:10}}),0);
 assert.equal(fracaoPV(null),null);
});
