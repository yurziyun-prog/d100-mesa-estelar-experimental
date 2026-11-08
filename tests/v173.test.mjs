import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {trocarVeiculos,veiculoGenerico} from '../js/mesa-naves-cena.js';
import {fatiarRedondas,faixas} from '../js/mesa-formas.js';
import {acharObstaculo,planoEmpurrao,planoPulo,empurravel,pulavel} from '../js/mesa-empurrar.js';
import {ligarCidadeBaixa,mapaDaCidade,PORTAS_CB,NOME_V173} from '../js/mesa-mapa-cidade-baixa.js';
import {pontoDeBorda,afastarNaBorda} from '../js/mesa-ligacoes.js';
import {destinoDosTokens,semLigacoesPara} from '../js/mesa-apagar-mapas.js';
import {tamanhoGrade} from '../js/mesa-vista.js';
test('v173 carros antigos quaisquer viram os novos; carroça, sucata e peças novas ficam',()=>{
 assert.equal(veiculoGenerico({nome:'Carro vermelho'}),'carro_esportivo');assert.equal(veiculoGenerico({nome:'Moto'}),'moto_vermelha');
 assert.equal(veiculoGenerico({nome:'Carroça'}),'');assert.equal(veiculoGenerico({nome:'Sucata de carro'}),'');
 const r=trocarVeiculos({objects:[{id:'c',nome:'Carro',x:5,y:5,larguraM:2,alturaM:4.5},{id:'n',nome:'Aerocarro',modeloId:'ia_veiculo_hovercar',x:1,y:1}]});
 assert.equal(r.trocados,1);assert.equal(r.cena.objects[0].angulo,90);assert.equal(r.cena.objects[1].id,'n');
});
test('v173 casa redonda barra em faixas que seguem a curva (não um quadrado)',()=>{
 const f=faixas('elipse',0,0,5.5,5.5);assert.ok(f.length>=8);assert.ok(f[0].w<f[Math.floor(f.length/2)].w*.7);
 const cena={objects:[{id:'h',nome:'Casa redonda',modeloId:'pk_casa_redonda',x:14,y:7,larguraM:5.5,alturaM:5.5,bloqueiaMovimento:false},{id:'s1',nome:'Casa redonda',x:14,y:7,larguraM:3.6,alturaM:5.5,bloqueiaMovimento:true},{id:'s2',nome:'Casa redonda',x:14,y:7,larguraM:5.5,alturaM:3.6,bloqueiaMovimento:true}]};
 const r=fatiarRedondas(cena,28,14);assert.equal(r.n,1);assert.ok(!r.cena.objects.some(o=>o.id==='s1'||o.id==='s2'));assert.ok(r.cena.objects.filter(o=>o.colisaoV173==='h').length>=8);
 assert.equal(fatiarRedondas(r.cena,28,14).n,0);
});
test('v173 caixa leve é empurrada 1 m; pilha pesada e baixa: pula por cima',()=>{
 const cx={id:'c',nome:'Caixa',x:15,y:7,larguraM:.8,alturaM:.8,bloqueiaMovimento:true};
 assert.ok(empurravel(cx));const a=acharObstaculo({de:{x:14,y:7},para:{x:16,y:7},objetos:[cx],W:28,H:14});assert.equal(a.obj.id,'c');assert.deepEqual(a.dir,{x:1,y:0});
 assert.deepEqual(planoEmpurrao({obj:cx,dir:a.dir,objetos:[cx],W:28,H:14}),{x:16,y:7});
 const pilha={id:'p',nome:'Caixas agrupadas',x:15,y:7,larguraM:1.6,alturaM:1.2,bloqueiaMovimento:true};
 assert.ok(!empurravel(pilha)&&pulavel(pilha));assert.ok(planoPulo({obj:pilha,dir:{x:1,y:0},ator:{x:13.7,y:7},objetos:[pilha],W:28,H:14}).x>15.8);
 assert.equal(pulavel({nome:'Parede',larguraM:1,alturaM:1,bloqueiaMovimento:true}),false);
});
test('v173 Cidade Baixa: portas para os mapas da cidade, ligação antiga das Ruas vai para uma boca de rua',()=>{
 const mapas=[{id:'cenario_c002'},{id:'cenario_c001',nome:'Portão de Véspera'},{id:'bar1_2',nome:'A Última Bateria'},{id:'x',nome:'Mina'},{id:'t',nome:'testemapa'}];
 const cen=[{id:'C3',mapaId:'bar1_2',local:'Distrito inferior de Véspera'},{id:'C14',mapaId:'x',local:'Calico - zona de mineração'}];
 const r=ligarCidadeBaixa({ligs:[{id:'l1',a:{mapa:'cenario_c001',x:14,y:.3},b:{mapa:'cenario_c002',x:14,y:13}},{id:'i',a:{mapa:'v164_cidade_baixa_ia',x:3,y:3},b:{mapa:'int1',x:1,y:1},interiorV164:true}],mapas,cenarios:cen,pontoDeBorda,afastarNaBorda});
 assert.ok(r.ligs.some(l=>l.b.mapa==='bar1_2'&&l.a.mapa==='cenario_c002'));assert.ok(!r.ligs.some(l=>l.b.mapa==='x'||l.b.mapa==='t'));
 assert.ok(r.ligs.some(l=>l.id==='i'&&l.a.mapa==='cenario_c002'));assert.ok(!mapaDaCidade({id:'cenario_c002'}));assert.ok(PORTAS_CB.length>=12);assert.ok(!/ia/i.test(NOME_V173));
});
test('v173 apagar mapas: jogadores saem, NPCs somem, saídas para o mapa somem; grade 1 m',()=>{
 const d=destinoDosTokens([{id:'pj',mapaId:'m'},{id:'syncnpc%3Aa',mapaId:'m'},{id:'o',mapaId:'z'}],'m');assert.equal(d.mover.length,1);assert.equal(d.apagar.length,1);
 assert.equal(semLigacoesPara([{a:{mapa:'m'},b:{mapa:'z'}},{a:{mapa:'y'},b:{mapa:'z'}}],['m']).length,1);
 assert.equal(tamanhoGrade(50,25),'2.0000% 4.0000%');
});
test('v173 ligado no site: módulos instalados, NPC controlado não volta, movimento barrado chama o empurrão, rótulo marcado',()=>{
 const m=readFileSync(new URL('../js/app/22-mesa-e-modulos.js',import.meta.url),'utf8');for(const x of ['mesa-vista.js','mesa-empurrar.js','mesa-apagar-mapas.js'])assert.ok(m.includes(x));
 const v=readFileSync(new URL('../js/mesa-vida.js',import.meta.url),'utf8');assert.match(v,/controlado\(tt\)/);
 const n=readFileSync(new URL('../js/nova-direta.js',import.meta.url),'utf8');assert.match(n,/mesaBloqueioV173_/);assert.match(n,/dataset\.rotulo/);
 const c=readFileSync(new URL('../js/mesa-camera.js',import.meta.url),'utf8');assert.match(c,/camPan/);
});
