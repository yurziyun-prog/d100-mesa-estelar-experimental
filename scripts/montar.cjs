// Mesa Estelar — montagem do site para publicação.
//
// O código do app fica em js/app/NN-assunto.js (partes em ordem). Aqui elas são juntadas, na ordem do nome,
// formando o js/app.js publicado, idêntico a escrever tudo num arquivo só.
//
// Na publicação, cada módulo recebe um endereço único com a "impressão digital" do conteúdo (?h=...).
// Isso garante que:
//  - cada módulo carrega uma vez só (antes, o mesmo arquivo com ?v= diferentes carregava 2-3 vezes);
//  - o navegador pode guardar os módulos em cache por muito tempo, pois qualquer mudança gera um endereço novo;
//  - não é preciso trocar números de versão à mão.
// Um import apontando para um arquivo que não existe, ou um erro de sintaxe, cancela a publicação.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os'),{spawnSync}=require('node:child_process');

const PARTES='app';
function partesDoApp(root){
  const dir=path.join(root,'js',PARTES);
  return fs.readdirSync(dir).filter(n=>/^\d+-[\w-]+\.js$/.test(n)).sort().map(n=>path.join(dir,n));
}
function montarApp(root){return partesDoApp(root).map(f=>fs.readFileSync(f,'utf8')).join('');}

// import ... from './x.js?...'   |   import('./x.js?...')   |   import './x.js'
const RE_IMPORT=/(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])\.\/([\w.-]+\.js)(\?[^'"]*)?\2/g;
function importsDe(src){const out=[];let m;RE_IMPORT.lastIndex=0;while((m=RE_IMPORT.exec(src)))out.push({arquivo:m[3],dinamico:/\(\s*$/.test(m[1]),indice:m.index});return out;}
// dinâmico no topo do arquivo (linha começa com import(...)): carregado logo na abertura
function dinamicoNoTopo(src,indice){const ini=src.lastIndexOf('\n',indice-1)+1;return /^import\s*\(/.test(src.slice(ini,indice+8));}

const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);

// Recebe {nome: código} dos módulos de js/ e devolve {nome: código com endereços únicos}, os hashes e a lista para pré-carregar.
function carimbar(mods,entrada='app.js'){
  const nomes=Object.keys(mods),deps={},faltando=[];
  for(const n of nomes){deps[n]=[...new Set(importsDe(mods[n]).map(i=>i.arquivo))];for(const d of deps[n])if(!mods[d])faltando.push(`${n} → ${d}`);}
  if(faltando.length)throw Error('Import para arquivo inexistente:\n  '+faltando.join('\n  '));
  // impressão própria: conteúdo com os endereços normalizados (sem ?v=)
  const proprio={};for(const n of nomes)proprio[n]=hash(mods[n].replace(RE_IMPORT,(a,p,q,f)=>`${p}${q}./${f}${q}`));
  // impressão final: própria + de tudo o que ela importa (direta ou indiretamente); ciclos não atrapalham
  const final={};
  for(const n of nomes){const vis=new Set([n]),fila=[n];while(fila.length){const x=fila.pop();for(const d of deps[x])if(!vis.has(d)){vis.add(d);fila.push(d);}}
    final[n]=hash([...vis].sort().map(x=>x+':'+proprio[x]).join('|'));}
  const out={};for(const n of nomes)out[n]=mods[n].replace(RE_IMPORT,(a,p,q,f)=>`${p}${q}./${f}?h=${final[f]}${q}`);
  // pré-carregar: o que o app importa direto e os módulos abertos logo no início, com tudo o que eles importam de forma fixa
  const pre=new Set(),pend=[entrada];
  const estaticos=n=>importsDe(mods[n]).filter(i=>!i.dinamico).map(i=>i.arquivo);
  const iniciais=importsDe(mods[entrada]).filter(i=>i.dinamico&&dinamicoNoTopo(mods[entrada],i.indice)).map(i=>i.arquivo);
  pend.push(...iniciais);
  while(pend.length){const x=pend.pop();if(pre.has(x)||!mods[x])continue;pre.add(x);pend.push(...estaticos(x));}
  return {codigo:out,hash:final,precarregar:[...pre].filter(x=>x!==entrada).sort()};
}

// Confere a sintaxe de cada módulo com o próprio Node (sem executar nada).
function conferirSintaxe(arquivos){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mesa-check-')),erros=[];
  try{for(const [nome,codigo] of Object.entries(arquivos)){const f=path.join(tmp,nome.replace(/\.js$/,'.mjs'));fs.writeFileSync(f,codigo);
    const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status!==0)erros.push(nome+': '+String(r.stderr||'').split('\n').filter(Boolean).slice(-3).join(' | '));}}
  finally{fs.rmSync(tmp,{recursive:true,force:true});}
  if(erros.length)throw Error('Erro de sintaxe:\n  '+erros.join('\n  '));
}

// Lê os módulos de js/ (montando o app.js a partir das partes).
function lerModulos(root){
  const dir=path.join(root,'js'),mods={};
  for(const n of fs.readdirSync(dir))if(n.endsWith('.js')&&fs.statSync(path.join(dir,n)).isFile())mods[n]=fs.readFileSync(path.join(dir,n),'utf8');
  if(fs.existsSync(path.join(dir,PARTES))){if(mods['app.js'])throw Error('Existe js/app.js E js/app/. O app agora fica só nas partes de js/app/; apague ou renomeie o js/app.js solto.');mods['app.js']=montarApp(root);}
  return mods;
}

// index.html: app.js com o endereço único + pré-carregamento dos módulos (todos baixados em paralelo).
function prepararIndex(html,res){
  const re=/<script type="module" src="js\/app\.js(\?[^"]*)?"><\/script>/;
  if(!re.test(html))throw Error('index.html: não achei <script type="module" src="js/app.js...">');
  const links=res.precarregar.map(n=>`<link rel="modulepreload" href="js/${n}?h=${res.hash[n]}">`).join('\n');
  return html.replace(re,`${links}\n<script type="module" src="js/app.js?h=${res.hash['app.js']}"></script>`);
}

module.exports={montarApp,partesDoApp,importsDe,carimbar,conferirSintaxe,lerModulos,prepararIndex};

// Uso direto: node scripts/montar.cjs app  →  imprime o app.js montado (para testes e ferramentas)
if(require.main===module&&process.argv[2]==='app')process.stdout.write(montarApp(path.resolve(__dirname,'..')));
