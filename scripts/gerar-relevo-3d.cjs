// Gera os PICOS E ROCHAS EM 3D do relevo (cordilheira / colinas escarpadas): modelos 3D de montanhas e rochas dos pacotes (Quaternius, CC0)
// renderizados em vista inclinada (de cima e do sul), com contorno escuro, luz quente e fundo transparente.
// Saída: arte/relevo/<id>.webp e js/mesa-relevo-dados.js (lista com proporção e ponto de apoio de cada sprite).
// Uso: node scripts/gerar-relevo-3d.cjs
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const {chromium}=require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.join(__dirname,'..');
const THREE_DIR=process.env.THREE_DIR||'C:/Users/yurzi/AppData/Local/Temp/claude/C--Users-yurzi-Documents-Codex-mandarim-aula-main/2296697d-e56e-4bd6-b824-c216845a4b59/scratchpad/render3d';
const ZIPS_DIR=process.env.ZIPS_DIR||'C:/Users/yurzi/Documents/Codex/2026-09-09';
const TMP=path.join(os.tmpdir(),'relevo3d-modelos'),SAIDA=path.join(raiz,'arte','relevo');
// [zip, nome do arquivo .glb, id, rótulo, elevação da câmera (graus), giro (graus)]
const MODELOS=[
 ['Ultimate Fantasy RTS-glb.zip','Mountain.glb','montanha','Montanha',52,0],
 ['Ultimate Fantasy RTS-glb.zip','Mountain.glb','montanha_b','Montanha',52,140],
 ['Ultimate Fantasy RTS-glb.zip','Mountain Group.glb','grupo','Grupo de montanhas',52,0],
 ['Ultimate Fantasy RTS-glb.zip','Mountains.glb','serra','Serra',52,0],
 ['Ultimate Fantasy RTS-glb.zip','Rock.glb','rocha','Rocha',52,0],
 ['Ultimate Fantasy RTS-glb.zip','Rocks.glb','rochas','Rochas',52,0],
];
const ps=c=>cp.execFileSync('powershell',['-NoProfile','-Command',c],{maxBuffer:1<<26}).toString();
const zipP=z=>path.join(ZIPS_DIR,z).replace(/\//g,'\\');
const PAGINA=`<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OutlineEffect} from 'three/addons/effects/OutlineEffect.js';
window.pronto=true;
window.relevo=async({url,tam,el,giro})=>{
 const g=await new GLTFLoader().loadAsync(url),m=g.scene,cena=new THREE.Scene();
 const sujeira=[];m.traverse(o=>{if(o.isMesh&&o.material&&/dirt|ground|grass/i.test(String(o.material.name)))sujeira.push(o);});sujeira.forEach(o=>o.parent&&o.parent.remove(o)); // o terreno de terra embutido no modelo sai: o chão é o do mapa
 const malhas=[];m.traverse(o=>{if(o.isMesh)malhas.push((o.name||'?')+'|'+(o.material&&o.material.name||'?')+'|'+(o.material&&o.material.color?o.material.color.getHexString():'-'));});
 m.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();if('metalness' in o.material)o.material.metalness=0;if('roughness' in o.material)o.material.roughness=Math.max(.8,o.material.roughness||0);}});
 m.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(m,true),c=b.getCenter(new THREE.Vector3());
 m.position.set(-c.x,-b.min.y,-c.z);
 const piv=new THREE.Group();piv.add(m);piv.rotation.y=giro*Math.PI/180;cena.add(piv);
 piv.updateMatrixWorld(true);const b2=new THREE.Box3().setFromObject(piv,true),s=b2.getSize(new THREE.Vector3());
 cena.add(new THREE.HemisphereLight(0xfff1dc,0x4a3a30,1.5));const sol=new THREE.DirectionalLight(0xffe2b8,2.6);sol.position.set(-4,7,5);cena.add(sol);
 const e=el*Math.PI/180,R=40,cy=s.y/2;
 const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);cam.position.set(0,cy+Math.sin(e)*R,Math.cos(e)*R);cam.lookAt(0,cy,0);
 // enquadra: projeta a caixa e ajusta a janela ortogonal
 cam.updateMatrixWorld(true);cam.updateProjectionMatrix();
 const pts=[];for(const x of [b2.min.x,b2.max.x])for(const y of [b2.min.y,b2.max.y])for(const z of [b2.min.z,b2.max.z])pts.push(new THREE.Vector3(x,y,z).applyMatrix4(cam.matrixWorldInverse));
 const x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x)),y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));
 const w=(x1-x0)*1.1,h=(y1-y0)*1.1,cx=(x0+x1)/2,cyy=(y0+y1)/2,lado=Math.max(w,h);
 cam.left=cx-lado/2;cam.right=cx+lado/2;cam.top=cyy+lado/2;cam.bottom=cyy-lado/2;cam.updateProjectionMatrix();
 const rend=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});rend.setSize(tam,tam,false);rend.setClearColor(0x000000,0);rend.outputColorSpace=THREE.SRGBColorSpace;rend.toneMapping=THREE.ACESFilmicToneMapping;rend.toneMappingExposure=1.05;
 const ef=new OutlineEffect(rend,{defaultThickness:.005,defaultColor:[.08,.06,.05],defaultAlpha:1});ef.render(cena,cam);
 const cv=document.createElement('canvas');cv.width=tam;cv.height=tam;const x=cv.getContext('2d');x.filter='saturate(.9) contrast(1.06)';x.drawImage(rend.domElement,0,0);rend.dispose();
 // base do objeto na imagem (fração da altura): onde o centro do chão do modelo cai
 const base=new THREE.Vector3(0,b2.min.y,0).applyMatrix4(cam.matrixWorldInverse),by=(cam.top-base.y)/lado;
 return {malhas,webp:cv.toDataURL('image/webp',.88).split(',')[1],base:Math.round(by*1000)/1000,proporcao:Math.round((s.x/lado)*1000)/1000,largura:s.x,altura:s.y};
};
</script>`;
(async()=>{
 fs.mkdirSync(SAIDA,{recursive:true});fs.mkdirSync(TMP,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:400,height:400}});page.on('pageerror',e=>console.log('PAGEERR',e.message));
 await page.route('https://r3d.test/**',r=>{const u=new URL(r.request().url()),p=decodeURIComponent(u.pathname);
  if(p==='/')return r.fulfill({contentType:'text/html',body:PAGINA});
  if(p.startsWith('/three/')){const f=path.join(THREE_DIR,'node_modules','three',p.slice(7));return fs.existsSync(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  if(p.startsWith('/m/')){const f=path.join(TMP,p.slice(3));return fs.existsSync(f)?r.fulfill({contentType:'model/gltf-binary',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  return r.fulfill({status:404,body:''});});
 await page.goto('https://r3d.test/');await page.waitForFunction(()=>window.pronto,null,{timeout:30000});
 const lista=[];
 for(const [zip,arq,id,nome,el,giro] of MODELOS){
  const tmp=path.join(TMP,id+'.glb');
  try{ps(`Add-Type -AssemblyName System.IO.Compression.FileSystem;$z=[IO.Compression.ZipFile]::OpenRead('${zipP(zip)}');$e=$z.Entries|Where-Object {$_.Name -eq '${arq}'}|Select-Object -First 1;if(-not $e){throw 'sem '+'${arq}'};[IO.Compression.ZipFileExtensions]::ExtractToFile($e,'${tmp.replace(/\//g,'\\')}',$true);$z.Dispose()`);}catch(e){console.log('não achei',arq);continue;}
  let r;try{r=await page.evaluate(a=>window.relevo(a),{url:'/m/'+id+'.glb',tam:384,el,giro});}catch(e){console.log('falhou',arq,String(e.message).slice(0,100));continue;}
  if(process.env.INFO)console.log(id,JSON.stringify(r.malhas));
  fs.rmSync(tmp,{force:true});
  fs.writeFileSync(path.join(SAIDA,id+'.webp'),Buffer.from(r.webp,'base64'));
  lista.push({id,nome,src:'arte/relevo/'+id+'.webp',base:r.base,proporcao:r.proporcao,razao:Math.round(r.altura/Math.max(.01,r.largura)*100)/100});process.stdout.write('.');
 }
 await browser.close();
 fs.writeFileSync(path.join(raiz,'js','mesa-relevo-dados.js'),'// Gerado por scripts/gerar-relevo-3d.cjs — sprites 3D de montanhas e rochas (arte/relevo). base = fração da altura da imagem onde o chão do modelo toca; proporcao = fração da largura da imagem ocupada pelo modelo; razao = altura/largura do modelo.\nexport const RELEVO='+JSON.stringify(lista)+';\n');
 console.log('\nrelevo:',lista.map(x=>x.id).join(', '));
})().catch(e=>{console.error(e);process.exit(1);});
