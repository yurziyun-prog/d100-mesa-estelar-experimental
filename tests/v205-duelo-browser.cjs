// DUELO JOGÁVEL — ficha criada pela fábrica real (novoPersonagem) + itens do CSV pelo importador real + resolvedores reais de ataque/defesa/dano + tempo real.
// VALIDAÇÃO: harness local (Edge sem cabeça, Firestore FALSO, papel de mestre SIMULADO: a mesma conta controla o Kael e processa os comandos, como no uso real do Yuri).
// NÃO prova: regras do Firestore, duas contas/clientes, rede real, controle físico. Variáveis: VIDEO_DIR grava vídeo; DERROTA=1 usa personagem fraco contra criatura forte.
const assert=require('assert/strict');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
const DERROTA=process.env.DERROTA==='1';
(async()=>{
 const D=await montarDuelo({criatura:null,perfil:DERROTA?'fraco':'forte'});const {H,page,erros,cid}=D;
 const SHEET='personagens/'+cid,HEALTH='combatesAtivos/mapaMesaSyncSaude';
 const ficha0=await page.evaluate(p=>JSON.stringify(window.__fs.get(p)),SHEET);
 await page.evaluate(async()=>{const c=window.__APP__.ctl();try{c.close?.();}catch(_){}await c.open();});await page.waitForTimeout(2200);
 await page.evaluate(cid=>{const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));},cid);await page.waitForTimeout(1800);
 // 1) o módulo de treino coloca a criatura (UI do mestre) perto do personagem escolhido em "Atuar como"
 const criaturaId=await page.evaluate(c=>window.mesaTestePersonagem.iniciarDuelo({criatura:c}),DERROTA?'insetoide_predador':'rastejante_de_cinzas');
 assert.ok(criaturaId,'criatura de treino colocada');await page.waitForTimeout(1500);
 const confirmar=()=>page.evaluate(()=>{const ok=document.querySelector('#rtEscolha [data-ok]');if(ok&&!ok.disabled){ok.click();return true;}return false;});
 const clicarCriatura=async()=>{for(let k=0;k<6;k++){const tk=await page.evaluate(id=>{const n=document.querySelector('#novaSyncBoard [data-token="'+id+'"]');n.scrollIntoView({block:'center',inline:'center'});const r=n.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];},criaturaId);await page.mouse.click(tk[0],tk[1]);await page.waitForTimeout(700);if(/Atacar/.test((await painel()).btn))return;}};
 const painel=()=>page.evaluate(()=>({btn:document.getElementById('novaSyncTest')?.textContent||'',dis:!!document.getElementById('novaSyncTest')?.disabled,res:(document.querySelector('.nova-result')?.textContent||''),skills:[...document.getElementById('novaSyncSkill')?.options||[]].map(o=>o.textContent)}));
 const vida=()=>page.evaluate(([c,k,H])=>{const a=window.__fs.get(H)?.actors||{};const f=x=>{const v=a[x]?.combateLab;return v?{pv:Object.values(v.hit||{}).reduce((s,n)=>s+Number(n||0),0),max:Object.values(v.hitMax||{}).reduce((s,n)=>s+Number(n||0),0),morto:!!v.morto,inc:!!v.inconsciente}:null;};return {kael:f(c),criatura:f(k),municao:JSON.stringify(a[c]?.municaoLab||{})};},[cid,criaturaId,HEALTH]);
 // 2) sem alvo selecionado o botão é só teste da perícia; com alvo e arma vira ⚔️ Atacar
 let p=await painel();console.log('sem alvo:',p.btn);assert.match(p.btn,/Testar/,'sem alvo é teste');
 await clicarCriatura();p=await painel();console.log('com alvo:',p.btn,'| perícias:',p.skills.join(' · '));assert.match(p.btn,/Atacar/,'com alvo e arma o botão ataca');
 if(!DERROTA)assert.ok(p.skills.some(s=>/Pistola/.test(s))&&p.skills.some(s=>/Brancas/.test(s)),'perícias de arma vêm do equipamento da ficha real');
 // 3) mensagem útil: sem munição
 await page.evaluate(([cid,H])=>{const h=window.__fs.get(H)||{actors:{}};const key=(window.__APP__.ev('(()=>{try{return labChaveArma_(obterItensEquipados_(window.__fs.get("personagens/'+cid+'"))[0]);}catch(e){return ""}})()'))||'';const a={...(h.actors||{})};a[cid]={...(a[cid]||{}),municaoLab:{...(a[cid]?.municaoLab||{}),[key]:0}};window.__fsWrite(H,{...h,actors:a});window.__chaveArma=key;},[cid,HEALTH]);await page.waitForTimeout(900);
 if(!DERROTA){await page.evaluate(()=>document.getElementById('novaSyncTest').click());await page.waitForTimeout(900);p=await painel();console.log('sem munição ->',p.res.slice(0,140));assert.match(p.res,/sem muni/i,'avisa arma sem munição');}
 // restaurar (botão da mesa) e seguir
 await page.evaluate(()=>window.mesaTestePersonagem.reiniciarDuelo());await page.waitForTimeout(1500);
 // 4) fora de alcance: com a faca (corpo a corpo, 1,8 m) a criatura a ~3 m está longe; o resolvedor real recusa com o motivo e a distância
 if(!DERROTA){
  await page.evaluate(()=>{const sk=document.getElementById('novaSyncSkill');sk.value='esp:armas_brancas_curtas';sk.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(600);
  let viuAlcance=false;for(let i=0;i<14&&!viuAlcance;i++){await confirmar();await page.evaluate(()=>{const b=document.getElementById('novaSyncTest');if(b&&!b.disabled&&/Atacar/.test(b.textContent))b.click();});for(let j=0;j<5&&!viuAlcance;j++){await page.waitForTimeout(500);p=await painel();viuAlcance=/alcance|bloquead/i.test(p.res);}} // ("Recarregando…" também é uma mensagem útil: insiste até o motivo de alcance aparecer)
  console.log('longe ->',p.res.slice(0,150));if(!/alcance|bloquead/i.test(p.res))console.log('   (painel inteiro)',JSON.stringify(p).slice(0,500));assert.match(p.res,/alcance|Linha de tiro bloqueada/i,'o motor real recusa com motivo (alcance ou linha de tiro)');
  await page.evaluate(()=>{const sk=document.getElementById('novaSyncSkill');sk.value='esp:combate_pistola_laser';sk.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(600);
 }
 // (velocidade do tempo real ×2 só para o teste não levar minutos; é a mesma opção ⚡ da barra do combate)
 await page.evaluate(()=>{window.__fsWrite('combatesAtivos/mesaTempoReal',{velocidade:2},{merge:true});});await page.waitForTimeout(600);
 // 5) o duelo: ataca com o botão até alguém cair (a criatura de treino reage sozinha pelo tempo real)
 const pos0=await page.evaluate(id=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/'+id);return [t.x,t.y];},criaturaId);
 let fim='',t0=Date.now(),ataques=0,viuCriaturaAtacar=false,viuAcertoEspecial=false,moveuMax=0;
 while(Date.now()-t0<260000){
  const v=await vida();
  if(v.criatura&&(v.criatura.morto||v.criatura.inc)){fim='vitoria';break;}
  if(v.kael&&(v.kael.morto||v.kael.inc)){fim='derrota';break;}
  const info=await page.evaluate(()=>{const r=document.querySelector('.nova-result')?.textContent||'';const b=document.getElementById('novaSyncTest');const ok=document.querySelector('#rtEscolha [data-ok]');const esc=!!document.getElementById('rtEscolha');if(ok&&!ok.disabled)ok.click();if(b&&!b.disabled&&/Atacar/.test(b.textContent)){b.click();return {r,clicou:true,esc};}return {r,clicou:false,esc};});
  if(info.clicou)ataques++;if(/Criatura de treino → /.test(info.r)||/Predador.*→|Criatura.*→ Kael/.test(info.r))viuCriaturaAtacar=true;if(info.esc)viuAcertoEspecial=true;
  moveuMax=Math.max(moveuMax,await page.evaluate(([id,p])=>{const t=window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/'+id);return t?(()=>{const d=window.__APP__.ctl().dimsAtual();return Math.hypot((t.x-p[0])*d.W/28,(t.y-p[1])*d.H/14);})():0;},[criaturaId,pos0]));
  await page.waitForTimeout(1000);
 }
 const v=await vida();console.log('fim:',fim||'(tempo esgotado)','| ataques enviados:',ataques,'| vida:',JSON.stringify(v));
 assert.ok(fim,'o duelo terminou (vitória ou derrota) em até 260 s');
 const hist=await page.evaluate(()=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).map(e=>String(e.message||'')));
 console.log('histórico:',hist.length,'entradas; golpes da criatura no Kael:',hist.filter(m=>/→ Kael de teste/.test(m)&&!/^⚡ Kael/.test(m)).length);
 const golpes=hist.filter(m=>/→ Kael de teste/.test(m)&&!/^⚡ Kael/.test(m)).length;console.log('a criatura REAGIU: posição gravada mudou '+moveuMax.toFixed(1)+' m e deu '+golpes+' golpe(s) no Kael');
 assert.ok(golpes>0||moveuMax>.5,'a criatura reage (anda até o personagem e/ou ataca) pelo tempo real');
 const msgs=await page.evaluate(()=>[...window.__fs].filter(([p])=>/Direta\/acoes\//.test(p)).map(([,x])=>String(x.message||'')));
 if(!DERROTA)assert.ok([...msgs,...hist].some(m=>/Kael de teste → /.test(m)&&/Sucesso|Falha|Crítico|Fiasco/.test(m)),'ataque do personagem resolvido pelo motor real (rolagem, perícia, arma)');
 assert.ok([...msgs,...hist].some(m=>/Defesa de |Esquiva|Aparar|evitou o ataque/.test(m)),'defesa real aparece em algum golpe');
 if(DERROTA)assert.equal(fim,'derrota','personagem fraco perde para a criatura forte');else console.log('(personagem forte × criatura fraca: vitória é provável mas não garantida — dados reais; resultado desta rodada:',fim+')');
 // 6) a ficha original NÃO foi alterada (saúde e munição ficam no estado da mesa)
 const ficha1=await page.evaluate(p=>JSON.stringify(window.__fs.get(p)),SHEET);
 const mudou=ficha0===ficha1?[]:Object.keys(JSON.parse(ficha1)).filter(k=>JSON.stringify(JSON.parse(ficha1)[k])!==JSON.stringify(JSON.parse(ficha0)[k]));
 console.log('campos da ficha que mudaram durante o duelo:',JSON.stringify(mudou));
 // (o motor grava ferimentos/Sorte do PERSONAGEM na própria ficha; o duelo devolve esses campos ao reiniciar/sair — conferido abaixo)
 // 7) reiniciar: a ficha real nunca é tocada (o duelo usa uma cópia da sessão); a cópia é recriada e a saúde restaurada

 await page.evaluate(()=>window.mesaTestePersonagem.reiniciarDuelo());await page.waitForTimeout(2500);
 const f2=JSON.parse(await page.evaluate(p=>JSON.stringify(window.__fs.get(p)),SHEET)),f0=JSON.parse(ficha0),dif=Object.keys(f0).filter(k=>!/^(localizacao|miniatura|imagem|visual|arte3d|atualizadoEm|criadoEm)/.test(k)&&JSON.stringify(f0[k])!==JSON.stringify(f2[k]));
 console.log('campos da ficha diferentes do original DEPOIS de reiniciar:',JSON.stringify(dif),dif.map(k=>JSON.stringify(f0[k]).slice(0,80)+' => '+JSON.stringify(f2[k]).slice(0,120)).join(' || '));assert.deepEqual(dif,[],'a ficha real continua idêntica (o duelo usa a cópia)');
 const v2=await vida();console.log('depois de reiniciar:',JSON.stringify(v2));
 assert.ok(v2.kael&&!v2.kael.inc&&!v2.kael.morto&&v2.kael.pv>0,'Kael de pé de novo (a criatura pode já tê-lo ferido de novo, o combate continua)');
 assert.ok(!v2.criatura||(v2.criatura.pv===v2.criatura.max&&!v2.criatura.inc&&!v2.criatura.morto),'criatura restaurada');
 assert.equal(await page.evaluate(()=>!!window.mesaTempoRealV111?.estado?.()?.pausado),false,'tempo real destravado');
 const n0=msgs.length;await clicarCriatura();
 for(let i=0;i<8;i++){await page.evaluate(()=>{const b=document.getElementById('novaSyncTest');if(b&&!b.disabled)b.click();const ok=document.querySelector('#rtEscolha [data-ok]');if(ok)ok.click();});await page.waitForTimeout(2200);if((await page.evaluate(()=>[...window.__fs].filter(([p])=>/Direta\/acoes\//.test(p)).length))>n0)break;}
 assert.ok((await page.evaluate(()=>[...window.__fs].filter(([p])=>/Direta\/acoes\//.test(p)).length))>n0,'novo ataque depois do reinício');
 // 8) sair do duelo remove a criatura de treino
 const saiu=await page.evaluate(()=>window.mesaTestePersonagem.sairDuelo());assert.ok(saiu>=1,'criatura de treino removida');
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS duelo ('+fim+') [harness local; mestre simulado; Firestore falso]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
