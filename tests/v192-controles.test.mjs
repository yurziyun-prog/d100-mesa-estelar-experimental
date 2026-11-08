import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {lerApp} from './_app.mjs';
import {ACOES,TECLADO_PADRAO,MOUSE_PADRAO,CONTROLE_PADRAO,CONTROLE_EXTRAS,efetivo,acaoDoBotao,trocar,restaurar,configVazia,lerConfig,rotuloTecla,rotuloMouse,rotuloControle,chaveDoEvento,vetorMovimento,proximoAlvo,linhasDeAjuda,acaoPorId,MOVIMENTO} from '../js/mesa-controles.js';
const ler=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');

test('v192: padrões: teclado, mouse e controle sem botão repetido; todas as ações trocáveis têm padrão de teclado',()=>{
 for(const [nome,pad] of [['teclado',TECLADO_PADRAO],['mouse',MOUSE_PADRAO],['controle',CONTROLE_PADRAO]]){const vistos=new Map();for(const [a,v] of Object.entries(pad)){assert.ok(acaoPorId(a),a);assert.ok(!vistos.has(String(v)),nome+': botão repetido '+v+' ('+a+' e '+vistos.get(String(v))+')');vistos.set(String(v),a);}}
 for(const a of ACOES.filter(a=>!a.so&&!a.fixo))assert.ok(TECLADO_PADRAO[a.id],'sem tecla padrão: '+a.id);
 for(const c of Object.keys(MOVIMENTO)){assert.ok(!Object.values(TECLADO_PADRAO).includes(c),'tecla de andar não pode ser de ação: '+c);}
 assert.equal(MOUSE_PADRAO.alvoEAtacar,0,'botão esquerdo marca alvo e ataca');assert.equal(MOUSE_PADRAO.interagir,1,'meio interage');assert.equal(MOUSE_PADRAO.armaAnterior,3);assert.equal(MOUSE_PADRAO.armaProxima,4);
 assert.equal(CONTROLE_PADRAO.atacar,'A');assert.equal(CONTROLE_EXTRAS.RT,'atacar');
});
test('v192: botão → ação (e inverso); no controle RT ataca por padrão; ação trocada solta o botão antigo',()=>{
 const c=configVazia();
 assert.equal(acaoDoBotao(c,'teclado','Space'),'saltos');assert.equal(acaoDoBotao(c,'teclado','shift+Tab'),'alvoAnterior');assert.equal(acaoDoBotao(c,'teclado','Tab'),'alvoProximo');assert.equal(acaoDoBotao(c,'teclado','KeyZ'),'');
 assert.equal(acaoDoBotao(c,'mouse',2),'');assert.equal(acaoDoBotao(c,'mouse',0),'alvoEAtacar','esquerdo ataca inimigo');
 assert.equal(acaoDoBotao(c,'controle','A'),'atacar');assert.equal(acaoDoBotao(c,'controle','RT'),'atacar');assert.equal(acaoDoBotao(c,'controle','DIR'),'alvoProximo');
 const r=trocar(c,'controle','atacar','Y');assert.equal(r.desligada,'alvoMaisPerto','Y já era "alvo mais perto": ficou sem ligação');
 assert.equal(acaoDoBotao(r.cfg,'controle','Y'),'atacar');assert.equal(acaoDoBotao(r.cfg,'controle','A'),'','A solto: não ataca mais');assert.equal(acaoDoBotao(r.cfg,'controle','RT'),'','RT segue a ação-mãe trocada');
 assert.equal(efetivo(r.cfg,'controle').alvoMaisPerto,'');
 assert.deepEqual(c,configVazia(),'trocar não altera a config original');
});
test('v192: trocar tecla e botão do mouse; conflitos; ações fixas e de outro aparelho são recusadas; restaurar volta ao padrão',()=>{
 let r=trocar(configVazia(),'teclado','atacar','KeyJ');assert.equal(r.desligada,null);assert.equal(acaoDoBotao(r.cfg,'teclado','KeyJ'),'atacar');assert.equal(acaoDoBotao(r.cfg,'teclado','Space'),'saltos','espaço permanece pular');
 r=trocar(r.cfg,'teclado','interagir','KeyJ');assert.equal(r.desligada,'atacar','usar KeyJ para interagir desliga o ataque');assert.equal(efetivo(r.cfg,'teclado').atacar,'');
 const m=trocar(configVazia(),'mouse','interagir',3);assert.equal(m.desligada,'armaAnterior');assert.equal(acaoDoBotao(m.cfg,'mouse',3),'interagir');assert.equal(acaoDoBotao(m.cfg,'mouse',1),'');
 assert.ok(trocar(configVazia(),'teclado','cancelar','KeyJ').erro,'cancelar é fixo');assert.ok(trocar(configVazia(),'teclado','alvoEAtacar','KeyJ').erro,'ação só do mouse');assert.ok(trocar(configVazia(),'mouse','saltos',1).erro);
 assert.ok(trocar(configVazia(),'teclado','atacar','Escape').erro,'Esc é fixo para cancelar');
 const lig=trocar(configVazia(),'controle','postura','CIMA');assert.equal(lig.desligada,'alvoAnterior');
 assert.deepEqual(restaurar(r.cfg,'teclado').teclado,{});assert.deepEqual(restaurar(r.cfg),configVazia());
 assert.equal(trocar(configVazia(),'teclado','atacar','').cfg.teclado.atacar,'','desligar uma ação');assert.equal(acaoDoBotao(trocar(configVazia(),'teclado','atacar','').cfg,'teclado','Space'),'saltos');
});
test('v192: config guardada é lida com segurança (JSON ruim, ação desconhecida)',()=>{
 assert.deepEqual(lerConfig('{{'),configVazia());assert.deepEqual(lerConfig(null),configVazia());
 const c=lerConfig(JSON.stringify({teclado:{atacar:'KeyJ',inventada:'KeyX'},mouse:null,controle:{interagir:'B'},lixo:1}));
 assert.equal(c.teclado.atacar,'KeyJ');assert.equal(c.teclado.inventada,undefined);assert.deepEqual(c.mouse,{});assert.equal(c.controle.interagir,'B');
});
test('v192: movimento por WASD/setas: diagonal normalizada, teclas opostas se anulam',()=>{
 assert.deepEqual(vetorMovimento(['KeyD']),{x:1,y:0});assert.deepEqual(vetorMovimento(['ArrowUp']),{x:0,y:-1});
 const d=vetorMovimento(['KeyW','KeyD']);assert.ok(Math.abs(Math.hypot(d.x,d.y)-1)<1e-9);assert.ok(d.x>0&&d.y<0);
 assert.deepEqual(vetorMovimento(['KeyA','KeyD']),{x:0,y:0});assert.deepEqual(vetorMovimento(['KeyD','ArrowRight']),{x:1,y:0},'duas teclas para o mesmo lado não aceleram');assert.deepEqual(vetorMovimento([]),{x:0,y:0});assert.deepEqual(vetorMovimento(['KeyZ']),{x:0,y:0});
});
test('v192: próximo/anterior alvo percorre do mais perto ao mais longe e dá a volta',()=>{
 const c=[{id:'a'},{id:'b'},{id:'c'}];
 assert.equal(proximoAlvo(c,'',1),'a');assert.equal(proximoAlvo(c,'',-1),'c');assert.equal(proximoAlvo(c,'a',1),'b');assert.equal(proximoAlvo(c,'c',1),'a');assert.equal(proximoAlvo(c,'a',-1),'c');assert.equal(proximoAlvo([],'a',1),null);assert.equal(proximoAlvo(c,'zzz',1),'a');
});
test('v192: rótulos legíveis e ajuda por aparelho (só o que está ligado)',()=>{
 assert.equal(rotuloTecla('Space'),'Espaço');assert.equal(rotuloTecla('KeyF'),'F');assert.equal(rotuloTecla('Digit1'),'1');assert.equal(rotuloTecla('shift+Tab'),'Shift + Tab');assert.equal(rotuloTecla('ArrowUp'),'↑');assert.equal(rotuloTecla(''),'—');
 assert.equal(rotuloMouse(2),'Direito');assert.equal(rotuloMouse(3),'Lateral (voltar)');assert.equal(rotuloControle('A'),'A (✕)');assert.equal(rotuloControle('START'),'Start/Menu');
 assert.equal(chaveDoEvento({code:'Tab',shiftKey:true}),'shift+Tab');assert.equal(chaveDoEvento({code:'KeyF',shiftKey:true}),'KeyF');
 const t=linhasDeAjuda(configVazia(),'teclado');assert.ok(t.some(l=>l.nome==='Andar'&&/W A S D/.test(l.tecla)));assert.ok(t.some(l=>l.id==='atacar'&&l.tecla==='J'));assert.ok(!t.some(l=>l.id==='alvoEAtacar'),'ação do mouse não aparece no teclado');
 const mo=linhasDeAjuda(configVazia(),'mouse');assert.ok(mo.some(l=>l.id==='alvoEAtacar'&&l.tecla==='Esquerdo'));assert.ok(mo.some(l=>l.id==='interagir'&&/Meio/.test(l.tecla)));
 const co=linhasDeAjuda(configVazia(),'controle');assert.ok(co.some(l=>l.nome==='Escolher algo no mapa'));assert.ok(co.some(l=>l.id==='atacar'&&/RT/.test(l.tecla)));
 const sem=trocar(configVazia(),'teclado','atacar','').cfg;assert.ok(!linhasDeAjuda(sem,'teclado').some(l=>l.id==='atacar'),'ação desligada some da ajuda');
});
test('v192: módulo instalado; mesa-controle consulta o remapeamento depois das janelas; controles antigos seguem',()=>{
 assert.match(lerApp(),/import\('\.\/mesa-controles\.js\?v=\d+'\)\.then\(m=>\{window\.mesaControlesModulo=m\.instalarControles\(\{controller:\(\)=>novaSyncController_\}\)/);
 const c=ler('js/mesa-controle.js');assert.match(c,/win\.mesaControlesV192\?\.mapeado\?\.\(nome\)/);assert.ok(c.indexOf('mesaControlesV192')>c.indexOf('if(j){'),'janelas abertas continuam navegáveis por padrão');
 const m=ler('js/mesa-controles.js');assert.match(m,/contextmenu/);assert.match(m,/e\.button>=3/);assert.match(m,/gamepadconnected/);assert.match(m,/localStorage/);
});
