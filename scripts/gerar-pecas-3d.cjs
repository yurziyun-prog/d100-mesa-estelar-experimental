// Gera as PEÇAS DE MAPA 3D (mobília, masmorra, ficção científica, plantas, itens) vistas de CIMA, no tamanho real em metros,
// a partir dos GLB dos pacotes (Quaternius, domínio público). Cada peça vira arte/pecas3d/<id>.webp + uma linha em js/mesa-pecas3d-dados.js,
// e o navegador do mestre as cadastra sozinho no Banco de Objetos de Mapa (js/mesa-pecas.js), como as peças de antes.
// Estilo do jogo: contorno escuro, luz quente de cima/esquerda, cores dessaturadas, sombra de contato.
//
// Uso: node scripts/gerar-pecas-3d.cjs            (todas as listadas em PACOTES)
//      node scripts/gerar-pecas-3d.cjs furniture_kit   (só um pacote)
// Precisa do three.js (THREE_DIR/node_modules/three) e dos zips em ZIPS_DIR (veja gerar-sprites-3d.cjs).
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..');
const THREE_DIR=process.env.THREE_DIR||'C:/Users/yurzi/AppData/Local/Temp/claude/C--Users-yurzi-Documents-Codex-mandarim-aula-main/2296697d-e56e-4bd6-b824-c216845a4b59/scratchpad/render3d';
const ZIPS_DIR=process.env.ZIPS_DIR||'C:/Users/yurzi/Documents/Codex/2026-09-09';
const TMP=path.join(os.tmpdir(),'pecas3d-modelos'),SAIDA=path.join(raiz,'arte','pecas3d');

