import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// v205 — autonomia por facção fora de combate. Neutros vivem no território (papel 'neutro',
// deambulam devagar perto de casa) e só reagem se atacados (papel 'foge', fogem dos
// jogadores por perto). Predadores não caçam presas neutras e presas não fogem de predadores
// neutros. 'parado' e 'montaria' seguem imóveis/montaria mesmo neutros. Facção vem do estado
// de tempo real (win.mesaTempoRealV111.estado().faccoes), que persiste fora do combate.
import {papelComFaccao,papelVida,VELOCIDADE} from '../js/mesa-vida.js';
import {faccaoDe,hostis} from '../js/mesa-tempo-real-ia.js';
const ler=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=ler('index.html'),vida=ler('js/mesa-vida.js'),app22=ler('js/app/22-mesa-e-modulos.js');
test('v205 cache',()=>{
 assert.match(html,/js\/app\.js\?v=46\.\d+-v\d+-mesa/);
 assert.match(app22,/mesa-vida\.js\?v=205/);
});
test('papelComFaccao: neutros viram território; feridos fogem; parado/montaria preservados',()=>{
 assert.equal(papelComFaccao('predador','neutros'),'neutro');
 assert.equal(papelComFaccao('guarda','neutros'),'neutro');
 assert.equal(papelComFaccao('civil','neutros'),'neutro');
 assert.equal(papelComFaccao('predador','neutros',true),'foge','neutro atacado foge');
 assert.equal(papelComFaccao('parado','neutros'),'parado');
 assert.equal(papelComFaccao('montaria','neutros'),'montaria');
 assert.equal(papelComFaccao('parado','neutros',true),'parado','sésil ferido continua imóvel');
 assert.equal(papelComFaccao('predador','inimigos'),'predador','fora de neutros nada muda');
 assert.equal(papelComFaccao('predador','grupo'),'predador');
 assert.equal(VELOCIDADE.neutro>0&&VELOCIDADE.neutro<VELOCIDADE.civil,true,'neutro anda devagar');
});
test('facção neutra não briga com ninguém (regra de hostilidade existente)',()=>{
 assert.equal(hostis('neutros','inimigos'),false);
 assert.equal(hostis('inimigos','neutros'),false);
 assert.equal(hostis('inimigos','grupo'),true);
 const t={id:'synccriatura:x',donoUid:''};
 assert.equal(faccaoDe(t,{[t.id]:'neutros'}),'neutros');
 assert.equal(faccaoDe(t,{}),'inimigos','sem registro, criatura continua inimiga por padrão');
});
test('papelVida (texto) continua igual — a facção ajusta por cima',()=>{
 assert.equal(papelVida({id:'synccriatura:p',texto:'Predador couraçado'}),'predador');
 assert.equal(papelVida({id:'syncnpc:g',texto:'Guarda'}),'guarda');
});
test('mesa-vida: wiring da facção e comportamentos neutro/foge',()=>{
 assert.match(vida,/export function papelComFaccao\(papel,fac,ferido=false\)/);
 assert.match(vida,/faccaoDe,fracaoVida\} from '\.\/mesa-tempo-real-ia\.js/);
 assert.match(vida,/mesaTempoRealV111\?\.estado\?\.\(\)\?\.faccoes/);
 assert.match(vida,/const papel=papelComFaccao\(papelBruto,facDe\(t\),ferido\(t\)\)/);
 assert.match(vida,/if\(papel==='neutro'\)return/);
 assert.match(vida,/if\(papel==='foge'\)\{/);
 assert.match(vida,/info\(o\)\.papel==='predador'&&facDe\(o\)!=='neutros'/,'presa não foge de predador neutro');
 assert.match(vida,/info\(o\)\.modelo!==info\(t\)\.modelo&&facDe\(o\)!=='neutros'/,'predador não caça presa neutra');
});
