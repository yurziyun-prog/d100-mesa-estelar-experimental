// Gera ÍCONES DE ITENS 3D (armas, armaduras, poções, comida, tesouros) em 3/4 de cima, 128x128, no estilo do jogo.
// Saída: arte/itens3d/<id>.webp e js/mesa-icones-itens-dados.js (lista com nomes em português para casar com o nome do item).
// Uso: node scripts/gerar-icones-itens.cjs   (usa os zips e o three.js como gerar-pecas-3d.cjs)
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..');
const THREE_DIR=process.env.THREE_DIR||'C:/Users/yurzi/AppData/Local/Temp/claude/C--Users-yurzi-Documents-Codex-mandarim-aula-main/2296697d-e56e-4bd6-b824-c216845a4b59/scratchpad/render3d';
const ZIPS_DIR=process.env.ZIPS_DIR||'C:/Users/yurzi/Documents/Codex/2026-09-09';
const TMP=path.join(os.tmpdir(),'itens3d-modelos'),SAIDA=path.join(raiz,'arte','itens3d');
const ZIPS=[['Ultimate RPG Items Bundle-glb.zip','rpg'],['Ultimate Food Pack-glb.zip','food']];
// nome do arquivo (inglês) → [palavras em português que casam (separadas por |), grupo]
const MAPA={
 'Armor Golden':['armadura dourada|armadura de ouro','armadura'],'Armor Leather':['armadura de couro|couro','armadura'],'Armor Metal':['armadura|cota de malha|armadura de metal','armadura'],
 'Arrow':['flecha|seta','municao'],'Axe Double':['machado duplo|machado de guerra','arma'],'Axe Small':['machado|machadinha','arma'],'Backpack':['mochila','mochila'],'Bag':['bolsa|saco','mochila'],
 'Bone':['osso','tesouro'],'Book Open':['livro aberto','tesouro'],'Book':['livro|diario|diário','tesouro'],'Chalice':['calice|cálice|taça','tesouro'],'Chest':['bau|baú','tesouro'],
 'Claymore':['montante|espada longa|espada grande','arma'],'Coin Pouch':['bolsa de moedas|moedas','tesouro'],'Coin':['moeda','tesouro'],'Crown':['coroa','tesouro'],'Dagger':['adaga|punhal','arma'],
 'Doublesided Hammer':['martelo de guerra|martelo','arma'],'Fish Bone':['espinha de peixe','tesouro'],'Glove':['luva','armadura'],'Gold Ingots':['barra de ouro|lingote','tesouro'],'Key':['chave','tesouro'],
 'Knife':['faca','arma'],'Mineral':['mineral|cristal|gema','tesouro'],'Necklace':['colar|amuleto','tesouro'],'Padlock':['cadeado','tesouro'],'Parchment':['pergaminho|papel','tesouro'],
 'Potion Bottle':['pocao|poção|elixir','consumivel'],'Scroll':['pergaminho|rolo','tesouro'],'Scythe':['foice','arma'],'Shield Celtic Golden':['escudo dourado','escudo'],'Shield Heater':['escudo','escudo'],
 'Shield Round':['escudo redondo|broquel','escudo'],'Skull Coin':['moeda de caveira','tesouro'],'Skull':['caveira|cranio|crânio','tesouro'],'Snowflake':['floco de neve','tesouro'],'Spear':['lanca|lança','arma'],
 'Star Coin':['moeda estrela','tesouro'],'Sword':['espada','arma'],'Wooden Bow':['arco','arma'],
 'Apple Green':['maca|maçã','comida'],'Avocado':['abacate','comida'],'Bacon':['bacon','comida'],'Banana':['banana','comida'],'Bread':['pao|pão','comida'],'Broccoli':['brocolis|brócolis','comida'],'Burger':['hamburguer|hambúrguer','comida'],
 'Carrot':['cenoura','comida'],'Chicken Leg':['coxa de frango|frango|carne assada','comida'],'Chocolate Bar':['chocolate','comida'],'Croissant':['croissant','comida'],'Cupcake':['cupcake|bolinho','comida'],'Donut':['rosquinha|donut','comida'],
 'Egg':['ovo','comida'],'Fries':['batata frita','comida'],'Ice Cream':['sorvete','comida'],'Lettuce':['alface','comida'],'Mushroom Sliced':['cogumelo','comida'],'Pizza Slice':['pizza','comida'],'Pumpkin':['abobora|abóbora','comida'],
 'Steak':['bife|carne|bisteca','comida'],'Sushi':['sushi','comida'],'Tomato':['tomate','comida'],'Turnip':['nabo','comida'],'Waffle':['waffle|waffles','comida'],'Soda':['refrigerante|refri','comida'],'Bottle':['garrafa','consumivel'],
 'Cooking Pot':['panela|caldeirao|caldeirão','tesouro'],'Frying Pan':['frigideira','tesouro'],'Tentacle':['tentaculo|tentáculo','comida']
};
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const ps=c=>cp.execFileSync('powershell',['-NoProfile','-Command',c],{maxBuffer:1<<26}).toString();
const zipP=z=>path.join(ZIPS_DIR,z).replace(/\//g,'\\');
const PAGINA=`<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OutlineEffect} from 'three/addons/effects/OutlineEffect.js';
window.pronto=true;
window.icone=async({url,tam})=>{
 const g=await new GLTFLoader().loadAsync(url),m=g.scene,cena=new THREE.Scene();
 m.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();if('metalness' in o.material)o.material.metalness=Math.min(.15,o.material.metalness||0);if('roughness' in o.material)o.material.roughness=Math.max(.6,o.material.roughness||0);}});
 m.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(m,true),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
 if(!isFinite(s.x))return {erro:'vazio'};
 m.position.sub(c);
 const piv=new THREE.Group();piv.add(m);piv.rotation.y=-.6;const roll=new THREE.Group();roll.add(piv);cena.add(roll);const ds=[s.x,s.y,s.z].sort((p,q)=>q-p);if(ds[0]>ds[1]*2.2){roll.quaternion.setFromAxisAngle(new THREE.Vector3(2.2,2.4,3.2).normalize(),.78);}
 const r=Math.max(s.x,s.y,s.z)*(ds[0]>ds[1]*2.2?.62:.78);
 cena.add(new THREE.HemisphereLight(0xfff1dc,0x4a3a30,1.6));const sol=new THREE.DirectionalLight(0xffe2b8,2.4);sol.position.set(-3,6,4);cena.add(sol);
 const cam=new THREE.OrthographicCamera(-r,r,r,-r,.01,100);cam.position.set(2.2*r,2.4*r,3.2*r);cam.lookAt(0,0,0);
 const rend=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});rend.setSize(tam,tam,false);rend.setClearColor(0x000000,0);rend.outputColorSpace=THREE.SRGBColorSpace;rend.toneMapping=THREE.ACESFilmicToneMapping;rend.toneMappingExposure=1.05;
 const ef=new OutlineEffect(rend,{defaultThickness:.006,defaultColor:[.08,.06,.05],defaultAlpha:1});ef.render(cena,cam);
 const cv=document.createElement('canvas');cv.width=tam;cv.height=tam;const x=cv.getContext('2d');x.filter='saturate(.92) contrast(1.05)';x.drawImage(rend.domElement,0,0);rend.dispose();
 return {webp:cv.toDataURL('image/webp',.88).split(',')[1]};
};
</script>`;
(async()=>{
 fs.mkdirSync(SAIDA,{recursive:true});fs.mkdirSync(TMP,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:300,height:300}});page.on('pageerror',e=>console.log('PAGEERR',e.message));
 await page.route('https://r3d.test/**',r=>{const u=new URL(r.request().url()),p=decodeURIComponent(u.pathname);
  if(p==='/')return r.fulfill({contentType:'text/html',body:PAGINA});
  if(p.startsWith('/three/')){const f=path.join(THREE_DIR,'node_modules','three',p.slice(7));return fs.existsSync(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  if(p.startsWith('/m/')){const f=path.join(TMP,p.slice(3));return fs.existsSync(f)?r.fulfill({contentType:'model/gltf-binary',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  return r.fulfill({status:404,body:''});});
 await page.goto('https://r3d.test/');await page.waitForFunction(()=>window.pronto,null,{timeout:30000});
 const lista=[];
 for(const [zip,pref] of ZIPS){
  const arqs=ps(`Add-Type -AssemblyName System.IO.Compression.FileSystem;$z=[IO.Compression.ZipFile]::OpenRead('${zipP(zip)}');$z.Entries|Where-Object {$_.Length -gt 0 -and $_.Name -match '\\.glb$'}|ForEach-Object {$_.FullName};$z.Dispose()`).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  for(const arq of arqs){
   const base=path.basename(arq).replace(/\.glb$/i,''),chave=base.replace(/-[A-Za-z0-9]{8,12}$/,'');
   const M=MAPA[chave];if(!M)continue;
   const sufixo=base!==chave?'_'+slug(base.slice(chave.length)):'';
   const id=pref+'_'+slug(chave)+sufixo,tmp=path.join(TMP,id+'.glb');
   ps(`Add-Type -AssemblyName System.IO.Compression.FileSystem;$z=[IO.Compression.ZipFile]::OpenRead('${zipP(zip)}');$e=$z.Entries|Where-Object {$_.FullName -eq '${arq.replace(/'/g,"''")}'}|Select-Object -First 1;[IO.Compression.ZipFileExtensions]::ExtractToFile($e,'${tmp.replace(/\//g,'\\')}',$true);$z.Dispose()`);
   let r;try{r=await page.evaluate(a=>window.icone(a),{url:'/m/'+id+'.glb',tam:128});}catch(e){console.log('falhou',arq,String(e.message).slice(0,80));continue;}
   fs.rmSync(tmp,{force:true});if(r.erro)continue;
   fs.writeFileSync(path.join(SAIDA,id+'.webp'),Buffer.from(r.webp,'base64'));
   lista.push({id,src:'arte/itens3d/'+id+'.webp',nomes:M[0],grupo:M[1],prio:sufixo?1:0});process.stdout.write('.');
  }
 }
 await browser.close();
 fs.writeFileSync(path.join(raiz,'js','mesa-icones-itens-dados.js'),'// Gerado por scripts/gerar-icones-itens.cjs — ícones 3D de itens (arte/itens3d). nomes = palavras que casam com o nome do item.\nexport const ICONES_ITENS='+JSON.stringify(lista)+';\n');
 console.log('\nícones:',lista.length);
})().catch(e=>{console.error(e);process.exit(1);});
