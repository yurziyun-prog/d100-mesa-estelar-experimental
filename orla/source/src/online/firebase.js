import {newWorld,importSheet,applyCommand,tickWorld,cloneWorld} from './model.js';
const BASE='https://www.gstatic.com/firebasejs/10.12.2/';
const config={apiKey:'AIzaSyDw_DB5qhwyqPI7_q6NgVA-U90atRGJ4mQ',authDomain:'d100-mesa-estelar.firebaseapp.com',projectId:'d100-mesa-estelar',storageBucket:'d100-mesa-estelar.firebasestorage.app',messagingSenderId:'1000414403401',appId:'1:1000414403401:web:fae7d2feaad04cc8bd9898'};
export async function firebaseService(){
 const [appSDK,A,F]=await Promise.all([import(BASE+'firebase-app.js'),import(BASE+'firebase-auth.js'),import(BASE+'firebase-firestore.js')]);const app=appSDK.getApps().find(a=>a.name==='[DEFAULT]')||appSDK.initializeApp(config),auth=A.getAuth(app),db=F.getFirestore(app);
 await new Promise(resolve=>{const off=A.onAuthStateChanged(auth,()=>{off();resolve();});});
 const isMaster=()=>auth.currentUser?.email==='yurziyun@gmail.com';
 const docs=async(name,owned=false)=>{const ref=F.collection(db,name),q=owned&&!isMaster()?F.query(ref,F.where('dono','==',auth.currentUser.uid)):ref;return (await F.getDocs(q)).docs.map(d=>({id:d.id,...d.data()}));};
 return {get user(){return auth.currentUser;},get master(){return isMaster();},login:(email,password)=>A.signInWithEmailAndPassword(auth,email,password),logout:()=>A.signOut(auth),sheets:()=>docs('personagens',true),
 async connect(code,{host,onWorld,onError}){
  if(!auth.currentUser)throw Error('Entre com sua conta do Mesa Estelar.');if(host&&!isMaster())throw Error('Somente o mestre pode abrir a sessão.');if(!/^[a-z0-9-]{3,24}$/.test(code))throw Error('Código: 3 a 24 letras minúsculas, números ou hífen.');
  const ref=F.doc(db,'combatesAtivos','orla-online-'+code),queue=F.collection(ref,'acoes'),token=crypto.randomUUID(),uid=auth.currentUser.uid;let closed=false,busy=false,commands=new Map(),timer,offQueue,leaseTimer=Date.now();
  if(host)await F.runTransaction(db,async tx=>{const snap=await tx.get(ref),data=snap.data();if(data?.leaseUntil>Date.now())throw Error('Esta sala já possui um mestre ativo. Aguarde alguns segundos após fechar a outra aba.');const world=cloneWorld(data?.world||newWorld());world.masterActor='god';tx.set(ref,{version:1,world,hostUid:uid,token,leaseUntil:Date.now()+8000,updatedAt:Date.now()});});
  const off=F.onSnapshot(ref,snap=>{const d=snap.data();if(d?.world)onWorld(d.world,d.updatedAt,d.leaseUntil);else onError('Aguardando o mestre abrir esta sala.');},e=>onError(e.message));
  if(host){
   const catalog=[...await docs('pericias'),...await docs('especializacoes')];
   function resolvedSheet(sheet){const attrs=Object.fromEntries(Object.entries(sheet.atributos||{}).map(([k,v])=>[k,Number(v)+(Number(sheet.bonus?.[k])||0)]));const skills={};for(const spec of catalog){const d=sheet.pericias?.[spec.id]||sheet.especializacoes?.[spec.id]||{},invest=d.investimentos;const train=invest?['origem','carreira','hobbie','xp'].reduce((s,k)=>s+(Number(invest[k])||0),0):(Number(d.treinoTotal??d.treinoEtapa)||0)+(Number(d.xpTreino)||0);let formula=String(spec.formula||'0').replace(/MAIOR/g,String(Math.max(...['FOR','TAM','DES','INT','CAR'].map(k=>attrs[k]||0)))).replace(/\b(FOR|CON|TAM|DES|INT|POD|CAR)\b/g,k=>String(attrs[k]||0));let base=0;if(/^[0-9+*/().\s-]+$/.test(formula)){try{base=Function('return ('+formula+')')();}catch{}}skills[spec.nome_pt||spec.nome||spec.name||spec.id]=Math.round(Number(base||0))+train;}return {...sheet,pericias:skills,especializacoes:{}};}
   offQueue=F.onSnapshot(queue,snap=>{commands=new Map(snap.docs.map(d=>[d.id,{ref:d.ref,data:d.data()}]));},e=>onError(e.message));
   timer=setInterval(async()=>{if(closed||busy)return;busy=true;try{const batch=[...commands.values()].slice(0,20),now=Date.now(),dt=Math.min(.5,(now-leaseTimer)/1000);leaseTimer=now;
    await F.runTransaction(db,async tx=>{const snap=await tx.get(ref),d=snap.data();if(d?.token!==token)throw Error('Outra conexão assumiu a sala.');const requests=[];for(const entry of batch){const snap=await tx.get(entry.ref);if(snap.exists())requests.push({ref:entry.ref,data:snap.data()});}const joins=new Map();for(const {data:c} of requests)if(c.op==='join'&&typeof c.personagemId==='string'&&c.personagemId.length<150){const sheet=await tx.get(F.doc(db,'personagens',c.personagemId));if(sheet.exists()&&((sheet.data().dono===c.donoUid&&sheet.data().tipo!=='npc'&&sheet.data().ativoNaCampanha!==false)||c.donoUid===uid))joins.set(c.id,resolvedSheet(sheet.data()));}
     const w=cloneWorld(d.world);for(const {ref:commandRef,data:c} of requests){if(joins.has(c.id))importSheet(w,c.personagemId,joins.get(c.id));else if(c.op!=='join')applyCommand(w,c,c.donoUid,c.donoUid===uid,now);tx.delete(commandRef);}tickWorld(w,dt,now);tx.update(ref,{world:w,updatedAt:now,leaseUntil:now+8000});
    });
   }catch(e){onError(e.message);if(/assumiu/.test(e.message)){closed=true;clearInterval(timer);}}finally{busy=false;}},350);
  }
  return {send:async(op,actor,data={})=>{if(closed)throw Error('Sala desconectada.');const id=crypto.randomUUID();await F.setDoc(F.doc(queue,id),{id,op,actor,personagemId:actor,donoUid:uid,data});},close(){closed=true;clearInterval(timer);off();offQueue?.();}};
 }
 };
}

