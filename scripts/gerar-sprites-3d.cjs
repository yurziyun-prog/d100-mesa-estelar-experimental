// Gera as FOLHAS DE QUADROS (sprite sheets) das miniaturas 3D do jogo a partir de modelos GLB com esqueleto e animação (Quaternius, domínio público).
// Cada modelo vira, para o mapa visto de cima em 3/4: andar (lado, costas, frente), atacar (lado, costas, frente), golpe recebido, morrer e parado.
// Estilo do jogo: contorno escuro, luz quente de cima/esquerda, cores um pouco dessaturadas, personagem enquadrado inteiro (como a arte atual).
// A arte "olha para a ESQUERDA" (o jogo espelha quando anda para a direita).
//
// Uso: node scripts/gerar-sprites-3d.cjs [id ...]     (sem ids = todos os de MODELOS)
// Precisa do three.js (npm install three) numa pasta: THREE_DIR=<pasta com node_modules/three>; e dos zips em ZIPS_DIR (padrão: ..\..\..\ da pasta do projeto).
// Saída: arte/miniaturas3d/<id>_<acao>_<direcao>.webp  +  js/mesa-sprites-3d-dados.js (lista das folhas e quadros para o jogo)
const fs=require('fs'),path=require('path'),cp=require('child_process');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..');
const THREE_DIR=process.env.THREE_DIR||'C:/Users/yurzi/AppData/Local/Temp/claude/C--Users-yurzi-Documents-Codex-mandarim-aula-main/2296697d-e56e-4bd6-b824-c216845a4b59/scratchpad/render3d';
const ZIPS_DIR=process.env.ZIPS_DIR||'C:/Users/yurzi/Documents/Codex/2026-09-09';
const TMP=path.join(require('os').tmpdir(),'sprites3d-modelos');
const SAIDA=path.join(raiz,'arte','miniaturas3d');
const TAM=Number(process.env.TAM)||192,QUADROS=Number(process.env.QUADROS)||8;