// pacote → zip, prefixo do id, categoria padrão (cat do banco de peças), e se barra por padrão
const PACOTES={
 furniture_kit:{zip:'Furniture Kit-glb.zip',pref:'mk',cat:'movel',bloq:true,max:120},
 furniture_pack:{zip:'Furniture Pack-glb.zip',pref:'mp',cat:'movel',bloq:true,max:30},
 casa:{zip:'Ultimate House Interior Pack-glb.zip',pref:'ci',cat:'movel',bloq:true,max:90},
 vila:{zip:'Medieval Village Pack-glb.zip',pref:'vm',cat:'cenario',bloq:true,max:50},
 masmorra:{zip:'Modular Dungeons Pack-glb.zip',pref:'md',cat:'masmorra',bloq:true,max:40},
 scifi:{zip:'Sci-fi Pack.undefined-glb.zip',pref:'sf',cat:'scifi',bloq:true,max:20},
 espaco:{zip:'Ultimate Space Kit-glb.zip',pref:'es',cat:'scifi',bloq:true,max:80},
 sobrevivencia:{zip:'Survival Pack-glb.zip',pref:'sv',cat:'carga',bloq:false,max:40},
 natureza:{zip:'Stylized Nature MegaKit.undefined-glb.zip',pref:'nt',cat:'planta',bloq:false,max:70},
 natureza2:{zip:'Ultimate Stylized Nature Pack-glb.zip',pref:'nu',cat:'planta',bloq:false,max:14},
 plantas:{zip:'House Plants set.undefined-glb.zip',pref:'pl',cat:'planta',bloq:false,max:30},
 fazenda:{zip:'Farm Buildings Bundle-glb.zip',pref:'fb',cat:'cenario',bloq:true,max:10},
 rts:{zip:'Ultimate Fantasy RTS-glb.zip',pref:'rt',cat:'cenario',bloq:true,max:60},
 pirata:{zip:'Pirate kit-glb.zip',pref:'pk',cat:'cenario',bloq:true,max:60},
 cyberpunk:{zip:'Cyberpunk Game Kit-glb.zip',pref:'cy',cat:'scifi',bloq:true,max:43},
 posapoc:{zip:'Post Apocolypse Pack.undefined-glb.zip',pref:'pa',cat:'cenario',bloq:true,max:50}
};
const IGNORA=/astronaut|alien|character|woman|man\b|robot|enemy|npc|animated|person|worker|soldier|zombie|cyborg|mech\b|gun|rifle|pistol/i;
const TRAD={chair:'cadeira',table:'mesa',bed:'cama',barrel:'barril',crate:'caixote',box:'caixa',door:'porta',wall:'parede',floor:'piso',torch:'tocha',chest:'baú',bookcase:'estante',bookshelf:'estante',shelf:'prateleira',plant:'planta',tree:'árvore',trees:'árvores',bush:'arbusto',bushes:'arbustos',rock:'pedra',rocks:'pedras',lamp:'luminária',sofa:'sofá',couch:'sofá',desk:'escrivaninha',cabinet:'armário',drawer:'gaveta',sink:'pia',toilet:'vaso',bathtub:'banheira',mirror:'espelho',stool:'banqueta',bench:'banco',rug:'tapete',carpet:'tapete',pillar:'pilar',column:'coluna',statue:'estátua',banner:'estandarte',arch:'arco',stairs:'escada',stair:'escada',tent:'barraca',fence:'cerca',well:'poço',cart:'carroça',wagon:'carroça',bag:'saco',bags:'sacos',bottle:'garrafa',candle:'vela',fire:'fogueira',campfire:'fogueira',tower:'torre',house:'casa',bell:'sino',mill:'moinho',stable:'estábulo',inn:'estalagem',blacksmith:'ferreiro',anvil:'bigorna',hay:'feno',flower:'flor',flowers:'flores',grass:'capim',log:'tronco',stump:'toco',mushroom:'cogumelo',pine:'pinheiro',birch:'bétula',dead:'morta',small:'pequeno',large:'grande',big:'grande',tall:'alto',open:'aberto',closed:'fechado',double:'duplo',single:'simples',king:'king',twin:'solteiro',kitchen:'cozinha',bathroom:'banheiro',bedroom:'quarto',cactus:'cacto',pot:'vaso',vase:'vaso',book:'livro',books:'livros',clock:'relógio',tv:'TV',computer:'computador',monitor:'monitor',fridge:'geladeira',oven:'forno',stove:'fogão',counter:'balcão',shower:'chuveiro',curtain:'cortina',window:'janela',gate:'portão',spikes:'espinhos',cobweb:'teia',web:'teia',skull:'caveira',bones:'ossos',trap:'armadilha',bear:'urso',axe:'machado',backpack:'mochila',battery:'bateria',engine:'motor',pipe:'cano',tank:'tanque',solar:'solar',panel:'painel',antenna:'antena',base:'base',building:'prédio',cargo:'carga',depot:'depósito',roof:'telhado',modules:'módulos',module:'módulo',tile:'ladrilho',pillar2:'pilar'};
const traduz=n=>n.replace(/\.glb$/i,'').replace(/[-_]+/g,' ').split(/\s+/).filter(Boolean).map((w,i)=>{const t=TRAD[w.toLowerCase()];return t?(i===0?t[0].toUpperCase()+t.slice(1):t):w;}).join(' ');
const slug=n=>n.replace(/\.glb$/i,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const ps=cmd=>cp.execFileSync('powershell',['-NoProfile','-Command',cmd],{maxBuffer:1<<26}).toString();
const zipP=z=>path.join(ZIPS_DIR,z).replace(/\//g,'\\');
const listar=zip=>ps(`Add-Type -AssemblyName System.IO.Compression.FileSystem;$z=[IO.Compression.ZipFile]::OpenRead('${zipP(zip)}');$z.Entries|Where-Object {$_.Length -gt 0 -and $_.Name -match '\\.glb$'}|ForEach-Object {$_.Name};$z.Dispose()`).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const extrair=(zip,arq,saida)=>{fs.mkdirSync(path.dirname(saida),{recursive:true});ps(`Add-Type -AssemblyName System.IO.Compression.FileSystem;$z=[IO.Compression.ZipFile]::OpenRead('${zipP(zip)}');$e=$z.Entries|Where-Object Name -eq '${arq}'|Select-Object -First 1;[IO.Compression.ZipFileExtensions]::ExtractToFile($e,'${saida.replace(/\//g,'\\')}',$true);$z.Dispose()`);};

const PAGINA=`<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OutlineEffect} from 'three/addons/effects/OutlineEffect.js';
window.pronto=true;
// peça vista de cima: +X para a direita, +Z para baixo (como o mapa). Devolve o tamanho em metros e a imagem.
window.topo=async({url,ppmMax,margem})=>{
 const g=await new GLTFLoader().loadAsync(url),modelo=g.scene,cena=new THREE.Scene();cena.add(modelo);
 modelo.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();if('metalness' in o.material)o.material.metalness=Math.min(.12,o.material.metalness||0);if('roughness' in o.material)o.material.roughness=Math.max(.75,o.material.roughness||1);}});
 modelo.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(modelo,true),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
 if(!isFinite(s.x)||!isFinite(s.z))return {erro:'sem geometria'};
 const w=s.x+2*margem,h=s.z+2*margem;
 if(Math.max(w,h)>14||Math.max(s.x,s.z)<.12)return {erro:'tamanho fora da faixa: '+s.x.toFixed(2)+'x'+s.z.toFixed(2)};
 const ppm=Math.min(ppmMax,640/Math.max(w,h)),pw=Math.max(8,Math.round(w*ppm)),ph=Math.max(8,Math.round(h*ppm));
 cena.add(new THREE.HemisphereLight(0xfff1dc,0x4a3a30,1.5));
 const sol=new THREE.DirectionalLight(0xffe2b8,2.3);sol.position.set(c.x-4,c.y+9,c.z-3);sol.target.position.copy(c);cena.add(sol,sol.target);
 const cam=new THREE.OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,200);cam.up.set(0,0,-1);cam.position.set(c.x,b.max.y+20,c.z);cam.lookAt(c.x,0,c.z);
 const rend=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});rend.setSize(pw,ph,false);rend.setClearColor(0x000000,0);rend.outputColorSpace=THREE.SRGBColorSpace;rend.toneMapping=THREE.ACESFilmicToneMapping;rend.toneMappingExposure=1.05;
 const ef=new OutlineEffect(rend,{defaultThickness:.0035,defaultColor:[.08,.06,.05],defaultAlpha:1});ef.render(cena,cam);
 const cv=document.createElement('canvas');cv.width=pw;cv.height=ph;const x=cv.getContext('2d');x.filter='saturate(.9) contrast(1.05)';x.drawImage(rend.domElement,0,0);
 rend.dispose();return {w:Math.round(w*100)/100,h:Math.round(h*100)/100,altura:Math.round(s.y*100)/100,webp:cv.toDataURL('image/webp',.86).split(',')[1]};
};
</script>`;
(async()=>{
 const pedidos=process.argv.slice(2).length?process.argv.slice(2):Object.keys(PACOTES);
 fs.mkdirSync(SAIDA,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:700,height:700}});
 page.on('pageerror',e=>console.log('PAGEERR',e.message));
 await page.route('https://r3d.test/**',r=>{const u=new URL(r.request().url()),p=decodeURIComponent(u.pathname);
  if(p==='/')return r.fulfill({contentType:'text/html',body:PAGINA});
  if(p.startsWith('/three/')){const f=path.join(THREE_DIR,'node_modules','three',p.slice(7));return fs.existsSync(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  if(p.startsWith('/m/')){const f=path.join(TMP,p.slice(3));return fs.existsSync(f)?r.fulfill({contentType:'model/gltf-binary',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  return r.fulfill({status:404,body:''});});
 await page.goto('https://r3d.test/');await page.waitForFunction(()=>window.pronto,null,{timeout:30000});
 const dadosArq=path.join(raiz,'js','mesa-pecas3d-dados.js');
 let todas=[];try{todas=JSON.parse(fs.readFileSync(dadosArq,'utf8').split('PECAS_3D=')[1].replace(/;\s*$/,''));}catch(_){}
 const porId=new Map(todas.map(p=>[p.id,p]));
 for(const pid of pedidos){
  const P=PACOTES[pid];if(!P){console.log('pacote desconhecido',pid);continue;}
  const arqs=listar(P.zip).filter(a=>!IGNORA.test(a)&&!/-[A-Za-z0-9]{8,12}\.glb$/.test(a)).slice(0,P.max*2);
  let n=0,pulou=0;
  for(const arq of arqs){
   if(n>=P.max)break;
   const id=P.pref+'_'+slug(arq),tmp=path.join(TMP,id+'.glb');
   try{extrair(P.zip,arq,tmp);}catch(e){pulou++;continue;}
   let r;try{r=await page.evaluate(async a=>window.topo(a),{url:'/m/'+id+'.glb',ppmMax:64,margem:.03});}catch(e){console.log('  falhou',arq,String(e.message).slice(0,80));pulou++;continue;}
   fs.rmSync(tmp,{force:true});
   if(r.erro){pulou++;continue;}
   fs.writeFileSync(path.join(SAIDA,id+'.webp'),Buffer.from(r.webp,'base64'));
   const NAO_BARRA=/banner|cobweb|web|torch|mount|coin|skull|bone|bricks|curtain|picture|poster|painting|sign|wall lamp|rug|carpet|tile|pile|paper|note|candle|plate|cup|fork|knife|spoon/i;const nome=traduz(arq),piso=/rug|carpet|tapete|floor|tile|piso|mat\b/i.test(arq),teto=/roof|telhado|ceiling/i.test(arq);
   porId.set(id,{id:'3d_'+id,nome:nome+' (3D)',src:'arte/pecas3d/'+id+'.webp',larguraM:r.w,alturaM:r.h,cat:P.cat,bloq:piso||teto||NAO_BARRA.test(arq)?false:(P.bloq&&r.altura>=.35),camada:piso?1:teto?5:(P.cat==='planta'?2:3)});
   n++;process.stdout.write('.');
  }
  console.log('\n',pid,':',n,'peças (',pulou,'puladas )');
 }
 await browser.close();
 const lista=[...porId.values()].sort((a,b)=>a.id.localeCompare(b.id));
 fs.writeFileSync(dadosArq,'// Gerado por scripts/gerar-pecas-3d.cjs — peças de mapa 3D vistas de cima (arte/pecas3d). Cadastradas no Banco de Objetos pelo mestre (js/mesa-pecas.js).\nexport const PECAS_3D='+JSON.stringify(lista)+';\n');
 console.log('total de peças 3D:',lista.length);
})().catch(e=>{console.error(e);process.exit(1);});
