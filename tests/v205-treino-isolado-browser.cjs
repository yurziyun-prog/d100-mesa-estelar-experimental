// TREINO ISOLADO: o duelo de treino NÃO escreve na ficha real (cópia em treinoSessoes/<sessão>/fichas/<id>).
// Cobre: vitória, derrota (CENARIO=derrota), reinício, saída, fechamento abrupto (aba some da memória), falha de rede (ao começar e no meio da luta) e edição legítima feita
// por OUTRO cliente durante a luta. Em todos: a ficha real persistida fica IDÊNTICA (documento inteiro) ao que era + a edição legítima.
// VALIDAÇÃO: harness local (Edge sem cabeça, Firestore FALSO, mestre SIMULADO, um só cliente de verdade). NÃO prova regras do Firestore, duas contas, rede real.
const assert=require('assert/strict');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
const DERROTA=process.env.CENARIO==='derrota';
const ord=v=>Array.isArray(v)?v.map(ord):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,ord(v[k])])):v;
const S=v=>String(JSON.stringify(ord(v)));
(async()=>{
 const D=await montarDuelo({criatura:null,perfil:DERROTA?'fraco':'forte'});const {H,page,erros,cid}=D;
 const REAL='personagens/'+cid;
 const lerReal=()=>page.evaluate(p=>JSON.parse(JSON.stringify(window.__fs.get(p)||null)),REAL);
 const lerCopia=()=>page.evaluate(([s,c])=>{const k=[...window.__fs.keys()].find(x=>x.startsWith('treinoSessoes/')&&x.includes('/fichas/'+c));return k?{k,v:JSON.parse(JSON.stringify(window.__fs.get(k)))}:null;},[null,cid]);
 const rota=()=>page.evaluate(c=>window.mesaTreinoRotaV205('personagens/'+c),cid);
 let esperado=await lerReal();const R0=S(esperado);
 const confere=async(rotulo)=>{const r=await lerReal();if(S(r)!==S(esperado)){const ks=[...new Set([...Object.keys(r||{}),...Object.keys(esperado)])].filter(k=>S(r?.[k])!==S(esperado[k]));console.log('  ✗ campos diferentes em',rotulo,':',ks.map(k=>k+' '+S(esperado[k]).slice(0,60)+' => '+S(r?.[k]).slice(0,80)).join(' | '));}assert.equal(S(r),S(esperado),'ficha real INTACTA após '+rotulo);console.log('  ✓ ficha real intacta após',rotulo);};
 await page.evaluate(async()=>{const c=window.__APP__.ctl();try{c.close?.();}catch(_){}await c.open();});await page.waitForTimeout(2200);
 await page.evaluate(cid=>{const s=document.getElementById('novaSyncPersonagem');s.value=cid;s.dispatchEvent(new Event('change',{bubbles:true}));},cid);await page.waitForTimeout(1500);
 const confirmar=()=>page.evaluate(()=>{const ok=document.querySelector('#rtEscolha [data-ok]');if(ok&&!ok.disabled){ok.click();return true;}return false;});
 const painel=()=>page.evaluate(()=>({btn:document.getElementById('novaSyncTest')?.textContent||'',res:document.querySelector('.nova-result')?.textContent||''}));
 const vida=(crt)=>page.evaluate(([c,k])=>{const a=window.__fs.get('combatesAtivos/mapaMesaSyncSaude')?.actors||{};const f=x=>{const v=a[x]?.combateLab;return v?{pv:Object.values(v.hit||{}).reduce((s,n)=>s+Number(n||0),0),max:Object.values(v.hitMax||{}).reduce((s,n)=>s+Number(n||0),0),morto:!!v.morto,inc:!!v.inconsciente}:null;};return {kael:f(c),crt:k?f(k):null};},[cid,crt]);
 const clicarCriatura=async(id)=>{await page.waitForSelector('#novaSyncBoard [data-token="'+id+'"]',{timeout:10000,state:'attached'});for(let k=0;k<6;k++){const tk=await page.evaluate(i=>{const n=document.querySelector('#novaSyncBoard [data-token="'+i+'"]');n.scrollIntoView({block:'center',inline:'center'});const r=n.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];},id);await page.mouse.click(tk[0],tk[1]);await page.waitForTimeout(700);if(/Atacar/.test((await painel()).btn))return;}};
 const lutar=async(id,limiteMs)=>{const t0=Date.now();let fim='';while(Date.now()-t0<limiteMs){const v=await vida(id);if(v.crt&&(v.crt.morto||v.crt.inc)){fim='vitoria';break;}if(v.kael&&(v.kael.morto||v.kael.inc)){fim='derrota';break;}
   await confirmar();await page.evaluate(()=>{const b=document.getElementById('novaSyncTest');if(b&&!b.disabled&&/Atacar/.test(b.textContent))b.click();});await page.waitForTimeout(1000);}return fim;};
 const luta=async(criatura)=>{const id=await page.evaluate(c=>window.mesaTestePersonagem.iniciarDuelo({criatura:c}),criatura);await page.waitForTimeout(1200);await page.evaluate(()=>{window.__fsWrite('combatesAtivos/mesaTempoReal',{velocidade:2},{merge:true});});return id;};

 // ---------- 1) começar: cópia criada, redirecionamento armado, ficha real intocada
 const crt=await luta(DERROTA?'insetoide_predador':'rastejante_de_cinzas');
 const cp=await lerCopia();assert.ok(cp,'cópia da ficha criada na sessão de treino');assert.equal(cp.v.treinoV205,true,'cópia marcada como treino');assert.equal(cp.v.treinoOrigemV205,REAL,'cópia aponta a origem');
 assert.match(await rota(),/^treinoSessoes\/t_[^/]+\/fichas\//,'o combate agora aponta para a cópia');console.log('começou: cópia em',cp.k);
 await confere('iniciar');
 await clicarCriatura(crt);

 if(!DERROTA){
  // ---------- 2) Sorte (grava na ficha no jogo normal) vai para a cópia
  await page.evaluate(()=>document.getElementById('novaLuck')?.click());await page.waitForTimeout(2500);
  const cp2=await lerCopia();console.log('Sorte: cópia pontosSorte =',cp2.v.pontosSorte,'(original',esperado.pontosSorte,')');
  await confere('gastar Sorte');
  // ---------- 3) outro cliente edita a ficha REAL no meio da luta (edição legítima): tem que permanecer
  esperado={...esperado,anotacoes:'EDITADO POR OUTRO CLIENTE durante o duelo',recursos:Number(esperado.recursos||0)+7};
  await page.evaluate(([p,v])=>window.__fsWrite(p,v),[REAL,esperado]);
  // ---------- 4) vitória
  const fim=await lutar(crt,260000);console.log('fim da luta:',fim);assert.equal(fim,'vitoria');
  await confere('vitória (com a edição legítima do outro cliente preservada)');
  const hist=await page.evaluate(()=>(window.__fs.get('combatesAtivos/mapaMesaSyncHistorico')?.entries||[]).length);console.log('entradas de histórico durante o treino:',hist);
  // ---------- 5) reiniciar: recria a cópia a partir da ficha real de agora (inclui a edição) e restaura a saúde
  await page.evaluate(()=>window.mesaTestePersonagem.reiniciarDuelo());await page.waitForTimeout(1500);
  const cp3=await lerCopia();const {treinoV205,treinoOrigemV205,treinoSessaoV205,treinoCopiadoEmV205,...corpo}=cp3.v;
  // (o 🔄 Restaurar da mesa também grava fadiga/necessidades/Sorte — na CÓPIA, não na ficha real —, por isso só comparo o que o treino não mexe: a edição do outro cliente tem de estar na cópia nova)
  const livre=['combate','pontosSorte','necessidades','pontosMagiaGastos','inventario'],sem=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!livre.includes(k)));
  assert.equal(S(sem(corpo)),S(sem(esperado)),'após reiniciar a cópia foi recriada da ficha real de agora (com a edição do outro cliente)');assert.equal(corpo.anotacoes,esperado.anotacoes);
  await confere('reiniciar');
  // ---------- 6) fechamento abrupto: a aba "some" no meio de um duelo ativo; nada a reparar
  await page.evaluate(()=>{const b=document.getElementById('novaSyncTest');if(b&&!b.disabled)b.click();});await page.waitForTimeout(1500);
  await page.evaluate(()=>window.mesaTreinoV205.esquecer());
  assert.equal(await rota(),REAL,'sem sessão armada o combate volta à ficha real');await confere('fechar a aba no meio do duelo');
  // ---------- 7) falha de rede: (a) ao começar
  await page.evaluate(()=>window.mesaTestePersonagem.sairDuelo());await page.waitForTimeout(800);
  await page.evaluate(()=>{window.__FALHA_REDE='treinoSessoes';});
  const msg=await page.evaluate(()=>window.mesaTestePersonagem.iniciarDuelo({criatura:'rastejante_de_cinzas'}).then(()=>'(iniciou!)',e=>String(e.message||e)));console.log('falha de rede ao começar ->',msg.slice(0,160));
  assert.match(msg,/NÃO foi iniciado/,'avisa que o duelo não começou');assert.equal(await rota(),REAL,'sem cópia não há redirecionamento (e nenhum duelo)');await confere('falha de rede ao começar');
  await page.evaluate(()=>{window.__FALHA_REDE='';});
  // ---------- 8) falha de rede (b) no meio da luta: gravar na cópia falha; a ficha real não vira alternativa
  const crt2=await luta('rastejante_de_cinzas');await clicarCriatura(crt2);
  await page.evaluate(()=>{window.__FALHA_REDE='treinoSessoes';});
  await page.evaluate(()=>document.getElementById('novaLuck')?.click());await page.waitForTimeout(2500);
  const p=await painel();console.log('Sorte com a rede da cópia fora ->',p.res.slice(0,140));
  await page.evaluate(()=>{window.__FALHA_REDE='';});await confere('falha de rede no meio da luta');
  // ---------- 9) sair: apaga cópia, desarma, limpa criaturas/saúde; ficha real intacta
  const sid2=await page.evaluate(()=>window.mesaTreinoV205.sessao());
  await page.evaluate(()=>window.mesaTestePersonagem.sairDuelo());await page.waitForTimeout(1200);
  const restantes=await page.evaluate(()=>[...window.__fs.keys()].filter(k=>k.startsWith('treinoSessoes/')&&k.includes('/fichas/')));
  console.log('cópias que restam no banco:',restantes.length,'(só a ÓRFÃ da aba "fechada" no passo anterior; é apagada pelo mestre depois de 12 h)');
  assert.ok(!restantes.some(k=>k.includes('/'+sid2+'/')),'a cópia desta sessão foi apagada ao sair');assert.equal(await rota(),REAL,'redirecionamento desarmado');
  const sobrou=await page.evaluate(id=>!!window.__fs.get('combatesAtivos/mapaMesaSyncDireta/posicoes/'+id),crt2);assert.equal(sobrou,false,'a criatura de treino foi removida do mapa');
  await confere('sair');
 }else{
  // ---------- DERROTA: personagem fraco perde; a cópia leva o ferimento, a ficha real não
  const fim=await lutar(crt,200000);console.log('fim da luta:',fim);assert.equal(fim,'derrota');
  const cp2=await lerCopia();console.log('cópia após derrota: combate =',JSON.stringify(cp2.v.combate).slice(0,160));
  await confere('derrota');
  await page.evaluate(()=>window.mesaTestePersonagem.reiniciarDuelo());await page.waitForTimeout(1500);await confere('reiniciar depois da derrota');
  await page.evaluate(()=>window.mesaTestePersonagem.sairDuelo());await page.waitForTimeout(1200);await confere('sair depois da derrota');
 }
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED|Falha de rede simulada/i.test(e));assert.equal(reais.length,0,reais.join('|'));
 console.log('PASS treino isolado ('+(DERROTA?'derrota':'vitória, reinício, saída, fechar aba, falha de rede, edição concorrente')+') [harness local; mestre simulado; Firestore falso]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