// id do jogo → zip, arquivo, nomes dos clipes (sufixo; o prefixo "Armature|" etc. é achado sozinho)
const GENERICO={andar:['Walk','Fast_Flying'],atacar:['Sword_Slash','Punch_Right','Punch','Attack_Headbutt','Attack','Attack_Kick','Bite_Front','Headbutt'],golpe:['HitRecieve','HitReact','Idle_HitReact_Left','Idle'],morrer:['Death'],parado:['Idle','Idle_Neutral','Flying_Idle']};
const HUMANO=GENERICO,ANIMAL=GENERICO,DINO=()=>GENERICO;
const MODELOS={
 adventurer:{zip:'Ultimate Modular Men Pack-glb.zip',arq:'Adventurer.glb',clipes:HUMANO,nome:'Aventureiro'},
 medieval_woman:{zip:'Ultimate Modular Women Pack-glb.zip',arq:'Medieval.glb',clipes:HUMANO,nome:'Mulher medieval'},
 deer:{zip:'Animated Animal Pack-glb.zip',arq:'Deer.glb',clipes:ANIMAL,nome:'Cervo'},
 trex:{zip:'Animated Dinosaur Bundle-glb.zip',arq:'T-Rex.glb',clipes:DINO('TRex'),nome:'T-Rex'}
};
const slug=n=>n.replace(/\.glb$/i,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
function listarZip(zip){const ps=`Add-Type -AssemblyName System.IO.Compression.FileSystem;$z=[IO.Compression.ZipFile]::OpenRead('${path.join(ZIPS_DIR,zip).replace(/\//g,'\\')}');$z.Entries|Where-Object {$_.Length -gt 0 -and $_.Name -match '\.glb$'}|ForEach-Object {$_.Name};$z.Dispose()`;return cp.execFileSync('powershell',['-NoProfile','-Command',ps]).toString().split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
if(process.env.TODOS==='1'){for(const [zip,pref] of [['Ultimate Modular Men Pack-glb.zip','h_'],['Ultimate Modular Women Pack-glb.zip','m_'],['Animated Animal Pack-glb.zip','a_'],['Animated Dinosaur Bundle-glb.zip','d_']]){for(const arq of listarZip(zip)){if(/-[A-Za-z0-9]{8,12}\.glb$/.test(arq))continue;const id=pref+slug(arq);if(!MODELOS[id])MODELOS[id]={zip,arq,clipes:GENERICO,nome:arq.replace(/\.glb$/i,'')};}}}
// NOVOS=1: pacotes baixados em 21/10/2026 (monstros, inimigos, zumbis, sobreviventes, fazenda). Ids: mo_ monstros, en_ inimigos, zb_ zumbis/sobreviventes, fz_ fazenda.
if(process.env.NOVOS==='1'){
 const PT={'Alien':'Alienígena','Alpaking':'Alpacarei','Alpaking Evolved':'Alpacarei evoluído','Armabee':'Tatuabelha','Armabee Evolved':'Tatuabelha evoluída','Birb':'Passarinho','Blue Demon':'Demônio azul','Bunny':'Coelho','Cactoro':'Cactoro','Cat':'Gato','Chicken':'Galinha','Demon':'Demônio','Dino':'Dinossauro','Dragon':'Dragão','Dragon Evolved':'Dragão evoluído','Fish':'Peixe','Frog':'Sapo','Ghost':'Fantasma','Ghost Skull':'Caveira fantasma','Glub':'Glub','Glub Evolved':'Glub evoluído','Goleling':'Golemzinho','Goleling Evolved':'Golemzinho evoluído','Green Blob':'Gosma verde','Green Spiky Blob':'Gosma espinhosa','Hywirl':'Hywirl','Monkroose':'Macacoalce','Mushnub':'Cogumelinho','Mushnub Evolved':'Cogumelinho evoluído','Mushroom King':'Rei cogumelo','Ninja':'Ninja','Orc Enemy':'Orc inimigo','Orc':'Orc','Pigeon':'Pombo','Pink Blob':'Gosma rosa','Squidle':'Lulinha','Tribal':'Tribal','Wizard':'Mago','Yeti':'Yeti'};
 const SO_CABECA=/^(Alien|Birb|Cactoro|Cat|Chicken|Fish|Green Blob|Green Spiky Blob|Ninja|Orc Enemy|Pigeon|Pink Blob|Wizard|Yeti|Mushnub|Mushnub Evolved|Glub|Glub Evolved|Goleling|Goleling Evolved|Alpaking|Alpaking Evolved)$/;
 for(const arq of listarZip('Ultimate Monsters Bundle-glb.zip')){if(/-[A-Za-z0-9]{8,12}\.glb$/.test(arq))continue;const n=arq.replace(/\.glb$/i,'');if(SO_CABECA.test(n))continue;MODELOS['mo_'+slug(arq)]={zip:'Ultimate Monsters Bundle-glb.zip',arq,clipes:GENERICO,nome:'Monstro · '+(PT[n]||n)};}
 // versões COM CORPO (corpo inteiro, andar/correr/socar) das criaturas que no pacote original são só cabeça
 for(const [arq,id,nome] of [['Alien-RRliSQBP7r.glb','alien','Alienígena'],['Cactoro-IGn9lhdama.glb','cactoro','Cactoro'],['Ninja-xGYmeDpfTu.glb','ninja','Ninja'],['Yeti-ceRHrn8HHE.glb','yeti','Yeti'],['Fish-ypEYhCImAB.glb','peixe','Homem-peixe'],['Demon-LnfIziKv4o.glb','demonio_guerreiro','Demônio guerreiro']])MODELOS['mo_'+id+'_corpo']={zip:'Ultimate Monsters Bundle-glb.zip',arq,clipes:GENERICO,nome:'Monstro · '+nome};
 const E=(p,extra={})=>({andar:[p+'_Walk',p+'_Run'],atacar:[p+'_Attack'],golpe:[p+'_Idle'],morrer:[p+'_Death'],parado:[p+'_Idle'],...extra});
 const en=[['Frog','Sapo-inimigo',{andar:['Frog_Jump']}],['Rat','Rato'],['Snake','Cobra',{morrer:['Snake_Idle']}],['Spider','Aranha']];
 for(const [p,nome,extra] of en)MODELOS['en_'+p.toLowerCase()]={zip:'Animated Enemies-glb.zip',arq:p+'.glb',clipes:E(p,extra||{}),nome:'Inimigo · '+nome};
 const Z={andar:['Walk'],atacar:['Idle_Attack','Punch','Crawl'],golpe:['HitReact'],morrer:['Death'],parado:['Idle']};
 MODELOS.zb_zombie={zip:'Post Apocolypse Pack.undefined-glb.zip',arq:'Zombie.glb',clipes:Z,nome:'Zumbi'};
 MODELOS.zb_zombie_half={zip:'Post Apocolypse Pack.undefined-glb.zip',arq:'Zombie half.glb',clipes:{andar:['Crawl'],atacar:['Crawl'],golpe:['HitReact'],morrer:['Death'],parado:['Idle']},nome:'Zumbi rastejante'};
 MODELOS.zb_big_arm={zip:'Post Apocolypse Pack.undefined-glb.zip',arq:'Big arm.glb',clipes:{andar:['Walk'],atacar:['Punch','Run_Attack'],golpe:['HitReact'],morrer:['Death'],parado:['Idle']},nome:'Zumbi braço grande'};
 const S={andar:['Walk'],atacar:['Slash','Stab','Punch'],golpe:['HitReact'],morrer:['Death'],parado:['Idle']};
 for(const [id,nome] of [['Matt','Matt'],['Sam','Sam'],['Shaun','Shaun'],['Lis','Lis']])MODELOS['zb_'+id.toLowerCase()]={zip:'Post Apocolypse Pack.undefined-glb.zip',arq:(id==='Lis'?'Lis':'Characters '+id)+'.glb',clipes:S,nome:'Sobrevivente · '+nome};
 for(const [id,arq,nome] of [['pug','Characters Pug','Pug'],['german_shepard','German Shepard','Pastor-alemão']])MODELOS['zb_'+id]={zip:'Post Apocolypse Pack.undefined-glb.zip',arq:arq+'.glb',clipes:GENERICO,nome:'Cão · '+nome};
 const F={andar:['Walk'],atacar:['Jump'],golpe:['Idle'],morrer:['Death'],parado:['Idle']};
 for(const [id,nome] of [['Cow','Vaca'],['Horse','Cavalo'],['Zebra','Zebra']])MODELOS['fz_'+id.toLowerCase()]={zip:'Farm Animal Pack-glb.zip',arq:id+'.glb',clipes:F,nome:'Animal · '+nome};
 if(!process.argv.slice(2).length)for(const k of Object.keys(MODELOS))if(!/^(mo_|en_|zb_|fz_)/.test(k))delete MODELOS[k];
}
const ACOES=[['andar',['lado','costas','frente']],['atacar',['lado','costas','frente']],['golpe',['lado']],['morrer',['lado']],['parado',['lado']]];

function extrair(zip,arq,saida){
 fs.mkdirSync(TMP,{recursive:true});
 const ps=`Add-Type -AssemblyName System.IO.Compression.FileSystem;$z=[IO.Compression.ZipFile]::OpenRead('${path.join(ZIPS_DIR,zip).replace(/\//g,'\\')}');$e=$z.Entries|Where-Object Name -eq '${arq}'|Select-Object -First 1;[IO.Compression.ZipFileExtensions]::ExtractToFile($e,'${saida.replace(/\//g,'\\')}',$true);$z.Dispose()`;
 cp.execFileSync('powershell',['-NoProfile','-Command',ps]);
}
const PAGINA=`<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OutlineEffect} from 'three/addons/effects/OutlineEffect.js';
window.pronto=false;
const cache=new Map();
function guardarPose(g){g.__pose=[];g.scene.traverse(o=>g.__pose.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]));}
function restaurarPose(g){for(const [o,p,q,sc] of g.__pose){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(sc);}g.scene.updateMatrixWorld(true);}
async function carregar(url){if(cache.has(url))return cache.get(url);const g=await new GLTFLoader().loadAsync(url);guardarPose(g);cache.set(url,g);return g;}
const dirs={lado:0,frente:Math.PI/2,costas:-Math.PI/2}; // ângulo da câmera em volta do modelo (lado = câmera em +X: o modelo olha para a esquerda)
// caixa que contém o modelo em TODOS os quadros de TODAS as ações (o enquadramento e a escala são iguais em tudo; nada é cortado)
const acharClipe=(g,cands)=>{for(const c of [].concat(cands)){const a=g.animations.find(a=>a.name===c||a.name.endsWith('|'+c)||a.name.endsWith('_'+c));if(a)return a;}return null;};
window.medir=async({url,clipes})=>{
 const g=await carregar(url),modelo=g.scene,mixer=new THREE.AnimationMixer(modelo),caixa=new THREE.Box3();restaurarPose(g);
 for(const nome of clipes){const clip=acharClipe(g,nome);if(!clip)continue;mixer.stopAllAction();restaurarPose(g);const ac=mixer.clipAction(clip);ac.play();
  for(let i=0;i<=12;i++){mixer.setTime(clip.duration*i/12);modelo.updateMatrixWorld(true);caixa.union(new THREE.Box3().setFromObject(modelo,true));}}
 return {min:caixa.min.toArray(),max:caixa.max.toArray()};
};
window.folha=async({url,clipe,direcao,quadros,tam,loop,bbox})=>{
 const g=await carregar(url),cena=new THREE.Scene();restaurarPose(g);
 const modelo=g.scene;cena.add(modelo);
 modelo.traverse(o=>{if(o.isMesh){o.castShadow=false;if(o.material){o.material=o.material.clone();if('metalness' in o.material)o.material.metalness=Math.min(.15,o.material.metalness||0);if('roughness' in o.material)o.material.roughness=Math.max(.7,o.material.roughness||1);}}});
 cena.add(new THREE.HemisphereLight(0xfff1dc,0x4a3a30,1.55));
 const sol=new THREE.DirectionalLight(0xffe2b8,2.2);sol.position.set(-3,6,4);cena.add(sol);
 const rim=new THREE.DirectionalLight(0x9fb4ff,.8);rim.position.set(4,3,-5);cena.add(rim);
 const mixer=new THREE.AnimationMixer(modelo);
 const clip=acharClipe(g,clipe);
 if(!clip)throw new Error('clipe não encontrado: '+JSON.stringify(clipe)+' em '+g.animations.map(a=>a.name).join(','));
 const acao=mixer.clipAction(clip);acao.play();
 const dur=clip.duration;
 // caixa do modelo no 1º quadro da pose parada: usada para enquadrar IGUAL em todos os quadros e ações (tamanho estável)
 const medir=()=>{modelo.updateMatrixWorld(true);return new THREE.Box3().setFromObject(modelo);};
 mixer.setTime(0);const b0=bbox?new THREE.Box3(new THREE.Vector3(...bbox.min),new THREE.Vector3(...bbox.max)):medir();
 const c=b0.getCenter(new THREE.Vector3()),s=b0.getSize(new THREE.Vector3());
 const alvo=Math.max(s.y,Math.max(s.x,s.z))*1.12; // altura OU comprimento: o que for maior cabe no quadro, com folga
 const cam=new THREE.OrthographicCamera(-alvo/2,alvo/2,alvo/2,-alvo/2,.1,100);
 const ang=dirs[direcao]??0,el=THREE.MathUtils.degToRad(26),R=20;
 cam.position.set(c.x+Math.cos(el)*Math.cos(ang)*R,c.y+Math.sin(el)*R,c.z+Math.cos(el)*Math.sin(ang)*R);cam.lookAt(c.x,c.y,c.z);
 const rend=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});rend.setSize(tam,tam,false);rend.setClearColor(0x000000,0);
 rend.outputColorSpace=THREE.SRGBColorSpace;rend.toneMapping=THREE.ACESFilmicToneMapping;rend.toneMappingExposure=1.05;
 const efeito=new OutlineEffect(rend,{defaultThickness:.0042*(tam/192)*1.0,defaultColor:[.08,.06,.05],defaultAlpha:1});
 const folha=document.createElement('canvas');folha.width=tam*quadros;folha.height=tam;const f=folha.getContext('2d');
 for(let i=0;i<quadros;i++){
  const t=loop?(dur*i/quadros):(dur*i/Math.max(1,quadros-1));
  mixer.setTime(Math.min(dur-1e-4,t));modelo.updateMatrixWorld(true);
  efeito.render(cena,cam);
  f.save();f.filter='saturate(.88) contrast(1.06) brightness(.98)';f.drawImage(rend.domElement,i*tam,0,tam,tam);f.restore();
 }
 rend.dispose();
 return {png:folha.toDataURL('image/png'),bbox:{min:b0.min.toArray(),max:b0.max.toArray()},dur};
};
window.pronto=true;
</script>`;
(async()=>{
 const ids=process.argv.slice(2).length?process.argv.slice(2):Object.keys(MODELOS);
 fs.mkdirSync(SAIDA,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:600,height:600}});
 page.on('pageerror',e=>console.log('PAGEERR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('PAGE',m.text().slice(0,200));});
 await page.route('https://r3d.test/**',r=>{
  const u=new URL(r.request().url()),p=decodeURIComponent(u.pathname);
  if(p==='/')return r.fulfill({contentType:'text/html',body:PAGINA});
  if(p.startsWith('/three/')){const f=path.join(THREE_DIR,'node_modules','three',p.slice(7));return fs.existsSync(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  if(p.startsWith('/m/')){const f=path.join(TMP,p.slice(3));return fs.existsSync(f)?r.fulfill({contentType:'model/gltf-binary',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  return r.fulfill({status:404,body:''});
 });
 await page.goto('https://r3d.test/');await page.waitForFunction(()=>window.pronto,null,{timeout:30000});
 const dados={};
 for(const id of ids){
  const m=MODELOS[id];if(!m){console.log('modelo desconhecido',id);continue;}
  const arq=path.join(TMP,id+'.glb');if(!fs.existsSync(arq))extrair(m.zip,m.arq,arq);
  dados[id]={nome:m.nome,folhas:{}};
  const bbox=await page.evaluate(async a=>window.medir(a),{url:'/m/'+id+'.glb',clipes:Object.values(m.clipes)});
  for(const [acao,direcoes] of ACOES){
   for(const dir of direcoes){
    const loop=acao==='andar'||acao==='parado';
    const r=await page.evaluate(async a=>window.folha(a),{url:'/m/'+id+'.glb',clipe:m.clipes[acao],direcao:dir,quadros:QUADROS,tam:TAM,loop,bbox});
    const png=Buffer.from(r.png.split(',')[1],'base64');
    // PNG → WEBP (menor) pelo próprio navegador
    const webp=await page.evaluate(async b64=>{const i=new Image();i.src='data:image/png;base64,'+b64;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/webp',.86).split(',')[1];},png.toString('base64'));
    const nome=`${id}_${acao}_${dir}.webp`;fs.writeFileSync(path.join(SAIDA,nome),Buffer.from(webp,'base64'));
    dados[id].folhas[`${acao}_${dir}`]={arquivo:nome,quadros:QUADROS,dur:Math.round(r.dur*1000)/1000};
    process.stdout.write('.');
   }
  }
  console.log('\n',id,'pronto');
  try{const arqD=path.join(raiz,'js','mesa-sprites-3d-dados.js');const ant=fs.existsSync(arqD)?JSON.parse(fs.readFileSync(arqD,'utf8').split('=')[1].replace(/;\s*$/,'')):{};fs.writeFileSync(arqD,'// Gerado por scripts/gerar-sprites-3d.cjs — folhas de quadros das miniaturas 3D (arte/miniaturas3d)\nexport const SPRITES_3D='+JSON.stringify({...ant,[id]:dados[id]})+';\n');}catch(e){console.log('aviso: dados não gravados',e.message);}
 }
 await browser.close();
 // lista para o jogo
 const antigo=fs.existsSync(path.join(raiz,'js','mesa-sprites-3d-dados.js'))?JSON.parse(fs.readFileSync(path.join(raiz,'js','mesa-sprites-3d-dados.js'),'utf8').split('=')[1].replace(/;\s*$/,'')):{};
 const tudo={...antigo,...dados};
 fs.writeFileSync(path.join(raiz,'js','mesa-sprites-3d-dados.js'),'// Gerado por scripts/gerar-sprites-3d.cjs — folhas de quadros das miniaturas 3D (arte/miniaturas3d)\nexport const SPRITES_3D='+JSON.stringify(tudo)+';\n');
 console.log('ok:',Object.keys(tudo).join(', '));
})().catch(e=>{console.error(e);process.exit(1);});
