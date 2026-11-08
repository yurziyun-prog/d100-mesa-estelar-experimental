// Sender de jogador distinto da autoridade. Banco falso: não comprova autenticação.
const assert=require('node:assert/strict');
const {montarDuelo}=require('./_duelo-fixtura.cjs');
(async()=>{
 const {H,page,cid,criaturaId,id}=await montarDuelo({criatura:'rastejante_de_cinzas',arma:'espada_forca',dist:.6});
 try{
  await page.evaluate(async({cid,criaturaId,id})=>{
   const A=window.__APP__,S=window.__fs;A.setMestre();
   const p='combatesAtivos/mapaMesaSyncDireta/posicoes/'+cid;
   window.__fsWrite(p,{...S.get(p),donoUid:'jogador-separado'});
   window.__fsWrite('personagens/'+cid,{...S.get('personagens/'+cid),dono:'jogador-separado'});
   window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:true,pausado:true,mapId:'antigo',auto:{[cid]:false,[criaturaId]:false}});
   const ctl=A.ctl();ctl.close();ctl.open();
   window.__senderResultado=null;
   const {conectarAtaques}=await import('/js/nova-ataques.js');
   const doc=A.ev('doc'),setDoc=A.ev('setDoc'),onSnapshot=A.ev('onSnapshot'),db=A.ev('db');
   const sender=conectarAtaques({database:{
    writeMap:(p,v)=>setDoc(doc(db,...p.split('/')),v),
    subscribeDoc:(p,receive,fail)=>onSnapshot(doc(db,...p.split('/')),s=>receive(s.exists()?s.data():null),fail)
   },user:()=>({uid:'jogador-separado',master:false}),tokens:()=>[],onHealth:()=>{},onError:e=>console.error(e)});
   const t={...S.get(p),id:cid},dados=await window.mesaTempoRealDadosV111_.dados(t),ataque=dados.ataques.find(a=>/Espada de Força/.test(a.nome));
   if(!ataque)throw Error('Espada ausente');
   const s=document.getElementById('novaSyncPersonagem');s.value='__mestre__';s.dispatchEvent(new Event('change',{bubbles:true}));
   sender.attack({actorId:cid,targetId:criaturaId,mapId:id,skillId:ataque.skillId,weaponId:ataque.weaponId}).then(v=>{window.__senderResultado={ok:true,message:v};},e=>{window.__senderResultado={ok:false,message:e.message};}).finally(()=>sender.close());
  },{cid,criaturaId,id});
  await page.waitForFunction(()=>window.__senderResultado!==null,null,{timeout:25000});
  const r=await page.evaluate(()=>window.__senderResultado);assert.equal(r.ok,true,r.message);
  assert.match(r.message,/Espada de Força/);
  console.log('PASS jogador de dono distinto recebe resolução da autoridade enquanto o mestre está em modo Mestre [banco falso]');
 }finally{await H.close();}
})().catch(e=>{console.error(e);process.exit(1);});
